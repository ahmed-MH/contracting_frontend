import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Gift, Percent, Moon, Calendar, Wallet, Zap, FileText } from 'lucide-react';
import {
    type TemplateSpo,
    type CreateTemplateSpoPayload
} from '../types/spos.types';
import { useCreateSpoTemplate, useUpdateSpoTemplate } from '../hooks/useSpoTemplates';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createSpoTemplateSchema, type SpoTemplateFormValues } from '../../schemas/catalog.schema';

interface EditSpoTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateSpo | null;
}

export default function EditSpoTemplateModal({ isOpen, onClose, editItem }: EditSpoTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createSpoTemplateSchema(t), [t]);
    const createMutation = useCreateSpoTemplate();
    const updateMutation = useUpdateSpoTemplate();
    const isEditing = !!editItem;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<SpoTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
            applicationType: 'PER_NIGHT_PER_PERSON',
        },
    });

    const watchConditionType = watch('conditionType');
    const watchBenefitType = watch('benefitType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    conditionType: editItem.conditionType,
                    conditionValue: editItem.conditionValue,
                    benefitType: editItem.benefitType,
                    benefitValue: editItem.benefitValue,
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({ name: '', conditionType: 'NONE', benefitType: 'PERCENTAGE_DISCOUNT', applicationType: 'PER_NIGHT_PER_PERSON' });
            }
        }
    }, [isOpen, editItem, reset]);

    const onSubmit = (data: SpoTemplateFormValues) => {
        const payload: CreateTemplateSpoPayload = { ...data };
        if (payload.conditionType === 'NONE' || payload.conditionType === 'HONEYMOONER') {
            delete payload.conditionValue;
        } else {
            payload.conditionValue = Number(payload.conditionValue);
        }
        if (['FREE_ROOM_UPGRADE', 'FREE_BOARD_UPGRADE', 'KIDS_GO_FREE'].includes(payload.benefitType)) {
            delete payload.benefitValue;
        } else {
            payload.benefitValue = Number(payload.benefitValue);
            payload.value = payload.benefitValue;
        }
        if (isEditing) {
            updateMutation.mutate({ id: editItem.id, payload }, { onSuccess: onClose });
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);
    const benefitNeedsValue = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS'].includes(watchBenefitType);
    const isPending = createMutation.isPending || updateMutation.isPending;

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                Annuler
            </button>
            <button form="spo-template-form" type="submit" disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-white text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer">
                {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {isEditing ? 'Mettre à jour' : 'Ajouter au catalogue'}
            </button>
        </>
    );

    return (
        <ModalShell isOpen={isOpen} onClose={onClose}
            title={isEditing ? `Modifier – ${editItem.name}` : 'Nouveau Template SPO'}
            subtitle={t('auto.features.catalog.spos.components.editspotemplatemodal.subtitle.1fab0c9a', { defaultValue: "Règle Promotionnelle Catalogue" })}
            icon={<Gift size={20} />} iconBg="bg-brand-mint/10 dark:bg-brand-mint/5 text-brand-mint"
            footer={footer} maxWidth="max-w-2xl">
            <form id="spo-template-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                {/* Section 1 */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2 flex items-center gap-2">
                        <FileText size={12} /> 1. Identification du Modèle
                    </h4>
                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.spos.components.editspotemplatemodal.1cd0e2c0', { defaultValue: "Nom de l'offre (Public interne)" })}</label>
                        <input {...register('name')}
                            className="w-full px-4 py-3 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-semibold text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                            placeholder={t('auto.features.catalog.spos.components.editspotemplatemodal.placeholder.008d3df6', { defaultValue: "Ex: Spring Promo -10% (Catalogue)" })} />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2 flex items-center gap-2">
                        <Zap size={12} /> 2. Logique de la Règle (Trigger & Benefit)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* SI (Condition) */}
                        <div className="space-y-4 p-5 bg-brand-slate/10 dark:bg-brand-navy/80 rounded-2xl border border-brand-slate/30 dark:border-brand-slate/30 relative">
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-slate/20 text-white text-[10px] font-black rounded-full shadow-sm">{t('auto.features.catalog.spos.components.editspotemplatemodal.4a2293e3', { defaultValue: "SI (CONDITION)" })}</div>
                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-brand-slate dark:text-brand-light/75 uppercase tracking-wider mb-1.5">{t('auto.features.catalog.spos.components.editspotemplatemodal.5683cbd2', { defaultValue: "Déclencheur" })}</label>
                                <select {...register('conditionType')}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-brand-navy border border-brand-slate/30 dark:border-brand-slate/30 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint transition-all cursor-pointer appearance-none shadow-sm text-brand-navy dark:text-brand-light">
                                    <option value="NONE">{t('auto.features.catalog.spos.components.editspotemplatemodal.3aa41669', { defaultValue: "Aucune (Automatique)" })}</option>
                                    <option value="MIN_NIGHTS">{t('auto.features.catalog.spos.components.editspotemplatemodal.8560aa42', { defaultValue: "Nuits minimales" })}</option>
                                    <option value="EARLY_BIRD">{t('auto.features.catalog.spos.components.editspotemplatemodal.9424a69a', { defaultValue: "Réservation anticipée" })}</option>
                                    <option value="LONG_STAY">{t('auto.features.catalog.spos.components.editspotemplatemodal.626606f9', { defaultValue: "Long séjour" })}</option>
                                    <option value="HONEYMOONER">{t('auto.features.catalog.spos.components.editspotemplatemodal.3cfeeb72', { defaultValue: "Voyage de noces" })}</option>
                                </select>
                            </div>
                            {conditionNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <label className="block text-[10px] font-bold text-brand-slate dark:text-brand-light/75 uppercase tracking-wider mb-1.5">
                                        {watchConditionType === 'EARLY_BIRD' ? "Jours d'avance" : 'Seuil (nuits)'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-slate transition-colors">
                                            {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                        </div>
                                        <input type="number" {...register('conditionValue', { valueAsNumber: true })}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-brand-navy border border-brand-slate/30 dark:border-brand-slate/30 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light"
                                            placeholder={t('auto.features.catalog.spos.components.editspotemplatemodal.placeholder.99b01594', { defaultValue: "Val." })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ALORS (Benefit) */}
                        <div className="space-y-4 p-5 bg-brand-mint/5 dark:bg-brand-mint/5 rounded-2xl border border-brand-mint/20 relative">
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-mint text-white text-[10px] font-black rounded-full shadow-sm">{t('auto.features.catalog.spos.components.editspotemplatemodal.49be0fdb', { defaultValue: "ALORS (AVANTAGE)" })}</div>
                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-brand-mint uppercase tracking-wider mb-1.5">{t('auto.features.catalog.spos.components.editspotemplatemodal.57a5b7ff', { defaultValue: "Récompense / Mode" })}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select {...register('benefitType')}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-brand-navy border border-brand-mint/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint transition-all cursor-pointer appearance-none shadow-sm text-brand-navy dark:text-brand-light">
                                        <option value="PERCENTAGE_DISCOUNT">{t('auto.features.catalog.spos.components.editspotemplatemodal.cbe4d27f', { defaultValue: "Réduction %" })}</option>
                                        <option value="FIXED_DISCOUNT">{t('auto.features.catalog.spos.components.editspotemplatemodal.6f6d348c', { defaultValue: "Réduction Fixe" })}</option>
                                        <option value="FREE_NIGHTS">{t('auto.features.catalog.spos.components.editspotemplatemodal.4e2a5c5f', { defaultValue: "Nuits offertes" })}</option>
                                        <option value="FREE_ROOM_UPGRADE">{t('auto.features.catalog.spos.components.editspotemplatemodal.f2fb2ce3', { defaultValue: "Upgrade Chambre" })}</option>
                                        <option value="FREE_BOARD_UPGRADE">{t('auto.features.catalog.spos.components.editspotemplatemodal.b4daaf80', { defaultValue: "Upgrade Pension" })}</option>
                                        <option value="KIDS_GO_FREE">{t('auto.features.catalog.spos.components.editspotemplatemodal.1b9311c5', { defaultValue: "Enfants Gratuits" })}</option>
                                    </select>
                                    <select {...register('applicationType')}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-brand-navy border border-brand-mint/20 rounded-xl text-[10px] text-brand-mint font-bold outline-none focus:ring-2 focus:ring-brand-mint cursor-pointer appearance-none shadow-sm">
                                        <option value="PER_NIGHT_PER_PERSON">{t('auto.features.catalog.spos.components.editspotemplatemodal.58bbb40f', { defaultValue: "Par Nuit et Personne" })}</option>
                                        <option value="PER_NIGHT_PER_ROOM">{t('auto.features.catalog.spos.components.editspotemplatemodal.f63ed76b', { defaultValue: "Par Chambre et Nuit" })}</option>
                                        <option value="FLAT_RATE_PER_STAY">{t('auto.features.catalog.spos.components.editspotemplatemodal.33e21f25', { defaultValue: "Forfait / Séjour" })}</option>
                                    </select>
                                </div>
                            </div>
                            {benefitNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <label className="block text-[10px] font-bold text-brand-mint uppercase tracking-wider mb-1.5">{t('auto.features.catalog.spos.components.editspotemplatemodal.78a59193', { defaultValue: "Valeur" })}</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-mint/60 group-focus-within:text-brand-mint transition-colors">
                                            {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> :
                                                watchBenefitType === 'FREE_NIGHTS' ? <Moon size={16} /> : <Wallet size={16} />}
                                        </div>
                                        <input type="number" step="0.01" {...register('benefitValue', { valueAsNumber: true })}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-brand-navy border border-brand-mint/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light"
                                            placeholder={t('auto.features.catalog.spos.components.editspotemplatemodal.placeholder.99b01594', { defaultValue: "Val." })} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
