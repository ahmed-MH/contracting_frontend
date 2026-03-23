import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, AlertCircle } from 'lucide-react';
import type { 
    ContractCancellationRule, 
    CreateContractCancellationRulePayload,
    CancellationPenaltyType 
} from '../../../catalog/cancellation/types/cancellation.types';
import type { Contract } from '../../types/contract.types';
import { useCreateContractCancellation, useUpdateContractCancellation } from '../../hooks/useContractCancellation';

interface ContractCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract;
    editItem: ContractCancellationRule | null;
}

export default function ContractCancellationModal({
    isOpen,
    onClose,
    contract,
    editItem,
}: ContractCancellationModalProps) {
    const createMutation = useCreateContractCancellation(contract.id);
    const updateMutation = useUpdateContractCancellation(contract.id);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<CreateContractCancellationRulePayload>({
        defaultValues: {
            name: '',
            daysBeforeArrival: 2,
            appliesToNoShow: true,
            minStayCondition: null,
            penaltyType: 'NIGHTS' as CancellationPenaltyType,
            baseValue: 1,
            contractRoomIds: [],
        },
    });

    const penaltyType = watch('penaltyType');

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                daysBeforeArrival: editItem.daysBeforeArrival,
                appliesToNoShow: editItem.appliesToNoShow,
                minStayCondition: editItem.minStayCondition,
                penaltyType: editItem.penaltyType,
                baseValue: Number(editItem.baseValue),
                contractRoomIds: editItem.applicableRooms?.map(r => r.contractRoomId) || [],
            });
        } else {
            reset({
                name: '',
                daysBeforeArrival: 2,
                appliesToNoShow: true,
                minStayCondition: null,
                penaltyType: 'NIGHTS' as CancellationPenaltyType,
                baseValue: 1,
                contractRoomIds: contract.contractRooms?.map(r => r.id) || [],
            });
        }
    }, [editItem, reset, contract, isOpen]);

    if (!isOpen) return null;

    const onSubmit = (data: CreateContractCancellationRulePayload) => {
        if (editItem) {
            updateMutation.mutate({
                id: editItem.id,
                payload: data
            }, {
                onSuccess: () => onClose()
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: () => onClose()
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editItem ? 'Modifier la politique' : 'Nouvelle politique d\'annulation'}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Configuration de base</p>
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
                                💡 <span className="font-bold">Architecture Matrice :</span> L'activation par période et les pénalités surchargées se gèrent directement dans la <span className="text-indigo-900 font-bold">Grille Annulation</span> principale.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de la règle</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Late Cancel Standard"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Jours avant Arrivée</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        {...register('daysBeforeArrival', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Jours</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Séjour Minimum (Libre)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        {...register('minStayCondition', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold placeholder:font-medium"
                                        placeholder="Non requis"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Nuits</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                            <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm ring-1 ring-indigo-200 mt-0.5">
                                <AlertCircle size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-900">Application No-Show</p>
                                <p className="text-[11px] text-indigo-700/80 mt-1 leading-relaxed">
                                    Si activé, cette règle servira également de base pour les cas de "Non-présentation".
                                </p>
                                <label className="inline-flex items-center gap-2 mt-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register('appliesToNoShow')}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Appliquer aux No-Shows</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Type de Pénalité</label>
                                <select
                                    {...register('penaltyType')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                >
                                    <option value="NIGHTS">Frais en Nuits</option>
                                    <option value="PERCENTAGE">Pourcentage du séjour</option>
                                    <option value="FIXED_AMOUNT">Montant Fixe (Total)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Valeur de Base de Pénalité</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('baseValue', { required: true, valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                                        {penaltyType === 'NIGHTS' ? 'Nuits' : penaltyType === 'PERCENTAGE' ? '%' : '€'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">Chambres concernées</label>
                            <div className="grid grid-cols-2 gap-3">
                                {contract.contractRooms?.map((room) => (
                                    <label key={room.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer group has-checked:bg-indigo-50/50 has-checked:border-indigo-200">
                                        <input
                                            type="checkbox"
                                            value={room.id}
                                            {...register('contractRoomIds')}
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

                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
                            <span className="p-1.5 bg-white rounded-lg text-amber-600 shadow-xs ring-1 ring-amber-200">
                                <Save size={14} />
                            </span>
                            <p className="text-[11px] font-bold text-amber-900 italic">
                                💡 L'activation par période et les surcharges se gèrent directement dans la Grille.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                            {editItem ? 'Mettre à jour' : 'Créer la politique'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
