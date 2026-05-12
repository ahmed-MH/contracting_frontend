import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useTemplateSupplements,
    useArchivedTemplateSupplements,
    useCreateTemplateSupplement,
    useUpdateTemplateSupplement,
    useDeleteTemplateSupplement,
    useRestoreTemplateSupplement,
    type TemplateSupplement,
    type CreateTemplateSupplementPayload,
} from '../hooks/useTemplateSupplements';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Archive,
    ChevronDown,
    ChevronRight,
    Search,
    CalendarDays,
} from 'lucide-react';
import type { SupplementCalculationType, PricingModifierApplicationType } from '../../../../types';
import EditSupplementTemplateModal from '../components/EditSupplementTemplateModal';
import UpdatedByCell from '../../../../components/audit/UpdatedByCell';
import PaginationControls, { createClientPageMeta, getPageItems } from '../../../../components/ui/PaginationControls';

const TYPE_LABELS: Record<SupplementCalculationType, string> = {
    FIXED: 'Fixe',
    PERCENTAGE: 'Pourcentage',
    FORMULA: 'Formule',
    FREE: 'Gratuit',
};

const APPLICATION_LABELS: Record<PricingModifierApplicationType, string> = {
    PER_NIGHT_PER_PERSON: 'Par pers./nuit',
    PER_NIGHT_PER_ROOM: 'Par chambre',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

const TYPE_COLORS: Record<SupplementCalculationType, string> = {
    FIXED: 'bg-brand-mint/10 text-brand-mint',
    PERCENTAGE: 'bg-brand-slate/10 text-brand-slate',
    FORMULA: 'bg-brand-mint/10 text-brand-mint',
    FREE: 'bg-brand-mint/10 text-brand-mint',
};

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SupplementsCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateSupplement | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [archivedPage, setArchivedPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const canManageArchive = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';

    // Debounce search input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: paginatedResult, isLoading, isError } = useTemplateSupplements(page, limit, debouncedSearch);
    const supplements = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedSupplements } = useArchivedTemplateSupplements({ enabled: canManageArchive });
    const archivedSupplementsList = archivedSupplements ?? [];
    const archivedMeta = createClientPageMeta(archivedSupplementsList.length, archivedPage, limit);
    const paginatedArchivedSupplements = getPageItems(archivedSupplementsList, archivedMeta);
    const createMutation = useCreateTemplateSupplement();
    const updateMutation = useUpdateTemplateSupplement();
    const deleteMutation = useDeleteTemplateSupplement();
    const restoreMutation = useRestoreTemplateSupplement();

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (s: TemplateSupplement) => {
        setEditing(s);
        setIsModalOpen(true);
    };

    const handleDelete = async (s: TemplateSupplement) => {
        if (await confirm({
            title: `Archiver le supplément "${s.name}" ?`,
            description: "Le supplément sera archivé et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(s.id);
        }
    };

    const handleRestore = async (s: TemplateSupplement) => {
        if (await confirm({
            title: `Restaurer le supplément "${s.name}" ?`,
            description: "Le supplément sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(s.id);
        }
    };

    const onSubmit = (data: CreateTemplateSupplementPayload) => {
        const payload = { ...data };
        if (payload.type === 'FREE') {
            payload.value = undefined;
            payload.formula = undefined;
        } else if (payload.type !== 'FORMULA') {
            payload.formula = undefined;
        }

        if (!payload.specificDate) {
            payload.specificDate = null;
        }

        if (editing) {
            updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: closeModal });
        } else {
            createMutation.mutate(payload, { onSuccess: closeModal });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const formatValue = (s: TemplateSupplement): string => {
        switch (s.type) {
            case 'FIXED':
                return `${s.value ?? 0}`;
            case 'PERCENTAGE':
                return `${s.value ?? 0}%`;
            case 'FORMULA':
                return s.formula ?? '—';
            case 'FREE':
                return 'Gratuit';
        }
    };

    return (
        <div className="space-y-4 p-4 md:p-6 animate-in fade-in duration-500">
            <section className="premium-surface relative overflow-hidden p-5 md:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-brand-mint/10 dark:bg-brand-mint/8" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                        {t('pages.catalog.supplements.header.kicker', { defaultValue: 'Extras' })}
                    </p>
                    <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                            <Package size={24} />
                        </span>
                        Catalogue Suppléments
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.ce69312f', { defaultValue: "Définitions des suppléments réutilisables (templates)" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none lg:mt-9">
                    <Plus size={16} /> Nouveau Supplément
                </button>
                </div>

                <div className="relative mt-5 flex flex-col gap-3 border-t border-brand-slate/10 pt-5 dark:border-brand-light/10 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('auto.features.catalog.supplements.pages.supplementscatalogpage.placeholder.f8a6ec00', { defaultValue: "Rechercher un supplément..." })}
                        className="w-full rounded-2xl border border-brand-slate/20 bg-brand-light/70 py-3 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>
                {meta && (
                    <span className="premium-pill w-fit border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                        {meta.total} {t('pages.catalog.supplements.header.totalLabel', { defaultValue: 'templates' })}
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
                <div className="premium-surface border-brand-slate/20 p-6 text-sm text-brand-slate dark:text-brand-light/75">
                    Impossible de charger les suppléments.
                </div>
            )}

            {!isLoading && !isError && supplements.length === 0 && (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <Package size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {debouncedSearch ? 'Aucun supplément trouvé' : 'Aucun supplément défini'}
                    </p>
                    {!debouncedSearch && (
                        <p className="text-brand-slate text-xs mt-1">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.d8e159e3', { defaultValue: "Cliquez sur « Nouveau Supplément » pour commencer" })}</p>
                    )}
                </div>
            )}

            {supplements.length > 0 && (
                <div className="premium-surface overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-brand-slate/15 bg-brand-mint/6 dark:border-brand-light/10 dark:bg-brand-light/5">
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.51293b71', { defaultValue: "Nom" })}</th>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7663304e', { defaultValue: "Type" })}</th>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.6c0c1e73', { defaultValue: "Valeur" })}</th>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.048aa5d3', { defaultValue: "Application" })}</th>
                                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.e79fe39b', { defaultValue: "Obligatoire" })}</th>
                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.supplements.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                    {t('pages.catalog.supplements.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                            {supplements.map((s) => (
                                <tr key={s.id} className="group transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-brand-navy dark:text-brand-light">{s.name}</span>
                                            <span className="text-sm text-brand-slate font-mono dark:text-brand-light/55">{s.reference || 'SUP-PENDING'}</span>
                                            {s.specificDate && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CalendarDays size={11} className="text-brand-mint shrink-0" />
                                                    <span className="text-[10px] text-brand-mint font-bold italic uppercase">
                                                        Évènement · {formatShortDate(s.specificDate)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold tracking-wide ${TYPE_COLORS[s.type]}`}>
                                            {TYPE_LABELS[s.type]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-brand-navy font-mono text-xs dark:text-brand-light">{formatValue(s)}</td>
                                    <td className="px-5 py-3 text-brand-slate text-xs">{APPLICATION_LABELS[s.applicationType]}</td>
                                    <td className="px-5 py-3 text-center">
                                        {s.isMandatory ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-xl bg-brand-slate/10 text-brand-slate text-xs font-semibold">
                                                Oui
                                            </span>
                                        ) : (
                                            <span className="text-brand-slate text-xs">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.05fe84b1', { defaultValue: "Non" })}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <UpdatedByCell updatedByName={s.updatedByName} updatedAt={s.updatedAt} />
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => openEdit(s)}
                                                className="p-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none" title={t('auto.features.catalog.supplements.pages.supplementscatalogpage.title.5b7708a7', { defaultValue: "Modifier" })}>
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(s)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none" title={t('auto.features.catalog.supplements.pages.supplementscatalogpage.title.2dd01bc7', { defaultValue: "Archiver" })}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <PaginationControls meta={meta} onPageChange={setPage} />
                </div>
            )}

            {/* ─── Archived Section ───────────────────────── */}
            {canManageArchive && (
                <div className="mt-10 space-y-4">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Suppléments archivés {archivedSupplements ? `(${archivedSupplements.length})` : ''}
                    </button>

                    {showArchived && archivedSupplements && archivedSupplements.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                            <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-brand-slate/15 bg-brand-mint/6 dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.51293b71', { defaultValue: "Nom" })}</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7663304e', { defaultValue: "Type" })}</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.supplements.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.9cdaf222', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                                    {paginatedArchivedSupplements.map((s) => (
                                        <tr key={s.id} className="transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                            <td className="px-5 py-3 text-brand-slate font-semibold dark:text-brand-light/75">{s.name}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold tracking-wide ${TYPE_COLORS[s.type]}`}>
                                                    {TYPE_LABELS[s.type]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 align-top">
                                                <UpdatedByCell updatedByName={s.updatedByName} updatedAt={s.updatedAt} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(s)} disabled={restoreMutation.isPending}
                                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-60">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            <PaginationControls meta={archivedMeta} onPageChange={setArchivedPage} />
                        </div>
                    )}

                    {showArchived && archivedSupplements && archivedSupplements.length === 0 && (
                        <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7333e56a', { defaultValue: "Aucun supplément archivé" })}</div>
                    )}
                </div>
            )}

            <EditSupplementTemplateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}

