import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Calendar, Clock, CreditCard, ClipboardList, Zap } from 'lucide-react';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createEarlyBookingTemplateSchema, type EarlyBookingTemplateFormValues } from '../../schemas/catalog.schema';

interface EditEarlyBookingTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateEarlyBooking | null;
    onSubmit: (data: CreateTemplateEarlyBookingPayload) => void;
    isPending: boolean;
}

export default function EditEarlyBookingTemplateModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: EditEarlyBookingTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createEarlyBookingTemplateSchema(t), [t]);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<EarlyBookingTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '', value: 10, calculationType: 'PERCENTAGE', releaseDays: 60,
            bookingWindowStart: '', bookingWindowEnd: '', stayWindowStart: '', stayWindowEnd: '',
            isPrepaid: false, prepaymentPercentage: 0, prepaymentDeadlineDate: '',
            roomingListDeadlineDate: '', applicationType: 'PER_NIGHT_PER_PERSON',
        },
    });

    const isPrepaid = watch('isPrepaid');
    const calculationType = watch('calculationType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name, value: Number(editItem.value) || 0,
                    calculationType: editItem.calculationType, releaseDays: editItem.releaseDays,
                    bookingWindowStart: editItem.bookingWindowStart || '', bookingWindowEnd: editItem.bookingWindowEnd || '',
                    stayWindowStart: editItem.stayWindowStart || '', stayWindowEnd: editItem.stayWindowEnd || '',
                    isPrepaid: editItem.isPrepaid, prepaymentPercentage: editItem.prepaymentPercentage || 0,
                    prepaymentDeadlineDate: editItem.prepaymentDeadlineDate || '',
                    roomingListDeadlineDate: editItem.roomingListDeadlineDate || '',
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({
                    name: '', value: 10, calculationType: 'PERCENTAGE', releaseDays: 60,
                    bookingWindowStart: '', bookingWindowEnd: '', stayWindowStart: '', stayWindowEnd: '',
                    isPrepaid: false, prepaymentPercentage: 0, prepaymentDeadlineDate: '',
                    roomingListDeadlineDate: '', applicationType: 'PER_NIGHT_PER_PERSON',
                });
            }
        }
    }, [isOpen, editItem, reset]);

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

    const inputCls = "w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate";
    const selectCls = "w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold appearance-none cursor-pointer text-brand-navy dark:text-brand-light";
    const labelCls = "block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2";
    const sectionCls = "text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2";

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                Annuler
            </button>
            <button form="early-booking-template-form" type="submit" disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-white text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer">
                {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {editItem ? 'Enregistrer' : 'Créer le Template'}
            </button>
        </>
    );

    return (
        <ModalShell isOpen={isOpen} onClose={onClose}
            title={editItem ? `Modifier – ${editItem.name}` : 'Nouveau Template Early Booking'}
            subtitle={t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.subtitle.8bffd413', { defaultValue: "Définition Catalogue" })} icon={<Zap size={20} />}
            iconBg="bg-brand-mint/10 dark:bg-brand-mint/5 text-brand-mint"
            footer={footer} maxWidth="max-w-2xl">
            <form id="early-booking-template-form" onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
                {/* Section 1 */}
                <div className="space-y-4">
                    <h4 className={sectionCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.7cd965e8', { defaultValue: "1. Informations de base" })}</h4>
                    <div>
                        <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.37f6f144', { defaultValue: "Nom de l'offre" })}</label>
                        <input {...register('name')} className={inputCls} placeholder={t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.placeholder.59aff53a', { defaultValue: "Ex: EB Hiver -15% (Template)" })} />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.8fc14613', { defaultValue: "Type de Calcul" })}</label>
                                <select {...register('calculationType')} className={selectCls}>
                                    <option value="PERCENTAGE">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.6bca1a6f', { defaultValue: "Pourcentage (%)" })}</option>
                                    <option value="FIXED">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.b9afde85', { defaultValue: "Fixe (€)" })}</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.593c91e6', { defaultValue: "Mode" })}</label>
                                <select {...register('applicationType')} className={selectCls}>
                                    <option value="PER_NIGHT_PER_PERSON">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.005af6b3', { defaultValue: "Par Nuit / Pers." })}</option>
                                    <option value="PER_NIGHT_PER_ROOM">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.84aa8373', { defaultValue: "Par Chambre / Nuit" })}</option>
                                    <option value="FLAT_RATE_PER_STAY">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.21fb0166', { defaultValue: "Forfait Séjour" })}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.17abcc92', { defaultValue: "Valeur" })}</label>
                            <div className="relative">
                                <input type="number" step="0.01" {...register('value', { valueAsNumber: true })} className={inputCls} />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-slate">{calculationType === 'PERCENTAGE' ? '%' : '€'}</span>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.fef7500e', { defaultValue: "Release" })}</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors"><Clock size={16} /></div>
                                <input type="number" {...register('releaseDays', { valueAsNumber: true })} className={`${inputCls} pl-10`} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.f9dc7029', { defaultValue: "jours" })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-4">
                    <h4 className={sectionCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.c23f8650', { defaultValue: "2. Périodes de validité" })}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 bg-brand-mint/10 dark:bg-brand-mint/20 rounded-2xl border border-brand-mint/30 dark:border-brand-mint/30 space-y-4">
                            <div className="flex items-center gap-2 text-brand-mint dark:text-brand-light/75 mb-1">
                                <Calendar size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.4c8f9b5b', { defaultValue: "Fenêtre de Réservation" })}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-mint dark:text-brand-light/75 uppercase mb-1">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.6b67ef39', { defaultValue: "Du" })}</label>
                                    <input type="date" {...register('bookingWindowStart')} className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/30 dark:border-brand-mint/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none transition-all text-brand-navy dark:text-brand-light" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-mint dark:text-brand-light/75 uppercase mb-1">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.e21bd01e', { defaultValue: "Au" })}</label>
                                    <input type="date" {...register('bookingWindowEnd')} className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/30 dark:border-brand-mint/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none transition-all text-brand-navy dark:text-brand-light" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-brand-mint/10 dark:bg-brand-mint/20 rounded-2xl border border-brand-mint/30 dark:border-brand-mint/30 space-y-4">
                            <div className="flex items-center gap-2 text-brand-mint dark:text-brand-light/75 mb-1">
                                <Calendar size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.f19b247c', { defaultValue: "Période de Séjour" })}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-mint dark:text-brand-light/75 uppercase mb-1">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.6b67ef39', { defaultValue: "Du" })}</label>
                                    <input type="date" {...register('stayWindowStart')} className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/30 dark:border-brand-mint/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none transition-all text-brand-navy dark:text-brand-light" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-mint dark:text-brand-light/75 uppercase mb-1">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.e21bd01e', { defaultValue: "Au" })}</label>
                                    <input type="date" {...register('stayWindowEnd')} className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/30 dark:border-brand-mint/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none transition-all text-brand-navy dark:text-brand-light" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2">
                        <h4 className={sectionCls}>{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.1a08f8fa', { defaultValue: "3. Prépaiement & Garanties" })}</h4>
                        <div className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" id="isPrepaid" {...register('isPrepaid')}
                                className="w-4 h-4 text-brand-mint rounded-xl border-brand-slate/30 focus:ring-brand-mint transition-all" />
                            <label htmlFor="isPrepaid" className="text-xs font-bold text-brand-mint hover:text-brand-mint/80 cursor-pointer">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.b6f2e9d7', { defaultValue: "Activer l'exigence" })}</label>
                        </div>
                    </div>
                    {isPrepaid ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-4 bg-brand-mint/10 dark:bg-brand-mint/5 rounded-2xl border border-brand-mint/20">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-brand-mint uppercase mb-2"><CreditCard size={14} /> {t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.0ecb9ba0', { defaultValue: "% Prépaiement" })}</label>
                                <input type="number" {...register('prepaymentPercentage', { valueAsNumber: true })}
                                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light" />
                            </div>
                            <div className="p-4 bg-brand-slate/10 dark:bg-brand-navy/80 rounded-2xl border border-brand-slate/30 dark:border-brand-slate/30">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-brand-slate dark:text-brand-light/75 uppercase mb-2"><Clock size={14} /> {t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.bcbe5929', { defaultValue: "Date Limite (Pay)" })}</label>
                                <input type="date" {...register('prepaymentDeadlineDate')}
                                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-slate/30 dark:border-brand-slate/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light" />
                            </div>
                            <div className="p-4 bg-brand-mint/10 dark:bg-brand-mint/20 rounded-2xl border border-brand-mint/30 dark:border-brand-mint/30">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-brand-mint dark:text-brand-light/75 uppercase mb-2"><ClipboardList size={14} /> {t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.7d300fa2', { defaultValue: "Rooming List" })}</label>
                                <input type="date" {...register('roomingListDeadlineDate')}
                                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-mint/30 dark:border-brand-mint/30 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light" />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-brand-light dark:bg-brand-slate/10 border border-dashed border-brand-slate/20 rounded-2xl py-6 text-center">
                            <p className="text-xs text-brand-slate font-medium italic">{t('auto.features.catalog.early.bookings.components.editearlybookingtemplatemodal.4c0e6cc8', { defaultValue: "Aucun prépaiement exigé pour ce template" })}</p>
                        </div>
                    )}
                </div>
            </form>
        </ModalShell>
    );
}
