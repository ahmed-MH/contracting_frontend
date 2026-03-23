import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Info } from 'lucide-react';
import { useUpdateContractReduction } from '../../hooks/useContractReductions';
import type {
    ContractReduction,
    ReductionCalculationType,
    PaxType,
    PricingModifierApplicationType,
    ReductionSystemCode,
} from '../../../../types';
import type { Period, ContractRoom } from '../../types/contract.types';

interface FormValues {
    name: string;
    systemCode: ReductionSystemCode;
    calculationType: ReductionCalculationType;
    value: number;
    paxType: PaxType;
    paxOrder: number | null;
    minAge: number;
    maxAge: number;
    applicableContractRoomIds: number[];
    applicationType: PricingModifierApplicationType;
}

interface Props {
    contractId: number;
    reduction: ContractReduction;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractReductionModal({
    contractId,
    reduction,
    isOpen,
    onClose,
    contractRooms,
}: Props) {
    const updateMutation = useUpdateContractReduction(contractId);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<FormValues>({
        defaultValues: {
            name: reduction.name,
            systemCode: reduction.systemCode || 'CHILD',
            calculationType: reduction.calculationType,
            value: reduction.value ?? 0,
            paxType: reduction.paxType,
            paxOrder: reduction.paxOrder,
            minAge: reduction.minAge,
            maxAge: reduction.maxAge,
            applicableContractRoomIds: reduction.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
            applicationType: reduction.applicationType || 'PER_NIGHT_PER_PERSON',
        },
    });

    const watchSystemCode = watch('systemCode');
    const watchCalcType = watch('calculationType');
    const selectedRoomIds = watch('applicableContractRoomIds');

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
        if (reduction) {
            reset({
                name: reduction.name,
                systemCode: reduction.systemCode || 'CHILD',
                calculationType: reduction.calculationType,
                value: reduction.value ?? 0,
                paxType: reduction.paxType,
                paxOrder: reduction.paxOrder,
                minAge: reduction.minAge,
                maxAge: reduction.maxAge,
                applicableContractRoomIds: reduction.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
                applicationType: reduction.applicationType || 'PER_NIGHT_PER_PERSON',
            });
        }
    }, [reduction, reset]);

    const toggleRoom = (roomId: number) => {
        const current = selectedRoomIds ?? [];
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId];
        setValue('applicableContractRoomIds', next, { shouldDirty: true });
    };

    const onSubmit = (data: FormValues) => {
        updateMutation.mutate(
            {
                reductionId: reduction.id,
                data: {
                    name: data.name,
                    systemCode: data.systemCode,
                    calculationType: data.calculationType,
                    value: data.calculationType === 'FREE' ? undefined : data.value,
                    paxType: data.paxType,
                    paxOrder: data.paxOrder,
                    minAge: data.minAge,
                    maxAge: data.maxAge,
                    applicableContractRoomIds: data.applicableContractRoomIds,
                    applicationType: data.applicationType,
                },
            },
            { onSuccess: onClose },
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ─── Header ────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Modifier la réduction</h3>
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

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de la réduction</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Réduction Enfant Standard"
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
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Ans</span>
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
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Ans</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Types Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Type de Calcul</label>
                                    <select
                                        {...register('calculationType')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold cursor-pointer"
                                    >
                                        <option value="PERCENTAGE">Pourcentage (%)</option>
                                        <option value="FIXED">Fixe (TND)</option>
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

                            {/* Value */}
                            {watchCalcType !== 'FREE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        {watchCalcType === 'PERCENTAGE' ? 'Valeur de Base (%)' : 'Montant de Base'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('value', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                                            {watchCalcType === 'PERCENTAGE' ? '%' : 'TND'}
                                        </span>
                                    </div>
                                </div>
                            )}

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

                            {/* Reminder */}
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
                                <span className="p-1.5 bg-white rounded-lg text-amber-600 shadow-xs ring-1 ring-amber-200">
                                    <Save size={14} />
                                </span>
                                <p className="text-[11px] font-bold text-amber-900 italic">
                                    💡 L'activation par période et les surcharges se gèrent directement dans la Grille.
                                </p>
                            </div>
                        </div>
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
