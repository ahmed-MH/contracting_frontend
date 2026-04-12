import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import ModalShell from '../../../../components/ui/ModalShell';
import type { 
    ContractCancellationRule, 
    CreateContractCancellationRulePayload,
    CancellationPenaltyType 
} from '../../../catalog/cancellation/types/cancellation.types';
import type { Contract } from '../../types/contract.types';
import { useCreateContractCancellation, useUpdateContractCancellation } from '../../hooks/useContractCancellation';
import { useTranslation } from 'react-i18next';
import {
    createContractCancellationSchema,
    type ContractCancellationFormInput,
    type ContractCancellationFormValues,
} from '../schemas/contract-detail.schema';

interface EditContractCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract;
    editItem: ContractCancellationRule | null;
}

export default function EditContractCancellationModal({
    isOpen,
    onClose,
    contract,
    editItem,
}: EditContractCancellationModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractCancellationSchema(t), [t]);
    const createMutation = useCreateContractCancellation(contract.id);
    const updateMutation = useUpdateContractCancellation(contract.id);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<ContractCancellationFormInput, unknown, ContractCancellationFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            daysBeforeArrival: 2,
            appliesToNoShow: true,
            minStayCondition: null,
            penaltyType: 'NIGHTS' as CancellationPenaltyType,
            baseValue: 1,
            contractRoomIds: [],
        },
    });

    const penaltyType = watch('penaltyType');

    useEffect(() => {
        if (editItem) {
            reset({
                name: editItem.name,
                daysBeforeArrival: editItem.daysBeforeArrival,
                appliesToNoShow: editItem.appliesToNoShow,
                minStayCondition: editItem.minStayCondition,
                penaltyType: editItem.penaltyType,
                baseValue: Number(editItem.baseValue),
                contractRoomIds: editItem.applicableRooms?.map(r => r.contractRoomId) || [],
            });
        } else {
            reset({
                name: '',
                daysBeforeArrival: 2,
                appliesToNoShow: true,
                minStayCondition: null,
                penaltyType: 'NIGHTS' as CancellationPenaltyType,
                baseValue: 1,
                contractRoomIds: contract.contractRooms?.map(r => r.id) || [],
            });
        }
    }, [editItem, reset, contract, isOpen]);

    if (!isOpen) return null;

    const onSubmit = (data: ContractCancellationFormValues) => {
        const payload: CreateContractCancellationRulePayload = {
            ...data,
            minStayCondition: data.minStayCondition ?? null,
        };

        if (editItem) {
            updateMutation.mutate({
                id: editItem.id,
                payload
            }, {
                onSuccess: () => onClose()
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => onClose()
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editItem ? 'Modifier la politique' : 'Nouvelle politique d\'annulation'}
            subtitle={t('auto.features.contracts.details.modals.editcontractcancellationmodal.subtitle.94b4927c', { defaultValue: "Configuration de base" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={editItem ? 'Mettre à jour' : 'Créer la politique'}
            isSubmitting={isPending}
            submitDisabled={!isDirty}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.1e8a2055', { defaultValue: "Architecture Matrice :" })}</span> {t('auto.features.contracts.details.modals.editcontractcancellationmodal.33ef0800', { defaultValue: "L'activation par période et les pénalités surchargées se gèrent directement dans la" })} <span className="text-brand-mint font-bold">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.793e9efa', { defaultValue: "Grille Annulation" })}</span> principale.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.ad8ce36f', { defaultValue: "Nom de la règle" })}</label>
                                <input
                                    {...register('name')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light outline-none"
                                    placeholder={t('auto.features.contracts.details.modals.editcontractcancellationmodal.placeholder.03493fca', { defaultValue: "ex: Late Cancel Standard" })}
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.f08fe9c1', { defaultValue: "Jours avant Arrivée" })}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        {...register('daysBeforeArrival', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.bb28fd69', { defaultValue: "Jours" })}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.47fab217', { defaultValue: "Séjour Minimum (Libre)" })}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        {...register('minStayCondition', { valueAsNumber: true, min: 0 })}
                                        className="w-full px-4 py-2.5 bg-brand-light border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint focus:bg-white transition-all text-sm font-bold placeholder:font-medium"
                                        placeholder={t('auto.features.contracts.details.modals.editcontractcancellationmodal.placeholder.5fc68eed', { defaultValue: "Non requis" })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.7277d445', { defaultValue: "Nuits" })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-brand-mint/5 rounded-xl border border-brand-mint/20 flex items-start gap-3">
                            <div className="p-1.5 bg-white dark:bg-brand-navy/50 rounded-xl text-brand-mint shadow-sm ring-1 ring-brand-mint/20 mt-0.5">
                                <AlertCircle size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.28ba0518', { defaultValue: "Application No-Show" })}</p>
                                <p className="text-[11px] text-brand-slate mt-1 leading-relaxed">
                                    Si activé, cette règle servira également de base pour les cas de "Non-présentation".
                                </p>
                                <label className="inline-flex items-center gap-2 mt-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register('appliesToNoShow')}
                                        className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded-xl focus:ring-brand-mint cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-tight group-hover:text-brand-mint transition-colors">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.b05a2ecf', { defaultValue: "Appliquer aux No-Shows" })}</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                            <div>
                                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.73fa9da8', { defaultValue: "Type de Pénalité" })}</label>
                                <select
                                    {...register('penaltyType')}
                                    className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                >
                                    <option value="NIGHTS">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.26db5f97', { defaultValue: "Frais en Nuits" })}</option>
                                    <option value="PERCENTAGE">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.54666617', { defaultValue: "Pourcentage du séjour" })}</option>
                                    <option value="FIXED_AMOUNT">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.a2ee5b45', { defaultValue: "Montant Fixe (Total)" })}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.38bc4d83', { defaultValue: "Valeur de Base de Pénalité" })}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('baseValue', { valueAsNumber: true })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate uppercase">
                                        {penaltyType === 'NIGHTS' ? 'Nuits' : penaltyType === 'PERCENTAGE' ? '%' : '€'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                            <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-4 text-center">{t('auto.features.contracts.details.modals.editcontractcancellationmodal.7b2da6bb', { defaultValue: "Chambres concernées" })}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {contract.contractRooms?.map((room) => (
                                    <label key={room.id} className="flex items-center gap-3 p-3 bg-brand-light dark:bg-brand-slate/10 rounded-xl border border-brand-slate/20 hover:border-brand-mint transition-all cursor-pointer group has-checked:bg-brand-mint/5 has-checked:border-brand-mint/40">
                                        <input
                                            type="checkbox"
                                            value={room.id}
                                            {...register('contractRoomIds')}
                                            className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded-xl focus:ring-brand-mint cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-brand-navy dark:text-brand-light group-hover:text-brand-mint transition-colors uppercase tracking-tight">
                                                {room.roomType?.code}
                                            </span>
                                            <span className="text-[10px] text-brand-slate font-medium truncate max-w-[180px]">
                                                {room.roomType?.name}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-brand-slate/10 rounded-xl p-4 border border-brand-slate/30 flex items-center gap-3">
                                <span className="text-lg">💡</span>
                            <p className="text-[11px] font-bold text-brand-slate italic">
                                💡 L'activation par période et les surcharges se gèrent directement dans la Grille.
                            </p>
                        </div>
            </div>
        </ModalShell>
    );
}
