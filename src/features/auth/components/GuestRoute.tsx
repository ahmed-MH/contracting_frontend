import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GuestRouteProps {
    children: React.ReactNode;
}

/**
 * Inverse of ProtectedRoute — only accessible to unauthenticated users.
 * Redirects logged-in users to the main app.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/product/hotel" replace />;
    }

    return <>{children}</>;
}
