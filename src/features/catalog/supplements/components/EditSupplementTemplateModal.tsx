import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import {
    type TemplateSupplement,
    type CreateTemplateSupplementPayload
} from '../hooks/useTemplateSupplements';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createSupplementTemplateSchema, type SupplementTemplateFormValues } from '../../schemas/catalog.schema';

interface EditSupplementTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateSupplement | null;
    onSubmit: (data: CreateTemplateSupplementPayload) => void;
    isPending: boolean;
}

export default function EditSupplementTemplateModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: EditSupplementTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createSupplementTemplateSchema(t), [t]);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<SupplementTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            systemCode: 'CUSTOM',
            type: 'FIXED',
            value: 0,
            formula: '',
            isMandatory: false,
            applicationType: 'PER_NIGHT_PER_ROOM',
            specificDate: '',
            minAge: 0,
            maxAge: 99,
        },
    });

    const watchType = watch('type');
    const watchSystemCode = watch('systemCode');

    useEffect(() => {
        if (watchSystemCode === 'SINGLE_OCCUPANCY' || watchSystemCode === 'CUSTOM') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
        }
    }, [watchSystemCode, setValue]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                systemCode: editItem.systemCode || 'CUSTOM',
                type: editItem.type,
                value: editItem.value ?? 0,
                formula: editItem.formula ?? '',
                isMandatory: editItem.isMandatory || false,
                applicationType: editItem.applicationType,
                specificDate: editItem.specificDate ?? '',
                minAge: editItem.minAge ?? 0,
                maxAge: editItem.maxAge ?? 99,
            });
        } else {
            reset({
                name: '',
                systemCode: 'CUSTOM',
                type: 'FIXED',
                value: 0,
                formula: '',
                isMandatory: false,
                applicationType: 'PER_NIGHT_PER_ROOM',
                specificDate: '',
                minAge: 0,
                maxAge: 99,
            });
        }
    }, [editItem, reset, isOpen]);

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                Annuler
            </button>
            <button
                form="supplement-template-form"
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-brand-light text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {editItem ? 'Enregistrer' : 'Créer le supplément'}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editItem ? `Modifier – ${editItem.name}` : 'Nouveau Supplément'}
            subtitle={t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.subtitle.d65841ee', { defaultValue: "Définition Catalogue" })}
            footer={footer}
        >
            <form id="supplement-template-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="bg-brand-mint/10 dark:bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 text-brand-navy dark:text-brand-light text-xs leading-relaxed font-medium">
                    {t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.tip', { defaultValue: "Astuce : Les suppl?ments du catalogue servent de mod?les. Lors de l'import dans un contrat, vous pourrez ajuster leurs prix par p?riode." })}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.07f39843', { defaultValue: "Comportement Métier" })}</label>
                        <select {...register('systemCode')}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light">
                            <option value="CUSTOM">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.80da13d2', { defaultValue: "Autre / Standard" })}</option>
                            <option value="SINGLE_OCCUPANCY">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.d8ffefd8', { defaultValue: "Supplément Single" })}</option>
                            <option value="GALA_DINNER">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.28f784dc', { defaultValue: "Dîner de Gala" })}</option>
                            <option value="MEAL_PLAN">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.3d69fa74', { defaultValue: "Supplément de Pension (Repas)" })}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.a40efce2', { defaultValue: "Nom du supplément" })}</label>
                        <input {...register('name')}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                            placeholder={t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.placeholder.16f08e5e', { defaultValue: "ex: Dîner de Gala, Lit Bébé..." })} />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>

                    {(watchSystemCode === 'GALA_DINNER' || watchSystemCode === 'MEAL_PLAN') && (
                        <div className="grid grid-cols-2 gap-4 bg-brand-light dark:bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/15 dark:border-brand-slate/20">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.72f7cd38', { defaultValue: "Age Minimum" })}</label>
                                <div className="relative">
                                    <input type="number" {...register('minAge', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.70839f7e', { defaultValue: "ans" })}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.8c96febd', { defaultValue: "Age Maximum" })}</label>
                                <div className="relative">
                                    <input type="number" {...register('maxAge', { valueAsNumber: true, max: 99 })}
                                        className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.70839f7e', { defaultValue: "ans" })}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.e69e5a54', { defaultValue: "Type de calcul" })}</label>
                            <select {...register('type')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light">
                                <option value="FIXED">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.2b31abd3', { defaultValue: "Fixe (montant)" })}</option>
                                <option value="PERCENTAGE">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.bf7fee32', { defaultValue: "Pourcentage" })}</option>
                                <option value="FORMULA">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.35b58b48', { defaultValue: "Formule" })}</option>
                                <option value="FREE">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.d7a72b15', { defaultValue: "Gratuit" })}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.49428240', { defaultValue: "Mode d'Application" })}</label>
                            <select {...register('applicationType')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold appearance-none cursor-pointer text-brand-navy dark:text-brand-light">
                                <option value="PER_NIGHT_PER_PERSON">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.2969c12e', { defaultValue: "Par Nuit et Par Personne" })}</option>
                                <option value="PER_NIGHT_PER_ROOM">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.6ac86809', { defaultValue: "Par Chambre et Par Nuit" })}</option>
                                <option value="FLAT_RATE_PER_STAY">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.ff68de8a', { defaultValue: "Forfait Unique par Séjour" })}</option>
                            </select>
                        </div>
                    </div>

                    {(watchType === 'FIXED' || watchType === 'PERCENTAGE') && (
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                Valeur par défaut ({watchType === 'PERCENTAGE' ? '%' : '€'})
                            </label>
                            <input type="number" step="0.01" {...register('value', { valueAsNumber: true })}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                        </div>
                    )}

                    {watchType === 'FORMULA' && (
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.20da80f2', { defaultValue: "Formule de calcul" })}</label>
                            <input {...register('formula')} placeholder={t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.placeholder.0e40180d', { defaultValue: "ex: SGL = DBL" })}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-mono font-bold text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate" />
                            <p className="mt-1.5 text-[10px] text-brand-slate font-medium italic">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.formulaHint', { defaultValue: "Ex: SGL = DBL (le prix single s'aligne sur le double)" })}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/15 dark:border-brand-slate/20">
                        <input type="checkbox" id="isMandatory" {...register('isMandatory')}
                            className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded focus:ring-brand-mint cursor-pointer" />
                        <label htmlFor="isMandatory" className="text-sm font-bold text-brand-navy dark:text-brand-light cursor-pointer select-none">
                            Supplément obligatoire par défaut
                        </label>
                    </div>

                    <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                        <label className="flex items-center gap-2 text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                            📅 Date de l'évènement <span className="text-[10px] text-brand-slate font-normal lowercase">{t('auto.features.catalog.supplements.components.editsupplementtemplatemodal.cc4ffce3', { defaultValue: "(optionnel)" })}</span>
                        </label>
                        <input type="date" {...register('specificDate')}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light" />
                        <p className="mt-1.5 text-[10px] text-brand-slate font-medium leading-relaxed">
                            Si spécifié, ce supplément ne sera disponible que pour les contrats couvrant cette date précise.
                        </p>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
