import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContract } from '../../hooks/useContracts';
import { useHotel } from '../../../hotel/context/HotelContext';
import type { Contract } from '../../types/contract.types';
import ContractHeader from './ContractHeader';
import ContractTabs from './ContractTabs';

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
            <div className="p-4 md:p-6">
                <div className="premium-surface flex h-64 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            </div>
        );
    }

    if (isError || !contract) {
        return (
            <div className="p-4 md:p-6">
                <div className="premium-surface border-brand-slate/30 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.contractDetails.loadError', { defaultValue: 'Unable to load contract.' })}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-col p-4 md:p-6">
            <ContractHeader contract={contract} onBack={() => navigate('/contracts')} />
            <ContractTabs />
            <div className="mt-6 flex-1">
                <Outlet context={{ contract } satisfies ContractOutletContext} />
            </div>
        </div>
    );
}
