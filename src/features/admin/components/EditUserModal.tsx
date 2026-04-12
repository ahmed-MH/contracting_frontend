import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useUpdateUser, type UserListItem } from '../hooks/useUsers';
import type { Hotel } from '../../hotel/services/hotel.service';
import Modal from '../../../components/ui/Modal';
import { createEditUserSchema, type EditUserFormInput, type EditUserFormValues } from '../schemas/user.schema';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserListItem | null;
    allHotels: Hotel[];
}

export default function EditUserModal({ isOpen, onClose, user, allHotels }: EditUserModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createEditUserSchema(t), [t]);
    const inputClassName = 'w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-white/10 dark:bg-white/5 dark:text-brand-light';
    const disabledInputClassName = 'w-full rounded-2xl border border-white/70 bg-brand-light px-4 py-3 text-sm text-brand-slate opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75';
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditUserFormInput, unknown, EditUserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            role: 'COMMERCIAL',
            hotelIds: [],
        },
    });

    const selectedRole = watch('role');

    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role as EditUserFormValues['role'],
                hotelIds: user.hotels ? user.hotels.map((hotel) => hotel.id) : [],
            });
        }
    }, [user, reset]);

    useEffect(() => {
        if (!isOpen) {
            reset({
                firstName: '',
                lastName: '',
                role: 'COMMERCIAL',
                hotelIds: [],
            });
        }
    }, [isOpen, reset]);

    useEffect(() => {
        if (selectedRole === 'ADMIN') {
            setValue('hotelIds', []);
        }
    }, [selectedRole, setValue]);

    const updateMutation = useUpdateUser(onClose);

    const onSubmit = (data: EditUserFormValues) => {
        if (!user) return;

        updateMutation.mutate({
            id: user.id,
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                hotelIds: data.role === 'COMMERCIAL' ? data.hotelIds : [],
            },
        });
    };

    const selectedHotelIds = watch('hotelIds');

    const toggleHotel = (hotelId: number) => {
        const current = selectedHotelIds ?? [];
        const next = current.includes(hotelId)
            ? current.filter((id) => id !== hotelId)
            : [...current, hotelId];
        setValue('hotelIds', next, { shouldDirty: true });
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pages.users.modals.edit.title', { defaultValue: 'Edit {{email}}', email: user.email })}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {!user.isActive && (
                    <div className="rounded-2xl border border-brand-slate/30 bg-brand-slate/10 px-4 py-3 text-xs leading-5 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                        {t('pages.users.modals.edit.pendingActivationHint', {
                            defaultValue: 'This user has not activated the account yet. First and last name will be set when the invite is accepted.',
                        })}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.users.modals.edit.firstName', { defaultValue: 'First Name' })}
                    </label>
                    <input {...register('firstName')} disabled={!user.isActive} className={!user.isActive ? disabledInputClassName : inputClassName} />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.users.modals.edit.lastName', { defaultValue: 'Last Name' })}
                    </label>
                    <input {...register('lastName')} disabled={!user.isActive} className={!user.isActive ? disabledInputClassName : inputClassName} />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.users.modals.edit.role', { defaultValue: 'Role' })} *
                    </label>
                    <select {...register('role')} className={inputClassName}>
                        <option value="ADMIN">{t('pages.users.roles.admin', { defaultValue: 'Administrator' })}</option>
                        <option value="COMMERCIAL">{t('pages.users.roles.commercial', { defaultValue: 'Commercial' })}</option>
                    </select>
                    <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/75">
                        {selectedRole === 'ADMIN'
                            ? t('pages.users.modals.roleHints.admin', { defaultValue: 'Global platform access (no hotel assignment required)' })
                            : t('pages.users.modals.roleHints.commercial', { defaultValue: 'Local employee, must be assigned to at least one hotel' })}
                    </p>
                </div>

                {selectedRole === 'COMMERCIAL' && allHotels.length > 0 && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.users.modals.edit.assignedHotels', { defaultValue: 'Assigned Hotels' })} *
                        </label>
                        <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                            {allHotels.map((hotel) => (
                                <label key={hotel.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-brand-navy transition hover:border-brand-mint/15 hover:bg-brand-mint/8 dark:text-brand-light dark:hover:bg-brand-mint/10">
                                    <input
                                        type="checkbox"
                                        checked={selectedHotelIds?.includes(hotel.id) ?? false}
                                        onChange={() => toggleHotel(hotel.id)}
                                        className="rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint"
                                    />
                                    <span>{hotel.name}</span>
                                </label>
                            ))}
                        </div>
                        {errors.hotelIds && <p className="mt-1 text-xs text-brand-slate">{errors.hotelIds.message}</p>}
                    </div>
                )}

                <div className="flex justify-end gap-3 border-t border-brand-slate/15 pt-3 dark:border-brand-slate/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75 dark:hover:text-white"
                    >
                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-mint disabled:opacity-50"
                    >
                        {updateMutation.isPending
                            ? t('pages.users.modals.edit.saving', { defaultValue: 'Saving...' })
                            : t('actions.save', { defaultValue: 'Save' })}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
