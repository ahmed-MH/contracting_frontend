import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useContractEarlyBookings, useDeleteContractEarlyBooking } from '../../hooks/useContractEarlyBookings';
import { useConfirm } from '../../../../context/ConfirmContext';
import { CalendarCheck, Plus } from 'lucide-react';
import type { ContractEarlyBooking } from '../../../catalog/early-bookings/types/early-bookings.types';
import ImportEarlyBookingModal from '../../../catalog/early-bookings/components/ImportEarlyBookingModal';
import EditContractEarlyBookingModal from '../modals/EditContractEarlyBookingModal';
import EarlyBookingGrid from '../components/EarlyBookingGrid';

export default function EarlyBookingsTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const [showImport, setShowImport] = useState(false);
    const [editingEB, setEditingEB] = useState<ContractEarlyBooking | null>(null);
    const { data: earlyBookings, isLoading, refetch } = useContractEarlyBookings(contract.id);
    const deleteMutation = useDeleteContractEarlyBooking(contract.id);
    const { confirm } = useConfirm();

    const handleDelete = async (eb: ContractEarlyBooking) => {
        if (await confirm({
            title: `Supprimer l'Early Booking "${eb.name}" ?`,
            description: 'Cet Early Booking sera définitivement supprimé de ce contrat.',
            confirmLabel: 'Supprimer',
            variant: 'danger',
        })) { deleteMutation.mutate(eb.id); }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
    );

    const items = earlyBookings ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <CalendarCheck size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Early Bookings</h2>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <button onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-100 transition-all hover:scale-[1.02]">
                    <Plus size={16} /> Importer depuis le Catalogue
                </button>
            </div>

            {items.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <CalendarCheck size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm font-semibold tracking-tight">Aucun Early Booking paramétré</p>
                    <p className="text-gray-400 text-xs mt-1">Importez des offres depuis le catalogue hôtelier pour les appliquer sur ce contrat.</p>
                </div>
            )}

            {items.length > 0 && (
                <EarlyBookingGrid
                    earlyBookings={items}
                    periods={contract.periods ?? []}
                    onSaved={() => refetch()}
                    onEdit={(eb) => setEditingEB(eb)}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                />
            )}

            <ImportEarlyBookingModal contractId={contract.id} isOpen={showImport} onClose={() => setShowImport(false)} />

            {editingEB && (
                <EditContractEarlyBookingModal
                    contractId={contract.id}
                    isOpen={!!editingEB}
                    onClose={() => setEditingEB(null)}
                    eb={editingEB}
                    contractRooms={contract.contractRooms ?? []}
                    periods={contract.periods ?? []}
                />
            )}
        </>
    );
}
