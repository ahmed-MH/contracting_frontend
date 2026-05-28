import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useArrangements, useArchivedArrangements, useCreateArrangement, useUpdateArrangement, useDeleteArrangement, useRestoreArrangement, type Arrangement, type CreateArrangementPayload } from '../hooks/useArrangements';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { UtensilsCrossed, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import EditArrangementModal from '../components/EditArrangementModal';
import { GuidedPageHeader } from '../../../components/layout/Workspace';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import PaginationControls, { DEFAULT_PAGE_SIZE, createClientPageMeta, getPageItems } from '../../../components/ui/PaginationControls';

export default function ArrangementsPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Arrangement | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [archivedPage, setArchivedPage] = useState(1);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const canManageArchive = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: arrangements, isLoading, isError } = useArrangements();
    const { data: archivedArrangements } = useArchivedArrangements(canManageArchive && showArchived);

    useEffect(() => {
        setPage(1);
        setArchivedPage(1);
    }, [search]);

    const displayedArrangements = arrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const displayedArchivedArrangements = archivedArrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    ) ?? [];
    const arrangementsMeta = createClientPageMeta(displayedArrangements.length, page, DEFAULT_PAGE_SIZE);
    const archivedArrangementsMeta = createClientPageMeta(displayedArchivedArrangements.length, archivedPage, DEFAULT_PAGE_SIZE);
    const paginatedArrangements = getPageItems(displayedArrangements, arrangementsMeta);
    const paginatedArchivedArrangements = getPageItems(displayedArchivedArrangements, archivedArrangementsMeta);
    const createMutation = useCreateArrangement(closeModal);
    const updateMutation = useUpdateArrangement(closeModal);
    const deleteMutation = useDeleteArrangement();
    const restoreMutation = useRestoreArrangement();

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (item: Arrangement) => { setEditing(item); setIsModalOpen(true); };
    
    const handleDelete = async (item: Arrangement) => {
        if (await confirm({
            title: t('pages.arrangements.confirmArchive.title', {
                defaultValue: 'Archive arrangement "{{code}} - {{name}}"?',
                code: item.code,
                name: item.name,
            }),
            description: t('pages.arrangements.confirmArchive.description', {
                defaultValue: 'This arrangement will be archived and can be restored later.',
            }),
            confirmLabel: t('pages.arrangements.confirmArchive.confirmLabel', { defaultValue: 'Archive' }),
            variant: "danger"
        })) {
            deleteMutation.mutate(item.id);
        }
    };

    const handleRestore = async (item: Arrangement) => {
        if (await confirm({
            title: t('pages.arrangements.confirmRestore.title', {
                defaultValue: 'Restore arrangement "{{code}} - {{name}}"?',
                code: item.code,
                name: item.name,
            }),
            description: t('pages.arrangements.confirmRestore.description', {
                defaultValue: 'This arrangement will become active again.',
            }),
            confirmLabel: t('pages.arrangements.confirmRestore.confirmLabel', { defaultValue: 'Restore' }),
            variant: "info"
        })) {
            restoreMutation.mutate(item.id);
        }
    };

    const onSubmit = (data: CreateArrangementPayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return (
            <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
                <div className="premium-surface border-brand-slate/20 p-6 text-sm text-brand-navy dark:text-brand-light">
                    {t('pages.arrangements.errorLoad', { defaultValue: 'Unable to load arrangements.' })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
            <GuidedPageHeader
                icon={UtensilsCrossed}
                kicker={t('pages.arrangements.header.kicker', { defaultValue: 'Hotel Setup' })}
                title={t('pages.arrangements.header.title', { defaultValue: 'Arrangements' })}
                description={t('pages.arrangements.header.subtitle', { defaultValue: 'Define the board bases offered by the hotel.' })}
                actions={(
                <>
                <div className="hidden">
                    <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        <UtensilsCrossed className="text-brand-mint" size={28} />
                        {t('pages.arrangements.header.title', { defaultValue: 'Arrangements' })}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{t('auto.features.arrangements.pages.arrangementspage.5abc4ade', { defaultValue: "Plans repas proposés par l'hôtel" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none">
                    <Plus size={16} />
                    {t('pages.arrangements.modal.createTitle', { defaultValue: 'Add arrangement' })}
                </button>
                </>
                )}
            />

            {/* ─── Search Bar ──────────────────────────────────────────── */}
            <section className="premium-surface p-4">
                <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/70" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('auto.features.arrangements.pages.arrangementspage.placeholder.995686e5', { defaultValue: "Search arrangements..." })}
                        className="w-full rounded-xl border border-brand-slate/20 bg-brand-light/70 py-2.5 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>
            </section>

            {(!isLoading && !isError && arrangements?.length === 0) ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.arrangements.pages.arrangementspage.c87031c2', { defaultValue: "No arrangements defined yet" })}</p>
                    <p className="text-brand-slate/70 text-xs mt-1">{t('auto.features.arrangements.pages.arrangementspage.5dcf7e80', { defaultValue: "Click “Add arrangement” to get started" })}</p>
                </div>
            ) : arrangements && arrangements.length > 0 && displayedArrangements.length === 0 ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.arrangements.emptySearch', { defaultValue: 'No arrangement found for "{{search}}"', search })}
                    </p>
                </div>
            ) : displayedArrangements.length > 0 && (
                <div className="premium-surface overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light/80 border-b border-brand-slate/15">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b33b394f', { defaultValue: "Code" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.96ce3732', { defaultValue: "Label" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.arrangements.pages.arrangementspage.60d9e35d', { defaultValue: "Level" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b6c233f6', { defaultValue: "Description" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('pages.arrangements.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.arrangements.pages.arrangementspage.3463121d', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {paginatedArrangements.map((arr) => (
                                <tr key={arr.id} className="hover:bg-brand-light/80 transition-colors group">
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-mint/10 text-brand-mint text-xs font-bold font-mono tracking-wider border border-brand-mint/20 uppercase">
                                            {arr.code}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-brand-navy group-hover:text-brand-mint transition-colors leading-tight">{arr.name}</span>
                                            <span className="text-xs text-brand-slate/70 mt-0.5 font-mono uppercase">{arr.reference || 'REF-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${arr.level === 0 ? 'bg-brand-light/80 text-brand-slate/70 border-brand-slate/10' : 'bg-brand-mint/10 text-brand-mint border-brand-mint/20'}`}>
                                            Niveau {arr.level}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs text-brand-slate italic max-w-[280px] truncate block" title={arr.description || ''}>
                                            {arr.description || <span className="text-brand-slate/45">{t('auto.features.arrangements.pages.arrangementspage.b64ea579', { defaultValue: "No description" })}</span>}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <UpdatedByCell updatedByName={arr.updatedByName} updatedAt={arr.updatedAt} />
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => openEdit(arr)}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none bg-transparent" title={t('auto.features.arrangements.pages.arrangementspage.title.a2e2e4e7', { defaultValue: "Edit" })}>
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(arr)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent" title={t('auto.features.arrangements.pages.arrangementspage.title.ede43660', { defaultValue: "Archive" })}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    <PaginationControls meta={arrangementsMeta} onPageChange={setPage} />
                </div>
            )}

            {/* ─── Archived Section ───────────────────────── */}
            {canManageArchive && (
                <div className="mt-10 space-y-4">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        {t('pages.arrangements.archived.toggle', {
                            defaultValue: 'Archived arrangements {{count}}',
                            count: archivedArrangements ? `(${archivedArrangements.length})` : '',
                        })}
                    </button>

                    {showArchived && displayedArchivedArrangements.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-slate/10 border-b border-brand-slate/15">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b33b394f', { defaultValue: "Code" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.cbf4e9cf', { defaultValue: "Nom" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('pages.arrangements.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.arrangements.pages.arrangementspage.7d74144c', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {paginatedArchivedArrangements.map((arr) => (
                                        <tr key={arr.id} className="hover:bg-brand-slate/10 transition-colors">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-slate/15 text-brand-slate text-xs font-bold font-mono tracking-wider">
                                                    {arr.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-brand-slate italic">{arr.name}</td>
                                            <td className="px-5 py-3 align-top">
                                                <UpdatedByCell updatedByName={arr.updatedByName} updatedAt={arr.updatedAt} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(arr)} disabled={restoreMutation.isPending}
                                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-60">
                                                    <RotateCcw size={14} />
                                                    {t('pages.arrangements.archived.restore', { defaultValue: 'Restore' })}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            <PaginationControls meta={archivedArrangementsMeta} onPageChange={setArchivedPage} />
                        </div>
                    )}

                    {showArchived && archivedArrangements && archivedArrangements.length === 0 && (
                        <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">{t('auto.features.arrangements.pages.arrangementspage.34b0529a', { defaultValue: "No archived arrangements" })}</div>
                    )}
                </div>
            )}

            <EditArrangementModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                editing={editing} 
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}
