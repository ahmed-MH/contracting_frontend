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
    ChevronLeft,
    Search,
    CalendarDays,
} from 'lucide-react';
import type { SupplementCalculationType, PricingModifierApplicationType } from '../../../../types';
import EditSupplementTemplateModal from '../components/EditSupplementTemplateModal';

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

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: paginatedResult, isLoading, isError } = useTemplateSupplements(page, limit, debouncedSearch);
    const supplements = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedSupplements } = useArchivedTemplateSupplements({ enabled: isAdmin });
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
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
                        <Package className="text-brand-mint" size={28} />
                        Catalogue Suppléments
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.ce69312f', { defaultValue: "Définitions des suppléments réutilisables (templates)" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-mint text-white text-sm font-medium rounded-xl hover:bg-brand-mint transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouveau Supplément
                </button>
            </div>

            {/* ─── Search Bar ──────────────────────────────────────────── */}
            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('auto.features.catalog.supplements.pages.supplementscatalogpage.placeholder.f8a6ec00', { defaultValue: "Rechercher un supplément..." })}
                        className="w-full pl-9 pr-4 py-2 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-brand-slate/10 border border-brand-slate/30 p-6 text-brand-slate text-sm">
                    Impossible de charger les suppléments.
                </div>
            )}

            {!isLoading && !isError && supplements.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
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
                <div className="bg-white rounded-xl border border-brand-slate/20 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.51293b71', { defaultValue: "Nom" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7663304e', { defaultValue: "Type" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.6c0c1e73', { defaultValue: "Valeur" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.048aa5d3', { defaultValue: "Application" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.e79fe39b', { defaultValue: "Obligatoire" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">
                                    {t('pages.catalog.supplements.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {supplements.map((s) => (
                                <tr key={s.id} className="hover:bg-brand-light transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-brand-navy">{s.name}</span>
                                            <span className="text-sm text-brand-slate font-mono">{s.reference || 'SUP-PENDING'}</span>
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
                                    <td className="px-5 py-3 text-brand-navy font-mono text-xs">{formatValue(s)}</td>
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

                    {/* ─── Pagination Standard ────────────────────────────────── */}
                    {meta && meta.lastPage > 0 && (
                        <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 flex items-center justify-between">
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
                                <div className="flex items-center px-2.5 text-xs font-bold text-brand-slate bg-white border border-brand-slate/20 rounded-xl h-9 min-w-[36px] justify-center shadow-xs">
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

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Suppléments archivés {archivedSupplements ? `(${archivedSupplements.length})` : ''}
                    </button>

                    {showArchived && archivedSupplements && archivedSupplements.length > 0 && (
                        <div className="mt-4 bg-brand-light rounded-xl border border-brand-slate/20 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-light border-b border-brand-slate/20">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.51293b71', { defaultValue: "Nom" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7663304e', { defaultValue: "Type" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.9cdaf222', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedSupplements.map((s) => (
                                        <tr key={s.id} className="hover:bg-brand-light transition-colors">
                                            <td className="px-5 py-3 text-brand-slate font-medium">{s.name}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold tracking-wide ${TYPE_COLORS[s.type]}`}>
                                                    {TYPE_LABELS[s.type]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(s)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-bold rounded-xl hover:bg-brand-mint/10 transition-colors cursor-pointer disabled:opacity-50 border-none">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedSupplements && archivedSupplements.length === 0 && (
                        <p className="mt-3 text-sm text-brand-slate italic font-medium ml-6">{t('auto.features.catalog.supplements.pages.supplementscatalogpage.7333e56a', { defaultValue: "Aucun supplément archivé" })}</p>
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

