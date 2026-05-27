const https = require('https');
const http = require('http');
const { URL } = require('url');

// ── SSRF protection ───────────────────────────────────────────────────────────

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isBlockedHost(hostname) {
  return BLOCKED_HOST_PATTERNS.some(re => re.test(hostname));
}

function safeParseUrl(urlStr) {
  let parsed;
  try { parsed = new URL(urlStr); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  if (isBlockedHost(parsed.hostname)) return null;
  return parsed;
}

// ── HTTP fetcher (redirect-safe, 2 MB cap, 10 s timeout) ─────────────────────

function fetchHtml(urlStr, hopsLeft = 4, timeout = 10000) {
  const parsed = safeParseUrl(urlStr);
  if (!parsed) return Promise.reject(new Error('Invalid or blocked URL'));

  return new Promise((resolve, reject) => {
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        if (hopsLeft <= 0) return reject(new Error('Too many redirects'));
        const next = new URL(res.headers.location, urlStr).toString();
        return fetchHtml(next, hopsLeft - 1, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let body = '';
      let bytes = 0;
      res.setEncoding('utf8');
      res.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 2_000_000) { req.destroy(); return; }
        body += chunk;
      });
      res.on('end', () => resolve(body));
    });

    const timer = setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
    req.on('close', () => clearTimeout(timer));
    req.on('error', err => { clearTimeout(timer); reject(err); });
  });
}

// ── Next.js / embedded JSON extraction ───────────────────────────────────────

function extractNextData(html) {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Recursively scan any JSON object for price-like values
function collectJsonPrices(obj, results, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 12) return;
  const PRICE_KEYS = ['price', 'salePrice', 'listPrice', 'currentPrice', 'regularPrice',
                      'offerPrice', 'retailPrice', 'finalPrice', 'discountedPrice', 'nowPrice',
                      'sale_price', 'list_price', 'retail_price', 'current_price'];
  for (const key of PRICE_KEYS) {
    if (obj[key] == null) continue;
    const raw = obj[key];
    if (typeof raw === 'number' && raw > 0) {
      results.push({ value: raw, key, type: /sale|discount|final|current|now/i.test(key) ? 'sale' : 'regular' });
    } else if (raw && typeof raw === 'object') {
      // { value: 198, currencyCode: "USD" } pattern
      if (typeof raw.value === 'number' && raw.value > 0)
        results.push({ value: raw.value, key, type: /sale|discount|final|current|now/i.test(key) ? 'sale' : 'regular' });
      if (typeof raw.amount === 'number' && raw.amount > 0)
        results.push({ value: raw.amount, key, type: 'regular' });
    }
  }
  if (Array.isArray(obj)) {
    for (const item of obj.slice(0, 15)) collectJsonPrices(item, results, depth + 1);
  } else {
    for (const val of Object.values(obj).slice(0, 25)) {
      if (val && typeof val === 'object') collectJsonPrices(val, results, depth + 1);
    }
  }
}

// ── HTML extraction helpers ───────────────────────────────────────────────────

function extractMeta(html, ...names) {
  for (const name of names) {
    let m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"'<>]{1,500})["']`, 'i'));
    if (!m) m = html.match(new RegExp(`<meta[^>]+content=["']([^"'<>]{1,500})["'][^>]+(?:property|name)=["']${name}["']`, 'i'));
    if (m) return m[1].trim();
  }
  return null;
}

function extractJsonLdProduct(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1]);
      const candidates = Array.isArray(obj) ? obj : (obj['@graph'] ? obj['@graph'] : [obj]);
      for (const item of candidates) {
        if (item && item['@type'] === 'Product') return item;
      }
    } catch { /* malformed JSON-LD */ }
  }
  return null;
}

// ── Currency helpers ──────────────────────────────────────────────────────────

// Map common currency strings/symbols to ISO codes
const CURRENCY_MAP = [
  { patterns: [/UAH|₴|грн/i],       code: 'UAH' },
  { patterns: [/USD|\$/],            code: 'USD' },
  { patterns: [/EUR|€/],             code: 'EUR' },
  { patterns: [/GBP|£/],             code: 'GBP' },
  { patterns: [/PLN|zł/i],           code: 'PLN' },
  { patterns: [/RUB|₽/],             code: 'RUB' },
];

