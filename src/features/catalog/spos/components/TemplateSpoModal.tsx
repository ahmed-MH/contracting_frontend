import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, FileText, Percent, Moon, Calendar, Wallet, Zap, Gift } from 'lucide-react';
import {
    type TemplateSpo,
    type CreateTemplateSpoPayload
} from '../types/spos.types';
import { useCreateSpoTemplate, useUpdateSpoTemplate } from '../hooks/useSpoTemplates';

interface TemplateSpoModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateSpo | null;
}

export default function TemplateSpoModal({ isOpen, onClose, editItem }: TemplateSpoModalProps) {
    const createMutation = useCreateSpoTemplate();
    const updateMutation = useUpdateSpoTemplate();
    const isEditing = !!editItem;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<CreateTemplateSpoPayload>({
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
            applicationType: 'PER_NIGHT_PER_PERSON',
        },
    });

    const watchConditionType = watch('conditionType');
    const watchBenefitType = watch('benefitType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    conditionType: editItem.conditionType,
                    conditionValue: editItem.conditionValue,
                    benefitType: editItem.benefitType,
                    benefitValue: editItem.benefitValue,
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({
                    name: '',
                    conditionType: 'NONE',
                    benefitType: 'PERCENTAGE_DISCOUNT',
                    applicationType: 'PER_NIGHT_PER_PERSON',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    if (!isOpen) return null;

    const onSubmit = (data: CreateTemplateSpoPayload) => {
        const payload: CreateTemplateSpoPayload = { ...data };

        // Clean values based on types
        if (payload.conditionType === 'NONE' || payload.conditionType === 'HONEYMOONER') {
            delete payload.conditionValue;
        } else {
            payload.conditionValue = Number(payload.conditionValue);
        }

        if (['FREE_ROOM_UPGRADE', 'FREE_BOARD_UPGRADE', 'KIDS_GO_FREE'].includes(payload.benefitType)) {
            delete payload.benefitValue;
        } else {
            payload.benefitValue = Number(payload.benefitValue);
            payload.value = payload.benefitValue;
        }

        if (isEditing) {
            updateMutation.mutate(
                { id: editItem.id, payload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);
    const benefitNeedsValue = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS'].includes(watchBenefitType);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditing ? `Modifier – ${editItem.name}` : 'Nouveau Template SPO'}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                                Règle Promotionnelle Catalogue
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
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
                                <FileText size={12} /> 1. Identification du Modèle
                            </h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de l'offre (Public interne)</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold"
                                    placeholder="Ex: Spring Promo -10% (Catalolgue)"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>
                        </div>

                        {/* Section 2: Moteur de Règle */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
                                <Zap size={12} /> 2. Logique de la Règle (Trigger & Benefit)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                {/* IF (Condition) */}
                                <div className="space-y-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-sm">SI (CONDITION)</div>

                                    <div className="pt-2">
                                        <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Déclencheur</label>
                                        <select
                                            {...register('conditionType', { required: true })}
                                            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer appearance-none shadow-sm"
                                        >
                                            <option value="NONE">Aucune (Automatique)</option>
                                            <option value="MIN_NIGHTS">Nuits minimales</option>
                                            <option value="EARLY_BIRD">Réservation anticipée</option>
                                            <option value="LONG_STAY">Long séjour</option>
                                            <option value="HONEYMOONER">Voyage de noces</option>
                                        </select>
                                    </div>

                                    {conditionNeedsValue && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                            <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                                                {watchConditionType === 'EARLY_BIRD' ? 'Jours d\'avance' : 'Seuil (nuits)'}
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-amber-600 transition-colors">
                                                    {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                                </div>
                                                <input
                                                    type="number"
                                                    {...register('conditionValue', { required: conditionNeedsValue, min: 1 })}
                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                                    placeholder="Val."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* THEN (Benefit) */}
                                <div className="space-y-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-sm">ALORS (AVANTAGE)</div>

                                    <div className="pt-2">
                                        <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Récompense / Mode</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                {...register('benefitType', { required: true })}
                                                className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="PERCENTAGE_DISCOUNT">Réduction %</option>
                                                <option value="FIXED_DISCOUNT">Réduction Fixe</option>
                                                <option value="FREE_NIGHTS">Nuits offertes</option>
                                                <option value="FREE_ROOM_UPGRADE">Upgrade Chambre</option>
                                                <option value="FREE_BOARD_UPGRADE">Upgrade Pension</option>
                                                <option value="KIDS_GO_FREE">Enfants Gratuits</option>
                                            </select>
                                            <select
                                                {...register('applicationType')}
                                                className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-[10px] text-indigo-700 font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="PER_NIGHT_PER_PERSON">Par Nuit et Personne</option>
                                                <option value="PER_NIGHT_PER_ROOM">Par Chambre et Nuit</option>
                                                <option value="FLAT_RATE_PER_STAY">Forfait / Séjour</option>
                                            </select>
                                        </div>
                                    </div>

                                    {benefitNeedsValue && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                            <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Valeur</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                                                    {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> :
                                                        watchBenefitType === 'FREE_NIGHTS' ? <Moon size={16} /> : <Wallet size={16} />}
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('benefitValue', { required: benefitNeedsValue })}
                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Val."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none outline-none">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer border-none outline-none"
                        >
                            {isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isEditing ? 'Mettre à jour' : 'Ajouter au catalogue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
