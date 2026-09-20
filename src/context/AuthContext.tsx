import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, OnboardingData, SaasPlanTier } from '../types';
import {
  api,
  ApiError,
  getStoredAccessToken,
  setStoredTokens,
  clearStoredTokens,
} from '../api/client';
import { queryClient } from '../api/queries';
import toast from 'react-hot-toast';

export const SAAS_PLANS: Record<SaasPlanTier, {
  name: string;
  price: number;
  maxRooms: number;
  maxBuildings: number;
  features: string[];
}> = {
  starter: {
    name: 'Starter Plan',
    price: 699,
    maxRooms: 20,
    maxBuildings: 1,
    features: [
      'Up to 20 Rooms & Residents',
      'Single Building Management',
      'Tenant Aadhaar KYC Document Store',
      'Manual Rent Receipts & PDF Export',
      'Basic Sub-meter Electricity Logging',
    ],
  },
  growth: {
    name: 'Growth Pro Multi-Property',
    price: 1499,
    maxRooms: 50,
    maxBuildings: 5,
    features: [
      'Up to 50 Rooms & 5 Buildings',
      'Multi-Building Portfolio Dashboard',
      'Sub-meter Electricity Auto-Split Calculation',
      'Instant WhatsApp Overdue Reminders',
      'Custom UPI QR Code on Receipts',
      'Priority Phone & Chat Support',
    ],
  },
  enterprise: {
    name: 'Enterprise Co-Living',
    price: 3499,
    maxRooms: 200,
    maxBuildings: 20,
    features: [
      'Up to 200 Rooms & 20 Buildings',
      'Advanced Multi-City Portfolio Analytics',
      'Custom Domain & Branded Resident Portal',
      'Bulk Data CSV Import & Export',
      'Dedicated Account Manager 24/7',
    ],
  },
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    businessName?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  resetOnboardingForTesting: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  upgradeSubscription: (tier: SaasPlanTier) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: restore session from backend if access token exists
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = getStoredAccessToken();
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.auth.me();
        if (isMounted && res?.user) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Failed to restore session from token:', err);
        clearStoredTokens();
        if (isMounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    const handleUnauthorized = () => {
      clearStoredTokens();
      setCurrentUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Login handler calling Next.js API
  const login = async (
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.login(emailOrPhone, password);
      setStoredTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      await queryClient.invalidateQueries();
      return { success: true };
    } catch (err: any) {
      console.error('Login failed:', err);
      return {
        success: false,
        error: err.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  // Register handler calling Next.js API
  const register = async (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    businessName?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await api.auth.register(userData);
      setStoredTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      await queryClient.invalidateQueries();
      return { success: true, user: res.user };
    } catch (err: any) {
      console.error('Registration failed:', err);
      return {
        success: false,
        error: err.message || 'Registration failed.',
      };
    }
  };

  // Logout handler calling Next.js API
  const logout = () => {
    api.auth.logout().catch(() => { });
    clearStoredTokens();
    queryClient.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Complete onboarding wizard calling atomic backend endpoint
  const completeOnboarding = async (data: OnboardingData): Promise<void> => {
    try {
      const res = await api.onboarding.complete(data);
      if (res?.user) {
        setCurrentUser(res.user);
      }
      await queryClient.invalidateQueries();
    } catch (err: any) {
      console.error('Onboarding completion failed:', err);
      let errors = err?.fields ? Object.values(err.fields).flat() : [err.message]
      console.log("err", err, JSON.stringify(err))
      toast.error(<ul> {errors.map(e => <li>{e}</li>)}</ul>)
      throw err;
    }
  };

  const resetOnboardingForTesting = () => {
    if (currentUser) {
      const updated = { ...currentUser, isOnboarded: false };
      setCurrentUser(updated);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      const res = await api.account.updateProfile(updates);
      if (res?.user) {
        setCurrentUser(res.user);
      }
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (err) {
      console.error('Update user profile failed:', err);
    }
  };

  const upgradeSubscription = (tier: SaasPlanTier) => {
    console.log('[SaaS Plan] Subscribing to tier:', tier);
    // In P0 default plan is implicit, but we update UI state gracefully
    if (currentUser) {
      const plan = SAAS_PLANS[tier];
      setCurrentUser({
        ...currentUser,
        subscription: {
          planTier: tier,
          planName: plan.name,
          status: 'active',
          renewalDate: '2026-12-31',
          monthlyPrice: plan.price,
          maxRooms: plan.maxRooms,
          maxBuildings: plan.maxBuildings,
          features: plan.features,
        },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        resetOnboardingForTesting,
        updateUserProfile,
        upgradeSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
