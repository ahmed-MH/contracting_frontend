import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import CommercialLayout from './layouts/CommercialLayout';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import GuestRoute from './features/auth/components/GuestRoute';
import LandingPage from './features/public/LandingPage';
import LoginPage from './features/auth/pages/LoginPage';
import AcceptInvitePage from './features/auth/pages/AcceptInvitePage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import HotelPage from './features/hotel/pages/HotelPage';
import RoomTypesPage from './features/rooms/pages/RoomTypesPage';
import ArrangementsPage from './features/arrangements/pages/ArrangementsPage';
import SupplementsCatalogPage from './features/catalog/supplements/pages/SupplementsCatalogPage';
import SpoTemplatesPage from './features/catalog/spos/pages/SpoTemplatesPage';
import ReductionsCatalogPage from './features/catalog/reductions/pages/ReductionsCatalogPage';
import MonoparentalCatalogPage from './features/catalog/monoparental/pages/MonoparentalCatalogPage';
import EarlyBookingsCatalogPage from './features/catalog/early-bookings/pages/EarlyBookingsCatalogPage';
import CancellationCatalogPage from './features/catalog/cancellation/pages/CancellationCatalogPage';
import AffiliatesPage from './features/partners/pages/AffiliatesPage';
import ContractsList from './features/contracts/pages/ContractsList';
import ContractDetailsLayout from './features/contracts/details/components/ContractDetailsLayout';
import GeneralTab from './features/contracts/details/tabs/GeneralTab';
import RatesGridTab from './features/contracts/details/tabs/RatesGridTab';
import SupplementsTab from './features/contracts/details/tabs/SupplementsTab';
import ReductionsTab from './features/contracts/details/tabs/ReductionsTab';
import MonoparentalTab from './features/contracts/details/tabs/MonoparentalTab';
import EarlyBookingsTab from './features/contracts/details/tabs/EarlyBookingsTab';
import ContractSposTab from './features/contracts/details/tabs/ContractSposTab';
import CancellationTab from './features/contracts/details/tabs/CancellationTab';
import SimulatorPage from './features/simulator/pages/SimulatorPage';
import UsersPage from './features/admin/pages/UsersPage';

function App() {
    return (
        <>
            <Toaster position="top-right" richColors closeButton />
            <BrowserRouter>
                <Routes>
                    {/* ─── Public Route ──────────────────────── */}
                    <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

                    {/* ─── Guest-only Auth Routes (redirect if logged in) ── */}
                    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                    <Route path="/accept-invite" element={<GuestRoute><AcceptInvitePage /></GuestRoute>} />
                    <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
                    <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

                    {/* ─── Protected App Routes ───────────────── */}
                    <Route element={
                        <ProtectedRoute>
                            <CommercialLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="product/hotel" element={<HotelPage />} />
                        <Route path="product/rooms" element={<RoomTypesPage />} />
                        <Route path="product/arrangements" element={<ArrangementsPage />} />
                        <Route path="product/supplements" element={<SupplementsCatalogPage />} />
                        <Route path="product/spos" element={<SpoTemplatesPage />} />
                        <Route path="product/reductions" element={<ReductionsCatalogPage />} />
                        <Route path="product/monoparental" element={<MonoparentalCatalogPage />} />
                        <Route path="product/early-bookings" element={<EarlyBookingsCatalogPage />} />
                        <Route path="product/cancellations" element={<CancellationCatalogPage />} />
                        <Route path="partners/affiliates" element={<AffiliatesPage />} />
                        <Route path="contracts" element={<ContractsList />} />
                        <Route path="simulator" element={<SimulatorPage />} />
                        <Route path="contracts/:id" element={<ContractDetailsLayout />}>
                            <Route index element={<Navigate to="general" replace />} />
                            <Route path="general" element={<GeneralTab />} />
                            <Route path="rates-grid" element={<RatesGridTab />} />
                            <Route path="supplements" element={<SupplementsTab />} />
                            <Route path="spos" element={<ContractSposTab />} />
                            <Route path="reductions" element={<ReductionsTab />} />
                            <Route path="monoparental" element={<MonoparentalTab />} />
                            <Route path="early-bookings" element={<EarlyBookingsTab />} />
                            <Route path="cancellation" element={<CancellationTab />} />
                        </Route>
                        <Route path="admin/users" element={
                            <ProtectedRoute requiredRole="ADMIN">
                                <UsersPage />
                            </ProtectedRoute>
                        } />
                    </Route>

                    {/* ─── Fallback ────────────────────────────── */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
