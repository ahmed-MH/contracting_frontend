import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, BedDouble, Users, Baby, Hash, Settings2, User } from 'lucide-react';
import type { RoomType, CreateRoomTypePayload } from '../types/room.types';
import ModalShell from '../../../components/ui/ModalShell';
import { useTranslation } from 'react-i18next';
import { createRoomTypeSchema, type RoomTypeFormInput, type RoomTypeFormValues } from '../schemas/room.schema';

interface EditRoomTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: RoomType | null;
    onSubmit: (data: CreateRoomTypePayload) => void;
    isPending: boolean;
}

export default function EditRoomTypeModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending,
}: EditRoomTypeModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createRoomTypeSchema(t), [t]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<RoomTypeFormInput, unknown, RoomTypeFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: '',
            name: '',
            minOccupancy: 1,
            maxOccupancy: 3,
            minAdults: 1,
            maxAdults: 2,
            minChildren: 0,
            maxChildren: 2,
            allowCotOverMax: false,
        },
    });

    useEffect(() => {
        if (editing) {
            reset({
                code: editing.code,
                name: editing.name,
                minOccupancy: editing.minOccupancy,
                maxOccupancy: editing.maxOccupancy,
                minAdults: editing.minAdults,
                maxAdults: editing.maxAdults,
                minChildren: editing.minChildren,
                maxChildren: editing.maxChildren,
                allowCotOverMax: editing.allowCotOverMax,
            });
        } else {
            reset({
                code: '',
                name: '',
                minOccupancy: 1,
                maxOccupancy: 3,
                minAdults: 1,
                maxAdults: 2,
                minChildren: 0,
                maxChildren: 2,
                allowCotOverMax: false,
            });
        }
    }, [editing, reset, isOpen]);

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    const onFormSubmit = (data: RoomTypeFormValues) => onSubmit(data);
    const numInputCls = 'w-full bg-white dark:bg-brand-navy border border-brand-slate/20 rounded-xl px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-brand-mint outline-none text-brand-navy dark:text-brand-light';

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
                form="room-type-form"
                type="submit"
                disabled={isPending || (!isDirty && editing !== null)}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-white text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
                {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {editing
                    ? t('pages.roomTypes.modal.update', { defaultValue: 'Update room' })
                    : t('pages.roomTypes.modal.create', { defaultValue: 'Create room' })}
            </button>
        </>
    );

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={editing
                ? t('pages.roomTypes.modal.editTitle', { defaultValue: 'Edit room' })
                : t('pages.roomTypes.modal.createTitle', { defaultValue: 'New room type' })}
            subtitle={t('pages.roomTypes.modal.subtitle', { defaultValue: 'Technical setup and capacity' })}
            icon={<BedDouble size={20} />}
            iconBg="bg-brand-mint/10 dark:bg-brand-mint/5 text-brand-mint"
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <form id="room-type-form" onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                            {t('fields.pmsCode', { defaultValue: 'PMS code' })}
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={14} />
                            <input
                                {...register('code')}
                                onChange={(event) => setValue('code', event.target.value.toUpperCase().replace(/\s/g, '').slice(0, 4), { shouldDirty: true, shouldValidate: true })}
                                className="w-full pl-9 pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-black font-mono tracking-widest text-brand-navy dark:text-brand-light"
                                placeholder={t('auto.features.rooms.components.editroomtypemodal.placeholder.31d16cf5', { defaultValue: "DBL" })}
                                maxLength={4}
                            />
                        </div>
                        {errors.code && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.code.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-2">
                            {t('fields.roomName', { defaultValue: 'Room name' })}
                        </label>
                        <input
                            {...register('name')}
                            onBlur={(event) => setValue('name', toTitleCase(event.target.value), { shouldDirty: true, shouldValidate: true })}
                            className="w-full px-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl focus:ring-2 focus:ring-brand-mint transition-all text-sm font-medium text-brand-navy dark:text-brand-light dark:placeholder:text-brand-slate"
                            placeholder={t('pages.roomTypes.modal.namePlaceholder', { defaultValue: 'ex: Standard double room' })}
                        />
                        {errors.name && <p className="mt-1.5 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="h-px flex-1 bg-brand-slate/15 dark:bg-brand-slate/20" />
                        <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">
                            {t('pages.roomTypes.modal.capacityTitle', { defaultValue: 'Capacity and occupancy' })}
                        </span>
                        <span className="h-px flex-1 bg-brand-slate/15 dark:bg-brand-slate/20" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="p-4 bg-brand-mint/5 dark:bg-brand-mint/5 rounded-2xl border border-brand-mint/20 space-y-4">
                            <div className="flex items-center gap-2 text-brand-mint mb-2">
                                <Users size={16} />
                                <span className="text-xs font-bold uppercase tracking-tight">{t('fields.totalPax', { defaultValue: 'Total pax' })}</span>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.min', { defaultValue: 'Min' })}</label>
                                <input type="number" {...register('minOccupancy', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.max', { defaultValue: 'Max' })}</label>
                                <input type="number" {...register('maxOccupancy', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                        </div>

                        <div className="p-4 bg-brand-mint/5 dark:bg-brand-mint/5 rounded-2xl border border-brand-mint/20 space-y-4">
                            <div className="flex items-center gap-2 text-brand-mint mb-2">
                                <User size={16} />
                                <span className="text-xs font-bold uppercase tracking-tight">{t('fields.adults', { defaultValue: 'Adults' })}</span>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.min', { defaultValue: 'Min' })}</label>
                                <input type="number" {...register('minAdults', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.max', { defaultValue: 'Max' })}</label>
                                <input type="number" {...register('maxAdults', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                        </div>

                        <div className="p-4 bg-brand-slate/5 dark:bg-brand-slate/10 rounded-2xl border border-brand-slate/15 dark:border-brand-slate/20 space-y-4">
                            <div className="flex items-center gap-2 text-brand-slate mb-2">
                                <Baby size={16} />
                                <span className="text-xs font-bold uppercase tracking-tight">{t('fields.children', { defaultValue: 'Children' })}</span>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.min', { defaultValue: 'Min' })}</label>
                                <input type="number" {...register('minChildren', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-slate uppercase mb-1">{t('fields.max', { defaultValue: 'Max' })}</label>
                                <input type="number" {...register('maxChildren', { valueAsNumber: true })} className={numInputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-brand-light dark:bg-brand-slate/10 rounded-2xl border border-brand-slate/15 dark:border-brand-slate/20 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-brand-navy rounded-xl shadow-sm border border-brand-slate/15 dark:border-brand-slate/20 text-brand-slate">
                            <Settings2 size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-brand-navy dark:text-brand-light">
                                {t('pages.roomTypes.modal.cotTitle', { defaultValue: 'Cot / crib' })}
                            </p>
                            <p className="text-[11px] text-brand-slate">
                                {t('pages.roomTypes.modal.cotDescription', { defaultValue: 'Allow adding a cot above max pax capacity.' })}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                        <input type="checkbox" {...register('allowCotOverMax')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-brand-slate/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-mint/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-brand-slate/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-mint" />
                    </label>
                </div>
            </form>
        </ModalShell>
    );
}
