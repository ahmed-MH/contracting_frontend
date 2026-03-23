import { useState, useEffect } from 'react';
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
import TemplateSpoModal from '../components/TemplateSpoModal';

export default function SpoTemplatesPage() {
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Gift className="text-indigo-600" size={28} />
                        Catalogue SPO
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos modèles d'offres spéciales (templates)</p>
                </div>
                <button
                    onClick={() => { setEditingSpo(null); setIsModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none"
                >
                    <Plus size={16} /> Nouveau Modèle
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une SPO..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm font-bold">
                    Impossible de charger le catalogue SPO.
                </div>
            )}

            {!isLoading && !isError && pageData?.data.length === 0 && (
                <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-12 text-center">
                    <Gift size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune offre spéciale trouvée</p>
                </div>
            )}

            {pageData && pageData.data.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Modèle</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">SI / Condition</th>
                                <th className="px-4 py-3 font-semibold text-gray-400 text-center"><GitMerge size={14} className="mx-auto rotate-90" /></th>
                                <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">ALORS / Avantage</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pageData.data.map((spo: TemplateSpo) => (
                                <tr key={spo.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 leading-tight">{spo.name}</span>
                                            <span className="text-sm text-gray-500 font-mono">{spo.reference || 'SPO-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            <span className="text-gray-700 font-bold whitespace-nowrap">{formatCondition(spo)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-300">
                                        <ChevronRight size={18} className="mx-auto" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-indigo-900 font-black whitespace-nowrap">{formatBenefit(spo)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => { setEditingSpo(spo); setIsModalOpen(true); }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border-none outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(spo)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border-none outline-none cursor-pointer">
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
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-medium tracking-tight">
                                Affichage de <span className="font-bold text-gray-700">{(page - 1) * limit + 1}</span> à <span className="font-bold text-gray-700">{Math.min(page * limit, pageData.meta.total)}</span> sur <span className="font-bold text-gray-700">{pageData.meta.total}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center px-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg h-9 min-w-[36px] justify-center shadow-xs">
                                    {page} / {pageData.meta.lastPage}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(pageData.meta.lastPage, p + 1))}
                                    disabled={page >= pageData.meta.lastPage}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
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
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Offres archivées {archivedSpos ? `(${archivedSpos.length})` : ''}
                    </button>

                    {showArchived && archivedSpos && archivedSpos.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-100">
                                    {archivedSpos.map((spo: TemplateSpo) => (
                                        <tr key={spo.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 font-bold">{spo.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(spo)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer border-none shadow-xs">
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

            <TemplateSpoModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSpo(null); }}
                editItem={editingSpo}
            />
        </div>
    );
}
