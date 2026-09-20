import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './api/queries';
import { PGProvider } from './context/PGContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PGProvider>
          <RouterProvider router={router} />
        </PGProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
