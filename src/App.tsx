import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queries';
import { PGProvider, usePG } from './context/PGContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RoomGrid } from './components/Rooms/RoomGrid';
import { TenantList } from './components/Tenants/TenantList';
import { RentHistoryTable } from './components/Rent/RentHistoryTable';
import { ElectricityManager } from './components/Electricity/ElectricityManager';
import { OverdueTracker } from './components/Overdue/OverdueTracker';
import { BuildingList } from './components/Buildings/BuildingList';
import { RentCollectionModal } from './components/Rent/RentCollectionModal';
import { ReceiptModal } from './components/Rent/ReceiptModal';
import { TenantDetailModal } from './components/Tenants/TenantDetailModal';
import { AadharPdfViewerModal } from './components/Rooms/AadharPdfViewerModal';
import { Building2, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [rentModalPreselectedTenantId, setRentModalPreselectedTenantId] = useState<string | undefined>(undefined);

  const { 
    receiptToView, 
    setReceiptToView, 
    tenantToView, 
    setTenantToView,
    coOccupantToViewAadhaar,
    setCoOccupantToViewAadhaar
  } = usePG();

  const handleOpenRentModal = (tenantId?: string) => {
    setRentModalPreselectedTenantId(tenantId);
    setIsRentModalOpen(true);
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onOpenRentModal={handleOpenRentModal}
    >
      {/* Dynamic Tab Views */}
      {currentTab === 'dashboard' && (
        <Dashboard
          onNavigate={setCurrentTab}
          onOpenRentModal={handleOpenRentModal}
        />
      )}

      {currentTab === 'rooms' && (
        <RoomGrid />
      )}

      {currentTab === 'tenants' && (
        <TenantList
          onSelectTenant={(t) => setTenantToView(t)}
          onOpenCollectRent={handleOpenRentModal}
        />
      )}

      {currentTab === 'rent' && (
        <RentHistoryTable
          onOpenCollectModal={handleOpenRentModal}
        />
      )}

      {currentTab === 'electricity' && (
        <ElectricityManager />
      )}

      {currentTab === 'overdue' && (
        <OverdueTracker
          onCollectPayment={handleOpenRentModal}
        />
      )}

      {currentTab === 'buildings' && (
        <BuildingList
          onNavigateToRooms={(buildingId) => {
            setCurrentTab('rooms');
          }}
        />
      )}

      {/* Global Application Modals */}
      <RentCollectionModal
        isOpen={isRentModalOpen}
        onClose={() => {
          setIsRentModalOpen(false);
          setRentModalPreselectedTenantId(undefined);
        }}
        preselectedTenantId={rentModalPreselectedTenantId}
      />

      <ReceiptModal
        payment={receiptToView}
        onClose={() => setReceiptToView(null)}
      />

      <TenantDetailModal
        tenant={tenantToView}
        onClose={() => setTenantToView(null)}
        onOpenCollectRent={handleOpenRentModal}
      />

      <AadharPdfViewerModal
        coOccupant={coOccupantToViewAadhaar}
        onClose={() => setCoOccupantToViewAadhaar(null)}
      />

    </AppLayout>
  );
};

const AppRoot: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();

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

  // If not logged in: show Login / Register screen
  if (!isAuthenticated || !currentUser) {
    return <AuthScreen />;
  }

  // If logged in but not onboarded: guide through complete PG onboarding flow
  if (!currentUser.isOnboarded) {
    return <OnboardingWizard />;
  }

  // Logged in and onboarded: full active PG application
  return <MainApp />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PGProvider>
          <AppRoot />
        </PGProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

