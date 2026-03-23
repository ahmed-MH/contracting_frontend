import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, ShieldAlert, Clock, Hash, Percent, Banknote, AlertTriangle } from 'lucide-react';
import { 
    type TemplateCancellationRule, 
    type CreateTemplateCancellationRulePayload 
} from '../hooks/useTemplateCancellations';
import { CancellationPenaltyType } from '../types/cancellation.types';

interface TemplateCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateCancellationRule | null;
    onSubmit: (data: CreateTemplateCancellationRulePayload) => void;
    isPending: boolean;
}

export default function TemplateCancellationModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: TemplateCancellationModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<CreateTemplateCancellationRulePayload>({
        defaultValues: {
            name: '',
            daysBeforeArrival: 2,
            appliesToNoShow: true,
            minStayCondition: null,
            penaltyType: CancellationPenaltyType.NIGHTS,
            baseValue: 1,
        },
    });

    const watchPenaltyType = watch('penaltyType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    daysBeforeArrival: editItem.daysBeforeArrival,
                    appliesToNoShow: editItem.appliesToNoShow,
                    minStayCondition: editItem.minStayCondition,
                    penaltyType: editItem.penaltyType,
                    baseValue: editItem.baseValue,
                });
            } else {
                reset({
                    name: '',
                    daysBeforeArrival: 2,
                    appliesToNoShow: true,
                    minStayCondition: null,
                    penaltyType: CancellationPenaltyType.NIGHTS,
                    baseValue: 1,
                });
            }
        }
    }, [isOpen, editItem, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {editItem ? `Modifier – ${editItem.name}` : 'Nouveau Template Annulation'}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                                Politique de désengagement Catalogue
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 border-none bg-transparent outline-none">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* Section 1: Identification */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">1. Identification & Nom</h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Libellé de la politique</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-semibold"
                                    placeholder="Ex: Late Cancel TGV - 48h"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>
                        </div>

                        {/* Section 2: Déclencheur (Trigger) */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
                                <Clock size={12} /> 2. Fenêtre de désengagement
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jours avant Arrivée</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <input
                                            type="number"
                                            {...register('daysBeforeArrival', { valueAsNumber: true, min: 0 })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-bold"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Jours</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Condition Séjour Min</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <input
                                            type="number"
                                            {...register('minStayCondition', { valueAsNumber: true, min: 0 })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-bold placeholder:font-medium"
                                            placeholder="Libre"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Nuits</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl border border-red-100 mt-2">
                                <input
                                    type="checkbox"
                                    id="appliesToNoShow"
                                    {...register('appliesToNoShow')}
                                    className="w-4 h-4 text-red-600 rounded-lg border-red-200 focus:ring-red-500 transition-all cursor-pointer"
                                />
                                <label htmlFor="appliesToNoShow" className="text-xs font-bold text-red-700 cursor-pointer select-none">
                                    Étendre la pénalité au "No-Show" (Non-présentation)
                                </label>
                            </div>
                        </div>

                        {/* Section 3: Pénalité */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">3. Calcul de la Pénalité</h4>
                            <div className="grid grid-cols-2 gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Unité de mesure</label>
                                    <select
                                        {...register('penaltyType')}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value={CancellationPenaltyType.NIGHTS}>Nuits de séjour</option>
                                        <option value={CancellationPenaltyType.PERCENTAGE}>Pourcentage (%)</option>
                                        <option value={CancellationPenaltyType.FIXED_AMOUNT}>Montant fixe (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Valeur pénalité</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                                            {watchPenaltyType === CancellationPenaltyType.NIGHTS ? <Hash size={16} /> : 
                                             watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? <Percent size={16} /> : 
                                             <Banknote size={16} />}
                                        </div>
                                        <input
                                            type="number"
                                            step={watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? "0.01" : "1"}
                                            {...register('baseValue', { valueAsNumber: true, min: 0 })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all text-sm font-black"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                                            {watchPenaltyType === CancellationPenaltyType.NIGHTS ? 'Nuits' : watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? '%' : '€'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer border-none outline-none"
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
