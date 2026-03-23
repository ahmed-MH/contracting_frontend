import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import {
    type TemplateSupplement,
    type CreateTemplateSupplementPayload
} from '../hooks/useTemplateSupplements';

interface TemplateSupplementModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateSupplement | null;
    onSubmit: (data: CreateTemplateSupplementPayload) => void;
    isPending: boolean;
}

export default function TemplateSupplementModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: TemplateSupplementModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CreateTemplateSupplementPayload>({
        defaultValues: {
            name: '',
            systemCode: 'CUSTOM',
            type: 'FIXED',
            value: 0,
            formula: '',
            isMandatory: false,
            applicationType: 'PER_NIGHT_PER_ROOM',
            specificDate: '',
            minAge: 0,
            maxAge: 99,
        },
    });

    const watchType = watch('type');
    const watchSystemCode = watch('systemCode');

    // Clean up fields when switching systemCode
    useEffect(() => {
        if (watchSystemCode === 'SINGLE_OCCUPANCY' || watchSystemCode === 'CUSTOM') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
        }
    }, [watchSystemCode, setValue]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                systemCode: editItem.systemCode || 'CUSTOM',
                type: editItem.type,
                value: editItem.value ?? 0,
                formula: editItem.formula ?? '',
                isMandatory: editItem.isMandatory || false,
                applicationType: editItem.applicationType,
                specificDate: editItem.specificDate ?? '',
                minAge: editItem.minAge ?? 0,
                maxAge: editItem.maxAge ?? 99,
            });
        } else {
            reset({
                name: '',
                systemCode: 'CUSTOM',
                type: 'FIXED',
                value: 0,
                formula: '',
                isMandatory: false,
                applicationType: 'PER_NIGHT_PER_ROOM',
                specificDate: '',
                minAge: 0,
                maxAge: 99,
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
                            {editItem ? `Modifier – ${editItem.name}` : 'Nouveau Supplément'}
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
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold">Astuce :</span> Les suppléments du catalogue servent de modèles. Lors de l'import dans un contrat, vous pourrez ajuster leurs prix par période.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Comportement Métier</label>
                                <select
                                    {...register('systemCode')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                >
                                    <option value="CUSTOM">Autre / Standard</option>
                                    <option value="SINGLE_OCCUPANCY">Supplément Single</option>
                                    <option value="GALA_DINNER">Dîner de Gala</option>
                                    <option value="MEAL_PLAN">Supplément de Pension (Repas)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom du supplément</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Dîner de Gala, Lit Bébé..."
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            {/* Conditional Age Range for Gala and Meal Plan */}
                            {(watchSystemCode === 'GALA_DINNER' || watchSystemCode === 'MEAL_PLAN') && (
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
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
                                                {...register('maxAge', { valueAsNumber: true, max: 99 })}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">ans</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Type de calcul</label>
                                    <select
                                        {...register('type')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    >
                                        <option value="FIXED">Fixe (montant)</option>
                                        <option value="PERCENTAGE">Pourcentage</option>
                                        <option value="FORMULA">Formule</option>
                                        <option value="FREE">Gratuit</option>
                                    </select>
                                </div>

                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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

                            {/* Conditional fields based on type */}
                            {(watchType === 'FIXED' || watchType === 'PERCENTAGE') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Valeur par défaut ({watchType === 'PERCENTAGE' ? '%' : '€'})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('value', { valueAsNumber: true })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    />
                                </div>
                            )}

                            {watchType === 'FORMULA' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Formule de calcul</label>
                                    <input
                                        {...register('formula')}
                                        placeholder="ex: SGL = DBL"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-mono font-bold"
                                    />
                                    <p className="mt-1.5 text-[10px] text-gray-400 font-medium italic">Ex: SGL = DBL (le prix single s'aligne sur le double)</p>
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <input
                                    type="checkbox"
                                    id="isMandatory"
                                    {...register('isMandatory')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="isMandatory" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                    Supplément obligatoire par défaut
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    📅 Date de l'évènement <span className="text-[10px] text-gray-400 font-normal lowercase">(optionnel)</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('specificDate')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                />
                                <p className="mt-1.5 text-[10px] text-gray-400 font-medium leading-relaxed">
                                    Si spécifié, ce supplément ne sera disponible que pour les contrats couvrant cette date précise.
                                </p>
                            </div>
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
                            {editItem ? 'Enregistrer' : 'Créer le supplément'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
