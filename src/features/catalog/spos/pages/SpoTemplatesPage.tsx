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
    Gift, Plus, Pencil, Trash2, GitMerge, Search, 
    ChevronLeft, ChevronRight, Archive, RotateCcw, ChevronDown
} from 'lucide-react';
import EditSpoTemplateModal from '../components/EditSpoTemplateModal';

export default function SpoTemplatesPage() {
    const { t } = useTranslation('common');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpo, setEditingSpo] = useState<TemplateSpo | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
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
    const { data: archivedSpos } = useArchivedSpoTemplates({ enabled: isAdmin });
    
    const deleteMutation = useDeleteSpoTemplate();
    const restoreMutation = useRestoreSpoTemplate();
    const { confirm } = useConfirm();

    const handleDelete = async (spo: TemplateSpo) => {
        if (await confirm({
            title: `Archiver l'offre "${spo.name}" ?`,
            description: `Le template sera archivé et ne sera plus visible dans le catalogue.`,
            confirmLabel: 'Archiver',
            variant: 'danger'
        })) {
            deleteMutation.mutate(spo.id);
        }
    };

    const handleRestore = async (spo: TemplateSpo) => {
        if (await confirm({
            title: `Restaurer l'offre "${spo.name}" ?`,
            description: `Le template sera de nouveau disponible pour l'importation.`,
            confirmLabel: 'Restaurer',
            variant: 'info'
        })) {
            restoreMutation.mutate(spo.id);
        }
    };

    const formatCondition = (spo: TemplateSpo) => {
        switch (spo.conditionType) {
            case 'MIN_NIGHTS': return `Min. ${spo.conditionValue} nuits`;
            case 'EARLY_BIRD': return `Réservé ${spo.conditionValue} j. avance`;
            case 'LONG_STAY': return `Long séjour (> ${spo.conditionValue} nuits)`;
            case 'HONEYMOONER': return 'Voyage de noces';
            case 'NONE': return 'Automatique';
            default: return spo.conditionType;
        }
    };

    const formatBenefit = (spo: TemplateSpo) => {
        switch (spo.benefitType) {
            case 'PERCENTAGE_DISCOUNT': return `-${spo.benefitValue}% réduction`;
            case 'FIXED_DISCOUNT': return `-${spo.benefitValue} fixe`;
            case 'FREE_NIGHTS': return `${spo.benefitValue} nuits offertes`;
            case 'FREE_ROOM_UPGRADE': return 'Upgrade Chambre';
            case 'FREE_BOARD_UPGRADE': return 'Upgrade Pension';
            case 'KIDS_GO_FREE': return 'Enfants gratuits';
            default: return spo.benefitType;
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
                        <Gift className="text-brand-mint" size={28} />
                        {t('pages.catalog.spo.header.title', { defaultValue: 'Catalogue SPO' })}
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.catalog.spos.pages.spotemplatespage.2b1c2c3d', { defaultValue: "Gérez vos modèles d'offres spéciales (templates)" })}</p>
                </div>
                <button
                    onClick={() => { setEditingSpo(null); setIsModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-mint text-white text-sm font-medium rounded-xl hover:bg-brand-mint transition-colors shadow-sm cursor-pointer border-none outline-none"
                >
                    <Plus size={16} /> Nouveau Modèle
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="text"
                        placeholder={t('pages.catalog.spo.header.searchPlaceholder', { defaultValue: 'Rechercher une SPO...' })}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                    {t('pages.catalog.spo.states.loadError', { defaultValue: 'Impossible de charger le catalogue SPO.' })}
                </div>
            )}

            {!isLoading && !isError && pageData?.data.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Gift size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.spos.pages.spotemplatespage.01f592bf', { defaultValue: "Aucune offre spéciale trouvée" })}</p>
                </div>
            )}

            {pageData && pageData.data.length > 0 && (
                <div className="bg-white rounded-xl border border-brand-slate/20 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.spos.pages.spotemplatespage.994aa2d8', { defaultValue: "Modèle" })}</th>
                                <th className="px-6 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.spos.pages.spotemplatespage.3bbd1cbc', { defaultValue: "SI / Condition" })}</th>
                                <th className="px-4 py-3 font-semibold text-brand-slate text-center"><GitMerge size={14} className="mx-auto rotate-90" /></th>
                                <th className="px-6 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.spos.pages.spotemplatespage.4420b633', { defaultValue: "ALORS / Avantage" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.spos.pages.spotemplatespage.a6e99000', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {pageData.data.map((spo: TemplateSpo) => (
                                <tr key={spo.id} className="hover:bg-brand-light transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-brand-navy leading-tight">{spo.name}</span>
                                            <span className="text-sm text-brand-slate font-mono">{spo.reference || 'SPO-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-slate/20" />
                                            <span className="text-brand-navy font-bold whitespace-nowrap">{formatCondition(spo)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-brand-slate">
                                        <ChevronRight size={18} className="mx-auto" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-mint" />
                                            <span className="text-brand-mint font-black whitespace-nowrap">{formatBenefit(spo)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => { setEditingSpo(spo); setIsModalOpen(true); }}
                                                className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all border-none outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(spo)}
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
                    {pageData?.meta && pageData.meta.lastPage > 0 && (
                        <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 flex items-center justify-between">
                            <p className="text-xs text-brand-slate font-medium tracking-tight">
                                {t('auto.pagination.summary', { defaultValue: 'Affichage de {{from}} ? {{to}} sur {{total}}', from: (page - 1) * limit + 1, to: Math.min(page * limit, pageData.meta.total), total: pageData.meta.total })}
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
                                    {page} / {pageData.meta.lastPage}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(pageData.meta.lastPage, p + 1))}
                                    disabled={page >= pageData.meta.lastPage}
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
                        Offres archivées {archivedSpos ? `(${archivedSpos.length})` : ''}
                    </button>

                    {showArchived && archivedSpos && archivedSpos.length > 0 && (
                        <div className="mt-4 bg-brand-light rounded-xl border border-brand-slate/20 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedSpos.map((spo: TemplateSpo) => (
                                        <tr key={spo.id} className="hover:bg-brand-light transition-colors">
                                            <td className="px-5 py-3 text-brand-slate font-bold">{spo.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(spo)}
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

            <EditSpoTemplateModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSpo(null); }}
                editItem={editingSpo}
            />
        </div>
    );
}
