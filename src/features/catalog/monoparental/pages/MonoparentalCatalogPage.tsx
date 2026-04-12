import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useTemplateMonoparentalRules,
    useArchivedTemplateMonoparentalRules,
    useCreateTemplateMonoparentalRule,
    useUpdateTemplateMonoparentalRule,
    useDeleteTemplateMonoparentalRule,
    useRestoreTemplateMonoparentalRule,
} from '../hooks/useTemplateMonoparentalRules';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
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
    Baby,
    User,
} from 'lucide-react';
import type { 
    TemplateMonoparentalRule, 
    CreateTemplateMonoparentalRulePayload,
    BaseRateType,
    ChildSurchargeBase
} from '../../../../types';
import EditMonoparentalTemplateModal from '../components/EditMonoparentalTemplateModal';

const BASE_RATE_LABELS: Record<BaseRateType, string> = {
    SINGLE: 'Single',
    DOUBLE: 'Double',
};

const CHILD_SURCHARGE_BASE_LABELS: Record<ChildSurchargeBase, string> = {
    SINGLE: 'Chambre Single',
    DOUBLE: 'Chambre Double',
    HALF_SINGLE: 'Demi-Single',
    HALF_DOUBLE: 'Demi-Double',
};

export default function MonoparentalCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateMonoparentalRule | null>(null);
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

    const { data: paginatedResult, isLoading, isError } = useTemplateMonoparentalRules(page, limit, debouncedSearch);
    const rules = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedRules } = useArchivedTemplateMonoparentalRules({ enabled: isAdmin });
    
    const createMutation = useCreateTemplateMonoparentalRule();
    const updateMutation = useUpdateTemplateMonoparentalRule();
    const deleteMutation = useDeleteTemplateMonoparentalRule();
    const restoreMutation = useRestoreTemplateMonoparentalRule();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (r: TemplateMonoparentalRule) => { setEditing(r); setIsModalOpen(true); };

    const handleDelete = async (r: TemplateMonoparentalRule) => {
        if (await confirm({
            title: `Archiver la règle "${r.name}" ?`,
            description: "La règle sera archivée et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(r.id);
        }
    };

    const handleRestore = async (r: TemplateMonoparentalRule) => {
        if (await confirm({
            title: `Restaurer la règle "${r.name}" ?`,
            description: "La règle sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(r.id);
        }
    };

    const onSubmit = (data: CreateTemplateMonoparentalRulePayload) => {
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
                        <Users className="text-brand-mint" size={28} />
                        {t('pages.catalog.monoparental.header.title', { defaultValue: 'Catalogue Monoparental' })}
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.0df487fc', { defaultValue: "Gérez les exceptions de tarification monoparentale (templates)" })}</p>
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
                        placeholder={t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.placeholder.9a24f186', { defaultValue: "Rechercher une règle..." })}
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
                    Impossible de charger les règles monoparentales.
                </div>
            )}

            {!isLoading && !isError && rules.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Users size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.a64abcb0', { defaultValue: "Aucune règle monoparentale trouvée" })}</p>
                </div>
            )}

            {rules.length > 0 && (
                <div className="bg-white rounded-xl border border-brand-slate/20 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.f130a297', { defaultValue: "Configuration" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.f23226d9', { defaultValue: "Déclencheur (Pax)" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.f4984b1a', { defaultValue: "Formule Tarifaire" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.0bba5166', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {rules.map((r) => (
                                <tr key={r.id} className="hover:bg-brand-light transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-brand-navy leading-tight">{r.name}</span>
                                            <span className="text-sm text-brand-slate font-mono">{r.reference || 'MON-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-xs font-bold text-brand-slate bg-brand-light px-2 py-0.5 rounded border border-brand-slate/20">
                                                <User size={12} /> {r.adultCount} Ad
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-brand-slate bg-brand-slate/10 px-2 py-0.5 rounded border border-brand-slate/30">
                                                <Baby size={12} /> {r.childCount} Ch ({r.minAge}-{r.maxAge} ans)
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-bold tracking-wide bg-brand-mint/10 text-brand-mint border border-brand-mint/30 px-1.5 py-0.5 rounded uppercase">
                                                {BASE_RATE_LABELS[r.baseRateType]}
                                            </span>
                                            <span className="text-brand-slate font-normal">+</span>
                                            <span className="text-brand-slate">{r.childSurchargePercentage}%</span>
                                            <span className="text-brand-slate font-normal text-[10px]">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.390f7019', { defaultValue: "de" })}</span>
                                            <span className="text-[10px] font-bold tracking-wide bg-brand-mint/10 text-brand-mint border border-brand-mint/30 px-1.5 py-0.5 rounded uppercase">
                                                {CHILD_SURCHARGE_BASE_LABELS[r.childSurchargeBase as ChildSurchargeBase]}
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
                        className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none font-bold">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Règles archivées {archivedRules ? `(${archivedRules.length})` : ''}
                    </button>

                    {showArchived && archivedRules && archivedRules.length > 0 && (
                        <div className="mt-4 bg-brand-light rounded-xl border border-brand-slate/20 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedRules.map((r: any) => (
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
                    {showArchived && archivedRules && archivedRules.length === 0 && (
                        <p className="mt-3 text-sm text-brand-slate italic font-medium ml-6">{t('auto.features.catalog.monoparental.pages.monoparentalcatalogpage.e6da54bc', { defaultValue: "Aucune règle archivée" })}</p>
                    )}
                </div>
            )}

            <EditMonoparentalTemplateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
