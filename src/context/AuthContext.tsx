import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, OnboardingData, SaasPlanTier, SaasSubscription } from '../types';

interface StoredUserAccount extends User {
  passwordHash: string;
}

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'user_owner_01',
    fullName: 'Ankit Panchal',
    email: 'owner@staysync.in',
    phone: '9876543210',
    role: 'owner',
    businessName: 'Sunshine Co-Living & PG',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isOnboarded: true,
    createdAt: '2026-01-10T10:00:00Z',
    passwordHash: 'admin123',
    subscription: {
      planTier: 'growth',
      planName: 'Growth Pro Multi-Property',
      status: 'active',
      renewalDate: '2026-12-31',
      monthlyPrice: 1499,
      maxRooms: 50,
      maxBuildings: 5,
      features: [
        'Up to 50 Rooms & 5 Buildings',
        'Aadhaar KYC Cloud Storage',
        'Sub-meter Electricity Auto-Billing',
        'Automated WhatsApp & SMS Rent Alerts',
        'Custom UPI QR Code Generator',
        'Multi-Property Building Portfolio'
      ]
    },
    gstNumber: '29ABCDE1234F1Z5',
    businessAddress: '124, 1st Cross, 5th Main, Indiranagar, Bengaluru, Karnataka 560038',
    bankDetails: {
      accountNumber: '918237461928',
      ifscCode: 'HDFC0001824',
      bankName: 'HDFC Bank, Indiranagar',
      accountHolderName: 'Ankit Panchal (Sunshine PG)',
      upiId: 'sunshinepg@okhdfcbank'
    }
  }
];

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
      'Basic Sub-meter Electricity Logging'
    ]
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
      'Priority Phone & Chat Support'
    ]
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
      'Dedicated Account Manager 24/7'
    ]
  }
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

const STORAGE_USERS_KEY = 'staysync_registered_users_v2';
const STORAGE_AUTH_KEY = 'staysync_authenticated_user_v2';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize accounts in localStorage
  const getStoredUsers = (): StoredUserAccount[] => {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        const parsed: StoredUserAccount[] = JSON.parse(stored);
        // Ensure all users have role: 'owner'
        const sanitized = parsed.map(u => ({
          ...u,
          role: 'owner' as UserRole,
          subscription: u.subscription || {
            planTier: 'growth',
            planName: 'Growth Pro Multi-Property',
            status: 'active',
            renewalDate: '2026-12-31',
            monthlyPrice: 1499,
            maxRooms: 50,
            maxBuildings: 5,
            features: SAAS_PLANS.growth.features
          }
        }));
        return sanitized;
      }
    } catch (e) {
      console.error('Failed to read stored users:', e);
    }
    // Default seed
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  };

  const saveUsers = (users: StoredUserAccount[]) => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  };

  // On mount: restore session or set default active user
  useEffect(() => {
    try {
      // Ensure seed users exist
      const users = getStoredUsers();
      const savedAuth = localStorage.getItem(STORAGE_AUTH_KEY);

      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        // Sync with freshest data in users list
        const fresh = users.find(u => u.id === parsed.id) || parsed;
        setCurrentUser(fresh);
        setIsAuthenticated(true);
      } else {
        // By default on initial load, pre-login the primary owner workspace
        const defaultUser = users[0];
        setCurrentUser(defaultUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login handler
  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedIdentifier = emailOrPhone.trim().toLowerCase();
    const users = getStoredUsers();

    const matched = users.find(u => 
      u.email.toLowerCase() === trimmedIdentifier || 
      u.phone.replace(/\D/g, '') === trimmedIdentifier.replace(/\D/g, '')
    );

    if (!matched) {
      return { success: false, error: 'No PG Owner account found with this email or mobile number.' };
    }

    if (matched.passwordHash !== password) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    const { passwordHash, ...userProfile } = matched;
    setCurrentUser(userProfile);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(userProfile));

    return { success: true };
  };

  // Register handler
  const register = async (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    businessName?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const trimmedEmail = userData.email.trim().toLowerCase();
    const cleanPhone = userData.phone.replace(/\D/g, '');
    const users = getStoredUsers();

    if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    if (users.some(u => u.phone.replace(/\D/g, '') === cleanPhone)) {
      return { success: false, error: 'An account with this mobile number is already registered.' };
    }

    const newId = `user_${Date.now()}`;
    const newUserRecord: StoredUserAccount = {
      id: newId,
      fullName: userData.fullName.trim(),
      email: trimmedEmail,
      phone: userData.phone.trim(),
      role: 'owner',
      businessName: userData.businessName?.trim() || `${userData.fullName.trim()}'s PG Accommodations`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.fullName)}&backgroundColor=4f46e5,0ea5e9,10b981`,
      isOnboarded: false, // New registered users MUST complete onboarding!
      createdAt: new Date().toISOString(),
      passwordHash: userData.password,
      subscription: {
        planTier: 'starter',
        planName: 'Starter Plan (14-Day Pro Trial)',
        status: 'trial',
        renewalDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        monthlyPrice: 0,
        maxRooms: 20,
        maxBuildings: 1,
        features: SAAS_PLANS.starter.features
      },
      bankDetails: {
        upiId: ''
      }
    };

    const updatedUsers = [...users, newUserRecord];
    saveUsers(updatedUsers);

    const { passwordHash, ...userProfile } = newUserRecord;
    setCurrentUser(userProfile);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(userProfile));

    return { success: true, user: userProfile };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  // Complete onboarding
  const completeOnboarding = async (data: OnboardingData) => {
    if (!currentUser) return;

    const users = getStoredUsers();
    const updatedUser: User = {
      ...currentUser,
      businessName: data.businessName || currentUser.businessName,
      isOnboarded: true,
      bankDetails: {
        ...currentUser.bankDetails,
        upiId: data.upiId || currentUser.bankDetails?.upiId
      }
    };

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          businessName: updatedUser.businessName,
          isOnboarded: true,
          bankDetails: updatedUser.bankDetails
        };
      }
      return u;
    });

    saveUsers(updatedUsers);
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(updatedUser));
  };

  // Allow resetting onboarding for the current user to demo/test onboarding at any time
  const resetOnboardingForTesting = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isOnboarded: false };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(updated));
    const users = getStoredUsers().map(u => u.id === currentUser.id ? { ...u, isOnboarded: false } : u);
    saveUsers(users);
  };

  // Update profile
  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(updated));
    const users = getStoredUsers().map(u => u.id === currentUser.id ? { ...u, ...updates } : u);
    saveUsers(users);
  };

  // Upgrade SaaS subscription
  const upgradeSubscription = (tier: SaasPlanTier) => {
    if (!currentUser) return;
    const planInfo = SAAS_PLANS[tier];
    const newSub: SaasSubscription = {
      planTier: tier,
      planName: planInfo.name,
      status: 'active',
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      monthlyPrice: planInfo.price,
      maxRooms: planInfo.maxRooms,
      maxBuildings: planInfo.maxBuildings,
      features: planInfo.features
    };
    updateUserProfile({ subscription: newSub });
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
        upgradeSubscription
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
