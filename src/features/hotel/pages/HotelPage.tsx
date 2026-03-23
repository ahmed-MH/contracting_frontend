import { useState } from 'react';
import {
    useArchivedHotels, useCreateHotel, useUpdateHotel,
    useDeleteHotel, useRestoreHotel, type Hotel, type CreateHotelPayload
} from '../hooks/useHotels';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../context/HotelContext';
import {
    Building2, Plus, Pencil, Trash2, RotateCcw, Archive,
    ChevronDown, MapPin, User,
    Landmark, Coins, Star, Mail, Hotel as HotelIcon,
    ArrowUpRight
} from 'lucide-react';
import HotelModal from '../components/HotelModal';
import ExchangeRatesSection from '../components/ExchangeRatesSection';

export default function HotelPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Hotel | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { currentHotel, availableHotels, switchHotel, isLoading: isContextLoading } = useHotel();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };
    const { data: archivedHotels } = useArchivedHotels(isAdmin && showArchived);

    const createMutation = useCreateHotel(closeModal);
    const updateMutation = useUpdateHotel(closeModal);
    const deleteMutation = useDeleteHotel();
    const restoreMutation = useRestoreHotel();

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (h: Hotel) => { setEditing(h); setIsModalOpen(true); };

    const handleDelete = async (h: Hotel) => {
        if (await confirm({
            title: `Archiver l'hôtel "${h.name}" ?`,
            description: "L'établissement sera déplacé en archive.",
            confirmLabel: 'Archiver',
            variant: 'danger',
        })) deleteMutation.mutate(h.id);
    };

    const handleRestore = async (h: Hotel) => {
        if (await confirm({
            title: `Restaurer l'hôtel "${h.name}" ?`,
            description: "L'hôtel redeviendra actif.",
            confirmLabel: 'Restaurer',
            variant: 'info',
        })) restoreMutation.mutate(h.id);
    };

    const onSubmit = (data: CreateHotelPayload) => {
        if (editing) { updateMutation.mutate({ id: editing.id, data }); }
        else { createMutation.mutate(data); }
    };

    if (isContextLoading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 pt-6 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── HEADER DE NAVIGATION ── */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <HotelIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuration Hôtel</h1>
                            <p className="text-sm font-medium text-gray-400">Gérez vos établissements et paramètres financiers</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {availableHotels.length > 1 && (
                            <div className="relative group">
                                <select
                                    value={currentHotel?.id || ''}
                                    onChange={(e) => switchHotel(Number(e.target.value))}
                                    className="appearance-none w-64 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                                >
                                    {availableHotels.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute inset-y-0 right-4 flex items-center h-full pointer-events-none text-gray-400" />
                            </div>
                        )}

                        {isAdmin && (
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer border-none outline-none"
                            >
                                <Plus size={18} /> Nouvel Hôtel
                            </button>
                        )}
                    </div>
                </header>

                <hr className="border-slate-200/60" />

                {!currentHotel ? (
                    <div className="py-20 text-center bg-white rounded-[32px] border border-slate-200 shadow-sm border-dashed">
                        <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-slate-900 font-bold mb-1">Aucun hôtel sélectionné</h3>
                        <p className="text-slate-400 text-sm">Veuillez choisir un établissement pour continuer.</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                        
                        {/* ── SECTION DASHBOARD PROFILE ── */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end justify-between">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{currentHotel.name}</h2>
                                    {currentHotel.stars && (
                                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-lg self-center">
                                            {Array.from({ length: currentHotel.stars }).map((_, i) => (
                                                <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <span className="text-gray-500 font-medium">Raison Sociale: <span className="text-slate-900 font-bold">{currentHotel.fiscalName || '—'}</span></span>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-wider">
                                        REF: {currentHotel.reference || 'HTL-PENDING'}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-wider border border-indigo-100">
                                        <Coins size={12} /> {currentHotel.defaultCurrency}
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEdit(currentHotel)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                    >
                                        <Pencil size={15} className="text-indigo-500" /> Modifier Profil
                                    </button>
                                    <button
                                        onClick={() => handleDelete(currentHotel)}
                                        disabled={deleteMutation.isPending}
                                        className="p-2 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── BENTO GRID MODERNISÉ ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            
                            {/* Card 1 : Localisation & Standard Info */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                        <MapPin size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Emplacement</h3>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Adresse physique</label>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed">{currentHotel.address}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Standard</label>
                                            <p className="text-sm font-bold text-gray-900">{currentHotel.phone}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Fax</label>
                                            <p className="text-sm font-semibold text-gray-400">{currentHotel.fax || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Gérant / Légal</label>
                                            <p className="text-sm font-bold text-gray-900">{currentHotel.legalRepresentative}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2 : Hub Email (Simplifié) */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                        <Mail size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Contact Numérique</h3>
                                </div>
                                <div className="space-y-3">
                                    {currentHotel.emails && currentHotel.emails.length > 0 ? (
                                        currentHotel.emails.map((e, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 transition-all">
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">{e.label}</span>
                                                    <p className="text-sm font-semibold text-gray-700 break-all">{e.address}</p>
                                                </div>
                                                <a href={`mailto:${e.address}`} className="ml-3 p-2 text-gray-300 hover:text-indigo-600 transition-colors shrink-0">
                                                    <ArrowUpRight size={18} />
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center opacity-30">
                                            <Mail size={32} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold uppercase italic tracking-widest">Aucun email</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3 : Financial Focus (Premium) */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                            <Landmark size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Fiche Bancaire</h3>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600">{currentHotel.bankName || 'Standard'}</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Matricule Fiscal</span>
                                            <span className="text-sm font-bold font-mono text-gray-900">{currentHotel.vatNumber || '—'}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RIB / Compte</span>
                                            <span className="text-sm font-bold font-mono text-gray-900">{currentHotel.accountNumber || '—'}</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Code IBAN International</label>
                                            <p className="text-sm font-bold font-mono text-gray-900 break-all leading-relaxed">{currentHotel.ibanCode || '—'}</p>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">BIC / SWIFT</span>
                                            <span className="text-sm font-bold font-mono text-indigo-600">{currentHotel.swiftCode || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ── SECTION TAUX DE CHANGE ── */}
                        <div className="pt-10">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <Coins className="text-indigo-600" size={24} />
                                Gestion des Taux de Change
                            </h2>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <ExchangeRatesSection />
                            </div>
                        </div>

                    </div>
                )}

                {/* ── ARCHIVES (DISCRET) ── */}
                {isAdmin && (
                    <div className="pt-12 border-t border-slate-200/60">
                         <button
                            onClick={() => setShowArchived(!showArchived)}
                            className="flex items-center gap-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-transparent border-none cursor-pointer outline-none"
                        >
                            <Archive size={16} />
                            {showArchived ? 'Masquer' : 'Afficher'} les établissements archivés ({archivedHotels?.length || 0})
                        </button>

                        {showArchived && archivedHotels && archivedHotels.length > 0 && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {archivedHotels.map(h => (
                                    <div key={h.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group grayscale hover:grayscale-0 transition-all">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{h.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-mono italic">{h.reference || 'REF-N/A'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(h)}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border-none outline-none"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <HotelModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    editing={editing}
                    onSubmit={onSubmit}
                    isPending={createMutation.isPending || updateMutation.isPending}
                />
            </div>
        </div>
    );
}
