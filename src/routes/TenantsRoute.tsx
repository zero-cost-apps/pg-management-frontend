import React from 'react';
import { usePG } from '../context/PGContext';
import { TenantList } from '../components/Tenants/TenantList';

export const TenantsRoute: React.FC = () => {
  const { setTenantToView, openRentModal } = usePG();

  return (
    <TenantList
      onSelectTenant={(t) => setTenantToView(t)}
      onOpenCollectRent={(tenantId) => openRentModal(tenantId)}
    />
  );
};
