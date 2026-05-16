import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppUser {
  role: 'admin' | 'guest';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginAsAdmin: (pin: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('app_user_role');
    return saved ? { role: saved as 'admin' | 'guest' } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We are using local-only roles (Admin/Guest) as requested, 
    // skipping Firebase Auth to avoid restricted operation errors.
    setLoading(false);
  }, []);

  const loginAsAdmin = (pin: string) => {
    if (pin === '1978') {
      const newUser: AppUser = { role: 'admin' };
      setUser(newUser);
      localStorage.setItem('app_user_role', 'admin');
      return true;
    }
    return false;
  };

  const loginAsGuest = () => {
    const newUser: AppUser = { role: 'guest' };
    setUser(newUser);
    localStorage.setItem('app_user_role', 'guest');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user_role');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsAdmin, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
