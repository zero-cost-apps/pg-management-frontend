import React from 'react';
import { usePG } from '../context/PGContext';
import { OverdueTracker } from '../components/Overdue/OverdueTracker';

export const OverdueRoute: React.FC = () => {
  const { openRentModal } = usePG();

  return (
    <OverdueTracker
      onCollectPayment={(tenantId) => openRentModal(tenantId)}
    />
  );
};
