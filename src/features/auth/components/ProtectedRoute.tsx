import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth.types';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    allowedRoles?: UserRole[];
    deniedRoles?: UserRole[];
}

export default function ProtectedRoute({
    children,
    requiredRole,
    allowedRoles,
    deniedRoles,
}: ProtectedRouteProps) {
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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to={getDefaultPathForRole(user?.role)} replace />;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDefaultPathForRole(user?.role)} replace />;
    }

    if (deniedRoles && user?.role && deniedRoles.includes(user.role)) {
        return <Navigate to={getDefaultPathForRole(user?.role)} replace />;
    }

    return <>{children}</>;
}
