import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UtensilsCrossed, Hash, AlignLeft, BarChart3 } from 'lucide-react';
import type { Arrangement, CreateArrangementPayload } from '../types/arrangement.types';
import ModalShell from '../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createArrangementSchema, type ArrangementFormInput, type ArrangementFormValues } from '../schemas/arrangement.schema';

interface EditArrangementModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: Arrangement | null;
    onSubmit: (data: CreateArrangementPayload) => void;
    isPending: boolean;
}

export default function EditArrangementModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending,
}: EditArrangementModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createArrangementSchema(t), [t]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ArrangementFormInput, unknown, ArrangementFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '', name: '', description: '', level: 0 },
    });

    useEffect(() => {
        if (editing) {
            reset({
                code: editing.code,
                name: editing.name,
                description: editing.description || '',
                level: editing.level || 0,
            });
        } else {
            reset({ code: '', name: '', description: '', level: 0 });
        }
    }, [editing, reset, isOpen]);

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    const inputCls = 'w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate';
    const handleValidSubmit = (data: ArrangementFormValues) => onSubmit(data);

    const footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer"
            >
                {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
                form="arrangement-form"
                type="submit"
                disabled={isPending || (!isDirty && editing !== null)}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-brand-light text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {editing
                    ? t('pages.arrangements.modal.saveChanges', { defaultValue: 'Save changes' })
                    : t('pages.arrangements.modal.create', { defaultValue: 'Create arrangement' })}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editing
                ? t('pages.arrangements.modal.editTitle', { defaultValue: 'Edit arrangement' })
                : t('pages.arrangements.modal.createTitle', { defaultValue: 'New arrangement' })}
            subtitle={t('pages.arrangements.modal.subtitle', { defaultValue: 'Meal plan and board type' })}
            icon={<UtensilsCrossed size={20} />}
            iconBg="bg-brand-mint/10 dark:bg-brand-mint/5 text-brand-mint"
            footer={footer}
        >
            <form id="arrangement-form" onSubmit={handleSubmit(handleValidSubmit)} className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                {t('fields.uniqueCode', { defaultValue: 'Unique code' })}
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={14} />
                                <input
                                    {...register('code')}
                                    onChange={(event) => setValue('code', event.target.value.toUpperCase().replace(/\s/g, '').slice(0, 5), { shouldDirty: true })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-black font-mono tracking-widest text-brand-navy dark:text-brand-light"
                                    placeholder={t('auto.features.arrangements.components.editarrangementmodal.placeholder.b837c01f', { defaultValue: "LPD" })}
                                    maxLength={5}
                                />
                            </div>
                            {errors.code && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.code.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                {t('fields.level', { defaultValue: 'Level' })}
                            </label>
                            <div className="relative">
                                <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={14} />
                                <input
                                    type="number"
                                    {...register('level', { valueAsNumber: true })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light"
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-[10px] text-brand-slate mt-1 italic leading-tight">
                                {t('pages.arrangements.modal.levelHint', { defaultValue: '0 = base, 1+ = superior' })}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                            {t('fields.label', { defaultValue: 'Label' })}
                        </label>
                        <input
                            {...register('name')}
                            onBlur={(event) => setValue('name', toTitleCase(event.target.value), { shouldDirty: true })}
                            className={inputCls}
                            placeholder={t('pages.arrangements.modal.namePlaceholder', { defaultValue: 'ex: Standard room and breakfast' })}
                        />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                            {t('fields.description', { defaultValue: 'Description' })}
                        </label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 text-brand-slate" size={16} />
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm resize-none text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                                placeholder={t('pages.arrangements.modal.descriptionPlaceholder', { defaultValue: 'Describe the meals included in this formula...' })}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-brand-mint/10 dark:bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-navy dark:text-brand-light shadow-sm">
                    <UtensilsCrossed size={18} className="shrink-0 mt-0.5 text-brand-mint" />
                    <div>
                        <p className="text-xs font-bold leading-relaxed">
                            {t('pages.arrangements.modal.levelLogicTitle', { defaultValue: 'Level logic' })}
                        </p>
                        <p className="text-[11px] mt-1 text-brand-slate leading-relaxed uppercase tracking-tighter font-medium">
                            {t('pages.arrangements.modal.levelLogicBody', { defaultValue: 'A meal plan is available as an option when its level is higher than the contract base board.' })}
                        </p>
                    </div>
                </div>
            </form>
        </ModalShell>
    );
}
