import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../../../components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { createContractPeriodSchema, type ContractPeriodFormValues } from '../schemas/contract-detail.schema';

type PeriodFormValues = ContractPeriodFormValues;

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

export default function CreatePeriodModal({ isOpen, onClose, onSubmit, isPending, contractStartDate, contractEndDate, existingPeriods, defaultValues }: Props) {
    const { t } = useTranslation('common');
    const schema = useMemo(
        () => createContractPeriodSchema(t, existingPeriods, contractStartDate, contractEndDate),
        [contractEndDate, contractStartDate, existingPeriods, t],
    );
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PeriodFormValues>({
        resolver: zodResolver(schema),
    });

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
        <Modal isOpen={isOpen} onClose={handleClose} title={t('auto.features.contracts.details.modals.createperiodmodal.title.4807876c', { defaultValue: "Nouvelle Période" })}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.createperiodmodal.32ba110d', { defaultValue: "Nom de la période" })}</label>
                    <input
                        type="text"
                        {...register('name')}
                        readOnly
                        className="w-full px-3 py-2 border border-brand-slate/10 bg-brand-light dark:bg-brand-slate/10 text-brand-slate rounded-xl text-sm outline-none cursor-not-allowed"
                    />
                    <p className="text-xs text-brand-slate/60 mt-1">{t('auto.features.contracts.details.modals.createperiodmodal.e8af1339', { defaultValue: "Généré automatiquement (ordre croissant)." })}</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.createperiodmodal.68d84d59', { defaultValue: "Date de début" })}</label>
                    <input
                        type="date"
                        {...register('startDate')}
                        min={contractStartDate?.substring(0, 10)}
                        max={contractEndDate?.substring(0, 10)}
                        className="w-full px-3 py-2 border border-brand-slate/20 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none text-brand-navy dark:text-brand-light dark:bg-brand-navy/50 dark:border-brand-slate/30"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.createperiodmodal.ae467c20', { defaultValue: "Date de fin" })}</label>
                    <input
                        type="date"
                        {...register('endDate')}
                        min={
                            currentStartDate
                                ? new Date(new Date(currentStartDate).getTime() + 86400000).toISOString().substring(0, 10)
                                : contractStartDate?.substring(0, 10)
                        }
                        max={finalMaxEnd}
                        className={`w-full px-3 py-2 border rounded-xl text-sm shadow-sm focus:ring-2 outline-none text-brand-navy dark:text-brand-light dark:bg-brand-navy/50 ${errors.endDate
                            ? 'border-brand-slate/30 focus:ring-brand-mint focus:border-brand-slate/30'
                            : 'border-brand-slate/20 focus:ring-brand-mint focus:border-brand-mint'
                            }`}
                    />
                    {errors.startDate && <p className="text-brand-slate text-xs mt-1">{errors.startDate.message}</p>}
                    {errors.endDate && <p className="text-brand-slate text-xs mt-1">{errors.endDate.message}</p>}
                </div>

                <div className="mt-6 pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20 flex justify-end gap-3">
                    <button type="button" onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-brand-slate hover:text-brand-navy dark:hover:text-brand-light bg-brand-slate/10 hover:bg-brand-slate/20 rounded-xl transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-brand-light bg-brand-mint rounded-xl hover:bg-brand-mint/90 transition-colors disabled:opacity-50 cursor-pointer">
                        {isPending ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
