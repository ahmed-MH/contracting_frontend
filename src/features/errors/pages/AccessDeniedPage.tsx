import { useAuth } from '../../auth/context/AuthContext';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { ErrorState } from '../components/ErrorState';

export default function AccessDeniedPage() {
    const { user } = useAuth();
    const homePath = getDefaultPathForRole(user?.role);

    return (
        <ErrorState
            variant="403"
            title="You don't have access to this workspace area."
            description="Your role is active, but this page belongs to another workspace permission scope."
            primaryLabel="Back to workspace home"
            primaryTo={homePath}
        />
    );
}
