import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContract } from '../../hooks/useContracts';
import { useHotel } from '../../../hotel/context/HotelContext';
import type { Contract } from '../../types/contract.types';
import ContractHeader from './ContractHeader';
import ContractTabs from './ContractTabs';
import { SectionCard, WorkspaceContainer } from '../../../../components/layout/Workspace';

export interface ContractOutletContext {
    contract: Contract;
}

export default function ContractDetailsLayout() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { currentHotel, isLoading: hotelLoading } = useHotel();
    const contractId = id ? Number(id) : undefined;

    const { data: contract, isLoading, isError } = useContract(
        currentHotel ? contractId : undefined,
    );

    if (isLoading || hotelLoading) {
        return (
            <WorkspaceContainer>
                <SectionCard bodyClassName="flex h-64 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </SectionCard>
            </WorkspaceContainer>
        );
    }

    if (isError || !contract) {
        return (
            <WorkspaceContainer>
                <SectionCard className="border-brand-slate/30 bg-brand-slate/10 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.contractDetails.loadError', { defaultValue: 'Unable to load contract.' })}
                </SectionCard>
            </WorkspaceContainer>
        );
    }

    return (
        <WorkspaceContainer className="flex min-h-full flex-col space-y-5">
            <ContractHeader contract={contract} onBack={() => navigate('/contracts')} />
            <ContractTabs />
            <div className="flex-1">
                <Outlet context={{ contract } satisfies ContractOutletContext} />
            </div>
        </WorkspaceContainer>
    );
}
