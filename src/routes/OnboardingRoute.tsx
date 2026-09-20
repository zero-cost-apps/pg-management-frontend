import React from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { OnboardingWizard } from '../components/Onboarding/OnboardingWizard';
import { Building2, Loader2 } from 'lucide-react';

export const OnboardingRoute: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-pulse">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Loading Onboarding Engine...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <OnboardingWizard
      onComplete={() => {
        navigate({ to: '/dashboard' });
      }}
    />
  );
};
