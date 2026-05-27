require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const { checkSmtpConfig } = require('./utils/sendVerificationEmail');
const { startScheduler } = require('./scheduler');

const app = express();
connectDB();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman) and any localhost port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/wishes',       require('./routes/wishes'));
app.use('/api/anti-wishlist',require('./routes/antiWishlist'));
app.use('/api/social',       require('./routes/social'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/premium',      require('./routes/premium'));
app.use('/api/aktualnost',   require('./routes/aktualnost'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  checkSmtpConfig();
  startScheduler();
});
