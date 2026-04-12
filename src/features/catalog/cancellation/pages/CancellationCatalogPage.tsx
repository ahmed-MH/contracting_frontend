import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useTemplateCancellations,
    useArchivedTemplateCancellations,
    useCreateTemplateCancellation,
    useUpdateTemplateCancellation,
    useDeleteTemplateCancellation,
    useRestoreTemplateCancellation,
    type TemplateCancellationRule,
    type CreateTemplateCancellationRulePayload,
} from '../hooks/useTemplateCancellations';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    ShieldAlert,
    Plus,
    Pencil,
    Trash2,
    Search,
    Hash,
    Percent,
    Banknote,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Archive,
    ChevronDown
} from 'lucide-react';
import { CancellationPenaltyType } from '../types/cancellation.types';
import EditCancellationTemplateModal from '../components/EditCancellationTemplateModal';

const PENALTY_LABELS: Record<CancellationPenaltyType, string> = {
    [CancellationPenaltyType.NIGHTS]: 'Nuits',
    [CancellationPenaltyType.PERCENTAGE]: 'Pourcentage',
    [CancellationPenaltyType.FIXED_AMOUNT]: 'Montant fixe',
};

const PENALTY_COLORS: Record<CancellationPenaltyType, string> = {
    [CancellationPenaltyType.NIGHTS]: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
    [CancellationPenaltyType.PERCENTAGE]: 'bg-brand-slate/10 text-brand-slate border-brand-slate/30',
    [CancellationPenaltyType.FIXED_AMOUNT]: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
};

const getIcon = (type: CancellationPenaltyType) => {
    switch (type) {
        case CancellationPenaltyType.NIGHTS: return <Hash size={12} />;
        case CancellationPenaltyType.PERCENTAGE: return <Percent size={12} />;
        case CancellationPenaltyType.FIXED_AMOUNT: return <Banknote size={12} />;
    }
};

export default function CancellationCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateCancellationRule | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;

    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: paginatedResult, isLoading, isError } = useTemplateCancellations(page, limit, debouncedSearch);
    const rules = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedRules } = useArchivedTemplateCancellations({ enabled: isAdmin });

    const createMutation = useCreateTemplateCancellation();
    const updateMutation = useUpdateTemplateCancellation();
    const deleteMutation = useDeleteTemplateCancellation();
    const restoreMutation = useRestoreTemplateCancellation();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (r: TemplateCancellationRule) => { setEditing(r); setIsModalOpen(true); };

    const handleDelete = async (r: TemplateCancellationRule) => {
        if (await confirm({
            title: `Archiver la règle "${r.name}" ?`,
            description: "La règle sera archivée et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(r.id);
        }
    };

    const handleRestore = async (r: TemplateCancellationRule) => {
        if (await confirm({
            title: `Restaurer la règle "${r.name}" ?`,
            description: "La règle sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(r.id);
        }
    };

    const onSubmit = (data: CreateTemplateCancellationRulePayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data }, { onSuccess: closeModal });
        } else {
            createMutation.mutate(data, { onSuccess: closeModal });
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
                        <ShieldAlert className="text-brand-mint" size={28} />
                        {t('pages.catalog.cancellation.header.title', { defaultValue: 'Catalogue Annulations' })}
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.8a1e12fb', { defaultValue: "Gérez les politiques d'annulation (templates)" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-mint text-white text-sm font-medium rounded-xl hover:bg-brand-mint transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvelle Règle
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('pages.catalog.cancellation.header.searchPlaceholder', { defaultValue: 'Rechercher une politique...' })}
                        className="w-full pl-9 pr-4 py-2 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-brand-slate/10 border border-brand-slate/30 p-6 text-brand-slate text-sm font-bold">
                    {t('pages.catalog.cancellation.states.loadError', { defaultValue: "Impossible de charger le catalogue d'annulations." })}
                </div>
            )}

            {!isLoading && !isError && rules.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <ShieldAlert size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.eb83598e', { defaultValue: "Aucune règle d'annulation trouvée" })}</p>
                </div>
            )}

            {rules.length > 0 && (
                <div className="bg-white rounded-xl border border-brand-slate/20 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20 text-brand-slate font-bold">
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.d61ff2cd', { defaultValue: "Nom de la politique" })}</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.96ca3444', { defaultValue: "Fenêtre" })}</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.90bdcac8', { defaultValue: "Min Stay" })}</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.01a8f56e', { defaultValue: "Pénalité" })}</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.8eec3a11', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {rules.map((r: TemplateCancellationRule) => (
                                <tr key={r.id} className="hover:bg-brand-light transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-brand-navy leading-tight inline-flex items-center gap-2">
                                                {r.name}
                                                {r.appliesToNoShow && (
                                                    <span className="text-[9px] bg-brand-slate/10 text-brand-slate border border-brand-slate/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.a9f39803', { defaultValue: "No-Show" })}</span>
                                                )}
                                            </span>
                                            <span className="text-sm text-brand-slate font-mono">{r.reference || 'CAN-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-slate/10 text-brand-slate border border-brand-slate/30 rounded-xl text-xs font-black">
                                            ≤ {r.daysBeforeArrival} jours
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-brand-slate font-bold">
                                        {r.minStayCondition ? `${r.minStayCondition} nuits` : <span className="text-brand-slate text-xs font-normal italic">{t('auto.features.catalog.cancellation.pages.cancellationcatalogpage.443b4f96', { defaultValue: "Sans condition" })}</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight border ${PENALTY_COLORS[r.penaltyType]}`}>
                                                {getIcon(r.penaltyType)}
                                                {PENALTY_LABELS[r.penaltyType]}
                                            </span>
                                            <span className="text-sm font-black text-brand-navy font-mono">
                                                {r.baseValue}{r.penaltyType === CancellationPenaltyType.NIGHTS ? 'n' : r.penaltyType === CancellationPenaltyType.PERCENTAGE ? '%' : '€'}
                                            </span>
                                        </div>
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

            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Règles archivées {archivedRules ? `(${archivedRules.length})` : ''}
                    </button>

                    {showArchived && archivedRules && archivedRules.length > 0 && (
                        <div className="mt-4 bg-brand-light rounded-xl border border-brand-slate/20 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedRules.map((r: TemplateCancellationRule) => (
                                        <tr key={r.id} className="hover:bg-brand-light transition-colors">
                                            <td className="px-5 py-3 text-brand-slate font-bold">{r.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(r)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-bold rounded-xl hover:bg-brand-mint/10 transition-colors cursor-pointer border-none shadow-xs">
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

            <EditCancellationTemplateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
