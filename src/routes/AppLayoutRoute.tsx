import React from 'react';
import { Outlet, Navigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { usePG } from '../context/PGContext';
import { AppLayout } from '../components/Layout/AppLayout';
import { RentCollectionModal } from '../components/Rent/RentCollectionModal';
import { ReceiptModal } from '../components/Rent/ReceiptModal';
import { TenantDetailModal } from '../components/Tenants/TenantDetailModal';
import { AadharPdfViewerModal } from '../components/Rooms/AadharPdfViewerModal';
import { Building2, Loader2 } from 'lucide-react';

export const AppLayoutRoute: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const {
    isRentModalOpen,
    rentModalPreselectedTenantId,
    closeRentModal,
    openRentModal,
    receiptToView,
    setReceiptToView,
    tenantToView,
    setTenantToView,
    coOccupantToViewAadhaar,
    setCoOccupantToViewAadhaar
  } = usePG();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-pulse">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Starting StaySync PG Engine...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> go to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not onboarded -> go to onboarding
  if (!currentUser.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout>
      <Outlet />

      {/* Global Application Modals */}
      <RentCollectionModal
        isOpen={isRentModalOpen}
        onClose={closeRentModal}
        preselectedTenantId={rentModalPreselectedTenantId}
      />

      <ReceiptModal
        payment={receiptToView}
        onClose={() => setReceiptToView(null)}
      />

      <TenantDetailModal
        tenant={tenantToView}
        onClose={() => setTenantToView(null)}
        onOpenCollectRent={(tenantId) => openRentModal(tenantId)}
      />

      <AadharPdfViewerModal
        coOccupant={coOccupantToViewAadhaar}
        onClose={() => setCoOccupantToViewAadhaar(null)}
      />
    </AppLayout>
  );
};
