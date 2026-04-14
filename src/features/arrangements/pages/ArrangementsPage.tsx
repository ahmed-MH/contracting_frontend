import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useArrangements, useArchivedArrangements, useCreateArrangement, useUpdateArrangement, useDeleteArrangement, useRestoreArrangement, type Arrangement, type CreateArrangementPayload } from '../hooks/useArrangements';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { UtensilsCrossed, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import EditArrangementModal from '../components/EditArrangementModal';
import { GuidedPageHeader } from '../../../components/layout/Workspace';

export default function ArrangementsPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Arrangement | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: arrangements, isLoading, isError } = useArrangements();
    const { data: archivedArrangements } = useArchivedArrangements(isAdmin && showArchived);

    const displayedArrangements = arrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    );

    const displayedArchivedArrangements = archivedArrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    );
    const createMutation = useCreateArrangement(closeModal);
    const updateMutation = useUpdateArrangement(closeModal);
    const deleteMutation = useDeleteArrangement();
    const restoreMutation = useRestoreArrangement();

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (item: Arrangement) => { setEditing(item); setIsModalOpen(true); };
    
    const handleDelete = async (item: Arrangement) => {
        if (await confirm({
            title: `Archiver l'arrangement "${item.code} – ${item.name}" ?`,
            description: "L'arrangement sera archivé.",
            confirmLabel: "Archiver",
            variant: "danger"
        })) {
            deleteMutation.mutate(item.id);
        }
    };

    const handleRestore = async (item: Arrangement) => {
        if (await confirm({
            title: `Restaurer l'arrangement "${item.code} – ${item.name}" ?`,
            description: "L'arrangement sera de nouveau actif.",
            confirmLabel: "Restaurer",
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
                    Impossible de charger les arrangements.
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
                    <Plus size={16} /> Nouvel Arrangement
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
                        placeholder={t('auto.features.arrangements.pages.arrangementspage.placeholder.995686e5', { defaultValue: "Rechercher un arrangement..." })}
                        className="w-full rounded-xl border border-brand-slate/20 bg-brand-light/70 py-2.5 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>
            </section>

            {(!isLoading && !isError && arrangements?.length === 0) ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.arrangements.pages.arrangementspage.c87031c2', { defaultValue: "Aucun arrangement défini" })}</p>
                    <p className="text-brand-slate/70 text-xs mt-1">{t('auto.features.arrangements.pages.arrangementspage.5dcf7e80', { defaultValue: "Cliquez sur « Nouvel Arrangement » pour commencer" })}</p>
                </div>
            ) : arrangements && arrangements.length > 0 && displayedArrangements?.length === 0 ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">Aucun arrangement trouvé pour "{search}"</p>
                </div>
            ) : displayedArrangements && displayedArrangements.length > 0 && (
                <div className="premium-surface overflow-x-auto animate-in slide-in-from-bottom-2 duration-300">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light/80 border-b border-brand-slate/15">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b33b394f', { defaultValue: "Code" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.96ce3732', { defaultValue: "Libellé" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.arrangements.pages.arrangementspage.60d9e35d', { defaultValue: "Niveau" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b6c233f6', { defaultValue: "Description" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.arrangements.pages.arrangementspage.3463121d', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {displayedArrangements.map((arr) => (
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
                                            {arr.description || <span className="text-brand-slate/45">{t('auto.features.arrangements.pages.arrangementspage.b64ea579', { defaultValue: "Aucune description" })}</span>}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => openEdit(arr)}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none bg-transparent" title={t('auto.features.arrangements.pages.arrangementspage.title.a2e2e4e7', { defaultValue: "Modifier" })}>
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(arr)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent" title={t('auto.features.arrangements.pages.arrangementspage.title.ede43660', { defaultValue: "Supprimer" })}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-brand-light/80 border-t border-brand-slate/10 text-[10px] font-bold text-brand-slate/70 uppercase tracking-widest text-center">
                        {displayedArrangements.length} arrangement{displayedArrangements.length > 1 ? 's' : ''} {arrangements && arrangements.length > displayedArrangements.length && `(sur ${arrangements.length})`}
                    </div>
                </div>
            )}

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none outline-none bg-transparent">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Arrangements archivés {archivedArrangements ? `(${archivedArrangements.length})` : ''}
                    </button>

                    {showArchived && displayedArchivedArrangements && displayedArchivedArrangements.length > 0 && (
                        <div className="premium-surface mt-4 overflow-x-auto opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-slate/10 border-b border-brand-slate/15">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.b33b394f', { defaultValue: "Code" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.arrangements.pages.arrangementspage.cbf4e9cf', { defaultValue: "Nom" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.arrangements.pages.arrangementspage.7d74144c', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {displayedArchivedArrangements.map((arr) => (
                                        <tr key={arr.id} className="hover:bg-brand-slate/10 transition-colors">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-slate/15 text-brand-slate text-xs font-bold font-mono tracking-wider">
                                                    {arr.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-brand-slate italic">{arr.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(arr)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-medium rounded-xl hover:bg-brand-mint/15 transition-colors cursor-pointer border-none outline-none">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedArrangements && archivedArrangements.length === 0 && (
                        <p className="mt-3 text-sm text-brand-slate/70 italic">{t('auto.features.arrangements.pages.arrangementspage.34b0529a', { defaultValue: "Aucun arrangement archivé" })}</p>
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
