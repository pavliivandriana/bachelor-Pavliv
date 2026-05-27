import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WishlistContextType {
  showQuickAdd: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const openQuickAdd = () => setShowQuickAdd(true);
  const closeQuickAdd = () => setShowQuickAdd(false);

  return (
    <WishlistContext.Provider value={{ showQuickAdd, openQuickAdd, closeQuickAdd }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
