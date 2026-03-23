import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Tag, Calendar, Percent, CreditCard, Clock } from 'lucide-react';
import { useUpdateContractEarlyBooking } from '../../hooks/useContractEarlyBookings';
import type { ContractEarlyBooking, UpdateContractEarlyBookingPayload, PricingModifierApplicationType } from '../../../catalog/early-bookings/types/early-bookings.types';
import type { Period, ContractRoom } from '../../types/contract.types';

interface FormValues {
    name: string;
    calculationType: 'FIXED' | 'PERCENTAGE' | 'FREE';
    value: number;
    releaseDays: number;
    bookingWindowStart: string;
    bookingWindowEnd: string;
    stayWindowStart: string;
    stayWindowEnd: string;
    isPrepaid: boolean;
    prepaymentPercentage: number | undefined;
    prepaymentDeadlineDate: string;
    roomingListDeadlineDate: string;
    applicableContractRoomIds: number[];
    applicationType: PricingModifierApplicationType;
}

interface Props {
    contractId: number;
    eb: ContractEarlyBooking;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractEarlyBookingModal({
    contractId, eb, isOpen, onClose, contractRooms,
}: Props) {
    const updateMutation = useUpdateContractEarlyBooking(contractId);

    const buildDefaults = (src: ContractEarlyBooking): FormValues => ({
        name: src.name,
        calculationType: src.calculationType,
        value: src.value,
        releaseDays: src.releaseDays,
        bookingWindowStart: src.bookingWindowStart || '',
        bookingWindowEnd: src.bookingWindowEnd || '',
        stayWindowStart: src.stayWindowStart || '',
        stayWindowEnd: src.stayWindowEnd || '',
        isPrepaid: src.isPrepaid,
        prepaymentPercentage: src.prepaymentPercentage || undefined,
        prepaymentDeadlineDate: src.prepaymentDeadlineDate || '',
        roomingListDeadlineDate: src.roomingListDeadlineDate || '',
        applicableContractRoomIds: src.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
        applicationType: src.applicationType || 'PER_NIGHT_PER_PERSON',
    });

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<FormValues>({
        defaultValues: buildDefaults(eb),
    });

    useEffect(() => { if (eb) reset(buildDefaults(eb)); }, [eb, reset]);

    const selectedRoomIds = watch('applicableContractRoomIds');
    const toggleRoom = (id: number) => {
        const cur = selectedRoomIds ?? [];
        setValue('applicableContractRoomIds', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], { shouldDirty: true });
    };

    const isPrepaid = watch('isPrepaid');
    const calcType = watch('calculationType');

    const onSubmit = (data: FormValues) => {
        const payload: UpdateContractEarlyBookingPayload = {
            name: data.name,
            calculationType: data.calculationType,
            value: data.value,
            releaseDays: data.releaseDays,
            bookingWindowStart: data.bookingWindowStart || null,
            bookingWindowEnd: data.bookingWindowEnd || null,
            stayWindowStart: data.stayWindowStart || null,
            stayWindowEnd: data.stayWindowEnd || null,
            isPrepaid: data.isPrepaid,
            applicableContractRoomIds: data.applicableContractRoomIds,
            applicationType: data.applicationType,
        };

        if (data.isPrepaid) {
            payload.prepaymentPercentage = data.prepaymentPercentage || null;
            payload.prepaymentDeadlineDate = data.prepaymentDeadlineDate || null;
            payload.roomingListDeadlineDate = data.roomingListDeadlineDate || null;
        } else {
            payload.prepaymentPercentage = null;
            payload.prepaymentDeadlineDate = null;
            payload.roomingListDeadlineDate = null;
        }

        updateMutation.mutate({ ebId: eb.id, data: payload }, { onSuccess: onClose });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ─── Header ────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Modifier l'Early Booking</h3>
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
                                💡 <span className="font-bold">Architecture Matrice :</span> L'activation par période et les surcharges se gèrent directement dans la <span className="text-indigo-900 font-bold">Grille Early Bookings</span>. Cette modale définit les paramètres globaux de la "Coquille".
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                <Tag size={12} className="text-gray-400" /> Nom de l'offre
                            </label>
                            <input
                                type="text"
                                {...register('name', { required: 'Le nom est requis' })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                placeholder="ex: Early Bird 60 Jours"
                            />
                            {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Types & Release Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Calc & App Mode */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <Percent size={12} className="text-gray-400" /> Type & Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        {...register('calculationType')}
                                        className="px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">Fixe</option>
                                    </select>
                                    <select
                                        {...register('applicationType')}
                                        className="px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="PER_NIGHT_PER_PERSON">Par Nuit & Pers.</option>
                                        <option value="PER_NIGHT_PER_ROOM">Par Chambre & Nuit</option>
                                        <option value="FLAT_RATE_PER_STAY">Forfait / Séjour</option>
                                    </select>
                                </div>
                            </div>

                            {/* Release Days */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <Clock size={12} className="text-gray-400" /> Release (jours)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register('releaseDays', { required: true, valueAsNumber: true })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                    placeholder="60"
                                />
                            </div>
                        </div>

                        {/* Value Input (Standalone for clarity) */}
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Montant de la réduction</span>
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('value', { required: true, valueAsNumber: true })}
                                    className="w-full pl-4 pr-10 py-2 bg-white border border-amber-200 rounded-lg text-sm font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500">
                                    {calcType === 'PERCENTAGE' ? '%' : 'TND'}
                                </span>
                            </div>
                        </div>

                        {/* Booking & Stay Windows */}
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Calendar size={12} /> Fenêtres de validité
                                <span className="font-normal normal-case text-gray-400">(optionnel)</span>
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Réservation du</label>
                                        <input type="date" {...register('bookingWindowStart')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Séjour du</label>
                                        <input type="date" {...register('stayWindowStart')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Réservation au</label>
                                        <input type="date" {...register('bookingWindowEnd')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Séjour au</label>
                                        <input type="date" {...register('stayWindowEnd')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prepayment */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={12} /> Conditions de Paiement
                                </p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register('isPrepaid')} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    <span className="ml-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Exiger prépaiement</span>
                                </label>
                            </div>
                            {isPrepaid && (
                                <div className="grid grid-cols-3 gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div>
                                        <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Pourcentage</label>
                                        <input type="number" min="0" max="100" {...register('prepaymentPercentage', { valueAsNumber: true })} className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Limite Prépay.</label>
                                        <input type="date" {...register('prepaymentDeadlineDate')} className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Limite Rooming</label>
                                        <input type="date" {...register('roomingListDeadlineDate')} className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
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
                            Sauvegarder la Coquille
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
