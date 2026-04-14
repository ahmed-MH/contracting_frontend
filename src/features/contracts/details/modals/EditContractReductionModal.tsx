import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import ModalShell from '../../../../components/ui/ModalShell';
import { useUpdateContractReduction } from '../../hooks/useContractReductions';
import type { ContractReduction } from '../../../../types';
import type { Period, ContractRoom } from '../../types/contract.types';
import { useTranslation } from 'react-i18next';
import {
    createContractReductionSchema,
    type ContractReductionFormInput,
    type ContractReductionFormValues,
} from '../schemas/contract-detail.schema';

interface Props {
    contractId: number;
    reduction: ContractReduction;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractReductionModal({
    contractId,
    reduction,
    isOpen,
    onClose,
    contractRooms,
}: Props) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractReductionSchema(t), [t]);
    const updateMutation = useUpdateContractReduction(contractId);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<ContractReductionFormInput, unknown, ContractReductionFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: reduction.name,
            systemCode: reduction.systemCode || 'CHILD',
            calculationType: reduction.calculationType,
            value: reduction.value ?? 0,
            paxType: reduction.paxType,
            paxOrder: reduction.paxOrder,
            minAge: reduction.minAge,
            maxAge: reduction.maxAge,
            applicableContractRoomIds: reduction.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
            applicationType: reduction.applicationType || 'PER_NIGHT_PER_PERSON',
        },
    });

    const watchSystemCode = watch('systemCode');
    const watchCalcType = watch('calculationType');
    const selectedRoomIds = watch('applicableContractRoomIds');

    // Clean up fields when switching systemCode
    useEffect(() => {
        if (watchSystemCode === 'EXTRA_ADULT') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
            // Default to 3rd adult if switching
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
        if (reduction) {
            reset({
                name: reduction.name,
                systemCode: reduction.systemCode || 'CHILD',
                calculationType: reduction.calculationType,
                value: reduction.value ?? 0,
                paxType: reduction.paxType,
                paxOrder: reduction.paxOrder,
                minAge: reduction.minAge,
                maxAge: reduction.maxAge,
                applicableContractRoomIds: reduction.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
                applicationType: reduction.applicationType || 'PER_NIGHT_PER_PERSON',
            });
        }
    }, [reduction, reset]);

    const toggleRoom = (roomId: number) => {
        const current = selectedRoomIds ?? [];
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId];
        setValue('applicableContractRoomIds', next, { shouldDirty: true });
    };

    const onSubmit = (data: ContractReductionFormValues) => {
        updateMutation.mutate(
            {
                reductionId: reduction.id,
                data: {
                    name: data.name,
                    systemCode: data.systemCode,
                    calculationType: data.calculationType,
                    value: data.calculationType === 'FREE' ? undefined : data.value,
                    paxType: data.paxType,
                    paxOrder: data.paxOrder,
                    minAge: data.minAge,
                    maxAge: data.maxAge,
                    applicableContractRoomIds: data.applicableContractRoomIds,
                    applicationType: data.applicationType,
                },
            },
            { onSuccess: onClose },
        );
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('auto.features.contracts.details.modals.editcontractreductionmodal.title.24cf9492', { defaultValue: "Modifier la réduction" })}
            subtitle={t('auto.features.contracts.details.modals.editcontractreductionmodal.subtitle.bdb3ac3f', { defaultValue: "Configuration de base · Coquille" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={t('auto.features.contracts.details.modals.editcontractreductionmodal.submitLabel.a3e103eb', { defaultValue: "Mettre à jour" })}
            isSubmitting={updateMutation.isPending}
            submitDisabled={!isDirty}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <Info className="shrink-0 mt-0.5 text-brand-mint" size={16} />
                            <p className="text-xs leading-relaxed font-medium">
                                Ces règles conditionnent le moteur de calcul. Assurez-vous de bien cibler le bon comportement (Enfant ou Adulte supplémentaire).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.67108475', { defaultValue: "Comportement Métier" })}</label>
                                <select
                                    {...register('systemCode')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                >
                                    <option value="CHILD">{t('auto.features.contracts.details.modals.editcontractreductionmodal.4273eebf', { defaultValue: "Enfant" })}</option>
                                    <option value="EXTRA_ADULT">{t('auto.features.contracts.details.modals.editcontractreductionmodal.dea869ee', { defaultValue: "Adulte Supplémentaire" })}</option>
                                    <option value="CUSTOM">{t('auto.features.contracts.details.modals.editcontractreductionmodal.b324581a', { defaultValue: "Réduction Standard / Autre" })}</option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.035e6e9d', { defaultValue: "Nom de la réduction" })}</label>
                                <input
                                    {...register('name')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light outline-none"
                                    placeholder={t('auto.features.contracts.details.modals.editcontractreductionmodal.placeholder.9502ee2a', { defaultValue: "ex: Réduction Enfant Standard" })}
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                            </div>

                            {/* Conditional Rendering based on systemCode */}
                            <div className="grid grid-cols-2 gap-4 bg-brand-light dark:bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/20">
                                {watchSystemCode !== 'CUSTOM' && (
                                    <div>
                                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                            Position ({watchSystemCode === 'CHILD' ? 'Enfant' : 'Adulte'})
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('paxOrder', { 
                                                    valueAsNumber: true, 
                                                    min: watchSystemCode === 'EXTRA_ADULT' ? 3 : 1 
                                                })}
                                                className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                                placeholder={watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3' : 'ex: 1'}
                                            />
                                        </div>
                                        <p className="text-[10px] text-brand-slate/60 mt-1">
                                            {watchSystemCode === 'EXTRA_ADULT' ? 'ex: 3 pour le 3ème adulte' : 'ex: 1 pour le 1er enfant'}
                                        </p>
                                    </div>
                                )}

                                {watchSystemCode === 'CHILD' && (
                                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.c749ed52', { defaultValue: "Age Minimum" })}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    {...register('minAge', { valueAsNumber: true, min: 0 })}
                                                    className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">{t('auto.features.contracts.details.modals.editcontractreductionmodal.98b63e8b', { defaultValue: "Ans" })}</span>
                                            </div>
                                        </div>
                                        <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.04a95f82', { defaultValue: "Age Maximum" })}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    {...register('maxAge', { valueAsNumber: true, max: 17 })}
                                                    className="w-full px-4 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">{t('auto.features.contracts.details.modals.editcontractreductionmodal.98b63e8b', { defaultValue: "Ans" })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Types Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.edd20c42', { defaultValue: "Type de Calcul" })}</label>
                                    <select
                                        {...register('calculationType')}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:bg-brand-light transition-all text-sm font-bold cursor-pointer text-brand-navy dark:text-brand-light outline-none"
                                    >
                                        <option value="PERCENTAGE">{t('auto.features.contracts.details.modals.editcontractreductionmodal.ca6db49b', { defaultValue: "Pourcentage (%)" })}</option>
                                        <option value="FIXED">{t('auto.features.contracts.details.modals.editcontractreductionmodal.ec522aa9', { defaultValue: "Fixe (TND)" })}</option>
                                        <option value="FREE">{t('auto.features.contracts.details.modals.editcontractreductionmodal.c447915c', { defaultValue: "Gratuit" })}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractreductionmodal.b31f79fc', { defaultValue: "Mode d'Application" })}</label>
                                    <select
                                        {...register('applicationType')}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:bg-brand-light transition-all text-sm font-bold cursor-pointer text-brand-navy dark:text-brand-light outline-none"
                                    >
                                        <option value="PER_NIGHT_PER_PERSON">{t('auto.features.contracts.details.modals.editcontractreductionmodal.a225361f', { defaultValue: "Par Nuit et Par Personne" })}</option>
                                        <option value="PER_NIGHT_PER_ROOM">{t('auto.features.contracts.details.modals.editcontractreductionmodal.6ecfc999', { defaultValue: "Par Chambre et Par Nuit" })}</option>
                                        <option value="FLAT_RATE_PER_STAY">{t('auto.features.contracts.details.modals.editcontractreductionmodal.313147b3', { defaultValue: "Forfait Unique par Séjour" })}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Value */}
                            {watchCalcType !== 'FREE' && (
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                        {watchCalcType === 'PERCENTAGE' ? 'Valeur de Base (%)' : 'Montant de Base'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('value', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">
                                            {watchCalcType === 'PERCENTAGE' ? '%' : 'TND'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Room Targeting */}
                            {contractRooms.length > 0 && (
                                <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-4 text-center">{t('auto.features.contracts.details.modals.editcontractreductionmodal.da335446', { defaultValue: "Chambres concernées" })}</label>
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

                            {/* Reminder */}
                            <div className="bg-brand-slate/10 rounded-xl p-4 border border-brand-slate/30 flex items-center gap-3">
                                <span className="text-lg">💡</span>
                                <p className="text-[11px] font-bold text-brand-slate italic">
                                    💡 L'activation par période et les surcharges se gèrent directement dans la Grille.
                                </p>
                            </div>
                        </div>
            </div>
        </ModalShell>
    );
}
