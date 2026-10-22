/**
 * FixMate Authentication Context
 * Manages user sessions, role-based workflows, and quick-switch for development testing.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '@/types/database';
import { dataStore } from '@/services/dataStore';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isCustomer: boolean;
  isProvider: boolean;
  isAdmin: boolean;
  switchUser: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  logout: () => Promise<void>;
  availableProfiles: Profile[];
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      await dataStore.initialize();
      const currentUser = await dataStore.getCurrentUser();
      const profiles = await dataStore.getProfiles();
      setAvailableProfiles(profiles);
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user in AuthContext', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const updated = await dataStore.setCurrentUser(userId);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = await dataStore.updateProfile(user.id, updates);
    setUser(updated);
  };

  const logout = async () => {
    // In demo mode or Supabase, clear current user
    if (availableProfiles.length > 0) {
      // Default back to first customer for sandbox
      await switchUser(availableProfiles[0].id);
    }
  };

  const role = user?.role || 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isCustomer: role === 'customer',
        isProvider: role === 'provider',
        isAdmin: role === 'admin',
        switchUser,
        updateProfile,
        logout,
        availableProfiles,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
