import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, Calendar, Percent, CreditCard, Clock } from 'lucide-react';
import ModalShell from '../../../../components/ui/ModalShell';
import { useUpdateContractEarlyBooking } from '../../hooks/useContractEarlyBookings';
import type { ContractEarlyBooking, UpdateContractEarlyBookingPayload } from '../../../catalog/early-bookings/types/early-bookings.types';
import type { Period, ContractRoom } from '../../types/contract.types';
import { useTranslation } from 'react-i18next';
import {
    createContractEarlyBookingSchema,
    type ContractEarlyBookingFormInput,
    type ContractEarlyBookingFormValues,
} from '../schemas/contract-detail.schema';

interface Props {
    contractId: number;
    eb: ContractEarlyBooking;
    isOpen: boolean;
    onClose: () => void;
    contractRooms: ContractRoom[];
    periods: Period[];
}

export default function EditContractEarlyBookingModal({
    contractId, eb, isOpen, onClose, contractRooms,
}: Props) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractEarlyBookingSchema(t), [t]);
    const updateMutation = useUpdateContractEarlyBooking(contractId);

    const buildDefaults = (src: ContractEarlyBooking): ContractEarlyBookingFormInput => ({
        name: src.name,
        calculationType: src.calculationType,
        value: src.value,
        releaseDays: src.releaseDays,
        bookingWindowStart: src.bookingWindowStart || '',
        bookingWindowEnd: src.bookingWindowEnd || '',
        stayWindowStart: src.stayWindowStart || '',
        stayWindowEnd: src.stayWindowEnd || '',
        isPrepaid: src.isPrepaid,
        prepaymentPercentage: src.prepaymentPercentage || undefined,
        prepaymentDeadlineDate: src.prepaymentDeadlineDate || '',
        roomingListDeadlineDate: src.roomingListDeadlineDate || '',
        applicableContractRoomIds: src.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) as number[] ?? [],
        applicationType: src.applicationType || 'PER_NIGHT_PER_PERSON',
    });

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<ContractEarlyBookingFormInput, unknown, ContractEarlyBookingFormValues>({
        resolver: zodResolver(schema),
        defaultValues: buildDefaults(eb),
    });

    useEffect(() => { if (eb) reset(buildDefaults(eb)); }, [eb, reset]);

    const selectedRoomIds = watch('applicableContractRoomIds');
    const toggleRoom = (id: number) => {
        const cur = selectedRoomIds ?? [];
        setValue('applicableContractRoomIds', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], { shouldDirty: true });
    };

    const isPrepaid = watch('isPrepaid');
    const calcType = watch('calculationType');

    const onSubmit = (data: ContractEarlyBookingFormValues) => {
        const payload: UpdateContractEarlyBookingPayload = {
            name: data.name,
            calculationType: data.calculationType,
            value: data.value,
            releaseDays: data.releaseDays,
            bookingWindowStart: data.bookingWindowStart || null,
            bookingWindowEnd: data.bookingWindowEnd || null,
            stayWindowStart: data.stayWindowStart || null,
            stayWindowEnd: data.stayWindowEnd || null,
            isPrepaid: data.isPrepaid,
            applicableContractRoomIds: data.applicableContractRoomIds,
            applicationType: data.applicationType,
        };

        if (data.isPrepaid) {
            payload.prepaymentPercentage = data.prepaymentPercentage || null;
            payload.prepaymentDeadlineDate = data.prepaymentDeadlineDate || null;
            payload.roomingListDeadlineDate = data.roomingListDeadlineDate || null;
        } else {
            payload.prepaymentPercentage = null;
            payload.prepaymentDeadlineDate = null;
            payload.roomingListDeadlineDate = null;
        }

        updateMutation.mutate({ ebId: eb.id, data: payload }, { onSuccess: onClose });
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('auto.features.contracts.details.modals.editcontractearlybookingmodal.title.ba6e41ad', { defaultValue: "Modifier l'Early Booking" })}
            subtitle={t('auto.features.contracts.details.modals.editcontractearlybookingmodal.subtitle.db23e114', { defaultValue: "Configuration de base · Coquille" })}
            onSubmit={handleSubmit(onSubmit)}
            submitLabel={t('auto.features.contracts.details.modals.editcontractearlybookingmodal.submitLabel.dde4da7b', { defaultValue: "Sauvegarder la Coquille" })}
            isSubmitting={updateMutation.isPending}
            submitDisabled={!isDirty}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                        {/* Info Alert */}
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-xl p-4 flex gap-3 text-brand-slate shadow-sm">
                            <p className="text-xs leading-relaxed font-medium">
                                💡 <span className="font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.a763840e', { defaultValue: "Architecture Matrice :" })}</span> {t('auto.features.contracts.details.modals.editcontractearlybookingmodal.8bb670f6', { defaultValue: "L'activation par période et les surcharges se gèrent directement dans la" })} <span className="text-brand-mint font-bold">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.2abd761e', { defaultValue: "Grille Early Bookings" })}</span>. Cette modale définit les paramètres globaux de la "Coquille".
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                                <Tag size={12} className="text-brand-slate" /> Nom de l'offre
                            </label>
                            <input type="text" {...register('name')}
                                className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light outline-none"
                                placeholder={t('auto.features.contracts.details.modals.editcontractearlybookingmodal.placeholder.f329185c', { defaultValue: "ex: Early Bird 60 Jours" })} />
                            {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                        </div>

                        {/* Types & Release Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Calc & App Mode */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider">
                                    <Percent size={12} className="text-brand-slate" /> Type & Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        {...register('calculationType')}
                                        className="px-3 py-2.5 bg-brand-mint/5 border border-brand-mint/20 rounded-xl text-xs text-brand-mint font-bold outline-none focus:ring-2 focus:ring-brand-mint cursor-pointer"
                                    >
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.4e1922d7', { defaultValue: "Fixe" })}</option>
                                    </select>
                                    <select
                                        {...register('applicationType')}
                                        className="px-3 py-2.5 bg-brand-mint/5 border border-brand-mint/20 rounded-xl text-[10px] text-brand-mint font-bold outline-none focus:ring-2 focus:ring-brand-mint cursor-pointer"
                                    >
                                        <option value="PER_NIGHT_PER_PERSON">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.391bb95e', { defaultValue: "Par Nuit & Pers." })}</option>
                                        <option value="PER_NIGHT_PER_ROOM">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.31b2075b', { defaultValue: "Par Chambre & Nuit" })}</option>
                                        <option value="FLAT_RATE_PER_STAY">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.4a65af00', { defaultValue: "Forfait / Séjour" })}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Release Days */}
                            <div className="space-y-4">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider">
                                        <Clock size={12} className="text-brand-slate" /> Release (jours)
                                    </label>
                                    <input type="number" min="0" {...register('releaseDays', { valueAsNumber: true })}
                                        className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-bold text-brand-navy dark:text-brand-light outline-none"
                                        placeholder="60" />
                            </div>
                        </div>

                        {/* Value Input (Standalone for clarity) */}
                        <div className="bg-brand-slate/10 p-4 rounded-xl border border-brand-slate/30 flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.456c26d9', { defaultValue: "Montant de la réduction" })}</span>
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('value', { valueAsNumber: true })}
                                    className="w-full pl-4 pr-10 py-2 bg-brand-light border border-brand-slate/30 rounded-xl text-sm font-black text-brand-slate focus:ring-2 focus:ring-brand-mint outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-slate">
                                    {calcType === 'PERCENTAGE' ? '%' : 'TND'}
                                </span>
                            </div>
                        </div>

                        {/* Booking & Stay Windows */}
                        <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                            <p className="text-xs font-bold text-brand-mint uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Calendar size={12} /> Fenêtres de validité
                                <span className="font-normal normal-case text-brand-slate/50">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.08b9f13f', { defaultValue: "(optionnel)" })}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.ff3bcbdd', { defaultValue: "Réservation du" })}</label>
                                        <input type="date" {...register('bookingWindowStart')} className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm dark:text-brand-light outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.a9ae2dad', { defaultValue: "Séjour du" })}</label>
                                        <input type="date" {...register('stayWindowStart')} className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm dark:text-brand-light outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.4e80ea26', { defaultValue: "Réservation au" })}</label>
                                        <input type="date" {...register('bookingWindowEnd')} className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm dark:text-brand-light outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-slate uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.7be5077d', { defaultValue: "Séjour au" })}</label>
                                        <input type="date" {...register('stayWindowEnd')} className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm dark:text-brand-light outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prepayment */}
                        <div className="pt-4 border-t border-brand-slate/20">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-brand-mint uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={12} /> Conditions de Paiement
                                </p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register('isPrepaid')} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-brand-slate/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-light after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-mint">
                                    </div>
                                    <span className="ml-2 text-xs font-bold text-brand-slate uppercase tracking-wide">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.0776f351', { defaultValue: "Exiger prépaiement" })}</span>
                                </label>
                            </div>
                            {isPrepaid && (
                                <div className="grid grid-cols-3 gap-4 bg-brand-mint/5 p-4 rounded-xl border border-brand-mint/20">
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-mint uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.95035f80', { defaultValue: "Pourcentage" })}</label>
                                        <input type="number" min="0" max="100" {...register('prepaymentPercentage', { valueAsNumber: true })} className="w-full px-3 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-mint/20 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none dark:text-brand-light" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-mint uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.efb0d730', { defaultValue: "Limite Prépay." })}</label>
                                        <input type="date" {...register('prepaymentDeadlineDate')} className="w-full px-3 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-mint/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none dark:text-brand-light" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-mint uppercase tracking-wider mb-1.5">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.71c589dd', { defaultValue: "Limite Rooming" })}</label>
                                        <input type="date" {...register('roomingListDeadlineDate')} className="w-full px-3 py-2 bg-brand-light dark:bg-brand-navy/50 border border-brand-mint/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none dark:text-brand-light" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Room Targeting */}
                        {contractRooms.length > 0 && (
                            <div className="pt-4 border-t border-brand-slate/15 dark:border-brand-slate/20">
                                <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-4 text-center">{t('auto.features.contracts.details.modals.editcontractearlybookingmodal.04248244', { defaultValue: "Chambres concernées" })}</label>
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
