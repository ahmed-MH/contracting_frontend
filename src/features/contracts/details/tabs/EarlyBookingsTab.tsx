import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('common');

    const handleDelete = async (eb: ContractEarlyBooking) => {
        if (await confirm({
            title: t('pages.contractDetails.earlyBookings.deleteTitle', {
                defaultValue: 'Delete Early Booking \"{{name}}\"?',
                name: eb.name,
            }),
            description: t('pages.contractDetails.earlyBookings.deleteDescription', {
                defaultValue: 'This Early Booking will be permanently removed from this contract.',
            }),
            confirmLabel: t('pages.contractDetails.earlyBookings.deleteConfirm', { defaultValue: 'Delete' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(eb.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    const items = earlyBookings ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <CalendarCheck size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.earlyBookings.title', { defaultValue: 'Early Bookings' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint cursor-pointer shadow-md shadow-brand-mint/20 transition-all hover:scale-[1.02]"
                >
                    <Plus size={16} />
                    {t('pages.contractDetails.earlyBookings.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                </button>
            </div>

            {items.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <CalendarCheck size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm font-semibold tracking-tight">
                        {t('pages.contractDetails.earlyBookings.emptyTitle', { defaultValue: 'No Early Booking configured' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.earlyBookings.emptySubtitle', {
                            defaultValue: 'Import offers from the hotel catalog to apply them to this contract.',
                        })}
                    </p>
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
