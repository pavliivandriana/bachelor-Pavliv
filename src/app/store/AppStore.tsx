import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, ApiError, setToken, removeToken, getToken } from '../../api/client';

export interface Wish {
  id: string;
  title: string;
  image: string;
  price: number;
  currency: string;
  link?: string;
  priority: number;
  confidence: number;
  aktualnostDuration: number;
  context?: string;
  notes?: string;
  tags: string[];
  visibility: 'public' | 'friends' | 'private';
  reserved: boolean;
  reservedBy?: string;
  fulfilled?: boolean;
  fulfilledAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastChecked?: Date | string;
  lastConfirmedAt?: Date | string;
  nextCheckAt?: Date | string;
  lastReminderSentAt?: Date | string;
  archived?: boolean;
  archivedAt?: Date | string;
  likes?: string[];
  comments?: Array<{ id: string; user: string; text: string; createdAt: Date }>;
  fetchStatus?: 'auto' | 'failed' | 'manual';
  sourceUrl?: string;
  fetchedAt?: Date | string;
  fetchedTitle?: string;
  fetchedPrice?: string;
  fetchedImageUrl?: string;
}

export interface AntiWishItem {
  id: string;
  category: string;
  item: string;
  reason?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string;
  bio?: string;
  preferences: {
    favoriteColors: string[];
    interests: string[];
    brands: string[];
  };
  sizes: {
    clothing?: string;
    shoe?: string;
    ring?: string;
  };
  followers: string[];
  following: string[];
  premium?: boolean;
  achievements?: string[];
  wishLimit?: number;
  profileVisibility?: 'public' | 'friends' | 'private';
  searchVisible?: boolean;
}

export interface Notification {
  id: string;
  type: 'reservation' | 'aktualnost' | 'follow' | 'comment' | 'like' | 'achievement';
  message: string;
  from?: string;
  wishId?: string;
  read: boolean;
  createdAt: Date | string;
}

interface AppState {
  currentUser: User | null;
  wishes: Wish[];
  antiWishlist: AntiWishItem[];
  notifications: Notification[];
  isAuthenticated: boolean;
  loading: boolean;
  newAchievements: string[];
}

