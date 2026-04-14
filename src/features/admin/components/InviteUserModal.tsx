import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { authService } from '../../auth/services/auth.service';
import { hotelService } from '../../hotel/services/hotel.service';
import Modal from '../../../components/ui/Modal';
import { createInviteUserSchema, type InviteUserFormInput, type InviteUserFormValues } from '../schemas/user.schema';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
    const queryClient = useQueryClient();
    const { t } = useTranslation('common');
    const schema = useMemo(() => createInviteUserSchema(t), [t]);
    const inputClassName = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';
    const helperTextClassName = 'mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/75';

    const { data: hotels = [] } = useQuery({
        queryKey: ['hotels'],
        queryFn: hotelService.getHotels,
    });

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<InviteUserFormInput, unknown, InviteUserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', role: 'COMMERCIAL', hotelIds: [] },
    });

    const selectedRole = watch('role');

    const inviteMutation = useMutation({
        mutationFn: (data: InviteUserFormValues) => authService.invite({
            email: data.email,
            role: data.role,
            hotelIds: data.role === 'COMMERCIAL' ? data.hotelIds.map(Number) : [],
        }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(result.message);
            onClose();
            reset();
        },
        onError: () => {},
    });

    const onSubmit = (data: InviteUserFormValues) => {
        inviteMutation.mutate(data);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pages.users.modals.invite.title', { defaultValue: 'Invite a user' })}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.users.modals.invite.email', { defaultValue: 'Email' })} *
                    </label>
                    <input
                        type="email"
                        {...register('email')}
                        placeholder={t('pages.users.modals.invite.emailPlaceholder', { defaultValue: 'new.user@example.com' })}
                        className={inputClassName}
                    />
                    {errors.email && <p className="mt-1 text-xs text-brand-slate">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.users.modals.invite.role', { defaultValue: 'Role' })} *
                    </label>
                    <select {...register('role')} className={inputClassName}>
                        <option value="ADMIN">{t('pages.users.roles.admin', { defaultValue: 'Administrator' })}</option>
                        <option value="COMMERCIAL">{t('pages.users.roles.commercial', { defaultValue: 'Commercial' })}</option>
                    </select>
                    <p className={helperTextClassName}>
                        {selectedRole === 'ADMIN'
                            ? t('pages.users.modals.roleHints.admin', { defaultValue: 'Global platform access (no hotel assignment required)' })
                            : t('pages.users.modals.roleHints.commercial', { defaultValue: 'Local employee, must be assigned to at least one hotel' })}
                    </p>
                </div>

                {selectedRole === 'COMMERCIAL' && hotels.length > 0 && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.users.modals.invite.assignedHotels', { defaultValue: 'Assigned Hotels' })} *
                        </label>
                        <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-brand-light/70 bg-brand-light/70 p-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                            {hotels.map((hotel) => (
                                <label key={hotel.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-brand-navy transition hover:border-brand-mint/15 hover:bg-brand-mint/8 dark:text-brand-light dark:hover:bg-brand-mint/10">
                                    <input
                                        type="checkbox"
                                        value={hotel.id}
                                        {...register('hotelIds')}
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
                        className="rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 py-2.5 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                    >
                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                        type="submit"
                        disabled={inviteMutation.isPending}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                    >
                        {inviteMutation.isPending
                            ? t('pages.users.modals.invite.sending', { defaultValue: 'Sending...' })
                            : t('pages.users.modals.invite.submit', { defaultValue: 'Send invitation' })}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
