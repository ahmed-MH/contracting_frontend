import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Spinner } from './components/ui/Spinner';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import GuestRoute from './features/auth/components/GuestRoute';
import { useAuth } from './features/auth/context/AuthContext';
import { getDefaultPathForRole } from './layouts/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from './hooks/useTheme';
import type { UserRole } from './features/auth/types/auth.types';

const LandingPage = lazy(() => import('./features/public/LandingPage'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const AcceptInvitePage = lazy(() => import('./features/auth/pages/AcceptInvitePage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const HotelPage = lazy(() => import('./features/hotel/pages/HotelPage'));
const ExchangeRatesPage = lazy(() => import('./features/exchange-rates/pages/ExchangeRatesPage'));
const RoomTypesPage = lazy(() => import('./features/rooms/pages/RoomTypesPage'));
const ArrangementsPage = lazy(() => import('./features/arrangements/pages/ArrangementsPage'));
const SupplementsCatalogPage = lazy(() => import('./features/catalog/supplements/pages/SupplementsCatalogPage'));
const SpoTemplatesPage = lazy(() => import('./features/catalog/spos/pages/SpoTemplatesPage'));
const ReductionsCatalogPage = lazy(() => import('./features/catalog/reductions/pages/ReductionsCatalogPage'));
const MonoparentalCatalogPage = lazy(() => import('./features/catalog/monoparental/pages/MonoparentalCatalogPage'));
const EarlyBookingsCatalogPage = lazy(() => import('./features/catalog/early-bookings/pages/EarlyBookingsCatalogPage'));
const CancellationCatalogPage = lazy(() => import('./features/catalog/cancellation/pages/CancellationCatalogPage'));
const AffiliatesPage = lazy(() => import('./features/partners/pages/AffiliatesPage'));
const ContractsList = lazy(() => import('./features/contracts/pages/ContractsList'));
const ContractDetailsLayout = lazy(() => import('./features/contracts/details/components/ContractDetailsLayout'));
const GeneralTab = lazy(() => import('./features/contracts/details/tabs/GeneralTab'));
const RatesGridTab = lazy(() => import('./features/contracts/details/tabs/RatesGridTab'));
const SupplementsTab = lazy(() => import('./features/contracts/details/tabs/SupplementsTab'));
const ReductionsTab = lazy(() => import('./features/contracts/details/tabs/ReductionsTab'));
const MonoparentalTab = lazy(() => import('./features/contracts/details/tabs/MonoparentalTab'));
const EarlyBookingsTab = lazy(() => import('./features/contracts/details/tabs/EarlyBookingsTab'));
const ContractSposTab = lazy(() => import('./features/contracts/details/tabs/ContractSposTab'));
const CancellationTab = lazy(() => import('./features/contracts/details/tabs/CancellationTab'));
const SimulatorPage = lazy(() => import('./features/simulator/pages/SimulatorPage'));
const ProformaPreviewPage = lazy(() => import('./features/simulator/pages/ProformaPreviewPage'));
const ContractPreviewPage = lazy(() => import('./features/contracts/pages/ContractPreviewPage'));
const UsersPage = lazy(() => import('./features/admin/pages/UsersPage'));
const AdminOverviewPage = lazy(() => import('./features/admin/pages/AdminOverviewPage'));
const SupervisorOverviewPage = lazy(() => import('./features/supervisor/pages/SupervisorOverviewPage'));
const SupervisorPlatformSettingsPage = lazy(() => import('./features/supervisor/pages/SupervisorPlatformSettingsPage'));
const SupervisorSystemLogsPage = lazy(() => import('./features/supervisor/pages/SupervisorSystemLogsPage'));
const SupervisorTenantsPage = lazy(() => import('./features/supervisor/pages/SupervisorTenantsPage'));

const supervisorOnlyRoles: UserRole[] = ['SUPERVISOR'];
const adminOnlyRoles: UserRole[] = ['ADMIN'];
const authenticatedRoles: UserRole[] = ['SUPERVISOR', 'ADMIN', 'COMMERCIAL', 'AGENT'];
const tenantOperatorRoles: UserRole[] = ['ADMIN', 'COMMERCIAL'];
const contractAccessRoles: UserRole[] = ['ADMIN', 'COMMERCIAL', 'AGENT'];
const simulatorAccessRoles: UserRole[] = ['ADMIN', 'COMMERCIAL', 'AGENT'];

const GlobalLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-brand-light dark:bg-brand-navy">
        <div className="scale-150">
            <Spinner />
        </div>
    </div>
);

function RoleHomeRedirect() {
    const { t } = useTranslation('common');
    void t;
    const { user } = useAuth();

    return <Navigate to={getDefaultPathForRole(user?.role)} replace />;
}

function App() {
    const { isDark } = useTheme();

    return (
        <>
            <Toaster
                position="top-right"
                closeButton
                theme={isDark ? 'dark' : 'light'}
                expand
                visibleToasts={4}
                toastOptions={{
                    duration: 4500,
                    unstyled: true,
                    classNames: {
                        default: 'pricify-toast-default',
                        success: 'pricify-toast-success',
                        error: 'pricify-toast-error',
                        warning: 'pricify-toast-warning',
                        info: 'pricify-toast-info',
                        toast: 'pricify-toast',
                        content: 'pricify-toast-content',
                        icon: 'pricify-toast-icon',
                        title: 'pricify-toast-title',
                        description: 'pricify-toast-description',
                        actionButton: 'pricify-toast-action',
                        cancelButton: 'pricify-toast-cancel',
                        closeButton: 'pricify-toast-close',
                    },
                }}
            />
            <BrowserRouter>
                <Suspense fallback={<GlobalLoader />}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />

                        <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/accept-invite" element={<AcceptInvitePage />} />
                        </Route>

                        <Route
                            element={
                                <ProtectedRoute allowedRoles={authenticatedRoles}>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="app" element={<RoleHomeRedirect />} />

                            <Route
                                path="platform"
                                element={
                                    <ProtectedRoute allowedRoles={supervisorOnlyRoles}>
                                        <SupervisorOverviewPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="organization"
                                element={
                                    <ProtectedRoute allowedRoles={adminOnlyRoles}>
                                        <AdminOverviewPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route path="hotel-setup" element={<Navigate to="/hotel-setup/hotel-information" replace />} />
                            <Route path="product/hotel" element={<Navigate to="/hotel-setup/hotel-information" replace />} />
                            <Route
                                path="hotel-setup/hotel-information"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <HotelPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="hotel-setup/exchange-rates"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <ExchangeRatesPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/rooms"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <RoomTypesPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/arrangements"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <ArrangementsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/supplements"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <SupplementsCatalogPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/spos"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <SpoTemplatesPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/reductions"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <ReductionsCatalogPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/monoparental"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <MonoparentalCatalogPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/early-bookings"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <EarlyBookingsCatalogPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="product/cancellations"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <CancellationCatalogPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="partners/affiliates"
                                element={
                                    <ProtectedRoute allowedRoles={tenantOperatorRoles}>
                                        <AffiliatesPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="contracts"
                                element={
                                    <ProtectedRoute allowedRoles={contractAccessRoles}>
                                        <ContractsList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="simulator"
                                element={
                                    <ProtectedRoute allowedRoles={simulatorAccessRoles}>
                                        <SimulatorPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="proforma/:id"
                                element={
                                    <ProtectedRoute allowedRoles={simulatorAccessRoles}>
                                        <ProformaPreviewPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="contracts/:id/preview"
                                element={
                                    <ProtectedRoute allowedRoles={contractAccessRoles}>
                                        <ContractPreviewPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="contracts/:id"
                                element={
                                    <ProtectedRoute allowedRoles={contractAccessRoles}>
                                        <ContractDetailsLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="general" replace />} />
                                <Route path="general" element={<ProtectedRoute allowedRoles={contractAccessRoles}><GeneralTab /></ProtectedRoute>} />
                                <Route path="rates-grid" element={<ProtectedRoute allowedRoles={contractAccessRoles}><RatesGridTab /></ProtectedRoute>} />
                                <Route path="supplements" element={<ProtectedRoute allowedRoles={contractAccessRoles}><SupplementsTab /></ProtectedRoute>} />
                                <Route path="spos" element={<ProtectedRoute allowedRoles={contractAccessRoles}><ContractSposTab /></ProtectedRoute>} />
                                <Route path="reductions" element={<ProtectedRoute allowedRoles={contractAccessRoles}><ReductionsTab /></ProtectedRoute>} />
                                <Route path="monoparental" element={<ProtectedRoute allowedRoles={contractAccessRoles}><MonoparentalTab /></ProtectedRoute>} />
                                <Route path="early-bookings" element={<ProtectedRoute allowedRoles={contractAccessRoles}><EarlyBookingsTab /></ProtectedRoute>} />
                                <Route path="cancellation" element={<ProtectedRoute allowedRoles={contractAccessRoles}><CancellationTab /></ProtectedRoute>} />
                            </Route>

                            <Route
                                path="admin/users"
                                element={
                                    <ProtectedRoute allowedRoles={adminOnlyRoles}>
                                        <UsersPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="tenants"
                                element={
                                    <ProtectedRoute allowedRoles={supervisorOnlyRoles}>
                                        <SupervisorTenantsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="plans"
                                element={
                                    <ProtectedRoute allowedRoles={supervisorOnlyRoles}>
                                        <SupervisorPlatformSettingsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="system-logs"
                                element={
                                    <ProtectedRoute allowedRoles={supervisorOnlyRoles}>
                                        <SupervisorSystemLogsPage />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}

export default App;
