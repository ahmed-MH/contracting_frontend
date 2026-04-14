import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useTemplateReductions,
    useArchivedTemplateReductions,
    useCreateTemplateReduction,
    useUpdateTemplateReduction,
    useDeleteTemplateReduction,
    useRestoreTemplateReduction,
    type TemplateReduction,
    type CreateTemplateReductionPayload,
} from '../hooks/useTemplateReductions';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    Percent,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Archive,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Search,
    Users,
} from 'lucide-react';
import EditReductionTemplateModal from '../components/EditReductionTemplateModal';

const PAX_TYPE_LABELS: Record<string, string> = {
    FIRST_CHILD: '1er Enfant',
    SECOND_CHILD: '2ème Enfant',
    THIRD_CHILD: '3ème Enfant',
    THIRD_ADULT: '3ème Adulte',
};

const CALC_TYPE_COLORS: Record<string, string> = {
    PERCENTAGE: 'bg-brand-slate/10 text-brand-slate border-brand-slate/30',
    FIXED: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
    FREE: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
};

export default function ReductionsCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateReduction | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: paginatedResult, isLoading, isError } = useTemplateReductions(page, limit, debouncedSearch);
    const reductions = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedReductions } = useArchivedTemplateReductions({ enabled: isAdmin });
    
    const createMutation = useCreateTemplateReduction();
    const updateMutation = useUpdateTemplateReduction();
    const deleteMutation = useDeleteTemplateReduction();
    const restoreMutation = useRestoreTemplateReduction();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (r: TemplateReduction) => { setEditing(r); setIsModalOpen(true); };

    const handleDelete = async (r: TemplateReduction) => {
        if (await confirm({
            title: `Archiver la réduction "${r.name}" ?`,
            description: "La réduction sera archivée et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(r.id);
        }
    };

    const handleRestore = async (r: TemplateReduction) => {
        if (await confirm({
            title: `Restaurer la réduction "${r.name}" ?`,
            description: "La réduction sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(r.id);
        }
    };

    const onSubmit = (data: CreateTemplateReductionPayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data }, { onSuccess: closeModal });
        } else {
            createMutation.mutate(data, { onSuccess: closeModal });
        }
    };

    return (
        <div className="space-y-4 p-4 md:p-6 animate-in fade-in duration-500">
            <section className="premium-surface relative overflow-hidden p-5 md:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-brand-mint/10 dark:bg-brand-mint/8" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.catalog.reductions.header.kicker', { defaultValue: 'Pricing rules' })}
                        </p>
                        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                                <Percent size={24} />
                            </span>
                            Catalogue Réductions
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.b89de9fd', { defaultValue: "Définitions des réductions réutilisables (templates)" })}</p>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none lg:mt-9">
                        <Plus size={16} /> Nouvelle Réduction
                    </button>
                </div>
                <div className="relative mt-5 flex flex-col gap-3 border-t border-brand-slate/10 pt-5 dark:border-brand-light/10 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('auto.features.catalog.reductions.pages.reductionscatalogpage.placeholder.927e81bd', { defaultValue: "Rechercher une réduction..." })}
                            className="w-full rounded-2xl border border-brand-slate/20 bg-brand-light/70 py-3 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        />
                    </div>
                    {meta && (
                        <span className="premium-pill w-fit border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {meta.total} {t('pages.catalog.reductions.header.totalLabel', { defaultValue: 'templates' })}
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
                    Impossible de charger les réductions.
                </div>
            )}

            {!isLoading && !isError && reductions.length === 0 && (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <Percent size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.16a64df5', { defaultValue: "Aucune réduction trouvée" })}</p>
                </div>
            )}

            {reductions.length > 0 && (
                <div className="premium-surface overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-brand-slate/15 bg-brand-mint/6 dark:border-brand-light/10 dark:bg-brand-light/5">
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.5a5ca319', { defaultValue: "Nom" })}</th>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.cdd158c5', { defaultValue: "Cible" })}</th>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.fca2f684', { defaultValue: "Ages" })}</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.11ea1d0e', { defaultValue: "Valeur" })}</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                    {t('pages.catalog.reductions.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                            {reductions.map((r) => (
                                <tr key={r.id} className="group transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-brand-navy leading-tight dark:text-brand-light">{r.name}</span>
                                            <span className="text-sm text-brand-slate font-mono dark:text-brand-light/55">{r.reference || 'RED-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 shrink-0">
                                        <div className="flex items-center gap-1.5 text-xs text-brand-mint font-bold bg-brand-mint/10 px-2 py-0.5 rounded-xl border border-brand-mint/30 w-fit">
                                            <Users size={12} />
                                            {PAX_TYPE_LABELS[r.paxType]}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-brand-slate text-xs font-bold font-mono">
                                        {r.minAge} — {r.maxAge} ans
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-bold border ${CALC_TYPE_COLORS[r.calculationType]}`}>
                                            {r.calculationType === 'FREE' ? 'Gratuit' : r.calculationType === 'PERCENTAGE' ? `-${r.value}%` : `-${r.value} €`}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(r)}
                                                className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all border-none outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(r)}
                                                className="p-1.5 text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 rounded-xl transition-all border-none outline-none cursor-pointer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ─── Pagination Standard ────────────────────────────────── */}
                    {meta && meta.lastPage > 0 && (
                        <div className="flex items-center justify-between border-t border-brand-slate/15 bg-brand-mint/5 px-5 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <p className="text-xs text-brand-slate font-medium tracking-tight">
                                {t('auto.pagination.summary', { defaultValue: 'Affichage de {{from}} ? {{to}} sur {{total}}', from: (page - 1) * limit + 1, to: Math.min(page * limit, meta.total), total: meta.total })}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-brand-mint/30"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex h-9 min-w-[52px] items-center justify-center rounded-xl border border-brand-slate/20 bg-brand-light/70 px-2.5 text-xs font-bold text-brand-slate shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                                    {page} / {meta.lastPage}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                                    disabled={page >= meta.lastPage}
                                    className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-brand-mint/30"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none dark:hover:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Réductions archivées {archivedReductions ? `(${archivedReductions.length})` : ''}
                    </button>

                    {showArchived && archivedReductions && archivedReductions.length > 0 && (
                        <div className="premium-surface mt-4 overflow-x-auto opacity-80">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                                    {archivedReductions.map((r: any) => (
                                        <tr key={r.id} className="transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                            <td className="px-5 py-3 text-brand-slate font-bold dark:text-brand-light/75">{r.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(r)}
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
                    {showArchived && archivedReductions && archivedReductions.length === 0 && (
                        <p className="mt-3 text-sm text-brand-slate italic font-medium ml-6">{t('auto.features.catalog.reductions.pages.reductionscatalogpage.08602ad6', { defaultValue: "Aucune réduction archivée" })}</p>
                    )}
                </div>
            )}

            <EditReductionTemplateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
