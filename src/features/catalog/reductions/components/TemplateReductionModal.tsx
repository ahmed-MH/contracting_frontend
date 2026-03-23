import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Info } from 'lucide-react';
import {
    type TemplateReduction,
    type CreateTemplateReductionPayload
} from '../hooks/useTemplateReductions';

interface TemplateReductionModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateReduction | null;
    onSubmit: (data: CreateTemplateReductionPayload) => void;
    isPending: boolean;
}

export default function TemplateReductionModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: TemplateReductionModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CreateTemplateReductionPayload>({
        defaultValues: {
            name: '',
            systemCode: 'CHILD',
            paxOrder: 1,
            calculationType: 'PERCENTAGE',
            minAge: 0,
            maxAge: 12,
            value: 0,
            applicationType: 'PER_NIGHT_PER_PERSON',
            paxType: 'FIRST_CHILD' // Legacy fallback
        },
    });

    const watchSystemCode = watch('systemCode');
    const watchCalcType = watch('calculationType');

    // Clean up fields when switching systemCode
    useEffect(() => {
        if (watchSystemCode === 'EXTRA_ADULT') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
            // Default to 3rd adult if switching
            if (!watch('paxOrder') || watch('paxOrder')! < 3) setValue('paxOrder', 3);
            setValue('paxType', 'THIRD_ADULT');
        } else if (watchSystemCode === 'CHILD') {
            setValue('minAge', 0);
            setValue('maxAge', 12);
            if (!watch('paxOrder')) setValue('paxOrder', 1);
            setValue('paxType', 'FIRST_CHILD');
        } else if (watchSystemCode === 'CUSTOM') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
            setValue('paxOrder', null);
        }
    }, [watchSystemCode, setValue, watch]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                systemCode: editItem.systemCode || 'CHILD',
                paxOrder: editItem.paxOrder,
                paxType: editItem.paxType,
                calculationType: editItem.calculationType,
                minAge: editItem.minAge,
                maxAge: editItem.maxAge,
                value: Number(editItem.value) || 0,
                applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
            });
        } else {
            reset({
                name: '',
                systemCode: 'CHILD',
                paxOrder: 1,
                paxType: 'FIRST_CHILD',
                calculationType: 'PERCENTAGE',
                minAge: 0,
                maxAge: 12,
                value: 0,
                applicationType: 'PER_NIGHT_PER_PERSON',
            });
        }
    }, [editItem, reset, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editItem ? `Modifier – ${editItem.name}` : 'Nouvelle Réduction'}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">
                            Définition Catalogue
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-6">
                        {/* Info Alert */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-700 shadow-sm">
                            <Info className="shrink-0 mt-0.5" size={16} />
                            <p className="text-xs leading-relaxed font-medium">
                                Ces règles conditionnent le moteur de calcul. Assurez-vous de bien cibler le bon comportement (Enfant ou Adulte supplémentaire).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Comportement Métier</label>
                                <select
                                    {...register('systemCode')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                >
                                    <option value="CHILD">Enfant</option>
                                    <option value="EXTRA_ADULT">Adulte Supplémentaire</option>
                                    <option value="CUSTOM">Réduction Standard / Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de la réduction</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Enfant 0-5 ans gratuit..."
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            {/* Conditional Rendering based on systemCode */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {watchSystemCode !== 'CUSTOM' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Position ({watchSystemCode === 'CHILD' ? 'Enfant' : 'Adulte'})
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('paxOrder', { 
                                                    valueAsNumber: true, 
                                                    min: watchSystemCode === 'EXTRA_ADULT' ? 3 : 1 
                                                })}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                                                placeholder={watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3' : 'ex: 1'}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3 pour le 3ème adulte' : 'ex: 1 pour le 1er enfant'}
                                        </p>
                                    </div>
                                )}

                                {watchSystemCode === 'CHILD' && (
                                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge Minimum</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    {...register('minAge', { valueAsNumber: true, min: 0 })}
                                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">ans</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge Maximum</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    {...register('maxAge', { valueAsNumber: true, max: 17 })}
                                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">ans</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Type de calcul</label>
                                    <select
                                        {...register('calculationType')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    >
                                        <option value="PERCENTAGE">Pourcentage (%)</option>
                                        <option value="FIXED">Fixe (€)</option>
                                        <option value="FREE">Gratuit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Mode d'Application</label>
                                    <select
                                        {...register('applicationType')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold cursor-pointer"
                                    >
                                        <option value="PER_NIGHT_PER_PERSON">Par Nuit et Par Personne</option>
                                        <option value="PER_NIGHT_PER_ROOM">Par Chambre et Par Nuit</option>
                                        <option value="FLAT_RATE_PER_STAY">Forfait Unique par Séjour</option>
                                    </select>
                                </div>
                            </div>

                            {watchCalcType !== 'FREE' && (
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Valeur de la réduction ({watchCalcType === 'PERCENTAGE' ? '%' : '€'})
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('value', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                                            {watchCalcType === 'PERCENTAGE' ? '%' : '€'}
                                        </span>
                                    </div>
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
                            {editItem ? 'Enregistrer' : 'Créer la réduction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
