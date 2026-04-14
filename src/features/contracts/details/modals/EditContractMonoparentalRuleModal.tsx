import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import ModalShell from '../../../../components/ui/ModalShell';
import { useUpdateContractMonoparentalRule } from '../../hooks/useContractMonoparentalRules';
import type {
    ContractMonoparentalRule,
    BaseRateType,
    ChildSurchargeBase,
} from '../../../../types';
import type { Period, ContractRoom } from '../../types/contract.types';
import { useTranslation } from 'react-i18next';
import {
    createContractMonoparentalSchema,
    type ContractMonoparentalFormInput,
    type ContractMonoparentalFormValues,
} from '../schemas/contract-detail.schema';

const BASE_RATE_LABELS: Record<BaseRateType, string> = {
    SINGLE: 'Single',
    DOUBLE: 'Double',
};

const CHILD_SURCHARGE_BASE_LABELS: Record<ChildSurchargeBase, string> = {
    SINGLE: 'Chambre Single',
    DOUBLE: 'Chambre Double',
    HALF_SINGLE: 'Demi-Single',
    HALF_DOUBLE: 'Demi-Double',
};

interface Props {
    contractId: number;
    rule: ContractMonoparentalRule;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractMonoparentalRuleModal({
    contractId,
    rule,
    isOpen,
    onClose,
    contractRooms,
}: Props) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractMonoparentalSchema(t), [t]);
    const updateMutation = useUpdateContractMonoparentalRule(contractId);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<ContractMonoparentalFormInput, unknown, ContractMonoparentalFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: rule.name,
            adultCount: rule.adultCount,
            childCount: rule.childCount,
            childSurchargePercentage: rule.childSurchargePercentage ?? 0,
            minAge: rule.minAge,
            maxAge: rule.maxAge,
            baseRateType: rule.baseRateType,
            childSurchargeBase: rule.childSurchargeBase,
            applicableContractRoomIds: rule.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
        },
    });

    useEffect(() => {
        if (rule) {
            reset({
                name: rule.name,
                adultCount: rule.adultCount,
                childCount: rule.childCount,
                childSurchargePercentage: rule.childSurchargePercentage ?? 0,
                minAge: rule.minAge,
                maxAge: rule.maxAge,
                baseRateType: rule.baseRateType,
                childSurchargeBase: rule.childSurchargeBase,
                applicableContractRoomIds: rule.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
            });
        }
    }, [rule, reset]);

    const selectedRoomIds = watch('applicableContractRoomIds');
    const toggleRoom = (roomId: number) => {
        const current = selectedRoomIds ?? [];
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId];
        setValue('applicableContractRoomIds', next, { shouldDirty: true });
    };

    const adultCount = watch('adultCount');
    const childCount = watch('childCount');
    const minAge = watch('minAge');
    const maxAge = watch('maxAge');
    const baseRateType = watch('baseRateType');
    const childSurchargeBase = watch('childSurchargeBase');
    const childSurchargePercentage = watch('childSurchargePercentage') ?? 0;

    const onSubmit = (data: ContractMonoparentalFormValues) => {
        updateMutation.mutate(
            {
                ruleId: rule.id,
                data: {
                    name: data.name,
                    adultCount: data.adultCount,
                    childCount: data.childCount,
                    childSurchargePercentage: data.childSurchargePercentage,
                    minAge: data.minAge,
                    maxAge: data.maxAge,
                    baseRateType: data.baseRateType,
                    childSurchargeBase: data.childSurchargeBase,
                    applicableContractRoomIds: data.applicableContractRoomIds,
                },
            },
            { onSuccess: onClose },
        );
    };

    const Stepper = ({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max?: number }) => (
        <div className="flex items-center border border-brand-slate/20 rounded-xl overflow-hidden bg-brand-light dark:bg-brand-navy/40 w-full h-10">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-brand-light dark:bg-brand-slate/10 hover:bg-brand-slate/10 text-brand-slate border-r border-brand-slate/20 transition-colors focus:outline-none font-bold text-lg cursor-pointer"
            >
                −
            </button>
            <div className="flex-1 text-center text-sm font-bold text-brand-navy dark:text-brand-light">{value}</div>
            <button
                type="button"
                onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
                className="shrink-0 w-10 h-full flex items-center justify-center bg-brand-light dark:bg-brand-slate/10 hover:bg-brand-slate/10 text-brand-slate border-l border-brand-slate/20 transition-colors focus:outline-none font-bold text-lg cursor-pointer"
            >
                +
            </button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.title.f2b97c4f', { defaultValue: "Modifier la règle monoparentale" })}
            subtitle={t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.subtitle.3ac58f0e', { defaultValue: "Configuration de base · Coquille" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.submitLabel.91ed311c', { defaultValue: "Mettre à jour" })}
            isSubmitting={updateMutation.isPending}
            submitDisabled={!isDirty}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.baa44125', { defaultValue: "Architecture Matrice :" })}</span> {t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.79df55e7', { defaultValue: "L'activation par période et les surcharges se gèrent directement dans la" })} <span className="text-brand-mint font-bold">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.6b6a0302', { defaultValue: "Grille Monoparentale" })}</span> principale.
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.2933997c', { defaultValue: "Nom de la règle" })}</label>
                            <input {...register('name')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light outline-none"
                                placeholder={t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.placeholder.d911fc2c', { defaultValue: "ex: 1 Adulte + 2 Enfants" })} />
                            {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                        </div>

                        {/* Zone A: Conditions */}
                        <div className="p-4 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/20 space-y-4">
                            <h3 className="text-xs font-bold text-brand-mint uppercase tracking-widest">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.e11605d7', { defaultValue: "Zone A : Condition d'application" })}</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.2184809c', { defaultValue: "Adultes" })}</label>
                                    <Stepper value={adultCount} onChange={(v) => setValue('adultCount', v, { shouldDirty: true })} min={1} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.d2306576', { defaultValue: "Enfants" })}</label>
                                    <Stepper value={childCount} onChange={(v) => setValue('childCount', v, { shouldDirty: true })} min={1} />
                                </div>
                                <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.a981a557', { defaultValue: "Age min." })}</label>
                                    <Stepper value={minAge} onChange={(v) => setValue('minAge', v, { shouldDirty: true })} min={0} />
                                </div>
                                <div>
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.6828e695', { defaultValue: "Age max." })}</label>
                                    <Stepper value={maxAge} onChange={(v) => setValue('maxAge', v, { shouldDirty: true })} min={0} max={17} />
                                </div>
                            </div>
                        </div>

                        {/* Zone B: Facturation */}
                        <div className="p-4 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/20 space-y-4">
                            <h3 className="text-xs font-bold text-brand-mint uppercase tracking-widest">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.f962b9e5', { defaultValue: "Zone B : Formule de facturation" })}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.2b9ac690', { defaultValue: "Base adulte" })}</label>
                                    <div className="flex items-center gap-2 border border-brand-slate/20 bg-brand-light dark:bg-brand-navy/50 px-4 py-2.5 rounded-xl shadow-sm">
                                        <User size={16} className="text-brand-slate" />
                                        <select {...register('baseRateType')} className="w-full text-sm font-bold text-brand-navy dark:text-brand-light bg-transparent outline-none cursor-pointer">
                                            <option value="SINGLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.d9b9596d', { defaultValue: "Single" })}</option>
                                            <option value="DOUBLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.1ee5cabd', { defaultValue: "Double" })}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.67a34da0', { defaultValue: "Majoration enfant (%)" })}</label>
                                    <div className="relative">
                                        <input type="number" {...register('childSurchargePercentage', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                        placeholder="50" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">%</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.dd872604', { defaultValue: "Base de calcul enfant" })}</label>
                                <select {...register('childSurchargeBase')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold outline-none cursor-pointer text-brand-navy dark:text-brand-light">
                                    <option value="SINGLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.34dabcf5', { defaultValue: "Chambre Single" })}</option>
                                    <option value="DOUBLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.e1b0ffcd', { defaultValue: "Chambre Double" })}</option>
                                    <option value="HALF_SINGLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.665f705d', { defaultValue: "Demi-Single" })}</option>
                                    <option value="HALF_DOUBLE">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.36a7de31', { defaultValue: "Demi-Double" })}</option>
                                </select>
                            </div>
                        </div>

                        {/* Magic Summary */}
                        <div className="bg-brand-slate/10 dark:bg-brand-navy/80 rounded-xl p-4 border border-brand-slate/30 dark:border-brand-slate/30 text-sm text-brand-navy dark:text-brand-light/80 leading-relaxed">
                            💡 Si la chambre contient <span className="font-bold">{adultCount} Adulte{adultCount > 1 ? 's' : ''}</span> et{' '}
                            <span className="font-bold">{childCount} Enfant{childCount > 1 ? 's' : ''}</span> (de {minAge} à {maxAge} ans), le prix sera la base{' '}
                            <span className="font-bold">{BASE_RATE_LABELS[baseRateType]}</span>
                            {childSurchargePercentage > 0 ? (
                                <> + <span className="font-bold">{childSurchargePercentage}%</span> {t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.380bcff1', { defaultValue: "de la" })} <span className="font-bold">{CHILD_SURCHARGE_BASE_LABELS[childSurchargeBase]}</span>.</>
                            ) : (
                                <> {t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.930ec509', { defaultValue: "(Enfant gratuit)." })}</>
                            )}
                        </div>

                        {/* Room Targeting */}
                        {contractRooms.length > 0 && (
                            <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-4 text-center">{t('auto.features.contracts.details.modals.editcontractmonoparentalrulemodal.5bda79ae', { defaultValue: "Chambres concernées" })}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {contractRooms.map((room) => (
                                        <label key={room.id} className="flex items-center gap-3 p-3 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/20 hover:border-brand-mint transition-all cursor-pointer group has-checked:bg-brand-mint/5 has-checked:border-brand-mint/40">
                                            <input type="checkbox" checked={selectedRoomIds?.includes(room.id) ?? false} onChange={() => toggleRoom(room.id)}
                                                className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded-xl focus:ring-brand-mint cursor-pointer" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-brand-navy dark:text-brand-light group-hover:text-brand-mint transition-colors uppercase tracking-tight">{room.roomType?.code}</span>
                                                <span className="text-[10px] text-brand-slate font-medium truncate max-w-[180px]">{room.roomType?.name}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
            </div>
        </ModalShell>
    );
}