function normaliseCurrency(raw) {
  if (!raw) return null;
  const s = raw.trim();
  for (const { patterns, code } of CURRENCY_MAP) {
    if (patterns.some(re => re.test(s))) return code;
  }
  // Already a 3-letter ISO code?
  if (/^[A-Z]{3}$/.test(s)) return s;
  return null;
}

function currencyFromJsonLd(product) {
  if (!product?.offers) return null;
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  return normaliseCurrency(offer?.priceCurrency) || null;
}

function detectCurrencyFromHtml(html, hostname) {
  // 1. Dedicated meta tags (most reliable explicit signal)
  const metaCurrency = extractMeta(html,
    'product:price:currency', 'og:price:currency', 'twitter:data2',
  );
  if (metaCurrency) {
    const c = normaliseCurrency(metaCurrency);
    if (c) return c;
  }

  // 2. Domain heuristic — checked BEFORE HTML scan to avoid false positives
  //    from third-party scripts that may contain other currency symbols.
  if (/\.ua$/i.test(hostname)) return 'UAH';

  // 3. Targeted scan: look for currency symbols only near price-like patterns
  if (/[\d\s][₴]|грн\.?(?:\s|$)|\bUAH\b/i.test(html)) return 'UAH';
  if (/[\d\s][€]|\bEUR\b/.test(html))                   return 'EUR';
  if (/[\d\s][£]|\bGBP\b/.test(html))                   return 'GBP';
  if (/[\d\s][$]|\bUSD\b/.test(html))                   return 'USD';

  return null;
}

// ── Price extraction ──────────────────────────────────────────────────────────

// CSS class keywords that signal an old/crossed-out price — never pick these.
const OLD_PRICE_CLS  = /\b(?:old|original|regular|compare|was|before|strikethrough|crossed|del|strike|undiscounted)\b/;
// CSS class keywords that unambiguously mean "current / discounted price".
const SALE_PRICE_CLS = /\b(?:current|sale|discount|actual|promo|final|special|new|active)\b/;

/**
 * Collect every numeric price candidate from the page, tagging each as
 * 'sale', 'regular', or 'old'.  Returns an array sorted by confidence.
 */
