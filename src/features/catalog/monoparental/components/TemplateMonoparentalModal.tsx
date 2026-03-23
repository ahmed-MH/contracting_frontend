import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User, Users } from 'lucide-react';
import { 
    type TemplateMonoparentalRule, 
    type CreateTemplateMonoparentalRulePayload,
    type BaseRateType,
    type ChildSurchargeBase
} from '../../../../types';

interface TemplateMonoparentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateMonoparentalRule | null;
    onSubmit: (data: CreateTemplateMonoparentalRulePayload) => void;
    isPending: boolean;
}

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

export default function TemplateMonoparentalModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: TemplateMonoparentalModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isDirty },
    } = useForm<CreateTemplateMonoparentalRulePayload>({
        defaultValues: {
            name: '',
            adultCount: 1,
            childCount: 1,
            minAge: 0,
            maxAge: 11,
            baseRateType: 'DOUBLE',
            childSurchargeBase: 'HALF_DOUBLE',
            childSurchargePercentage: 50,
        },
    });

    const adultCount = watch('adultCount');
    const childCount = watch('childCount');
    const minAge = watch('minAge');
    const maxAge = watch('maxAge');
    const baseRateType = watch('baseRateType');
    const childSurchargeBase = watch('childSurchargeBase');
    const childSurchargePercentage = watch('childSurchargePercentage') ?? 0;

    // Auto-generate name from adultCount + childCount
    useEffect(() => {
        const name = `${adultCount} Adulte${adultCount > 1 ? 's' : ''} + ${childCount} Enfant${childCount > 1 ? 's' : ''}`;
        setValue('name', name);
    }, [adultCount, childCount, setValue]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                adultCount: editItem.adultCount,
                childCount: editItem.childCount,
                minAge: editItem.minAge,
                maxAge: editItem.maxAge,
                baseRateType: editItem.baseRateType,
                childSurchargeBase: editItem.childSurchargeBase as ChildSurchargeBase,
                childSurchargePercentage: Number(editItem.childSurchargePercentage) || 0,
            });
        } else {
            reset({
                name: '1 Adulte + 1 Enfant',
                adultCount: 1,
                childCount: 1,
                minAge: 0,
                maxAge: 11,
                baseRateType: 'DOUBLE',
                childSurchargeBase: 'HALF_DOUBLE',
                childSurchargePercentage: 50,
            });
        }
    }, [editItem, reset, isOpen]);

    if (!isOpen) return null;

    const Stepper = ({ value, onChange, min, max }: { value: number, onChange: (v: number) => void, min: number, max?: number }) => (
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white w-full h-10 shadow-sm">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 border-r border-gray-200 transition-colors focus:outline-none cursor-pointer font-bold"
            >
                -
            </button>
            <div className="flex-1 text-center text-sm font-bold text-gray-900">{value}</div>
            <button
                type="button"
                onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 border-l border-gray-200 transition-colors focus:outline-none cursor-pointer font-bold"
            >
                +
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editItem ? `Modifier – ${editItem.name}` : 'Nouvelle Règle Monoparentale'}
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
                        {/* Summary Card */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 text-indigo-700 shadow-sm">
                            <div className="bg-white p-2.5 rounded-lg shadow-sm h-fit">
                                <Users size={20} className="text-indigo-600" />
                            </div>
                            <div className="text-xs leading-relaxed">
                                <span className="block font-bold text-sm mb-1 uppercase tracking-tight">Résumé de la règle :</span>
                                Si la chambre contient <span className="font-bold underline">{adultCount} Adulte{adultCount > 1 ? 's' : ''}</span> et <span className="font-bold underline">{childCount} Enfant{childCount > 1 ? 's' : ''}</span> (de {minAge} à {maxAge} ans), le prix sera : base <span className="font-bold">{BASE_RATE_LABELS[baseRateType]}</span>
                                {childSurchargePercentage > 0 ? (
                                    <> + <span className="font-bold">{childSurchargePercentage}%</span> de la <span className="font-bold">{CHILD_SURCHARGE_BASE_LABELS[childSurchargeBase]}</span>.</>
                                ) : (
                                    <> (Enfant gratuit).</>
                                )}
                            </div>
                        </div>

                        {/* Section A */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">1. Condition d'application</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Adultes</label>
                                    <Stepper
                                        value={adultCount}
                                        onChange={(v) => setValue('adultCount', v, { shouldDirty: true })}
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Enfants</label>
                                    <Stepper
                                        value={childCount}
                                        onChange={(v) => setValue('childCount', v, { shouldDirty: true })}
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge min</label>
                                    <Stepper
                                        value={minAge}
                                        onChange={(v) => setValue('minAge', v, { shouldDirty: true })}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge max</label>
                                    <Stepper
                                        value={maxAge}
                                        onChange={(v) => setValue('maxAge', v, { shouldDirty: true })}
                                        min={0}
                                        max={17}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section B */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">2. Formule de tarification</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Base tarifaire adulte</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <User size={16} />
                                        </div>
                                        <select
                                            {...register('baseRateType')}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="SINGLE">Chambre Single</option>
                                            <option value="DOUBLE">Chambre Double</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Majoration enfant (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('childSurchargePercentage', { valueAsNumber: true, min: 0, max: 200 })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                                placeholder="50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Base de calcul majoration</label>
                                        <select
                                            {...register('childSurchargeBase')}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold cursor-pointer appearance-none"
                                        >
                                            <option value="SINGLE">Chambre Single</option>
                                            <option value="DOUBLE">Chambre Double (Entière)</option>
                                            <option value="HALF_SINGLE">Demi-Single (50%)</option>
                                            <option value="HALF_DOUBLE">Demi-Double (50%)</option>
                                        </select>
                                    </div>
                                </div>
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
                            {editItem ? 'Enregistrer' : 'Créer la règle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
