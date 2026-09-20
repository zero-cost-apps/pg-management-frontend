import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
} from '@tanstack/react-router';

// Route Components
import { HomeRoute } from '../routes/HomeRoute';
import { LoginRoute } from '../routes/LoginRoute';
import { RegisterRoute } from '../routes/RegisterRoute';
import { OnboardingRoute } from '../routes/OnboardingRoute';
import { AppLayoutRoute } from '../routes/AppLayoutRoute';
import { DashboardRoute } from '../routes/DashboardRoute';
import { RoomsRoute } from '../routes/RoomsRoute';
import { TenantsRoute } from '../routes/TenantsRoute';
import { RentRoute } from '../routes/RentRoute';
import { ElectricityRoute } from '../routes/ElectricityRoute';
import { OverdueRoute } from '../routes/OverdueRoute';
import { BuildingsRoute } from '../routes/BuildingsRoute';

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <Navigate to="/" replace />,
});

// 2. Public / Auth Routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeRoute,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRoute,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterRoute,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingRoute,
});

// 3. Protected App Layout Route (wraps all operational pages with sidebar & navbar)
const appLayoutRoute = createRoute({
  id: 'app',
  getParentRoute: () => rootRoute,
  component: AppLayoutRoute,
});

// 4. Authenticated Operational Pages
const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardRoute,
});

const roomsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/rooms',
  component: RoomsRoute,
});

const tenantsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tenants',
  component: TenantsRoute,
});

const rentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/rent',
  component: RentRoute,
});

const electricityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/electricity',
  component: ElectricityRoute,
});

const overdueRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/overdue',
  component: OverdueRoute,
});

const buildingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/buildings',
  component: BuildingsRoute,
});

// 5. Route Tree Construction
const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  onboardingRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    roomsRoute,
    tenantsRoute,
    rentRoute,
    electricityRoute,
    overdueRoute,
    buildingsRoute,
  ]),
]);

// 6. Router Instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register router for full TypeScript type safety across Link and navigate
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
