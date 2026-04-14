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
import { ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

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

    const importAction = (
        <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.earlyBookings.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={CalendarCheck}
                title={t('pages.contractDetails.earlyBookings.title', { defaultValue: 'Early Bookings' })}
                description={t('pages.contractDetails.earlyBookings.description', {
                    defaultValue: 'Attach booking-window incentives and configure their contract applicability.',
                })}
                action={importAction}
            >
                <ContractSectionLoading label={t('states.loading', { defaultValue: 'Loading...' })} />
            </ContractSectionShell>
        );
    }

    const items = earlyBookings ?? [];

    return (
        <>
            <ContractSectionShell
                icon={CalendarCheck}
                title={t('pages.contractDetails.earlyBookings.title', { defaultValue: 'Early Bookings' })}
                description={t('pages.contractDetails.earlyBookings.description', {
                    defaultValue: 'Attach booking-window incentives and configure their contract applicability.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={CalendarCheck}
                        title={t('pages.contractDetails.earlyBookings.emptyTitle', { defaultValue: 'No Early Booking configured' })}
                        description={t('pages.contractDetails.earlyBookings.emptySubtitle', {
                            defaultValue: 'Import offers from the hotel catalog to apply them to this contract.',
                        })}
                    />
                ) : (
                    <EarlyBookingGrid
                        earlyBookings={items}
                        periods={contract.periods ?? []}
                        onSaved={() => refetch()}
                        onEdit={(eb) => setEditingEB(eb)}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                    />
                )}
            </ContractSectionShell>

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
