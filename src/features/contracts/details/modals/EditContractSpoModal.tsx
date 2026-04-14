import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type ContractSpo,
    type CreateContractSpoPayload,
    type UpdateContractSpoPayload
} from '../../../catalog/spos/types/spos.types';
import type { Contract } from '../../types/contract.types';
import { useCreateContractSpo, useUpdateContractSpo } from '../../hooks/useContractSpos';
import { useArrangements } from '../../../arrangements/hooks/useArrangements';
import type { Arrangement } from '../../../arrangements/types/arrangement.types';
import { FileText, Percent, Moon, Calendar, Wallet, Target } from 'lucide-react';
import ModalShell from '../../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import {
    createContractSpoSchema,
    type ContractSpoFormInput,
    type ContractSpoFormValues,
} from '../schemas/contract-detail.schema';

interface EditContractSpoModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract;
    editItem?: ContractSpo | null;
}

export default function EditContractSpoModal({ isOpen, onClose, contract, editItem }: EditContractSpoModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractSpoSchema(t), [t]);
    const createMutation = useCreateContractSpo(contract.id);
    const updateMutation = useUpdateContractSpo(contract.id);
    const { data: arrangements = [] } = useArrangements();
    const isEditing = !!editItem;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ContractSpoFormInput, unknown, ContractSpoFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
            value: 0,
            stayNights: 0,
            payNights: 0,
            contractRoomIds: [],
            arrangementIds: [],
            applicationType: 'PER_NIGHT_PER_PERSON',
        }
    });

    const watchConditionType = watch('conditionType');
    const watchBenefitType = watch('benefitType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                const isDiscount = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(editItem.benefitType);
                const initialValue = (editItem.value && Number(editItem.value) !== 0) ? editItem.value : (isDiscount ? editItem.benefitValue : editItem.value);

                reset({
                    name: editItem.name,
                    conditionType: editItem.conditionType,
                    conditionValue: editItem.conditionValue,
                    benefitType: editItem.benefitType,
                    benefitValue: editItem.benefitValue,
                    value: initialValue ?? 0,
                    stayNights: editItem.stayNights,
                    payNights: editItem.payNights,
                    contractRoomIds: editItem.applicableContractRooms?.map(r => r.contractRoom.id) || [],
                    arrangementIds: editItem.applicableArrangements?.map(a => a.arrangement.id) || [],
                    applicationType: editItem.applicationType || 'PER_NIGHT_PER_PERSON',
                });
            } else {
                reset({
                    name: '',
                    conditionType: 'NONE',
                    benefitType: 'PERCENTAGE_DISCOUNT',
                    value: 0,
                    stayNights: 0,
                    payNights: 0,
                    contractRoomIds: [],
                    arrangementIds: [],
                    applicationType: 'PER_NIGHT_PER_PERSON',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    const onSubmit = (data: ContractSpoFormValues) => {
        const payload: CreateContractSpoPayload = {
            ...data,
            periodIds: data.periodIds ?? [],
            contractRoomIds: data.contractRoomIds,
            arrangementIds: data.arrangementIds,
            conditionValue: data.conditionValue ?? undefined,
            benefitValue: data.benefitValue ?? undefined,
        };

        // Clean values based on Engine Type
        if (['NONE', 'HONEYMOONER'].includes(payload.conditionType)) {
            payload.conditionValue = undefined;
        } else {
            payload.conditionValue = Number(payload.conditionValue);
        }

        // Clean targeting: map purely to number[]
        payload.contractRoomIds = payload.contractRoomIds.map(Number);
        payload.arrangementIds = payload.arrangementIds.map(Number);
        payload.applicationType = data.applicationType;

        if (isEditing) {
            updateMutation.mutate(
                { id: editItem.id, payload: payload as UpdateContractSpoPayload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);

    if (!isOpen) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Modifier l'offre spéciale" : 'Nouvelle offre spéciale (SPO)'}
            subtitle={t('auto.features.contracts.details.modals.editcontractspomodal.subtitle.59e45280', { defaultValue: "Configuration de base · Coquille" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={isEditing ? "Mettre à jour" : "Créer l'offre"}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                    <div className="p-6 space-y-6 flex-1">
                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <div className="bg-brand-mint p-1.5 rounded-xl h-fit text-brand-light">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractspomodal.34d8649d', { defaultValue: "Architecture Matrice :" })}</span> {t('auto.features.contracts.details.modals.editcontractspomodal.04fc2705', { defaultValue: "L'activation par période et les surcharges se gèrent directement dans la" })} <span className="text-brand-mint font-bold">{t('auto.features.contracts.details.modals.editcontractspomodal.ec526077', { defaultValue: "Grille SPO" })}</span>. Cette modale définit la "Coquille" globale.
                            </p>
                        </div>

                        {/* Info de base */}
                        <div className="bg-brand-light dark:bg-brand-navy/30 p-4 rounded-xl border border-brand-slate/20">
                            <label className="text-sm font-semibold text-brand-navy dark:text-brand-light mb-1.5 flex items-center gap-2">
                                <FileText size={16} className="text-brand-slate" /> Nom de l'offre
                            </label>
                            <input {...register('name')}
                                className="w-full px-3 py-2 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light dark:bg-brand-slate/10" />
                            {errors.name && <p className="text-brand-slate text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Moteur de Règles */}
                        <div className="grid grid-cols-1 gap-4 bg-brand-light dark:bg-brand-slate/10 p-4 border border-brand-slate/20 rounded-xl">
                            <h3 className="font-semibold text-brand-navy dark:text-brand-light text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Target size={16} className="text-brand-mint" /> Configuration de l'Offre
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Condition SI */}
                                <div className="bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/30">
                                    <h4 className="font-bold text-brand-slate text-xs mb-3 flex items-center gap-2 uppercase tracking-tight">
                                        <span className="bg-brand-slate/10 text-brand-slate px-2 py-0.5 rounded-xl">{t('auto.features.contracts.details.modals.editcontractspomodal.8093efb7', { defaultValue: "SI" })}</span> Condition
                                    </h4>
                                    <select {...register('conditionType')}
                                        className="w-full mb-3 px-3 py-2 bg-brand-light border border-brand-slate/30 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none font-medium text-brand-navy dark:text-brand-navy">
                                        <option value="NONE">{t('auto.features.contracts.details.modals.editcontractspomodal.e680d57f', { defaultValue: "- Aucune -" })}</option>
                                        <option value="MIN_NIGHTS">{t('auto.features.contracts.details.modals.editcontractspomodal.88f6c5ea', { defaultValue: "Nuits minimales" })}</option>
                                        <option value="EARLY_BIRD">{t('auto.features.contracts.details.modals.editcontractspomodal.693c92ed', { defaultValue: "Early Bird (Advance booking)" })}</option>
                                        <option value="LONG_STAY">{t('auto.features.contracts.details.modals.editcontractspomodal.8f25afab', { defaultValue: "Long Stay" })}</option>
                                        <option value="HONEYMOONER">{t('auto.features.contracts.details.modals.editcontractspomodal.e86d88a5', { defaultValue: "Honeymooner" })}</option>
                                    </select>
                                    {conditionNeedsValue && (
                                        <div className="relative animate-in fade-in">
                                            <input type="number" min="0"
                                                placeholder={watchConditionType === 'EARLY_BIRD' ? 'Jours d\'avance' : 'Nuits'}
                                                {...register('conditionValue', { valueAsNumber: true })}
                                                className="w-full pl-9 pr-3 py-2 bg-brand-light border border-brand-slate/30 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none" />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-slate">
                                                {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Avantage */}
                                <div className="bg-brand-mint/5 p-4 rounded-xl border border-brand-mint/20">
                                    <h4 className="font-bold text-brand-mint text-xs mb-3 flex items-center gap-2 uppercase tracking-tight">
                                        <span className="bg-brand-mint/10 text-brand-mint px-2 py-0.5 rounded-xl">{t('auto.features.contracts.details.modals.editcontractspomodal.f76b806a', { defaultValue: "ALORS" })}</span> Avantage
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-brand-light dark:bg-brand-navy/40 p-3 rounded-xl border border-brand-slate/20 shadow-sm">
                                            <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5 text-center">{t('auto.features.contracts.details.modals.editcontractspomodal.55382339', { defaultValue: "Récompense / Mode" })}</label>
                                            <div className="flex flex-col gap-2">
                                                <select {...register('benefitType')}
                                                    className="w-full px-3 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light">
                                                    <option value="PERCENTAGE_DISCOUNT">{t('auto.features.contracts.details.modals.editcontractspomodal.e7e01c2a', { defaultValue: "Réduction (%)" })}</option>
                                                    <option value="FIXED_DISCOUNT">{t('auto.features.contracts.details.modals.editcontractspomodal.8ad759ef', { defaultValue: "Réduction (Fixe)" })}</option>
                                                    <option value="FREE_NIGHTS">{t('auto.features.contracts.details.modals.editcontractspomodal.8358d52a', { defaultValue: "Nuits gratuites" })}</option>
                                                    <option value="FREE_ROOM_UPGRADE">{t('auto.features.contracts.details.modals.editcontractspomodal.f4973079', { defaultValue: "Up-grade Chambre" })}</option>
                                                    <option value="FREE_BOARD_UPGRADE">{t('auto.features.contracts.details.modals.editcontractspomodal.508198c6', { defaultValue: "Up-grade Pension" })}</option>
                                                    <option value="KIDS_GO_FREE">{t('auto.features.contracts.details.modals.editcontractspomodal.6d893549', { defaultValue: "Kids Go Free" })}</option>
                                                </select>
                                                <select {...register('applicationType')}
                                                    className="w-full px-3 py-2 bg-brand-mint text-brand-light rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-brand-mint/90 transition-colors cursor-pointer outline-none">
                                                    <option value="PER_NIGHT_PER_PERSON">{t('auto.features.contracts.details.modals.editcontractspomodal.22d21365', { defaultValue: "Par Nuit & Pers." })}</option>
                                                    <option value="PER_NIGHT_PER_ROOM">{t('auto.features.contracts.details.modals.editcontractspomodal.fd5a1f68', { defaultValue: "Par Chambre & Nuit" })}</option>
                                                    <option value="FLAT_RATE_PER_STAY">{t('auto.features.contracts.details.modals.editcontractspomodal.aeb77aa0', { defaultValue: "Forfait / Séjour" })}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center">
                                            {['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(watchBenefitType) && (
                                                <div className="relative animate-in fade-in slide-in-from-right-2 duration-300">
                                            <input type="number" min="0" step="0.01" placeholder={t('auto.features.contracts.details.modals.editcontractspomodal.placeholder.40a06a0a', { defaultValue: "Valeur base" })}
                                                    {...register('value', { valueAsNumber: true })}
                                                    className="w-full pl-9 pr-3 py-3 bg-brand-light border border-brand-mint rounded-xl text-sm font-black text-brand-mint focus:ring-4 focus:ring-brand-mint/10 outline-none shadow-md" />
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-mint">
                                                        {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> : <Wallet size={16} />}
                                                    </div>
                                                </div>
                                            )}

                                            {watchBenefitType === 'FREE_NIGHTS' && (
                                                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder={t('auto.features.contracts.details.modals.editcontractspomodal.placeholder.348ca932', { defaultValue: "Stay" })}
                                                            {...register('stayNights', { valueAsNumber: true })}
                                                            className="w-full pl-2 pr-2 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none text-center font-bold"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder={t('auto.features.contracts.details.modals.editcontractspomodal.placeholder.c65e7976', { defaultValue: "Pay" })}
                                                            {...register('payNights', { valueAsNumber: true })}
                                                            className="w-full pl-2 pr-2 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none text-center font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ciblage (Targeting) */}
                        <div className="border border-brand-slate/20 rounded-xl overflow-hidden p-5 bg-brand-light dark:bg-brand-navy/30 shadow-sm">
                            <h3 className="font-bold text-brand-navy dark:text-brand-light text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={14} className="text-brand-slate" /> Ciblage des Chambres & Pensions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Rooms */}
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-slate mb-2 uppercase">{t('auto.features.contracts.details.modals.editcontractspomodal.a6f26bb7', { defaultValue: "🏨 Chambres concernées" })}</label>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-brand-slate/20 rounded-xl p-3 bg-brand-light/50 dark:bg-brand-slate/10">
                                        {contract.contractRooms?.map((r) => (
                                            <label key={r.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-brand-light dark:hover:bg-brand-slate/10 p-1.5 rounded-xl border border-transparent hover:border-brand-slate/15 transition-all">
                                                <input type="checkbox" value={r.id} {...register('contractRoomIds')}
                                                    className="h-4 w-4 rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint cursor-pointer" />
                                                <span className="font-mono text-[10px] bg-brand-mint/10 text-brand-mint px-1.5 py-0.5 rounded font-bold uppercase">{r.roomType?.code}</span>
                                                <span className="truncate flex-1 text-brand-navy dark:text-brand-light">{r.roomType?.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Arrangements */}
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-slate mb-2 uppercase">{t('auto.features.contracts.details.modals.editcontractspomodal.2bf57f7f', { defaultValue: "🍴 Pensions validées" })}</label>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-brand-slate/20 rounded-xl p-3 bg-brand-light/50 dark:bg-brand-slate/10">
                                        {arrangements.map((a: Arrangement) => (
                                            <label key={a.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-brand-light dark:hover:bg-brand-slate/10 p-1.5 rounded-xl border border-transparent hover:border-brand-slate/15 transition-all">
                                                <input
                                                    type="checkbox"
                                                    value={a.id}
                                                    {...register('arrangementIds')}
                                                    className="h-4 w-4 rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint cursor-pointer"
                                                />
                                                <span className="font-mono text-[10px] bg-brand-slate/10 text-brand-slate px-1.5 py-0.5 rounded font-bold uppercase">{a.code}</span>
                                                <span className="truncate flex-1 text-brand-navy dark:text-brand-light">{a.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </ModalShell>
    );
}

