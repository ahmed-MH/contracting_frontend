import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useContract } from '../../hooks/useContracts';
import { useHotel } from '../../../hotel/context/HotelContext';
import type { Contract } from '../../types/contract.types';
import ContractHeader from './ContractHeader';
import ContractTabs from './ContractTabs';

// Shared context type for all child tabs
export interface ContractOutletContext {
    contract: Contract;
}

export default function ContractDetailsLayout() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentHotel, isLoading: hotelLoading } = useHotel();
    const contractId = id ? Number(id) : undefined;

    // Gate on hotel being ready so x-hotel-id header is present on refresh
    const { data: contract, isLoading, isError } = useContract(
        currentHotel ? contractId : undefined,
    );

    // ─── Loading ──────────────────────────────────────────────────────
    if (isLoading || hotelLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    // ─── Error ────────────────────────────────────────────────────────
    if (isError || !contract) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger le contrat.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <ContractHeader contract={contract} onBack={() => navigate('/contracts')} />

            {/* ─── Tabs Navigation ────────────────────────────────────── */}
            <ContractTabs />

            {/* ─── Active Tab Content ─────────────────────────────────── */}
            <div className="flex-1 p-8">
                <Outlet context={{ contract } satisfies ContractOutletContext} />
            </div>
        </div>
    );
}
