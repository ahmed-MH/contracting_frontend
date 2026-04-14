import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../../../components/ui/Modal';
import {
    type TemplateSpo,
    type CreateTemplateSpoPayload
} from '../types/spos.types';
import { useCreateSpoTemplate, useUpdateSpoTemplate } from '../hooks/useSpoTemplates';
import { FileText, Percent, Moon, Calendar, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createSpoTemplateSchema, type SpoTemplateFormValues } from '../../schemas/catalog.schema';

interface CreateSpoTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem?: TemplateSpo | null;
}

export default function CreateSpoTemplateModal({ isOpen, onClose, editItem }: CreateSpoTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createSpoTemplateSchema(t), [t]);
    const createMutation = useCreateSpoTemplate();
    const updateMutation = useUpdateSpoTemplate();
    const isEditing = !!editItem;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SpoTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
        }
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
                });
            } else {
                reset({
                    name: '',
                    conditionType: 'NONE',
                    benefitType: 'PERCENTAGE_DISCOUNT',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    const onSubmit = (data: SpoTemplateFormValues) => {
        // Clean up values if type doesn't need them
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
        }

        if (isEditing) {
            updateMutation.mutate(
                { id: editItem.id, payload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);
    const benefitNeedsValue = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS'].includes(watchBenefitType);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Modifier la condition spéciale (SPO)' : 'Créer une offre spéciale (SPO)'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Info de base */}
                <div className="bg-brand-light p-4 rounded-xl border border-brand-slate/20 shadow-md">
                    <label className="block text-sm font-semibold text-brand-navy mb-1.5 flex items-center gap-2">
                        <FileText size={16} className="text-brand-slate" /> Nom de l'offre
                    </label>
                    <input
                        {...register('name')}
                        placeholder={t('auto.features.catalog.spos.components.createspotemplatemodal.placeholder.c88bcead', { defaultValue: "Ex: Spring Promo -10%" })}
                        className="w-full px-3 py-2 border border-brand-slate/20 bg-brand-light dark:bg-brand-slate/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-none"
                    />
                    {errors.name && <p className="text-brand-slate text-xs mt-1.5 font-medium">{errors.name.message}</p>}
                </div>

                {/* Règle Moteur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Colonne SI (Condition) */}
                    <div className="bg-brand-slate/10 p-5 rounded-xl border border-brand-slate/30 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-brand-slate/10 text-brand-slate flex items-center justify-center">
                                <span className="font-bold text-sm">{t('auto.features.catalog.spos.components.createspotemplatemodal.3d0814d8', { defaultValue: "SI" })}</span>
                            </div>
                            <h3 className="font-semibold text-brand-slate text-sm uppercase tracking-wide">{t('auto.features.catalog.spos.components.createspotemplatemodal.3045788f', { defaultValue: "Condition" })}</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-slate mb-1">{t('auto.features.catalog.spos.components.createspotemplatemodal.57987910', { defaultValue: "Type de condition" })}</label>
                                <select
                                    {...register('conditionType')}
                                    className="w-full px-3 py-2 bg-brand-light border border-brand-slate/30 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-slate/30 outline-none text-brand-navy"
                                >
                                    <option value="NONE">{t('auto.features.catalog.spos.components.createspotemplatemodal.2c845701', { defaultValue: "Aucune (Toujours applicable)" })}</option>
                                    <option value="MIN_NIGHTS">{t('auto.features.catalog.spos.components.createspotemplatemodal.514d470e', { defaultValue: "Nuits minimales (Min. Nights)" })}</option>
                                    <option value="EARLY_BIRD">{t('auto.features.catalog.spos.components.createspotemplatemodal.31741767', { defaultValue: "Réservation anticipée (Early Bird)" })}</option>
                                    <option value="LONG_STAY">{t('auto.features.catalog.spos.components.createspotemplatemodal.eca20be2', { defaultValue: "Long séjour (Long Stay)" })}</option>
                                    <option value="HONEYMOONER">{t('auto.features.catalog.spos.components.createspotemplatemodal.06ada156', { defaultValue: "Voyage de noces (Honeymooner)" })}</option>
                                </select>
                            </div>

                            {conditionNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-brand-slate mb-1">
                                        {watchConditionType === 'EARLY_BIRD' ? 'Jours à l\'avance' : 'Nombre de nuits'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register('conditionValue', { valueAsNumber: true })}
                                            className="w-full px-3 py-2 bg-brand-light border border-brand-slate/30 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-slate/30 outline-none text-brand-navy pl-9"
                                            placeholder={t('auto.features.catalog.spos.components.createspotemplatemodal.placeholder.abd39585', { defaultValue: "Ex: 3" })}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-slate">
                                            {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                        </div>
                                    </div>
                                    {errors.conditionValue && <p className="text-brand-slate text-xs mt-1">{errors.conditionValue.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne ALORS (Avantage) */}
                    <div className="bg-brand-mint/5 p-5 rounded-xl border border-brand-mint/20 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-brand-mint/10 text-brand-mint flex items-center justify-center">
                                <span className="font-bold text-sm">{t('auto.features.catalog.spos.components.createspotemplatemodal.f1bbe63b', { defaultValue: "ALORS" })}</span>
                            </div>
                            <h3 className="font-semibold text-brand-navy dark:text-brand-light text-sm uppercase tracking-wide">{t('auto.features.catalog.spos.components.createspotemplatemodal.b518f0e7', { defaultValue: "Avantage" })}</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5">{t('auto.features.catalog.spos.components.createspotemplatemodal.148706f5', { defaultValue: "Type d'avantage" })}</label>
                                <select
                                    {...register('benefitType')}
                                    className="w-full px-3 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light font-bold cursor-pointer"
                                >
                                    <option value="PERCENTAGE_DISCOUNT">{t('auto.features.catalog.spos.components.createspotemplatemodal.7ef6e281', { defaultValue: "Réduction en pourcentage (%)" })}</option>
                                    <option value="FIXED_DISCOUNT">{t('auto.features.catalog.spos.components.createspotemplatemodal.989f7991', { defaultValue: "Réduction fixe" })}</option>
                                    <option value="FREE_NIGHTS">{t('auto.features.catalog.spos.components.createspotemplatemodal.c48d0872', { defaultValue: "Nuits gratuites" })}</option>
                                    <option value="FREE_ROOM_UPGRADE">{t('auto.features.catalog.spos.components.createspotemplatemodal.39242059', { defaultValue: "Surclassement de chambre gratuit" })}</option>
                                    <option value="FREE_BOARD_UPGRADE">{t('auto.features.catalog.spos.components.createspotemplatemodal.8ee99ea8', { defaultValue: "Surclassement de pension gratuit" })}</option>
                                    <option value="KIDS_GO_FREE">{t('auto.features.catalog.spos.components.createspotemplatemodal.9762d88b', { defaultValue: "Enfants gratuits (Kids go free)" })}</option>
                                </select>
                            </div>

                            {benefitNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5">
                                        {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? 'Pourcentage (%)' :
                                            watchBenefitType === 'FREE_NIGHTS' ? 'Nombre de nuits offertes' : 'Montant'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step={watchBenefitType === 'PERCENTAGE_DISCOUNT' ? "1" : "0.01"}
                                            {...register('benefitValue', { valueAsNumber: true })}
                                            className="w-full pl-9 pr-3 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light"
                                            placeholder={watchBenefitType === 'PERCENTAGE_DISCOUNT' ? "Ex: 10" : "Ex: 1"}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-mint">
                                            {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> :
                                                watchBenefitType === 'FREE_NIGHTS' ? <Moon size={16} /> : <Wallet size={16} />}
                                        </div>
                                    </div>
                                    {errors.benefitValue && <p className="text-brand-slate text-xs mt-1">{errors.benefitValue.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-brand-slate/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-brand-slate bg-brand-light dark:bg-brand-slate/10 rounded-xl hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 transition-colors cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-brand-light bg-brand-mint rounded-xl hover:bg-brand-mint/90 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-brand-mint/20"
                    >
                        {isEditing ? 'Enregistrer les modifications' : 'Créer l\'offre'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
