import { useState, useEffect } from 'react';
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
import TemplateMonoparentalModal from '../components/TemplateMonoparentalModal';

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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="text-indigo-600" size={28} />
                        Catalogue Monoparental
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les exceptions de tarification monoparentale (templates)</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvelle Règle
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une règle..."
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
                    Impossible de charger les règles monoparentales.
                </div>
            )}

            {!isLoading && !isError && rules.length === 0 && (
                <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-12 text-center">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune règle monoparentale trouvée</p>
                </div>
            )}

            {rules.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Configuration</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Déclencheur (Pax)</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Formule Tarifaire</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rules.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 leading-tight">{r.name}</span>
                                            <span className="text-sm text-gray-500 font-mono">{r.reference || 'MON-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                <User size={12} /> {r.adultCount} Ad
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                <Baby size={12} /> {r.childCount} Ch ({r.minAge}-{r.maxAge} ans)
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded uppercase">
                                                {BASE_RATE_LABELS[r.baseRateType]}
                                            </span>
                                            <span className="text-gray-400 font-normal">+</span>
                                            <span className="text-amber-600">{r.childSurchargePercentage}%</span>
                                            <span className="text-gray-400 font-normal text-[10px]">de</span>
                                            <span className="text-[10px] font-bold tracking-wide bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded uppercase">
                                                {CHILD_SURCHARGE_BASE_LABELS[r.childSurchargeBase as ChildSurchargeBase]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(r)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border-none outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(r)}
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
                    {meta && meta.lastPage > 0 && (
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-medium tracking-tight">
                                Affichage de <span className="font-bold text-gray-700">{(page - 1) * limit + 1}</span> à <span className="font-bold text-gray-700">{Math.min(page * limit, meta.total)}</span> sur <span className="font-bold text-gray-700">{meta.total}</span>
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
                                    {page} / {meta.lastPage}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                                    disabled={page >= meta.lastPage}
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
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none font-bold">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Règles archivées {archivedRules ? `(${archivedRules.length})` : ''}
                    </button>

                    {showArchived && archivedRules && archivedRules.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-100">
                                    {archivedRules.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 font-bold">{r.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(r)}
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
                    {showArchived && archivedRules && archivedRules.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic font-medium ml-6">Aucune règle archivée</p>
                    )}
                </div>
            )}

            <TemplateMonoparentalModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
