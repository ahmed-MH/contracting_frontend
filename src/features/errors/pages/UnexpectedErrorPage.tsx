import { useAuth } from '../../auth/context/AuthContext';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { ErrorState } from '../components/ErrorState';

interface UnexpectedErrorPageProps {
    onRetry?: () => void;
}

export default function UnexpectedErrorPage({ onRetry }: UnexpectedErrorPageProps) {
    const { isAuthenticated, user } = useAuth();
    const homePath = isAuthenticated ? getDefaultPathForRole(user?.role) : '/';

    return (
        <ErrorState
            variant="500"
            title="Something went wrong"
            description="The app hit an unexpected error while rendering this view. You can retry the view or return to a stable workspace entry point."
            primaryLabel={isAuthenticated ? 'Back to workspace home' : 'Back to home'}
            primaryTo={homePath}
            secondaryLabel="Retry"
            onSecondaryAction={onRetry ?? (() => window.location.reload())}
            fullscreen
        />
    );
}
