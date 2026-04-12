import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ModalShell from '../../../../components/ui/ModalShell';
import { useUpdateContractSupplement } from '../../hooks/useContractSupplements';
import type { ContractSupplement } from '../../../../types';
import type { ContractRoom } from '../../types/contract.types';
import { useTranslation } from 'react-i18next';
import {
    createContractSupplementSchema,
    type ContractSupplementFormInput,
    type ContractSupplementFormValues,
} from '../schemas/contract-detail.schema';

interface Props {
    contractId: number;
    supplement: ContractSupplement;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
}

export default function EditContractSupplementModal({
    contractId,
    supplement,
    isOpen,
    onClose,
    contractRooms,
}: Props) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractSupplementSchema(t), [t]);
    const updateMutation = useUpdateContractSupplement(contractId);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<ContractSupplementFormInput, unknown, ContractSupplementFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: supplement.name,
            systemCode: supplement.systemCode || 'CUSTOM',
            type: supplement.type,
            value: supplement.value ?? 0,
            formula: supplement.formula ?? '',
            isMandatory: supplement.isMandatory,
            applicationType: supplement.applicationType,
            applicableContractRoomIds:
                supplement.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
            specificDate: supplement.specificDate ?? '',
            minAge: supplement.minAge ?? 0,
            maxAge: supplement.maxAge ?? 99,
        },
    });

    const watchType = watch('type');
    const watchSystemCode = watch('systemCode');
    const selectedRoomIds = watch('applicableContractRoomIds');

    // Clean up fields when switching systemCode
    useEffect(() => {
        if (watchSystemCode === 'SINGLE_OCCUPANCY' || watchSystemCode === 'CUSTOM') {
            setValue('minAge', 0);
            setValue('maxAge', 99);
        }
    }, [watchSystemCode, setValue]);

    useEffect(() => {
        if (supplement) {
            reset({
                name: supplement.name,
                systemCode: supplement.systemCode || 'CUSTOM',
                type: supplement.type,
                value: supplement.value ?? 0,
                formula: supplement.formula ?? '',
                isMandatory: supplement.isMandatory,
                applicationType: supplement.applicationType,
                applicableContractRoomIds:
                    supplement.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
                specificDate: supplement.specificDate ?? '',
                minAge: supplement.minAge ?? 0,
                maxAge: supplement.maxAge ?? 99,
            });
        }
    }, [supplement, reset]);

    const toggleRoom = (roomId: number) => {
        const current = selectedRoomIds ?? [];
        const next = current.includes(roomId)
            ? current.filter((id) => id !== roomId)
            : [...current, roomId];
        setValue('applicableContractRoomIds', next, { shouldDirty: true });
    };

    const onSubmit = (data: ContractSupplementFormValues) => {
        updateMutation.mutate(
            {
                suppId: supplement.id,
                data: {
                    name: data.name,
                    systemCode: data.systemCode,
                    type: data.type,
                    value: data.type === 'FREE' ? undefined : data.value,
                    formula: data.type === 'FORMULA' ? data.formula : undefined,
                    isMandatory: data.isMandatory,
                    applicationType: data.applicationType,
                    applicableContractRoomIds: data.applicableContractRoomIds,
                    specificDate: data.specificDate || null,
                    minAge: data.minAge,
                    maxAge: data.maxAge,
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
            title={t('auto.features.contracts.details.modals.editcontractsupplementmodal.title.b85d7f23', { defaultValue: "Modifier le supplément" })}
            subtitle={t('auto.features.contracts.details.modals.editcontractsupplementmodal.subtitle.87d322ba', { defaultValue: "Configuration de base · Coquille" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={t('auto.features.contracts.details.modals.editcontractsupplementmodal.submitLabel.c5b38dcb', { defaultValue: "Mettre à jour" })}
            isSubmitting={updateMutation.isPending}
            submitDisabled={!isDirty}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">

                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.9ac766fa', { defaultValue: "Architecture Matrice :" })}</span> {t('auto.features.contracts.details.modals.editcontractsupplementmodal.b5c85b39', { defaultValue: "L'activation par période et les surcharges se gèrent directement dans la" })} <span className="text-brand-mint font-bold">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.38dce286', { defaultValue: "Grille Suppléments" })}</span> principale.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.6b5afd04', { defaultValue: "Comportement Métier" })}</label>
                                <select
                                    {...register('systemCode')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                >
                                    <option value="CUSTOM">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.a8d0bd95', { defaultValue: "Autre / Standard" })}</option>
                                    <option value="SINGLE_OCCUPANCY">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.c5ed0310', { defaultValue: "Supplément Single" })}</option>
                                    <option value="GALA_DINNER">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.c170138a', { defaultValue: "Dîner de Gala" })}</option>
                                    <option value="MEAL_PLAN">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.d30e9413', { defaultValue: "Supplément de Pension (Repas)" })}</option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.87efde3c', { defaultValue: "Nom du supplément" })}</label>
                                <input
                                    {...register('name')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light outline-none"
                                    placeholder={t('auto.features.contracts.details.modals.editcontractsupplementmodal.placeholder.7885ed9e', { defaultValue: "ex: Supplément Vue Mer" })}
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                            </div>

                            {/* Conditional Age Range for Gala and Meal Plan */}
                            {(watchSystemCode === 'GALA_DINNER' || watchSystemCode === 'MEAL_PLAN') && (
                                <div className="grid grid-cols-2 gap-4 bg-brand-light dark:bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/20">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.55f4c4e1', { defaultValue: "Âge Minimum" })}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('minAge', { valueAsNumber: true, min: 0 })}
                                                className="w-full px-4 py-2 bg-white dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.1a8e8d3a', { defaultValue: "ans" })}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.7ee9223e', { defaultValue: "Âge Maximum" })}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                {...register('maxAge', { valueAsNumber: true, max: 99 })}
                                                className="w-full px-4 py-2 bg-white dark:bg-brand-navy/50 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.1a8e8d3a', { defaultValue: "ans" })}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Type + Application */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.d1b0b3bc', { defaultValue: "Type de Calcul" })}</label>
                                    <select
                                        {...register('type')}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:bg-white transition-all text-sm font-bold cursor-pointer text-brand-navy dark:text-brand-light outline-none"
                                    >
                                        <option value="FIXED">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.db176a40', { defaultValue: "Fixe (TND)" })}</option>
                                        <option value="PERCENTAGE">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.d5cd8ba2', { defaultValue: "Pourcentage (%)" })}</option>
                                        <option value="FORMULA">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.825bffe9', { defaultValue: "Formule" })}</option>
                                        <option value="FREE">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.9517f2f2', { defaultValue: "Gratuit" })}</option>
                                    </select>
                                </div>
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.1565911a', { defaultValue: "Mode d'Application" })}</label>
                                    <select
                                        {...register('applicationType')}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:bg-white transition-all text-sm font-bold cursor-pointer text-brand-navy dark:text-brand-light outline-none"
                                    >
                                        <option value="PER_NIGHT_PER_PERSON">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.e9a36374', { defaultValue: "Par Nuit et Par Personne" })}</option>
                                        <option value="PER_NIGHT_PER_ROOM">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.6493e268', { defaultValue: "Par Chambre et Par Nuit" })}</option>
                                        <option value="FLAT_RATE_PER_STAY">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.0fd98736', { defaultValue: "Forfait Unique par Séjour" })}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Value or Formula */}
                            {(watchType === 'FIXED' || watchType === 'PERCENTAGE') && (
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                        {watchType === 'PERCENTAGE' ? 'Valeur de Base (%)' : 'Montant de Base (TND)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('value', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate/50 uppercase">
                                            {watchType === 'PERCENTAGE' ? '%' : 'TND'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {watchType === 'FORMULA' && (
                                <div>
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.825bffe9', { defaultValue: "Formule" })}</label>
                                    <input
                                        {...register('formula')}
                                        placeholder={t('auto.features.contracts.details.modals.editcontractsupplementmodal.placeholder.a15a9fd1', { defaultValue: "SGL = DBL" })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-mono text-brand-navy dark:text-brand-light outline-none"
                                    />
                                </div>
                            )}

                            {/* Mandatory */}
                            <div className="flex items-center gap-3 p-3.5 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/20">
                                <input type="checkbox" id="editIsMandatory" {...register('isMandatory')}
                                    className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded-xl focus:ring-brand-mint cursor-pointer" />
                                <label htmlFor="editIsMandatory" className="text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider cursor-pointer">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.53080039', { defaultValue: "Supplément Obligatoire" })}</label>
                            </div>

                            {/* Specific Event Date */}
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                        📅 Date Spécifique
                                        <span className="text-brand-slate/50 font-normal normal-case tracking-normal ml-2">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.d579d911', { defaultValue: "(Optionnel — ex: Saint-Valentin)" })}</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('specificDate')}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm text-brand-navy dark:text-brand-light outline-none"
                                    />
                                    <p className="text-[11px] text-brand-slate/60 mt-1.5 font-medium">
                                        Si renseignée, ce supplément sera auto-activé sur la période contenant cette date.
                                    </p>
                                </div>
                            </div>

                            {/* Room Targeting */}
                            {contractRooms.length > 0 && (
                                <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                                    <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-4 text-center">{t('auto.features.contracts.details.modals.editcontractsupplementmodal.75cec2bc', { defaultValue: "Chambres concernées" })}</label>
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