function collectPriceCandidates(html, jsonLd) {
  const add = (list, raw, source, type) => {
    const clean = cleanPrice(raw);
    const val   = clean ? parseFloat(clean) : NaN;
    if (!isNaN(val) && val > 0) list.push({ value: val, raw: clean, source, type });
  };

  const candidates = [];

  // 0. __NEXT_DATA__ (Next.js: Ralph Lauren, Dior, Fendi, etc.)
  const nextData = extractNextData(html);
  if (nextData) {
    const jsonPrices = [];
    collectJsonPrices(nextData, jsonPrices);
    for (const p of jsonPrices) {
      add(candidates, String(p.value), `next-data:${p.key}`, p.type);
    }
  }

  // 0b. Inline "price":{"value":198} patterns (luxury brand APIs embedded in HTML)
  const priceValueM = html.match(/"(?:sale_price|salePrice|currentPrice|finalPrice)"\s*:\s*\{[^}]{0,80}"value"\s*:\s*([\d.]+)/i);
  if (priceValueM) add(candidates, priceValueM[1], 'json:priceObj.value', 'sale');
  const genericPriceValueM = html.match(/"(?:price|listPrice|regularPrice)"\s*:\s*\{[^}]{0,80}"value"\s*:\s*([\d.]+)/i);
  if (genericPriceValueM) add(candidates, genericPriceValueM[1], 'json:genericPriceObj.value', 'regular');

  // 1. JSON-LD priceSpecification with explicit SalePrice type
  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
    const spec  = offer?.priceSpecification;
    if (spec) {
      const specs    = Array.isArray(spec) ? spec : [spec];
      const saleSpec = specs.find(s => String(s?.priceType ?? '').endsWith('SalePrice'));
      if (saleSpec?.price != null) add(candidates, String(saleSpec.price), 'json-ld:priceSpecification(SalePrice)', 'sale');
    }
    // Regular JSON-LD offer.price
    const raw = offer?.price ?? offer?.lowPrice;
    if (raw != null) add(candidates, String(raw), 'json-ld:offer.price', 'regular');
  }

  // 2. Meta tags
  const metaSale = extractMeta(html, 'product:sale_price:amount');
  if (metaSale) add(candidates, metaSale, 'meta:product:sale_price:amount', 'sale');

  const metaReg = extractMeta(html, 'product:price:amount', 'og:price:amount');
  if (metaReg) add(candidates, metaReg, 'meta:product:price:amount', 'regular');

  // 3. Inline JSON fields whose key name unambiguously means "sale / current price"
  //    jabko.ua: data-swatch='{"price_uah_no_currency": 18652.4}'
  const JSON_SALE = [
    { re: /"price_uah_no_currency"\s*:\s*([\d.]+)/,                         src: 'json:price_uah_no_currency' },
    { re: /"(?:sale|current|final|discounted|now)Price"\s*:\s*([\d.]+)/i,    src: 'json:salePrice' },
    { re: /"(?:sale|current|final|discounted)_price"\s*:\s*([\d.]+)/i,       src: 'json:sale_price' },
    { re: /"finalPrice"\s*:\s*([\d.]+)/i,                                    src: 'json:finalPrice' },
  ];
  for (const { re, src } of JSON_SALE) {
    const m = html.match(re);
    if (m) add(candidates, m[1], src, 'sale');
  }

  // 4. data-sale-price / data-current-price / data-special-price attributes
  const dataM = html.match(/data-(?:sale|current|special)-price=["']([^"'<>]{1,50})["']/i);
  if (dataM) add(candidates, dataM[1], 'data-attr:' + dataM[0].split('=')[0], 'sale');

  // 5. WooCommerce: sale price inside <ins>, old inside <del>
  const insM = html.match(/<ins\b[^>]*>([\s\S]{1,500}?)<\/ins>/i);
  if (insM) {
    const pm = insM[1].match(/([\d][\d\s.,₴€£$]{0,30})/);
    if (pm) add(candidates, pm[1], 'woocommerce:<ins>', 'sale');
  }
  const delM = html.match(/<del\b[^>]*>([\s\S]{1,500}?)<\/del>/i);
  if (delM) {
    const pm = delM[1].match(/([\d][\d\s.,₴€£$]{0,30})/);
    if (pm) add(candidates, pm[1], 'woocommerce:<del>', 'old');
  }

  // 6. itemprop="price"
  const ipM = html.match(/itemprop=["']price["'][^>]*content=["']([^"'<>]{1,50})["']/i) ||
              html.match(/content=["']([^"'<>]{1,50})["'][^>]*itemprop=["']price["']/i);
  if (ipM) add(candidates, ipM[1], 'itemprop:price', 'regular');

  // 7. data-price attribute (generic)
  const dpM = html.match(/data-price=["']([^"'<>]{1,50})["']/i);
  if (dpM) add(candidates, dpM[1], 'data-price', 'regular');

  // 8. CSS class scan
  const cssRe = /class=["']([^"']*\bprice\b[^"']*)["'][^>]*>([^<\n]{1,60})<\//gi;
  let cssM;
  while ((cssM = cssRe.exec(html)) !== null) {
    const cls  = cssM[1].toLowerCase();
    const text = cssM[2];
    if (!/\d/.test(text)) continue;
    const type = OLD_PRICE_CLS.test(cls) ? 'old' : SALE_PRICE_CLS.test(cls) ? 'sale' : 'regular';
    add(candidates, text, `css-class:${cssM[1].trim()}`, type);
  }

  return candidates;
}

/**
 * Detect whether the page is advertising a discount.
 * True when there are crossed-out prices, discount badges, or inline JSON
 * discount fields — even if the sale-price HTML is hard to parse.
 */
function pageHasDiscount(html, candidates) {
  if (candidates.some(c => c.type === 'sale' || c.type === 'old')) return true;
  if (/<del\b/i.test(html))                                          return true;
  if (/"discount"\s*:\s*"-?[\d]/i.test(html))                       return true; // jabko.ua "discount":"-2 897 грн"
  if (/class=["'][^"']*\b(?:discount|saving|badge)[^"']*["']/i.test(html)) return true;
  return false;
}

/**
 * Main price selector.  Runs all collectors, then picks the best price
 * according to priority:
 *   1. Explicit sale/current/discounted price
 *   2. If discount detected → lowest non-old price
 *   3. Regular price (non-old)
 *   4. Any non-old price (last resort)
 */
function extractBestPrice(html, jsonLd) {
  const candidates = collectPriceCandidates(html, jsonLd);
  const hasDiscount = pageHasDiscount(html, candidates);

  // ── Debug log ──────────────────────────────────────────────────────────────
  console.log('[productFetcher] Found prices:');
  if (candidates.length === 0) {
    console.log('  (none)');
  } else {
    for (const c of candidates) {
      console.log(`  ${c.value} (${c.type}) — ${c.source}`);
    }
  }
  if (hasDiscount) console.log('[productFetcher] Discount detected on page');

  let selected = null;
  let reason   = 'none';

  // 1. Explicit sale candidate
  const saleCandidates = candidates.filter(c => c.type === 'sale' && c.value > 0);
  if (saleCandidates.length > 0) {
    selected = saleCandidates[0];
    reason   = `explicit sale/current field (${selected.source})`;
  }

  // 2. Discount detected → lowest non-old price
  if (!selected && hasDiscount) {
    const nonOld = candidates.filter(c => c.type !== 'old' && c.value > 0);
    if (nonOld.length > 0) {
      selected = nonOld.reduce((a, b) => a.value < b.value ? a : b);
      reason   = `discount page — lowest non-old price (${selected.source})`;
    }
  }

  // 3. First regular price
  if (!selected) {
    const reg = candidates.find(c => c.type === 'regular' && c.value > 0);
    if (reg) { selected = reg; reason = `regular price (${reg.source})`; }
  }

  // 4. Any non-old
  if (!selected) {
    const any = candidates.find(c => c.type !== 'old' && c.value > 0);
    if (any) { selected = any; reason = `fallback any non-old (${any.source})`; }
  }

  if (selected) {
    console.log(`[productFetcher] Selected price: ${selected.value} — ${reason}`);
    return selected.raw;
  }

  console.log('[productFetcher] Selected price: null — no valid price found');
  return null;
}

/**
 * Parse a messy price string into a clean numeric string.
 * Handles:
 *   "21 549 ₴"     → "21549"
 *   "21,549 грн"   → "21549"
 *   "21 549.99"    → "21549.99"
 *   "1.234,56"     → "1234.56"  (European decimal comma)
 *   "1,234.56"     → "1234.56"  (US decimal dot)
 */
function cleanPrice(raw) {
  if (!raw) return null;

  // Strip everything except digits, space, comma, dot
  let s = raw.replace(/[^\d\s.,]/g, '').trim();
  // Remove spaces (Ukrainian uses space as thousand separator: "21 549")
  s = s.replace(/\s+/g, '');

  if (!s) return null;

  // Both comma and dot present — determine which is decimal
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // European: "1.234,56" → "1234.56"
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: "1,234.56" → "1234.56"
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    // Comma is decimal only if last part has 1-2 digits, otherwise it's a thousand separator
    if (parts.length === 2 && parts[1].length <= 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }

  const num = parseFloat(s);
  return isNaN(num) ? null : String(num);
}

// ── Image helpers ─────────────────────────────────────────────────────────────

function resolveUrl(url, base) {
  if (!url) return null;
  try { return new URL(url, base).toString(); } catch { return null; }
}

function isAbsoluteImageUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    // Reject data: URIs, blob: URIs passed as strings
    if (u.protocol === 'data:') return false;
    return true;
  } catch { return false; }
}

function bestImage(candidates, base) {
  for (const raw of candidates) {
    if (!raw) continue;
    const resolved = resolveUrl(raw, base);
    if (isAbsoluteImageUrl(resolved)) return resolved;
  }
  return null;
}

function imageFromJsonLd(product) {
  const img = product?.image;
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (Array.isArray(img)) return (typeof img[0] === 'string' ? img[0] : img[0]?.url) ?? null;
  return img.url ?? null;
}

// ── Main extractor ────────────────────────────────────────────────────────────

function findProductName(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 10) return null;
  if (obj['@type'] === 'Product' && typeof obj.name === 'string') return obj.name.trim();
  for (const key of ['product', 'productDetail', 'currentProduct', 'pdpProduct', 'item']) {
    if (obj[key]?.name && typeof obj[key].name === 'string') return obj[key].name.trim();
  }
  if (Array.isArray(obj)) {
    for (const item of obj.slice(0, 10)) { const r = findProductName(item, depth + 1); if (r) return r; }
  } else {
    for (const val of Object.values(obj).slice(0, 20)) {
      if (val && typeof val === 'object') { const r = findProductName(val, depth + 1); if (r) return r; }
    }
  }
  return null;
}

function parseProductInfo(html, pageUrl) {
  const parsed = new URL(pageUrl);
  const hostname = parsed.hostname;
  const jsonLd = extractJsonLdProduct(html);
  const nextData = extractNextData(html);

  // Title — try Next.js data first for JS-heavy sites
  const nextTitle = nextData ? findProductName(nextData) : null;
  const title =
    (jsonLd?.name && typeof jsonLd.name === 'string' ? jsonLd.name.trim() : null) ||
    nextTitle ||
    extractMeta(html, 'og:title', 'twitter:title') ||
    (() => { const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i); return m ? m[1].trim() : null; })() ||
    null;

  // Currency — priority order
  const currency =
    currencyFromJsonLd(jsonLd) ||
    detectCurrencyFromHtml(html, hostname) ||
    null;   // do NOT default to USD

  const price = extractBestPrice(html, jsonLd);

  // Extract <link rel="preload" as="image" href="..."> — many shops use this for the main product image.
  // Attributes can appear in any order, so we scan each <link> tag independently.
  const preloadImage = (() => {
    const tagRe = /<link\b[^>]*>/gi;
    let tagMatch;
    while ((tagMatch = tagRe.exec(html)) !== null) {
      const tag = tagMatch[0];
      if (!/rel=["']preload["']/i.test(tag)) continue;
      if (!/\bas=["']image["']/i.test(tag)) continue;
      const hrefM = tag.match(/\bhref=["']([^"'<>]{1,500})["']/i);
      if (hrefM) return hrefM[1];
    }
    return null;
  })();

  // Image — try multiple sources in priority order.
  // preloadImage comes first: <link rel="preload" as="image"> is an explicit intent signal
  // that this image is the main visual for the page, and CDNs rarely block it.
  // JSON-LD / og:image sometimes point to stale/missing thumbnail cache variants.
  const imageUrl = bestImage([
    preloadImage,
    imageFromJsonLd(jsonLd),
    extractMeta(html, 'og:image:secure_url'),
    extractMeta(html, 'og:image', 'og:image:url'),
    extractMeta(html, 'twitter:image', 'twitter:image:src'),
  ], pageUrl);

  return { title, price, currency, imageUrl };
}

// ── Image downloader (binary, redirect-safe, 10 MB cap) ──────────────────────

function downloadImage(urlStr, hopsLeft = 3, timeout = 10000, referer = null) {
  const parsed = safeParseUrl(urlStr);
  if (!parsed) return Promise.reject(new Error('Invalid or blocked URL'));

  return new Promise((resolve, reject) => {
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/*,*/*;q=0.8',
    };
    if (referer) headers['Referer'] = referer;

    const req = lib.get(urlStr, { headers }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        if (hopsLeft <= 0) return reject(new Error('Too many redirects'));
        let next;
        try { next = new URL(res.headers.location, urlStr).toString(); } catch { return reject(new Error('Bad redirect URL')); }
        return downloadImage(next, hopsLeft - 1, timeout, referer).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const contentType = (res.headers['content-type'] || '').split(';')[0].trim();
      const chunks = [];
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 10_000_000) { req.destroy(); return; }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
    });

    const timer = setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeout);
    req.on('close', () => clearTimeout(timer));
    req.on('error', err => { clearTimeout(timer); reject(err); });
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

async function fetchProductInfo(urlStr) {
  const parsed = new URL(urlStr);
  console.log(`[productFetcher] Fetching: ${urlStr}`);

  const html = await fetchHtml(urlStr);
  console.log(`[productFetcher] HTML received (${html.length} chars)`);

  const { title, price, currency, imageUrl } = parseProductInfo(html, urlStr);

  console.log(`[productFetcher] Parsed title:    ${title}`);
  console.log(`[productFetcher] Parsed price:    ${price}`);
  console.log(`[productFetcher] Parsed currency: ${currency}`);
  console.log(`[productFetcher] Parsed imageUrl: ${imageUrl}`);

  return {
    title,
    price,
    currency,
    imageUrl,
    sourceUrl:  urlStr,
    sourceHost: parsed.hostname,
  };
}

module.exports = { fetchProductInfo, safeParseUrl, downloadImage };
