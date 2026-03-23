import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../../../components/ui/Modal';

interface PeriodFormValues {
    name: string;
    startDate: string;
    endDate: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PeriodFormValues) => void;
    isPending: boolean;
    contractStartDate: string;
    contractEndDate: string;
    existingPeriods: { startDate: string; endDate: string; name: string }[];
    defaultValues?: Partial<PeriodFormValues>;
}

export default function PeriodFormModal({ isOpen, onClose, onSubmit, isPending, contractStartDate, contractEndDate, existingPeriods, defaultValues }: Props) {
    const { register, handleSubmit, reset, getValues, watch, formState: { errors } } = useForm<PeriodFormValues>();

    const currentStartDate = watch('startDate');

    useEffect(() => {
        if (isOpen) {
            reset({
                name: defaultValues?.name || '',
                startDate: defaultValues?.startDate?.substring(0, 10) || '',
                endDate: defaultValues?.endDate?.substring(0, 10) || '',
            });
        }
    }, [isOpen, defaultValues, reset]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFormSubmit = (data: PeriodFormValues) => {
        onSubmit(data);
        reset();
    };

    // --- Dynamic logic for "graying out" (restricting) dates ---
    const isOverlapping = (dateToCheck: string) => {
        const time = new Date(dateToCheck).getTime();
        for (const p of existingPeriods) {
            if (time >= new Date(p.startDate).getTime() && time <= new Date(p.endDate).getTime()) {
                return p.name;
            }
        }
        return null;
    };

    // Fin the earliest period that strictly starts AFTER our currentStartDate
    // This allows us to set the 'max' limit of the endDate input so it physically grays out future taken dates
    const nextPeriod = existingPeriods
        .filter(p => new Date(p.startDate) > new Date(currentStartDate || '1900-01-01'))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    // Compute max allowed End Date natively
    const rawContractEnd = contractEndDate?.substring(0, 10);
    const maxEndLimit = nextPeriod
        ? new Date(new Date(nextPeriod.startDate).getTime() - 86400000).toISOString().substring(0, 10)
        : rawContractEnd;

    // Choose the most restrictive max bound
    const finalMaxEnd = (maxEndLimit < rawContractEnd) ? maxEndLimit : rawContractEnd;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Nouvelle Période">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la période</label>
                    <input
                        type="text"
                        {...register('name', { required: true })}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-100 bg-gray-50 text-gray-600 rounded-lg text-sm shadow-sm outline-none cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Généré automatiquement (ordre croissant).</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                        type="date"
                        {...register('startDate', {
                            required: 'La date de début est requise',
                            validate: (value) => {
                                const overlapName = isOverlapping(value);
                                if (overlapName) return `Cette date est déjà occupée par ${overlapName}`;
                                return true;
                            }
                        })}
                        min={contractStartDate?.substring(0, 10)}
                        max={contractEndDate?.substring(0, 10)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                        type="date"
                        {...register('endDate', {
                            required: 'La date de fin est requise',
                            validate: (value) => {
                                const start = getValues('startDate');
                                if (start && value && new Date(value) <= new Date(start)) {
                                    return 'La date de fin doit être strictement supérieure à la date de début';
                                }
                                const overlapName = isOverlapping(value);
                                if (overlapName) return `Cette date de fin est déjà occupée par ${overlapName}`;
                                return true;
                            }
                        })}
                        min={
                            currentStartDate
                                ? new Date(new Date(currentStartDate).getTime() + 86400000).toISOString().substring(0, 10)
                                : contractStartDate?.substring(0, 10)
                        }
                        max={finalMaxEnd}
                        className={`w-full px-3 py-2 border rounded-lg text-sm shadow-sm focus:ring-2 outline-none ${errors.endDate
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                </div>

                {/* Footer — Golden Standard */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                        {isPending ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
