import { useAuth } from '../../auth/context/AuthContext';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { ErrorState } from '../components/ErrorState';

export default function NotFoundPage() {
    const { isAuthenticated, user } = useAuth();
    const homePath = isAuthenticated ? getDefaultPathForRole(user?.role) : '/';

    return (
        <ErrorState
            variant="404"
            title="Page not found"
            description="The page you opened does not exist, may have moved, or is no longer available in this workspace."
            primaryLabel={isAuthenticated ? 'Back to workspace home' : 'Back to home'}
            primaryTo={homePath}
            fullscreen
        />
    );
}