interface AppContextType extends AppState {
  clearNewAchievement: (id: string) => void;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ waitSeconds?: number }>;

  refreshWishes: () => Promise<void>;
  addWish: (wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt' | 'reserved'>) => Promise<void>;
  updateWish: (id: string, updates: Partial<Wish>) => Promise<void>;
  deleteWish: (id: string) => Promise<void>;
  reserveWish: (id: string, userId: string) => Promise<void>;
  unreserveWish: (id: string) => Promise<void>;
  fulfillWish: (id: string) => Promise<void>;
  unfulfillWish: (id: string) => Promise<void>;
  markWishAsRelevant: (id: string) => Promise<void>;
  archiveWish: (id: string) => Promise<void>;
  restoreWish: (id: string) => Promise<void>;

  addAntiWish: (item: Omit<AntiWishItem, 'id'>) => Promise<void>;
  removeAntiWish: (id: string) => Promise<void>;

  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;

  activatePremium: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function loadUserData(): Promise<Omit<AppState, 'currentUser' | 'isAuthenticated' | 'loading'>> {
  const [wishes, antiWishlist, notifications] = await Promise.all([
    api.get<Wish[]>('/wishes'),
    api.get<AntiWishItem[]>('/anti-wishlist'),
    api.get<Notification[]>('/notifications'),
  ]);
  return { wishes, antiWishlist, notifications, newAchievements: [] };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    wishes: [],
    antiWishlist: [],
    notifications: [],
    isAuthenticated: false,
    loading: true,
    newAchievements: [],
  });

  useEffect(() => {
    if (!getToken()) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    Promise.all([api.get<User>('/auth/me'), api.get<Wish[]>('/wishes'), api.get<AntiWishItem[]>('/anti-wishlist'), api.get<Notification[]>('/notifications')])
      .then(([currentUser, wishes, antiWishlist, notifications]) => {
        setState({ currentUser, wishes, antiWishlist, notifications, isAuthenticated: true, loading: false, newAchievements: [] });
      })
      .catch(() => {
        removeToken();
        setState(s => ({ ...s, loading: false }));
      });
  }, []);

  // Auth
  const login = async (email: string, password: string) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(token);
    const data = await loadUserData();
    setState(s => ({ ...s, ...data, currentUser: user, isAuthenticated: true }));
  };

  const logout = () => {
    removeToken();
    setState({ currentUser: null, wishes: [], antiWishlist: [], notifications: [], isAuthenticated: false, loading: false, newAchievements: [] });
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await api.post<{ needsVerification: boolean; email: string }>('/auth/register', { name, email, password });
    return { needsVerification: result.needsVerification ?? false };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const { token: jwt, user } = await api.post<{ token: string; user: User }>('/auth/verify', { email, otp });
    setToken(jwt);
    const data = await loadUserData();
    setState(s => ({ ...s, ...data, currentUser: user, isAuthenticated: true }));
  };

  const resendVerification = async (email: string) => {
    try {
      await api.post('/auth/resend-verification', { email });
      return {};
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429 && err.data?.waitSeconds) {
        return { waitSeconds: err.data.waitSeconds as number };
      }
      throw err;
    }
  };

  // Achievement check — fire-and-forget after relevant user actions
  const runAchievementCheck = () => {
    api.post<{ newlyGranted: string[]; wishLimit: number; userAchievements: string[] }>('/achievements/check')
      .then(({ newlyGranted, wishLimit, userAchievements }) => {
        setState(s => ({
          ...s,
          newAchievements: newlyGranted.length > 0 ? [...s.newAchievements, ...newlyGranted] : s.newAchievements,
          currentUser: s.currentUser
            ? { ...s.currentUser, achievements: userAchievements, wishLimit }
            : null,
        }));
      })
      .catch(() => {});
  };

  const clearNewAchievement = (id: string) =>
    setState(s => ({ ...s, newAchievements: s.newAchievements.filter(a => a !== id) }));

  // Wishes
  const refreshWishes = async () => {
    try {
      const wishes = await api.get<Wish[]>('/wishes');
      setState(s => ({ ...s, wishes }));
    } catch { /* keep existing data on failure */ }
  };

  const addWish = async (wish: Omit<Wish, 'id' | 'createdAt' | 'updatedAt' | 'reserved'>) => {
    const created = await api.post<Wish>('/wishes', wish);
    setState(s => ({ ...s, wishes: [created, ...s.wishes] }));
    runAchievementCheck();
  };

  const updateWish = async (id: string, updates: Partial<Wish>) => {
    const updated = await api.patch<Wish>(`/wishes/${id}`, updates);
    setState(s => ({ ...s, wishes: s.wishes.map(w => w.id === id ? updated : w) }));
  };

  const deleteWish = async (id: string) => {
    await api.delete(`/wishes/${id}`);
    setState(s => ({ ...s, wishes: s.wishes.filter(w => w.id !== id) }));
  };

  const reserveWish = async (id: string, _userId: string) => {
    const updated = await api.patch<Wish>(`/wishes/${id}/reserve`);
    setState(s => ({ ...s, wishes: s.wishes.map(w => w.id === id ? updated : w) }));
  };

  const unreserveWish = async (id: string) => {
    const updated = await api.patch<Wish>(`/wishes/${id}/unreserve`);
    setState(s => ({ ...s, wishes: s.wishes.map(w => w.id === id ? updated : w) }));
  };

  const fulfillWish = async (id: string) => {
    const updated = await api.patch<Wish>(`/wishes/${id}/fulfill`);
    setState(s => ({ ...s, wishes: s.wishes.map(w => w.id === id ? updated : w) }));
    runAchievementCheck();
  };

  const unfulfillWish = async (id: string) => {
    const updated = await api.patch<Wish>(`/wishes/${id}/unfulfill`);
    setState(s => ({ ...s, wishes: s.wishes.map(w => w.id === id ? updated : w) }));
  };

  const markWishAsRelevant = async (id: string) => {
    const now = new Date();
    const wish = state.wishes.find(w => w.id === id);
    const mins = wish?.aktualnostDuration ?? 1;
    const nextCheckAt = new Date(now.getTime() + mins * 60 * 1000);
    setState(s => ({
      ...s,
      wishes: s.wishes.map((w: Wish) =>
        w.id === id
          ? { ...w, lastConfirmedAt: now, nextCheckAt, lastChecked: now, lastReminderSentAt: undefined }
          : w
      ),
    }));
    try {
      await api.patch(`/wishes/${id}/relevant`);
      runAchievementCheck();
    } catch {}
  };

  const archiveWish = async (id: string) => {
    const archivedAt = new Date();
    setState(s => ({
      ...s,
      wishes: s.wishes.map(w => w.id === id ? { ...w, archived: true, archivedAt } : w),
    }));
    try { await api.patch(`/wishes/${id}`, { archived: true, archivedAt }); } catch {}
  };

  const restoreWish = async (id: string) => {
    setState(s => ({
      ...s,
      wishes: s.wishes.map(w => w.id === id ? { ...w, archived: false, archivedAt: undefined } : w),
    }));
    try { await api.patch(`/wishes/${id}`, { archived: false, archivedAt: null }); } catch {}
  };

  // Anti-Wishlist
  const addAntiWish = async (item: Omit<AntiWishItem, 'id'>) => {
    const created = await api.post<AntiWishItem>('/anti-wishlist', item);
    setState(s => ({ ...s, antiWishlist: [created, ...s.antiWishlist] }));
  };

  const removeAntiWish = async (id: string) => {
    await api.delete(`/anti-wishlist/${id}`);
    setState(s => ({ ...s, antiWishlist: s.antiWishlist.filter(i => i.id !== id) }));
  };

  // Social
  const followUser = async (userId: string) => {
    const { following } = await api.post<{ following: string[] }>(`/social/users/${userId}/follow`);
    setState(s => ({ ...s, currentUser: s.currentUser ? { ...s.currentUser, following } : null }));
    runAchievementCheck();
  };

  const unfollowUser = async (userId: string) => {
    const { following } = await api.delete<{ following: string[] }>(`/social/users/${userId}/follow`);
    setState(s => ({ ...s, currentUser: s.currentUser ? { ...s.currentUser, following } : null }));
  };

  // Notifications
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const n: Notification = { ...notification, id: Date.now().toString(), read: false, createdAt: new Date() };
    setState(s => ({ ...s, notifications: [n, ...s.notifications] }));
  };

  const markNotificationRead = async (id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: false } : n) }));
    }
  };

  const dismissNotification = async (id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== id) }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {}
  };

  const clearNotifications = async () => {
    await api.delete('/notifications');
    setState(s => ({ ...s, notifications: [] }));
  };

  // Premium
  const activatePremium = async () => {
    await api.post('/premium/activate', {});
    setState(s => ({
      ...s,
      currentUser: s.currentUser
        ? { ...s.currentUser, premium: true, wishLimit: 999 }
        : null,
    }));
  };

  // Profile
  const updateProfile = async (updates: Partial<User>) => {
    const user = await api.patch<User>('/users/me', updates);
    setState(s => ({ ...s, currentUser: user }));
  };

  const deleteAccount = async () => {
    await api.delete('/users/me');
    removeToken();
    setState(s => ({ ...s, currentUser: null, isAuthenticated: false, wishes: [], notifications: [] }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        clearNewAchievement,
        login,
        logout,
        register,
        verifyEmail,
        resendVerification,
        refreshWishes,
        addWish,
        updateWish,
        deleteWish,
        reserveWish,
        unreserveWish,
        fulfillWish,
        unfulfillWish,
        markWishAsRelevant,
        archiveWish,
        restoreWish,
        addAntiWish,
        removeAntiWish,
        followUser,
        unfollowUser,
        addNotification,
        markNotificationRead,
        dismissNotification,
        clearNotifications,
        activatePremium,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
