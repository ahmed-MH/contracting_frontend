import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Archive, Search, Calendar, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';
import {
    useTemplateEarlyBookings,
    useArchivedTemplateEarlyBookings,
    useCreateTemplateEarlyBooking,
    useUpdateTemplateEarlyBooking,
    useDeleteTemplateEarlyBooking,
    useRestoreTemplateEarlyBooking,
} from '../hooks/useTemplateEarlyBookings';
import EarlyBookingsTable from '../components/EarlyBookingsTable';
import EditEarlyBookingTemplateModal from '../components/EditEarlyBookingTemplateModal';

export default function EarlyBookingsCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateEarlyBooking | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;

    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    // Debounce search input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: paginatedResult, isLoading, isError } = useTemplateEarlyBookings(page, limit, debouncedSearch);
    const earlyBookings = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedEarlyBookings } = useArchivedTemplateEarlyBookings({ enabled: isAdmin });

    const createMutation = useCreateTemplateEarlyBooking();
    const updateMutation = useUpdateTemplateEarlyBooking();
    const deleteMutation = useDeleteTemplateEarlyBooking();
    const restoreMutation = useRestoreTemplateEarlyBooking();

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (eb: TemplateEarlyBooking) => {
        setEditing(eb);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const handleDelete = async (eb: TemplateEarlyBooking) => {
        if (await confirm({
            title: `Archiver l'Early Booking "${eb.name}" ?`,
            description: "L'Early Booking sera archivé et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(eb.id);
        }
    };

    const handleRestore = async (eb: TemplateEarlyBooking) => {
        if (await confirm({
            title: `Restaurer l'Early Booking "${eb.name}" ?`,
            description: "L'Early Booking sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(eb.id);
        }
    };

    const handleSubmit = (payload: CreateTemplateEarlyBookingPayload) => {
        if (editing) {
            updateMutation.mutate(
                { id: editing.id, data: payload },
                { onSuccess: closeModal }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: closeModal });
        }
    };

    return (
        <div className="space-y-4 p-4 md:p-6 animate-in fade-in duration-500">
            <section className="premium-surface relative overflow-hidden p-5 md:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-brand-mint/10 dark:bg-brand-mint/8" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.catalog.earlyBookings.header.kicker', { defaultValue: 'Advance offers' })}
                        </p>
                        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                                <Calendar size={24} />
                            </span>
                            {t('pages.catalog.earlyBookings.header.title', { defaultValue: 'Catalogue Early Booking' })}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{t('auto.features.catalog.early.bookings.pages.earlybookingscatalogpage.6c3403db', { defaultValue: "Définitions des offres de réservations anticipées (templates)" })}</p>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none lg:mt-9">
                        <Plus size={16} /> Nouvel Early Booking
                    </button>
                </div>
                <div className="relative mt-5 flex flex-col gap-3 border-t border-brand-slate/10 pt-5 dark:border-brand-light/10 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('pages.catalog.earlyBookings.header.searchPlaceholder', { defaultValue: 'Rechercher un template...' })}
                            className="w-full rounded-2xl border border-brand-slate/20 bg-brand-light/70 py-3 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        />
                    </div>
                    {meta && (
                        <span className="premium-pill w-fit border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {meta.total} {t('pages.catalog.earlyBookings.header.totalLabel', { defaultValue: 'templates' })}
                        </span>
                    )}
                </div>
            </section>

            {isLoading && (
                <div className="premium-surface flex h-48 items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="premium-surface border-brand-slate/20 p-6 text-sm font-semibold text-brand-slate dark:text-brand-light/75">
                    {t('pages.catalog.earlyBookings.states.loadError', { defaultValue: 'Impossible de charger le catalogue Early Booking.' })}
                </div>
            )}

            {!isLoading && !isError && earlyBookings.length === 0 && (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <Calendar size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.early.bookings.pages.earlybookingscatalogpage.d0a626c9', { defaultValue: "Aucun template trouvé" })}</p>
                </div>
            )}

            {earlyBookings.length > 0 && (
                <EarlyBookingsTable
                    data={earlyBookings}
                    meta={meta}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onPageChange={setPage}
                />
            )}

            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none dark:hover:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Templates archivés {archivedEarlyBookings ? `(${archivedEarlyBookings.length})` : ''}
                    </button>

                    {showArchived && archivedEarlyBookings && archivedEarlyBookings.length > 0 && (
                        <div className="premium-surface mt-4 overflow-x-auto opacity-80">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                                    {archivedEarlyBookings.map((eb: any) => (
                                        <tr key={eb.id} className="transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                            <td className="px-5 py-3 text-brand-slate font-bold dark:text-brand-light/75">{eb.name}</td>
                                            <td className="px-5 py-3 text-center text-[10px] text-brand-slate font-mono italic">
                                                {eb.bookingWindowStart ? `${eb.bookingWindowStart} -> ${eb.bookingWindowEnd}` : 'Fenêtre libre'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(eb)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-bold rounded-xl hover:bg-brand-mint/10 transition-colors cursor-pointer border-none shadow-sm">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <EditEarlyBookingTemplateModal
                isOpen={isModalOpen}
                editItem={editing}
                onClose={closeModal}
                onSubmit={handleSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
