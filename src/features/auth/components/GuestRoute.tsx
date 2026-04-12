import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { useTranslation } from 'react-i18next';

interface GuestRouteProps {
    children: React.ReactNode;
}

/**
 * Inverse of ProtectedRoute — only accessible to unauthenticated users.
 * Redirects logged-in users to the main app.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
    const { t } = useTranslation('common');
    void t;
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={getDefaultPathForRole(user?.role)} replace />;
    }

    return <>{children}</>;
}
