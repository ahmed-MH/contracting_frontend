import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    useSpoTemplates, 
    useDeleteSpoTemplate, 
    useArchivedSpoTemplates, 
    useRestoreSpoTemplate 
} from '../hooks/useSpoTemplates';
import type { TemplateSpo } from '../types/spos.types';
import { useConfirm } from '../../../../context/ConfirmContext';
import { useAuth } from '../../../auth/context/AuthContext';
import {
    Gift, Plus, Pencil, Trash2, Search,
    ChevronRight, Archive, RotateCcw, ChevronDown
} from 'lucide-react';
import EditSpoTemplateModal from '../components/EditSpoTemplateModal';
import UpdatedByCell from '../../../../components/audit/UpdatedByCell';
import PaginationControls, { createClientPageMeta, getPageItems } from '../../../../components/ui/PaginationControls';

export default function SpoTemplatesPage() {
    const { t } = useTranslation('common');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpo, setEditingSpo] = useState<TemplateSpo | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedPage, setArchivedPage] = useState(1);
    
    const { user } = useAuth();
    const canManageArchive = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';
    const limit = 10;

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: pageData, isLoading, isError } = useSpoTemplates({ page, limit, search: debouncedSearch });
    const { data: archivedSpos } = useArchivedSpoTemplates({ enabled: canManageArchive });
    const archivedSposList = archivedSpos ?? [];
    const archivedMeta = createClientPageMeta(archivedSposList.length, archivedPage, limit);
    const paginatedArchivedSpos = getPageItems(archivedSposList, archivedMeta);
    
    const deleteMutation = useDeleteSpoTemplate();
    const restoreMutation = useRestoreSpoTemplate();
    const { confirm } = useConfirm();

    const handleDelete = async (spo: TemplateSpo) => {
        if (await confirm({
            title: t('pages.catalog.spo.confirmArchive.title', { name: spo.name }),
            description: t('pages.catalog.spo.confirmArchive.description'),
            confirmLabel: t('pages.catalog.spo.confirmArchive.confirmLabel'),
            variant: 'danger'
        })) {
            deleteMutation.mutate(spo.id);
        }
    };

    const handleRestore = async (spo: TemplateSpo) => {
        if (await confirm({
            title: t('pages.catalog.spo.confirmRestore.title', { name: spo.name }),
            description: t('pages.catalog.spo.confirmRestore.description'),
            confirmLabel: t('pages.catalog.spo.confirmRestore.confirmLabel'),
            variant: 'info'
        })) {
            restoreMutation.mutate(spo.id);
        }
    };

    const formatCondition = (spo: TemplateSpo) => {
        switch (spo.conditionType) {
            case 'MIN_NIGHTS': return t('pages.catalog.labels.spoCondition.minNights', { count: spo.conditionValue });
            case 'EARLY_BIRD': return t('pages.catalog.labels.spoCondition.earlyBird', { count: spo.conditionValue });
            case 'LONG_STAY': return t('pages.catalog.labels.spoCondition.longStay', { count: spo.conditionValue });
            case 'AGE': return t('pages.catalog.labels.spoCondition.age', { count: spo.conditionValue });
            case 'HONEYMOONER': return t('pages.catalog.labels.spoCondition.honeymooner');
            case 'NONE': return t('pages.catalog.labels.spoCondition.none');
            default: return spo.conditionType;
        }
    };

    const formatBenefit = (spo: TemplateSpo) => {
        switch (spo.benefitType) {
            case 'PERCENTAGE_DISCOUNT': return t('pages.catalog.labels.spoBenefit.percentageDiscount', { value: `-${spo.benefitValue}` });
            case 'FIXED_DISCOUNT': return t('pages.catalog.labels.spoBenefit.fixedDiscount', { value: `-${spo.benefitValue}` });
            case 'FREE_NIGHTS': return t('pages.catalog.labels.spoBenefit.freeNights', { value: spo.benefitValue });
            case 'FREE_ROOM_UPGRADE': return t('pages.catalog.labels.spoBenefit.freeRoomUpgrade');
            case 'FREE_BOARD_UPGRADE': return t('pages.catalog.labels.spoBenefit.freeBoardUpgrade');
            case 'KIDS_GO_FREE': return t('pages.catalog.labels.spoBenefit.kidsGoFree');
            default: return spo.benefitType;
        }
    };

    return (
        <div className="space-y-4 p-4 md:p-6 animate-in fade-in duration-500">
            <section className="premium-surface relative overflow-hidden p-5 md:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-brand-mint/10 dark:bg-brand-mint/8" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.catalog.spo.header.kicker', { defaultValue: 'Special offers' })}
                        </p>
                        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                                <Gift size={24} />
                            </span>
                            {t('pages.catalog.spo.header.title', { defaultValue: 'Catalogue SPO' })}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{t('auto.features.catalog.spos.pages.spotemplatespage.2b1c2c3d', { defaultValue: "Gérez vos modèles d'offres spéciales (templates)" })}</p>
                    </div>
                    <button
                        onClick={() => { setEditingSpo(null); setIsModalOpen(true); }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none lg:mt-9"
                    >
                        <Plus size={16} /> {t('pages.catalog.spo.header.new')}
                    </button>
                </div>
                <div className="relative mt-5 flex flex-col gap-3 border-t border-brand-slate/10 pt-5 dark:border-brand-light/10 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                        <input
                            type="text"
                            placeholder={t('pages.catalog.spo.header.searchPlaceholder', { defaultValue: 'Rechercher une SPO...' })}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-brand-slate/20 bg-brand-light/70 py-3 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        />
                    </div>
                    {pageData?.meta && (
                        <span className="premium-pill w-fit border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {pageData.meta.total} {t('pages.catalog.spo.header.totalLabel', { defaultValue: 'templates' })}
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
                    {t('pages.catalog.spo.states.loadError', { defaultValue: 'Impossible de charger le catalogue SPO.' })}
                </div>
            )}

            {!isLoading && !isError && pageData?.data.length === 0 && (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <Gift size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.spos.pages.spotemplatespage.01f592bf', { defaultValue: "Aucune offre spéciale trouvée" })}</p>
                </div>
            )}

            {pageData && pageData.data.length > 0 && (
                <div className="premium-surface overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-brand-slate/15 bg-brand-mint/6 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.spos.pages.spotemplatespage.994aa2d8', { defaultValue: "Modèle" })}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.spo.table.rule', { defaultValue: 'Rule' })}</th>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.spo.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.spos.pages.spotemplatespage.a6e99000', { defaultValue: "Actions" })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                                {pageData.data.map((spo: TemplateSpo) => (
                                    <tr key={spo.id} className="group transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                    <td className="px-5 py-5 whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                                                <Gift size={17} />
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-brand-navy leading-tight dark:text-brand-light">{spo.name || spo.reference || 'SPO'}</span>
                                                <span className="text-xs text-brand-slate font-mono dark:text-brand-light/55">{spo.reference || 'SPO-PENDING'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-[210px] rounded-2xl border border-brand-slate/15 bg-brand-light/70 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-brand-slate dark:text-brand-light/55">
                                                    {t('auto.features.catalog.spos.pages.spotemplatespage.3bbd1cbc', { defaultValue: 'If / Condition' })}
                                                </span>
                                                <span className="mt-1 block truncate font-semibold text-brand-navy dark:text-brand-light" title={formatCondition(spo)}>
                                                    {formatCondition(spo)}
                                                </span>
                                            </div>
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-slate/15 bg-white text-brand-slate shadow-sm transition group-hover:border-brand-mint/30 group-hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5">
                                                <ChevronRight size={16} />
                                            </span>
                                            <div className="min-w-[190px] rounded-2xl border border-brand-mint/20 bg-brand-mint/10 px-3 py-2 shadow-sm">
                                                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-brand-mint/80">
                                                    {t('auto.features.catalog.spos.pages.spotemplatespage.4420b633', { defaultValue: 'Then / Benefit' })}
                                                </span>
                                                <span className="mt-1 block truncate font-black text-brand-mint" title={formatBenefit(spo)}>
                                                    {formatBenefit(spo)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <UpdatedByCell updatedByName={spo.updatedByName} updatedAt={spo.updatedAt} />
                                    </td>
                                    <td className="px-5 py-4 text-right align-middle">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => { setEditingSpo(spo); setIsModalOpen(true); }}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-brand-slate transition-all hover:border-brand-mint/20 hover:bg-brand-mint/10 hover:text-brand-mint outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(spo)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-brand-slate transition-all hover:border-brand-slate/20 hover:bg-brand-slate/10 hover:text-brand-navy dark:hover:text-brand-light outline-none cursor-pointer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <PaginationControls meta={pageData?.meta} onPageChange={setPage} />
                </div>
            )}

            {canManageArchive && (
                <div className="mt-10 space-y-4">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        {t('pages.catalog.spo.archived.toggle', { count: archivedSpos ? `(${archivedSpos.length})` : '' })}
                    </button>

                    {showArchived && archivedSpos && archivedSpos.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                            <div className="overflow-x-auto">
                                <table className="min-w-[520px] w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-brand-slate/15 bg-brand-mint/6 dark:border-brand-light/10 dark:bg-brand-light/5">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('auto.features.catalog.spos.pages.spotemplatespage.994aa2d8', { defaultValue: "Modèle" })}</th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.spo.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">{t('pages.catalog.spo.table.actions', { defaultValue: 'Actions' })}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-light/10">
                                        {paginatedArchivedSpos.map((spo: TemplateSpo) => (
                                            <tr key={spo.id} className="transition-colors hover:bg-brand-mint/5 dark:hover:bg-brand-light/5">
                                                <td className="px-5 py-3 text-brand-slate font-bold dark:text-brand-light/75">{spo.name}</td>
                                                <td className="px-5 py-3 align-top">
                                                    <UpdatedByCell updatedByName={spo.updatedByName} updatedAt={spo.updatedAt} />
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button onClick={() => handleRestore(spo)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-60">
                                                        <RotateCcw size={14} /> {t('pages.catalog.spo.archived.restore')}
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
                    {showArchived && archivedSpos && archivedSpos.length === 0 && (
                        <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
                            {t('pages.catalog.spo.archived.empty')}
                        </div>
                    )}
                </div>
            )}

            <EditSpoTemplateModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSpo(null); }}
                editItem={editingSpo}
            />
        </div>
    );
}
