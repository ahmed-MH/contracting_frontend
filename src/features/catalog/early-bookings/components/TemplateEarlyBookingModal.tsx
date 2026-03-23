import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Calendar, Clock, CreditCard, ClipboardList } from 'lucide-react';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';

interface TemplateEarlyBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateEarlyBooking | null;
    onSubmit: (data: CreateTemplateEarlyBookingPayload) => void;
    isPending: boolean;
}

export default function TemplateEarlyBookingModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: TemplateEarlyBookingModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<CreateTemplateEarlyBookingPayload>({
        defaultValues: {
            name: '',
            value: 10,
            calculationType: 'PERCENTAGE',
            releaseDays: 60,
            bookingWindowStart: '',
            bookingWindowEnd: '',
            stayWindowStart: '',
            stayWindowEnd: '',
            isPrepaid: false,
            prepaymentPercentage: 0,
            prepaymentDeadlineDate: '',
            roomingListDeadlineDate: '',
            applicationType: 'PER_NIGHT_PER_PERSON',
        },
    });

    const isPrepaid = watch('isPrepaid');
    const calculationType = watch('calculationType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    value: Number(editItem.value) || 0,
                    calculationType: editItem.calculationType,
                    releaseDays: editItem.releaseDays,
                    bookingWindowStart: editItem.bookingWindowStart || '',
                    bookingWindowEnd: editItem.bookingWindowEnd || '',
                    stayWindowStart: editItem.stayWindowStart || '',
                    stayWindowEnd: editItem.stayWindowEnd || '',
                    isPrepaid: editItem.isPrepaid,
                    prepaymentPercentage: editItem.prepaymentPercentage || 0,
                    prepaymentDeadlineDate: editItem.prepaymentDeadlineDate || '',
                    roomingListDeadlineDate: editItem.roomingListDeadlineDate || '',
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({
                    name: '',
                    value: 10,
                    calculationType: 'PERCENTAGE',
                    releaseDays: 60,
                    bookingWindowStart: '',
                    bookingWindowEnd: '',
                    stayWindowStart: '',
                    stayWindowEnd: '',
                    isPrepaid: false,
                    prepaymentPercentage: 0,
                    prepaymentDeadlineDate: '',
                    roomingListDeadlineDate: '',
                    applicationType: 'PER_NIGHT_PER_PERSON',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    if (!isOpen) return null;

    const handleFormSubmit = (data: CreateTemplateEarlyBookingPayload) => {
        const payload = { ...data };
        // Date cleanup
        payload.bookingWindowStart = payload.bookingWindowStart || null;
        payload.bookingWindowEnd = payload.bookingWindowEnd || null;
        payload.stayWindowStart = payload.stayWindowStart || null;
        payload.stayWindowEnd = payload.stayWindowEnd || null;

        if (!payload.isPrepaid) {
            payload.prepaymentPercentage = null;
            payload.prepaymentDeadlineDate = null;
            payload.roomingListDeadlineDate = null;
        } else {
            payload.prepaymentDeadlineDate = payload.prepaymentDeadlineDate || null;
            payload.roomingListDeadlineDate = payload.roomingListDeadlineDate || null;
        }
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editItem ? `Modifier – ${editItem.name}` : 'Nouveau Template Early Booking'}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">
                            Définition Catalogue
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* Section 1: Base Info */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">1. Informations de base</h4>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de l'offre</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="Ex: EB Hiver -15% (Template)"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Type de Calcul</label>
                                        <select
                                            {...register('calculationType')}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="PERCENTAGE">Pourcentage (%)</option>
                                            <option value="FIXED">Fixe (€)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Mode d'Application</label>
                                        <select
                                            {...register('applicationType')}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="PER_NIGHT_PER_PERSON">Par Nuit et Par Personne</option>
                                            <option value="PER_NIGHT_PER_ROOM">Par Chambre et Par Nuit</option>
                                            <option value="FLAT_RATE_PER_STAY">Forfait Unique par Séjour</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Valeur</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('value', { required: true, valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                            {calculationType === 'PERCENTAGE' ? '%' : '€'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Release</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            type="number"
                                            {...register('releaseDays', { valueAsNumber: true })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">jours</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Section 2: Windows */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">2. Périodes de validité</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                                        <Calendar size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Fenêtre de Réservation</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-600/60 uppercase mb-1">Du</label>
                                            <input type="date" {...register('bookingWindowStart')} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-600/60 uppercase mb-1">Au</label>
                                            <input type="date" {...register('bookingWindowEnd')} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                        <Calendar size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Période de Séjour</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-600/60 uppercase mb-1">Du</label>
                                            <input type="date" {...register('stayWindowStart')} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-600/60 uppercase mb-1">Au</label>
                                            <input type="date" {...register('stayWindowEnd')} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Prepayment */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">3. Prépaiement & Garanties</h4>
                                <div className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        id="isPrepaid"
                                        {...register('isPrepaid')}
                                        className="w-4 h-4 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 transition-all"
                                    />
                                    <label htmlFor="isPrepaid" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">Activer l'exigence</label>
                                </div>
                            </div>

                            {isPrepaid ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-indigo-700 uppercase mb-2">
                                            <CreditCard size={14} /> % Prépaiement
                                        </label>
                                        <input
                                            type="number"
                                            {...register('prepaymentPercentage', { valueAsNumber: true })}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase mb-2">
                                            <Clock size={14} /> Date Limite (Pay)
                                        </label>
                                        <input
                                            type="date"
                                            {...register('prepaymentDeadlineDate')}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-violet-700 uppercase mb-2">
                                            <ClipboardList size={14} /> Rooming List
                                        </label>
                                        <input
                                            type="date"
                                            {...register('roomingListDeadlineDate')}
                                            className="w-full px-3 py-2 bg-white border border-violet-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl py-6 text-center">
                                    <p className="text-xs text-gray-400 font-medium italic">Aucun prépaiement exigé pour ce template</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {editItem ? 'Enregistrer' : 'Créer le Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
