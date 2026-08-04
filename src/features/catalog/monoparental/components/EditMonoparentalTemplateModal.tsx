import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, User, Users } from 'lucide-react';
import { 
    type TemplateMonoparentalRule, 
    type CreateTemplateMonoparentalRulePayload,
    type BaseRateType,
    type ChildSurchargeBase
} from '../../../../types';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createMonoparentalTemplateSchema, type MonoparentalTemplateFormValues } from '../../schemas/catalog.schema';

interface EditMonoparentalTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateMonoparentalRule | null;
    onSubmit: (data: CreateTemplateMonoparentalRulePayload) => void;
    isPending: boolean;
}

export default function EditMonoparentalTemplateModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: EditMonoparentalTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createMonoparentalTemplateSchema(t), [t]);
    const baseRateLabels: Record<BaseRateType, string> = {
        SINGLE: t('pages.catalog.labels.baseRate.single'),
        DOUBLE: t('pages.catalog.labels.baseRate.double'),
    };
    const childSurchargeBaseLabels: Record<ChildSurchargeBase, string> = {
        SINGLE: t('pages.catalog.labels.surchargeBase.single'),
        DOUBLE: t('pages.catalog.labels.surchargeBase.double'),
        HALF_SINGLE: t('pages.catalog.labels.surchargeBase.halfSingle'),
        HALF_DOUBLE: t('pages.catalog.labels.surchargeBase.halfDouble'),
    };
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isDirty },
    } = useForm<MonoparentalTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            adultCount: 1,
            childCount: 1,
            minAge: 0,
            maxAge: 11,
            baseRateType: 'DOUBLE',
            childSurchargeBase: 'HALF_DOUBLE',
            childSurchargePercentage: 50,
        },
    });

    const adultCount = watch('adultCount');
    const childCount = watch('childCount');
    const minAge = watch('minAge');
    const maxAge = watch('maxAge');
    const baseRateType = watch('baseRateType');
    const childSurchargeBase = watch('childSurchargeBase');
    const childSurchargePercentage = watch('childSurchargePercentage') ?? 0;

    useEffect(() => {
        const adultLabel = t(`pages.catalog.modal.monoparental.modal.${adultCount > 1 ? 'adultPlural' : 'adultSingular'}`);
        const childLabel = t(`pages.catalog.modal.monoparental.modal.${childCount > 1 ? 'childPlural' : 'childSingular'}`);
        const name = `${adultCount} ${adultLabel} + ${childCount} ${childLabel}`;
        setValue('name', name);
    }, [adultCount, childCount, setValue, t]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                adultCount: editItem.adultCount,
                childCount: editItem.childCount,
                minAge: editItem.minAge,
                maxAge: editItem.maxAge,
                baseRateType: editItem.baseRateType,
                childSurchargeBase: editItem.childSurchargeBase as ChildSurchargeBase,
                childSurchargePercentage: Number(editItem.childSurchargePercentage) || 0,
            });
        } else {
            reset({
                name: t('pages.catalog.modal.monoparental.modal.defaultName'),
                adultCount: 1,
                childCount: 1,
                minAge: 0,
                maxAge: 11,
                baseRateType: 'DOUBLE',
                childSurchargeBase: 'HALF_DOUBLE',
                childSurchargePercentage: 50,
            });
        }
    }, [editItem, reset, isOpen, t]);

    const Stepper = ({ value, onChange, min, max }: { value: number, onChange: (v: number) => void, min: number, max?: number }) => (
        <div className="flex items-center border border-brand-slate/20 rounded-xl overflow-hidden bg-brand-light dark:bg-brand-navy w-full h-10 shadow-sm">
            <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-brand-light dark:bg-brand-slate/10 hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 text-brand-slate border-r border-brand-slate/20 transition-colors focus:outline-none cursor-pointer font-bold">
                -
            </button>
            <div className="flex-1 text-center text-sm font-bold text-brand-navy dark:text-brand-light">{value}</div>
            <button type="button" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-brand-light dark:bg-brand-slate/10 hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 text-brand-slate border-l border-brand-slate/20 transition-colors focus:outline-none cursor-pointer font-bold">
                +
            </button>
        </div>
    );

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                {t('pages.catalog.modal.common.cancel')}
            </button>
            <button
                form="monoparental-template-form"
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-brand-light text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {editItem ? t('pages.catalog.modal.common.save') : t('pages.catalog.modal.monoparental.modal.create')}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editItem ? t('pages.catalog.modal.monoparental.modal.editTitle', { name: editItem.name }) : t('pages.catalog.modal.monoparental.modal.createTitle')}
            subtitle={t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.subtitle.f2e2ab54', { defaultValue: "Définition Catalogue" })}
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <form id="monoparental-template-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Summary Card */}
                <div className="bg-brand-mint/10 dark:bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-4 text-brand-navy dark:text-brand-light shadow-sm">
                    <div className="bg-brand-light dark:bg-brand-navy p-2.5 rounded-xl shadow-sm h-fit">
                        <Users size={20} className="text-brand-mint" />
                    </div>
                    <div className="text-xs leading-relaxed">
                        <span className="block font-bold text-sm mb-1 uppercase tracking-tight">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.c777c589', { defaultValue: "Résumé de la règle :" })}</span>
                        <span className="block">
                            {t('pages.catalog.modal.monoparental.modal.summary', {
                                adults: adultCount,
                                children: childCount,
                                minAge,
                                maxAge,
                                base: baseRateLabels[baseRateType],
                            })}
                        </span>
                        {childSurchargePercentage > 0 ? (
                            <span className="block mt-1 font-medium">
                                {t('pages.catalog.modal.monoparental.modal.surcharge', {
                                    value: childSurchargePercentage,
                                    base: childSurchargeBaseLabels[childSurchargeBase],
                                })}
                            </span>
                        ) : (
                            <> {t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.8754f5fe', { defaultValue: "(Enfant gratuit)." })}</>
                        )}
                    </div>
                </div>

                {/* Section A */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.e2352df7', { defaultValue: "1. Condition d'application" })}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.83818f25', { defaultValue: "Adultes" })}</label>
                            <Stepper value={adultCount} onChange={(v) => setValue('adultCount', v, { shouldDirty: true })} min={1} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.3c6ee437', { defaultValue: "Enfants" })}</label>
                            <Stepper value={childCount} onChange={(v) => setValue('childCount', v, { shouldDirty: true })} min={1} />
                        </div>
                        <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.19ec857f', { defaultValue: "Age min" })}</label>
                            <Stepper value={minAge} onChange={(v) => setValue('minAge', v, { shouldDirty: true })} min={0} />
                        </div>
                        <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.445d75ea', { defaultValue: "Age max" })}</label>
                            <Stepper value={maxAge} onChange={(v) => setValue('maxAge', v, { shouldDirty: true })} min={0} max={17} />
                        </div>
                    </div>
                </div>

                {/* Section B */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.b812e113', { defaultValue: "2. Formule de tarification" })}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.b581fc35', { defaultValue: "Base tarifaire adulte" })}</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors">
                                    <User size={16} />
                                </div>
                                <select {...register('baseRateType')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold appearance-none cursor-pointer text-brand-navy dark:text-brand-light">
                                    <option value="SINGLE">{t('pages.catalog.labels.surchargeBase.single')}</option>
                                    <option value="DOUBLE">{t('pages.catalog.labels.surchargeBase.double')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.f8c668e9', { defaultValue: "Majoration enfant (%)" })}</label>
                                <div className="relative">
                                    <input type="number" {...register('childSurchargePercentage', { valueAsNumber: true, min: 0, max: 200 })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light"
                                        placeholder="50" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-slate uppercase">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.monoparental.components.editmonoparentaltemplatemodal.a53562c2', { defaultValue: "Base de calcul majoration" })}</label>
                                <select {...register('childSurchargeBase')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold cursor-pointer appearance-none text-brand-navy dark:text-brand-light">
                                    <option value="SINGLE">{t('pages.catalog.labels.surchargeBase.single')}</option>
                                    <option value="DOUBLE">{t('pages.catalog.labels.surchargeBase.double')}</option>
                                    <option value="HALF_SINGLE">{t('pages.catalog.labels.surchargeBase.halfSingle')}</option>
                                    <option value="HALF_DOUBLE">{t('pages.catalog.labels.surchargeBase.halfDouble')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
