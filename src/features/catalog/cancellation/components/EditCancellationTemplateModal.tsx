import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ShieldAlert, Clock, Hash, Percent, Banknote, AlertTriangle } from 'lucide-react';
import { 
    type TemplateCancellationRule, 
    type CreateTemplateCancellationRulePayload 
} from '../hooks/useTemplateCancellations';
import { CancellationPenaltyType } from '../types/cancellation.types';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createCancellationTemplateSchema, type CancellationTemplateFormValues } from '../../schemas/catalog.schema';

interface EditCancellationTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateCancellationRule | null;
    onSubmit: (data: CreateTemplateCancellationRulePayload) => void;
    isPending: boolean;
}

export default function EditCancellationTemplateModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: EditCancellationTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createCancellationTemplateSchema(t), [t]);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<CancellationTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            daysBeforeArrival: 2,
            appliesToNoShow: true,
            minStayCondition: null,
            penaltyType: CancellationPenaltyType.NIGHTS,
            baseValue: 1,
        },
    });

    const watchPenaltyType = watch('penaltyType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    daysBeforeArrival: editItem.daysBeforeArrival,
                    appliesToNoShow: editItem.appliesToNoShow,
                    minStayCondition: editItem.minStayCondition,
                    penaltyType: editItem.penaltyType,
                    baseValue: editItem.baseValue,
                });
            } else {
                reset({
                    name: '',
                    daysBeforeArrival: 2,
                    appliesToNoShow: true,
                    minStayCondition: null,
                    penaltyType: CancellationPenaltyType.NIGHTS,
                    baseValue: 1,
                });
            }
        }
    }, [isOpen, editItem, reset]);

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                Annuler
            </button>
            <button
                form="cancellation-template-form"
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-slate/20 text-white text-sm font-bold rounded-xl hover:bg-brand-slate/20 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {editItem ? 'Enregistrer' : 'Créer le Template'}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editItem ? `Modifier – ${editItem.name}` : 'Nouveau Template Annulation'}
            subtitle={t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.subtitle.5b9996bf', { defaultValue: "Politique de désengagement Catalogue" })}
            icon={<ShieldAlert size={20} />}
            iconBg="bg-brand-slate/10 dark:bg-brand-navy/80 text-brand-slate"
            footer={footer}
        >
            <form id="cancellation-template-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                {/* Section 1 */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.b1af04bb', { defaultValue: "1. Identification & Nom" })}</h4>
                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.502c4e93', { defaultValue: "Libellé de la politique" })}</label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-3 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:border-brand-mint transition-all text-sm font-semibold text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                            placeholder={t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.placeholder.4957255b', { defaultValue: "Ex: Late Cancel TGV - 48h" })}
                        />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2 flex items-center gap-2">
                        <Clock size={12} /> 2. Fenêtre de désengagement
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.544d3b13', { defaultValue: "Jours avant Arrivée" })}</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors">
                                    <Clock size={16} />
                                </div>
                                <input
                                    type="number"
                                    {...register('daysBeforeArrival', { valueAsNumber: true, min: 0 })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.4d36db1d', { defaultValue: "Jours" })}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.f777c4f2', { defaultValue: "Condition Séjour Min" })}</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors">
                                    <AlertTriangle size={16} />
                                </div>
                                <input
                                    type="number"
                                    {...register('minStayCondition', { valueAsNumber: true, min: 0 })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold placeholder:font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                                    placeholder={t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.placeholder.88a03b34', { defaultValue: "Libre" })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.2932ddb1', { defaultValue: "Nuits" })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-brand-slate/10 dark:bg-brand-navy/80 rounded-xl border border-brand-slate/30 dark:border-brand-slate/30 mt-2">
                        <input
                            type="checkbox"
                            id="appliesToNoShow"
                            {...register('appliesToNoShow')}
                            className="w-4 h-4 text-brand-slate rounded-xl border-brand-slate/30 focus:ring-brand-mint transition-all cursor-pointer"
                        />
                        <label htmlFor="appliesToNoShow" className="text-xs font-bold text-brand-slate dark:text-brand-light/75 cursor-pointer select-none">
                            Étendre la pénalité au "No-Show" (Non-présentation)
                        </label>
                    </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-bold text-brand-slate uppercase tracking-[0.2em] border-b border-brand-slate/15 dark:border-brand-slate/20 pb-2">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.245632d2', { defaultValue: "3. Calcul de la Pénalité" })}</h4>
                    <div className="grid grid-cols-2 gap-6 p-5 bg-brand-light dark:bg-brand-slate/10 rounded-2xl border border-brand-slate/15 dark:border-brand-slate/20">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-2">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.55ed00c5', { defaultValue: "Unité de mesure" })}</label>
                            <select
                                {...register('penaltyType')}
                                className="w-full px-3 py-2.5 bg-white dark:bg-brand-navy border border-brand-slate/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint transition-all appearance-none cursor-pointer shadow-sm text-brand-navy dark:text-brand-light"
                            >
                                <option value={CancellationPenaltyType.NIGHTS}>{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.02792fd9', { defaultValue: "Nuits de séjour" })}</option>
                                <option value={CancellationPenaltyType.PERCENTAGE}>{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.8f8841c4', { defaultValue: "Pourcentage (%)" })}</option>
                                <option value={CancellationPenaltyType.FIXED_AMOUNT}>{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.4eecf6d0', { defaultValue: "Montant fixe (€)" })}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-2">{t('auto.features.catalog.cancellation.components.editcancellationtemplatemodal.c1e57ec0', { defaultValue: "Valeur pénalité" })}</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-mint transition-colors">
                                    {watchPenaltyType === CancellationPenaltyType.NIGHTS ? <Hash size={16} /> : 
                                     watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? <Percent size={16} /> : 
                                     <Banknote size={16} />}
                                </div>
                                <input
                                    type="number"
                                    step={watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? "0.01" : "1"}
                                    {...register('baseValue', { valueAsNumber: true, min: 0 })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-black text-brand-navy dark:text-brand-light"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">
                                    {watchPenaltyType === CancellationPenaltyType.NIGHTS ? 'Nuits' : watchPenaltyType === CancellationPenaltyType.PERCENTAGE ? '%' : '€'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
