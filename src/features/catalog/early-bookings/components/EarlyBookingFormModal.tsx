import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../../../components/ui/Modal';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';

interface EarlyBookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: TemplateEarlyBooking | null;
    onSubmit: (data: CreateTemplateEarlyBookingPayload) => void;
    isPending: boolean;
}

export default function EarlyBookingFormModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isPending
}: EarlyBookingFormModalProps) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateTemplateEarlyBookingPayload>({
        defaultValues: {
            name: '',
            value: 10,
            calculationType: 'PERCENTAGE',
            releaseDays: 60,
            bookingWindowStart: '',
            bookingWindowEnd: '',
            stayWindowStart: '',
            stayWindowEnd: '',
            isPrepaid: false,
            prepaymentPercentage: 0,
            prepaymentDeadlineDate: '',
            roomingListDeadlineDate: '',
        },
    });

    const isPrepaid = watch('isPrepaid');
    const calculationType = watch('calculationType');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    value: initialData.value,
                    calculationType: initialData.calculationType,
                    releaseDays: initialData.releaseDays,
                    bookingWindowStart: initialData.bookingWindowStart || '',
                    bookingWindowEnd: initialData.bookingWindowEnd || '',
                    stayWindowStart: initialData.stayWindowStart || '',
                    stayWindowEnd: initialData.stayWindowEnd || '',
                    isPrepaid: initialData.isPrepaid,
                    prepaymentPercentage: initialData.prepaymentPercentage || 0,
                    prepaymentDeadlineDate: initialData.prepaymentDeadlineDate || '',
                    roomingListDeadlineDate: initialData.roomingListDeadlineDate || '',
                });
            } else {
                reset({
                    name: '',
                    value: 10,
                    calculationType: 'PERCENTAGE',
                    releaseDays: 60,
                    bookingWindowStart: '',
                    bookingWindowEnd: '',
                    stayWindowStart: '',
                    stayWindowEnd: '',
                    isPrepaid: false,
                    prepaymentPercentage: 0,
                    prepaymentDeadlineDate: '',
                    roomingListDeadlineDate: '',
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const handleFormSubmit = (data: CreateTemplateEarlyBookingPayload) => {
        const payload = { ...data };
        payload.bookingWindowStart = payload.bookingWindowStart || null;
        payload.bookingWindowEnd = payload.bookingWindowEnd || null;
        payload.stayWindowStart = payload.stayWindowStart || null;
        payload.stayWindowEnd = payload.stayWindowEnd || null;
        if (!payload.isPrepaid) {
            payload.prepaymentPercentage = null;
            payload.prepaymentDeadlineDate = null;
            payload.roomingListDeadlineDate = null;
        } else {
            payload.prepaymentDeadlineDate = payload.prepaymentDeadlineDate || null;
            payload.roomingListDeadlineDate = payload.roomingListDeadlineDate || null;
        }
        onSubmit(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? `Modifier – ${initialData.name}` : "Nouvel Early Booking"}
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'offre</label>
                    <input
                        type="text"
                        {...register('name', { required: 'Le nom est requis' })}
                        placeholder="Ex: Early Booking Hiver -15%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de Calcul</label>
                        <select
                            {...register('calculationType')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                            <option value="PERCENTAGE">Pourcentage (%)</option>
                            <option value="FIXED">Montant Fixe (TND)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valeur {calculationType === 'PERCENTAGE' ? '(%)' : '(Fixe)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('value', { required: true, valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 whitespace-nowrap">Release (Jours avant arrivée)</label>
                        <input
                            type="number"
                            min="0"
                            {...register('releaseDays', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1 text-xs">Réservation Du (Booking)</label>
                        <input
                            type="date"
                            {...register('bookingWindowStart')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1 text-xs">Réservation Au</label>
                        <input
                            type="date"
                            {...register('bookingWindowEnd')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1 text-xs">Séjour Du (Stay)</label>
                        <input
                            type="date"
                            {...register('stayWindowStart')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1 text-xs">Séjour Au</label>
                        <input
                            type="date"
                            {...register('stayWindowEnd')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center mb-2 mt-2">
                        <input
                            type="checkbox"
                            id="isPrepaid"
                            {...register('isPrepaid')}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="isPrepaid" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                            L'hôtel exige un prépaiement
                        </label>
                    </div>

                    {isPrepaid && (
                        <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">% Prépaiement</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...register('prepaymentPercentage', { valueAsNumber: true })}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">DL Prépaiement</label>
                                <input
                                    type="date"
                                    {...register('prepaymentDeadlineDate')}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">DL Rooming List</label>
                                <input
                                    type="date"
                                    {...register('roomingListDeadlineDate')}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-100">
                        {isPending ? (initialData ? 'Mise à jour...' : 'Création...') : (initialData ? 'Enregistrer les modifications' : 'Créer le Template')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
