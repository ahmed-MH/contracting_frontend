import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    type ContractSpo,
    type CreateContractSpoPayload,
    type UpdateContractSpoPayload
} from '../../../catalog/spos/types/spos.types';
import type { Contract } from '../../types/contract.types';
import { useCreateContractSpo, useUpdateContractSpo } from '../../hooks/useContractSpos';
import { useArrangements } from '../../../arrangements/hooks/useArrangements';
import type { Arrangement } from '../../../arrangements/types/arrangement.types';
import { X, Save, FileText, Percent, Moon, Calendar, Wallet, Target } from 'lucide-react';

interface ContractSpoModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract;
    editItem?: ContractSpo | null;
}

export default function ContractSpoModal({ isOpen, onClose, contract, editItem }: ContractSpoModalProps) {
    const createMutation = useCreateContractSpo(contract.id);
    const updateMutation = useUpdateContractSpo(contract.id);
    const { data: arrangements = [] } = useArrangements();
    const isEditing = !!editItem;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateContractSpoPayload>({
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
            value: 0,
            stayNights: 0,
            payNights: 0,
            contractRoomIds: [],
            arrangementIds: [],
            applicationType: 'PER_NIGHT_PER_PERSON',
        }
    });

    const watchConditionType = watch('conditionType');
    const watchBenefitType = watch('benefitType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                const isDiscount = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(editItem.benefitType);
                const initialValue = (editItem.value && Number(editItem.value) !== 0) ? editItem.value : (isDiscount ? editItem.benefitValue : editItem.value);

                reset({
                    name: editItem.name,
                    conditionType: editItem.conditionType,
                    conditionValue: editItem.conditionValue,
                    benefitType: editItem.benefitType,
                    benefitValue: editItem.benefitValue,
                    value: initialValue ?? 0,
                    stayNights: editItem.stayNights,
                    payNights: editItem.payNights,
                    contractRoomIds: editItem.applicableContractRooms?.map(r => r.contractRoom.id) || [],
                    arrangementIds: editItem.applicableArrangements?.map(a => a.arrangement.id) || [],
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({
                    name: '',
                    conditionType: 'NONE',
                    benefitType: 'PERCENTAGE_DISCOUNT',
                    value: 0,
                    stayNights: 0,
                    payNights: 0,
                    contractRoomIds: [],
                    arrangementIds: [],
                    applicationType: 'PER_NIGHT_PER_PERSON',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    const onSubmit = (data: CreateContractSpoPayload) => {
        const payload = { ...data };

        // Clean values based on Engine Type
        if (['NONE', 'HONEYMOONER'].includes(payload.conditionType)) {
            payload.conditionValue = undefined;
        } else {
            payload.conditionValue = Number(payload.conditionValue);
        }

        // Clean targeting: map purely to number[]
        payload.contractRoomIds = payload.contractRoomIds.map(Number);
        payload.arrangementIds = payload.arrangementIds.map(Number);
        payload.applicationType = data.applicationType;

        if (isEditing) {
            updateMutation.mutate(
                { id: editItem.id, payload: payload as UpdateContractSpoPayload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ─── Header ────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Modifier l\'offre spéciale' : 'Nouvelle offre spéciale (SPO)'}</h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Configuration de base · Coquille</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 flex flex-col">
                    <div className="p-6 space-y-6 flex-1">
                        {/* Info Alert */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-700 shadow-sm">
                            <div className="bg-indigo-600 p-1.5 rounded-lg h-fit text-white">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold">Architecture Matrice :</span> L'activation par période et les surcharges se gèrent directement dans la <span className="text-indigo-900 font-bold">Grille SPO</span>. Cette modale définit la "Coquille" globale.
                            </p>
                        </div>

                        {/* Info de base */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <label className="text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                                <FileText size={16} className="text-gray-400" /> Nom de l'offre
                            </label>
                            <input
                                {...register('name', { required: 'Le nom est requis' })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Moteur de Règles */}
                        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Target size={16} className="text-indigo-500" /> Configuration de l'Offre
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Condition SI */}
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <h4 className="font-bold text-amber-900 text-xs mb-3 flex items-center gap-2 uppercase tracking-tight">
                                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">SI</span> Condition
                                    </h4>
                                    <select
                                        {...register('conditionType')}
                                        className="w-full mb-3 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                                    >
                                        <option value="NONE">- Aucune -</option>
                                        <option value="MIN_NIGHTS">Nuits minimales</option>
                                        <option value="EARLY_BIRD">Early Bird (Advance booking)</option>
                                        <option value="LONG_STAY">Long Stay</option>
                                        <option value="HONEYMOONER">Honeymooner</option>
                                    </select>

                                    {conditionNeedsValue && (
                                        <div className="relative animate-in fade-in">
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder={watchConditionType === 'EARLY_BIRD' ? 'Jours d\'avance' : 'Nuits'}
                                                {...register('conditionValue', { required: conditionNeedsValue, valueAsNumber: true })}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                                                {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Avantage ALORS */}
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                    <h4 className="font-bold text-indigo-900 text-xs mb-3 flex items-center gap-2 uppercase tracking-tight">
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">ALORS</span> Avantage
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                            <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5 text-center">Récompense / Mode</label>
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    {...register('benefitType')}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="PERCENTAGE_DISCOUNT">Réduction (%)</option>
                                                    <option value="FIXED_DISCOUNT">Réduction (Fixe)</option>
                                                    <option value="FREE_NIGHTS">Nuits gratuites</option>
                                                    <option value="FREE_ROOM_UPGRADE">Up-grade Chambre</option>
                                                    <option value="FREE_BOARD_UPGRADE">Up-grade Pension</option>
                                                    <option value="KIDS_GO_FREE">Kids Go Free</option>
                                                </select>
                                                <select
                                                    {...register('applicationType')}
                                                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-indigo-700 transition-colors cursor-pointer outline-none"
                                                >
                                                    <option value="PER_NIGHT_PER_PERSON">Par Nuit & Pers.</option>
                                                    <option value="PER_NIGHT_PER_ROOM">Par Chambre & Nuit</option>
                                                    <option value="FLAT_RATE_PER_STAY">Forfait / Séjour</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center">
                                            {['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(watchBenefitType) && (
                                                <div className="relative animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Valeur base"
                                                        {...register('value', { required: true, valueAsNumber: true })}
                                                        className="w-full pl-9 pr-3 py-3 bg-white border-2 border-indigo-500 rounded-xl text-sm font-black text-indigo-700 focus:ring-4 focus:ring-indigo-100 outline-none shadow-lg"
                                                    />
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-500">
                                                        {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> : <Wallet size={16} />}
                                                    </div>
                                                </div>
                                            )}

                                            {watchBenefitType === 'FREE_NIGHTS' && (
                                                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Stay"
                                                            {...register('stayNights', { required: true, valueAsNumber: true })}
                                                            className="w-full pl-2 pr-2 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Pay"
                                                            {...register('payNights', { required: true, valueAsNumber: true })}
                                                            className="w-full pl-2 pr-2 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ciblage (Targeting) */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden p-5 bg-white shadow-sm">
                            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={14} className="text-gray-400" /> Ciblage des Chambres & Pensions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Rooms */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">🏨 Chambres concernées</label>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                        {contract.contractRooms?.map((r) => (
                                            <label key={r.id} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                                <input
                                                    type="checkbox"
                                                    value={r.id}
                                                    {...register('contractRoomIds')}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <span className="font-mono text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{r.roomType?.code}</span>
                                                <span className="truncate flex-1">{r.roomType?.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Arrangements */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase">🍽️ Pensions validées</label>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                        {arrangements.map((a: Arrangement) => (
                                            <label key={a.id} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                                <input
                                                    type="checkbox"
                                                    value={a.id}
                                                    {...register('arrangementIds')}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <span className="font-mono text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase">{a.code}</span>
                                                <span className="truncate flex-1">{a.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
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
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                            {isEditing ? 'Mettre à jour' : 'Créer l\'offre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

