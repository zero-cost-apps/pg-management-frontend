import React from 'react';
import { usePG } from '../context/PGContext';
import { RentHistoryTable } from '../components/Rent/RentHistoryTable';

export const RentRoute: React.FC = () => {
  const { openRentModal } = usePG();

  return (
    <RentHistoryTable
      onOpenCollectModal={(tenantId) => openRentModal(tenantId)}
    />
  );
};
