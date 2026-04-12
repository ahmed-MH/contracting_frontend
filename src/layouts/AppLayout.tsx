import CommercialLayout from './CommercialLayout';
import AdminLayout from './AdminLayout';
import SupervisorLayout from './SupervisorLayout';
import AgentLayout from './AgentLayout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/context/AuthContext';

export default function AppLayout() {
    useTranslation('common');
    const { user } = useAuth();

    switch (user?.role) {
        case 'SUPERVISOR':
            return <SupervisorLayout />;
        case 'ADMIN':
            return <AdminLayout />;
        case 'AGENT':
            return <AgentLayout />;
        case 'COMMERCIAL':
        default:
            return <CommercialLayout />;
    }
}
