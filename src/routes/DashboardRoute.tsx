import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePG } from '../context/PGContext';
import { Dashboard } from '../components/Dashboard/Dashboard';

export const DashboardRoute: React.FC = () => {
  const navigate = useNavigate();
  const { openRentModal } = usePG();

  return (
    <Dashboard
      onNavigate={(tab) => navigate({ to: `/${tab}` as any })}
      onOpenRentModal={(tenantId) => openRentModal(tenantId)}
    />
  );
};
