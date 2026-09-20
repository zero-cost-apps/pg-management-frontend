import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BuildingList } from '../components/Buildings/BuildingList';

export const BuildingsRoute: React.FC = () => {
  const navigate = useNavigate();

  return (
    <BuildingList
      onNavigateToRooms={(_buildingId) => {
        navigate({ to: '/rooms' });
      }}
    />
  );
};
