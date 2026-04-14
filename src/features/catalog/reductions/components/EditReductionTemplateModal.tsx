import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Info } from 'lucide-react';
import {
    type TemplateReduction,
    type CreateTemplateReductionPayload
} from '../hooks/useTemplateReductions';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createReductionTemplateSchema, type ReductionTemplateFormValues } from '../../schemas/catalog.schema';

interface EditReductionTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: TemplateReduction | null;
    onSubmit: (data: CreateTemplateReductionPayload) => void;
    isPending: boolean;
}

export default function EditReductionTemplateModal({
    isOpen,
    onClose,
    editItem,
    onSubmit,
    isPending,
}: EditReductionTemplateModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createReductionTemplateSchema(t), [t]);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ReductionTemplateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            systemCode: 'CHILD',
            paxOrder: 1,
            calculationType: 'PERCENTAGE',
            minAge: 0,
            maxAge: 12,
            value: 0,
            applicationType: 'PER_NIGHT_PER_PERSON',
            paxType: 'FIRST_CHILD'
        },
    });

    const watchSystemCode = watch('systemCode');
    const watchCalcType = watch('calculationType');

    useEffect(() => {
        if (watchSystemCode === 'EXTRA_ADULT') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
            if (!watch('paxOrder') || watch('paxOrder')! < 3) setValue('paxOrder', 3);
            setValue('paxType', 'THIRD_ADULT');
        } else if (watchSystemCode === 'CHILD') {
            setValue('minAge', 0);
            setValue('maxAge', 12);
            if (!watch('paxOrder')) setValue('paxOrder', 1);
            setValue('paxType', 'FIRST_CHILD');
        } else if (watchSystemCode === 'CUSTOM') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
            setValue('paxOrder', null);
        }
    }, [watchSystemCode, setValue, watch]);

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                systemCode: editItem.systemCode || 'CHILD',
                paxOrder: editItem.paxOrder,
                paxType: editItem.paxType,
                calculationType: editItem.calculationType,
                minAge: editItem.minAge,
                maxAge: editItem.maxAge,
                value: Number(editItem.value) || 0,
                applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
            });
        } else {
            reset({
                name: '',
                systemCode: 'CHILD',
                paxOrder: 1,
                paxType: 'FIRST_CHILD',
                calculationType: 'PERCENTAGE',
                minAge: 0,
                maxAge: 12,
                value: 0,
                applicationType: 'PER_NIGHT_PER_PERSON',
            });
        }
    }, [editItem, reset, isOpen]);

    const footer = (
        <>
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                Annuler
            </button>
            <button
                form="reduction-template-form"
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-brand-light text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {editItem ? 'Enregistrer' : 'Créer la réduction'}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editItem ? `Modifier – ${editItem.name}` : 'Nouvelle Réduction'}
            subtitle={t('auto.features.catalog.reductions.components.editreductiontemplatemodal.subtitle.676757db', { defaultValue: "Définition Catalogue" })}
            footer={footer}
        >
            <form id="reduction-template-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="bg-brand-mint/10 dark:bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-mint shadow-sm">
                    <Info className="shrink-0 mt-0.5" size={16} />
                    <p className="text-xs leading-relaxed font-medium text-brand-navy dark:text-brand-light">
                        Ces règles conditionnent le moteur de calcul. Assurez-vous de bien cibler le bon comportement (Enfant ou Adulte supplémentaire).
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.7a4305e8', { defaultValue: "Comportement Métier" })}</label>
                        <select
                            {...register('systemCode')}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light"
                        >
                            <option value="CHILD">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.dca3d8ad', { defaultValue: "Enfant" })}</option>
                            <option value="EXTRA_ADULT">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.8eb79c1b', { defaultValue: "Adulte Supplémentaire" })}</option>
                            <option value="CUSTOM">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.bec768b5', { defaultValue: "Réduction Standard / Autre" })}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.b8d32f1e', { defaultValue: "Nom de la réduction" })}</label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                            placeholder={t('auto.features.catalog.reductions.components.editreductiontemplatemodal.placeholder.965f0c8b', { defaultValue: "ex: Enfant 0-5 ans gratuit..." })}
                        />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-brand-light dark:bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/15 dark:border-brand-slate/20">
                        {watchSystemCode !== 'CUSTOM' && (
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                    Position ({watchSystemCode === 'CHILD' ? 'Enfant' : 'Adulte'})
                                </label>
                                <input
                                    type="number"
                                    {...register('paxOrder', { valueAsNumber: true, min: watchSystemCode === 'EXTRA_ADULT' ? 3 : 1 })}
                                    className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light"
                                    placeholder={watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3' : 'ex: 1'}
                                />
                                <p className="text-[10px] text-brand-slate mt-1">
                                    {watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3 pour le 3ème adulte' : 'ex: 1 pour le 1er enfant'}
                                </p>
                            </div>
                        )}

                        {watchSystemCode === 'CHILD' && (
                            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                                <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.f16cf0d8', { defaultValue: "Age Minimum" })}</label>
                                    <div className="relative">
                                        <input type="number" {...register('minAge', { valueAsNumber: true, min: 0 })}
                                            className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.8b613ce1', { defaultValue: "ans" })}</span>
                                    </div>
                                </div>
                                <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.8911a3eb', { defaultValue: "Age Maximum" })}</label>
                                    <div className="relative">
                                        <input type="number" {...register('maxAge', { valueAsNumber: true, max: 17 })}
                                            className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.8b613ce1', { defaultValue: "ans" })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.ef3683b5', { defaultValue: "Type de calcul" })}</label>
                            <select {...register('calculationType')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light">
                                <option value="PERCENTAGE">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.28238d11', { defaultValue: "Pourcentage (%)" })}</option>
                                <option value="FIXED">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.f1c7d9aa', { defaultValue: "Fixe (€)" })}</option>
                                <option value="FREE">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.da6463ce', { defaultValue: "Gratuit" })}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.aa76f86d', { defaultValue: "Mode d'Application" })}</label>
                            <select {...register('applicationType')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold cursor-pointer text-brand-navy dark:text-brand-light">
                                <option value="PER_NIGHT_PER_PERSON">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.d01d1192', { defaultValue: "Par Nuit et Par Personne" })}</option>
                                <option value="PER_NIGHT_PER_ROOM">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.de46e26e', { defaultValue: "Par Chambre et Par Nuit" })}</option>
                                <option value="FLAT_RATE_PER_STAY">{t('auto.features.catalog.reductions.components.editreductiontemplatemodal.8dd41322', { defaultValue: "Forfait Unique par Séjour" })}</option>
                            </select>
                        </div>
                    </div>

                    {watchCalcType !== 'FREE' && (
                        <div className="pt-2">
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                Valeur de la réduction ({watchCalcType === 'PERCENTAGE' ? '%' : '€'})
                            </label>
                            <div className="relative">
                                <input type="number" step="0.01"
                                    {...register('value', { valueAsNumber: true })}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">
                                    {watchCalcType === 'PERCENTAGE' ? '%' : '€'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </ModalShell>
    );
}
