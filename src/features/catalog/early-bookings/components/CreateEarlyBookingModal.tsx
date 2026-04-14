import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, CreditCard } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';
import { useTranslation } from 'react-i18next';
import { createEarlyBookingTemplateSchema, type EarlyBookingTemplateFormValues } from '../../schemas/catalog.schema';

interface CreateEarlyBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: TemplateEarlyBooking | null;
    onSubmit: (data: CreateTemplateEarlyBookingPayload) => void;
    isPending: boolean;
}

export default function CreateEarlyBookingModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isPending
}: CreateEarlyBookingModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createEarlyBookingTemplateSchema(t), [t]);
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EarlyBookingTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '', value: 10, calculationType: 'PERCENTAGE', releaseDays: 60,
            bookingWindowStart: '', bookingWindowEnd: '', stayWindowStart: '', stayWindowEnd: '',
            isPrepaid: false, prepaymentPercentage: 0, prepaymentDeadlineDate: '', roomingListDeadlineDate: '',
        },
    });

    const isPrepaid = watch('isPrepaid');
    const calculationType = watch('calculationType');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name, value: initialData.value, calculationType: initialData.calculationType,
                    releaseDays: initialData.releaseDays, bookingWindowStart: initialData.bookingWindowStart || '',
                    bookingWindowEnd: initialData.bookingWindowEnd || '', stayWindowStart: initialData.stayWindowStart || '',
                    stayWindowEnd: initialData.stayWindowEnd || '', isPrepaid: initialData.isPrepaid,
                    prepaymentPercentage: initialData.prepaymentPercentage || 0,
                    prepaymentDeadlineDate: initialData.prepaymentDeadlineDate || '',
                    roomingListDeadlineDate: initialData.roomingListDeadlineDate || '',
                });
            } else {
                reset({
                    name: '', value: 10, calculationType: 'PERCENTAGE', releaseDays: 60,
                    bookingWindowStart: '', bookingWindowEnd: '', stayWindowStart: '', stayWindowEnd: '',
                    isPrepaid: false, prepaymentPercentage: 0, prepaymentDeadlineDate: '', roomingListDeadlineDate: '',
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const handleFormSubmit = (data: EarlyBookingTemplateFormValues) => {
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

    const inputCls = "w-full px-3 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none transition-all";
    const labelCls = "block text-sm font-medium text-brand-navy dark:text-brand-light mb-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose}
            title={initialData ? `Modifier – ${initialData.name}` : "Nouvel Early Booking"}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                    <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.deec6f64', { defaultValue: "Nom de l'offre" })}</label>
                    <input type="text" {...register('name')}
                        placeholder={t('auto.features.catalog.early.bookings.components.createearlybookingmodal.placeholder.f673dc04', { defaultValue: "Ex: Early Booking Hiver -15%" })} className={inputCls} />
                    {errors.name && <p className="text-brand-slate text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.a5f22595', { defaultValue: "Type de Calcul" })}</label>
                        <select {...register('calculationType')} className={inputCls}>
                            <option value="PERCENTAGE">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.f7dde2c8', { defaultValue: "Pourcentage (%)" })}</option>
                            <option value="FIXED">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.40c2c3a5', { defaultValue: "Montant Fixe (TND)" })}</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>
                            Valeur {calculationType === 'PERCENTAGE' ? '(%)' : '(Fixe)'}
                        </label>
                        <input type="number" min="0" step="0.01"
                            {...register('value', { valueAsNumber: true })} className={inputCls} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`${labelCls} whitespace-nowrap`}>{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.6acfe11c', { defaultValue: "Release (Jours avant arrivée)" })}</label>
                        <div className="relative group">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors" size={14} />
                            <input type="number" min="0"
                                {...register('releaseDays', { valueAsNumber: true })}
                                className="w-full pl-9 pr-3 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-brand-slate/15 dark:border-brand-slate/20 pt-4">
                    <div>
                        <label className="block font-medium text-brand-navy dark:text-brand-light mb-1 text-xs">
                            <Calendar className="inline-block mr-1" size={11} /> Réservation Du (Booking)
                        </label>
                        <input type="date" {...register('bookingWindowStart')} className={inputCls} />
                    </div>
                    <div>
                        <label className="block font-medium text-brand-navy dark:text-brand-light mb-1 text-xs">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.5065fc57', { defaultValue: "Réservation Au" })}</label>
                        <input type="date" {...register('bookingWindowEnd')} className={inputCls} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4">
                    <div>
                        <label className="block font-medium text-brand-navy dark:text-brand-light mb-1 text-xs">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.183ab80f', { defaultValue: "Séjour Du (Stay)" })}</label>
                        <input type="date" {...register('stayWindowStart')} className={inputCls} />
                    </div>
                    <div>
                        <label className="block font-medium text-brand-navy dark:text-brand-light mb-1 text-xs">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.bbbfa452', { defaultValue: "Séjour Au" })}</label>
                        <input type="date" {...register('stayWindowEnd')} className={inputCls} />
                    </div>
                </div>

                <div className="pt-2 border-t border-brand-slate/15 dark:border-brand-slate/20">
                    <div className="flex items-center mb-2 mt-2">
                        <input type="checkbox" id="isPrepaid" {...register('isPrepaid')}
                            className="w-4 h-4 text-brand-mint rounded border-brand-slate/30 focus:ring-brand-mint" />
                        <label htmlFor="isPrepaid" className="ml-2 block text-sm font-medium text-brand-navy dark:text-brand-light cursor-pointer">
                            L'hôtel exige un prépaiement
                        </label>
                    </div>
                    {isPrepaid && (
                        <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div>
                                <label className="block text-[10px] text-brand-slate mb-1 uppercase font-bold flex items-center gap-1">
                                    <CreditCard size={10} /> % Prépaiement
                                </label>
                                <input type="number" min="0" max="100"
                                    {...register('prepaymentPercentage', { valueAsNumber: true })}
                                    className="w-full px-2 py-1.5 border border-brand-slate/20 bg-brand-light dark:bg-brand-slate/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-brand-slate mb-1 uppercase font-bold">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.cd68cad4', { defaultValue: "DL Prépaiement" })}</label>
                                <input type="date" {...register('prepaymentDeadlineDate')}
                                    className="w-full px-2 py-1.5 border border-brand-slate/20 bg-brand-light dark:bg-brand-slate/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-brand-slate mb-1 uppercase font-bold">{t('auto.features.catalog.early.bookings.components.createearlybookingmodal.902543af', { defaultValue: "DL Rooming List" })}</label>
                                <input type="date" {...register('roomingListDeadlineDate')}
                                    className="w-full px-2 py-1.5 border border-brand-slate/20 bg-brand-light dark:bg-brand-slate/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20 mt-4">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-brand-slate bg-brand-light dark:bg-brand-slate/10 rounded-xl hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-brand-light bg-brand-mint rounded-xl hover:bg-brand-mint/90 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-brand-mint/20">
                        {isPending ? (initialData ? 'Mise à jour...' : 'Création...') : (initialData ? 'Enregistrer les modifications' : 'Créer le Template')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
