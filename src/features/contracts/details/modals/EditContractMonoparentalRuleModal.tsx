import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User } from 'lucide-react';
import { useUpdateContractMonoparentalRule } from '../../hooks/useContractMonoparentalRules';
import type {
    ContractMonoparentalRule,
    BaseRateType,
    ChildSurchargeBase,
} from '../../../../types';
import type { Period, ContractRoom } from '../../types/contract.types';

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

interface FormValues {
    name: string;
    adultCount: number;
    childCount: number;
    childSurchargePercentage: number;
    minAge: number;
    maxAge: number;
    baseRateType: BaseRateType;
    childSurchargeBase: ChildSurchargeBase;
    applicableContractRoomIds: number[];
}

interface Props {
    contractId: number;
    rule: ContractMonoparentalRule;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractMonoparentalRuleModal({
    contractId,
    rule,
    isOpen,
    onClose,
    contractRooms,
}: Props) {
    const updateMutation = useUpdateContractMonoparentalRule(contractId);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<FormValues>({
        defaultValues: {
            name: rule.name,
            adultCount: rule.adultCount,
            childCount: rule.childCount,
            childSurchargePercentage: rule.childSurchargePercentage ?? 0,
            minAge: rule.minAge,
            maxAge: rule.maxAge,
            baseRateType: rule.baseRateType,
            childSurchargeBase: rule.childSurchargeBase,
            applicableContractRoomIds: rule.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
        },
    });

    useEffect(() => {
        if (rule) {
            reset({
                name: rule.name,
                adultCount: rule.adultCount,
                childCount: rule.childCount,
                childSurchargePercentage: rule.childSurchargePercentage ?? 0,
                minAge: rule.minAge,
                maxAge: rule.maxAge,
                baseRateType: rule.baseRateType,
                childSurchargeBase: rule.childSurchargeBase,
                applicableContractRoomIds: rule.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
            });
        }
    }, [rule, reset]);

    const selectedRoomIds = watch('applicableContractRoomIds');
    const toggleRoom = (roomId: number) => {
        const current = selectedRoomIds ?? [];
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId];
        setValue('applicableContractRoomIds', next, { shouldDirty: true });
    };

    const adultCount = watch('adultCount');
    const childCount = watch('childCount');
    const minAge = watch('minAge');
    const maxAge = watch('maxAge');
    const baseRateType = watch('baseRateType');
    const childSurchargeBase = watch('childSurchargeBase');
    const childSurchargePercentage = watch('childSurchargePercentage') ?? 0;

    const onSubmit = (data: FormValues) => {
        updateMutation.mutate(
            {
                ruleId: rule.id,
                data: {
                    name: data.name,
                    adultCount: data.adultCount,
                    childCount: data.childCount,
                    childSurchargePercentage: data.childSurchargePercentage,
                    minAge: data.minAge,
                    maxAge: data.maxAge,
                    baseRateType: data.baseRateType,
                    childSurchargeBase: data.childSurchargeBase,
                    applicableContractRoomIds: data.applicableContractRoomIds,
                },
            },
            { onSuccess: onClose },
        );
    };

    const Stepper = ({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max?: number }) => (
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white w-full h-10">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 border-r border-gray-200 transition-colors focus:outline-none font-bold text-lg"
            >
                −
            </button>
            <div className="flex-1 text-center text-sm font-bold text-gray-900">{value}</div>
            <button
                type="button"
                onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 border-l border-gray-200 transition-colors focus:outline-none font-bold text-lg"
            >
                +
            </button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ─── Header ────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Modifier la règle monoparentale</h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Configuration de base · Coquille</p>
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
                                💡 <span className="font-bold">Architecture Matrice :</span> L'activation par période et les surcharges se gèrent directement dans la <span className="text-indigo-900 font-bold">Grille Monoparentale</span> principale.
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de la règle</label>
                            <input
                                {...register('name', { required: 'Le nom est requis' })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                placeholder="ex: 1 Adulte + 2 Enfants"
                            />
                            {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Zone A: Conditions */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Zone A : Condition d'application</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Adultes</label>
                                    <Stepper value={adultCount} onChange={(v) => setValue('adultCount', v, { shouldDirty: true })} min={1} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Enfants</label>
                                    <Stepper value={childCount} onChange={(v) => setValue('childCount', v, { shouldDirty: true })} min={1} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge min.</label>
                                    <Stepper value={minAge} onChange={(v) => setValue('minAge', v, { shouldDirty: true })} min={0} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Âge max.</label>
                                    <Stepper value={maxAge} onChange={(v) => setValue('maxAge', v, { shouldDirty: true })} min={0} max={17} />
                                </div>
                            </div>
                        </div>

                        {/* Zone B: Facturation */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Zone B : Formule de facturation</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Base adulte</label>
                                    <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 rounded-xl shadow-sm">
                                        <User size={16} className="text-gray-400" />
                                        <select {...register('baseRateType')} className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer">
                                            <option value="SINGLE">Single</option>
                                            <option value="DOUBLE">Double</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Majoration enfant (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register('childSurchargePercentage', { valueAsNumber: true, min: 0 })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                            placeholder="50"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">%</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Base de calcul enfant</label>
                                <select
                                    {...register('childSurchargeBase')}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold outline-none cursor-pointer"
                                >
                                    <option value="SINGLE">Chambre Single</option>
                                    <option value="DOUBLE">Chambre Double</option>
                                    <option value="HALF_SINGLE">Demi-Single</option>
                                    <option value="HALF_DOUBLE">Demi-Double</option>
                                </select>
                            </div>
                        </div>

                        {/* Magic Summary */}
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-gray-700 leading-relaxed">
                            💡 Si la chambre contient <span className="font-bold">{adultCount} Adulte{adultCount > 1 ? 's' : ''}</span> et{' '}
                            <span className="font-bold">{childCount} Enfant{childCount > 1 ? 's' : ''}</span> (de {minAge} à {maxAge} ans), le prix sera la base{' '}
                            <span className="font-bold">{BASE_RATE_LABELS[baseRateType]}</span>
                            {childSurchargePercentage > 0 ? (
                                <> + <span className="font-bold">{childSurchargePercentage}%</span> de la <span className="font-bold">{CHILD_SURCHARGE_BASE_LABELS[childSurchargeBase]}</span>.</>
                            ) : (
                                <> (Enfant gratuit).</>
                            )}
                        </div>

                        {/* Room Targeting */}
                        {contractRooms.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">Chambres concernées</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {contractRooms.map((room) => (
                                        <label key={room.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer group has-checked:bg-indigo-50/50 has-checked:border-indigo-200">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoomIds?.includes(room.id) ?? false}
                                                onChange={() => toggleRoom(room.id)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                    {room.roomType?.code}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                                                    {room.roomType?.name}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer ────────────────────────────────────────── */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={updateMutation.isPending || !isDirty}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {updateMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                            Mettre à jour
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
