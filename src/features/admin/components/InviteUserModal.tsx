import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { authService } from '../../auth/services/auth.service';
import { hotelService } from '../../hotel/services/hotel.service';
import Modal from '../../../components/ui/Modal';
import { createInviteUserSchema, type InviteUserFormInput, type InviteUserFormValues } from '../schemas/user.schema';
import { USERS_QUERY_KEY } from '../hooks/useUsers';

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

    const { data: hotels = [], isLoading: isHotelsLoading } = useQuery({
        queryKey: ['hotels'],
        queryFn: hotelService.getHotels,
    });

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InviteUserFormInput, unknown, InviteUserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', role: 'ADMIN', hotelIds: [] },
    });

    const selectedRole = watch('role');
    const selectedHotelIds = watch('hotelIds') ?? [];
    const hasHotels = hotels.length > 0;
    const roleRequiresHotel = selectedRole !== 'ADMIN';
    const hasSelectedHotels = selectedHotelIds.length > 0;
    const isHotelAssignmentIncomplete = roleRequiresHotel && (!hasHotels || !hasSelectedHotels);

    useEffect(() => {
        if (!isOpen || hasHotels || selectedRole === 'ADMIN') {
            return;
        }

        setValue('role', 'ADMIN', { shouldValidate: true });
        setValue('hotelIds', [], { shouldValidate: true });
    }, [hasHotels, isOpen, selectedRole, setValue]);

    const inviteMutation = useMutation({
        mutationFn: (data: InviteUserFormValues) => authService.invite({
            email: data.email,
            role: data.role,
            hotelIds: data.role === 'ADMIN' ? [] : data.hotelIds.map(Number),
        }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: [...USERS_QUERY_KEY] });
            toast.success(result.message);
            onClose();
            reset();
        },
        onError: () => {},
    });

    const isSubmitDisabled = inviteMutation.isPending || isHotelAssignmentIncomplete;

    const onSubmit = (data: InviteUserFormValues) => {
        inviteMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
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
                        <option value="COMMERCIAL" disabled={!hasHotels}>{t('pages.users.roles.commercial', { defaultValue: 'Commercial' })}</option>
                        <option value="AGENT" disabled={!hasHotels}>{t('pages.users.roles.agent', { defaultValue: 'Agent' })}</option>
                    </select>
                    <p className={helperTextClassName}>
                        {selectedRole === 'ADMIN'
                            ? t('pages.users.modals.roleHints.admin', { defaultValue: 'Global platform access (no hotel assignment required)' })
                            : selectedRole === 'AGENT'
                                ? t('pages.users.modals.roleHints.agent', { defaultValue: 'Simulator-only user, must be assigned to at least one hotel' })
                                : t('pages.users.modals.roleHints.commercial', { defaultValue: 'Local employee, must be assigned to at least one hotel' })}
                    </p>
                    {!isHotelsLoading && !hasHotels && (
                        <div className="mt-3 rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                            {t('pages.users.modals.invite.noHotelsForLocalRoles', {
                                defaultValue: 'Create at least one hotel before inviting Commercial or Agent users. Administrator invites can be sent now.',
                            })}
                        </div>
                    )}
                </div>

                {selectedRole !== 'ADMIN' && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.users.modals.invite.assignedHotels', { defaultValue: 'Assigned Hotels' })} *
                        </label>
                        {hasHotels ? (
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
                        ) : (
                            <div className="rounded-2xl border border-dashed border-brand-slate/25 bg-brand-light/50 px-4 py-4 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                {t('pages.users.modals.invite.noHotelsAvailable', {
                                    defaultValue: 'No hotels are available for assignment yet.',
                                })}
                            </div>
                        )}
                        {errors.hotelIds && <p className="mt-1 text-xs text-brand-slate">{errors.hotelIds.message}</p>}
                        {hasHotels && !hasSelectedHotels && (
                            <p className={helperTextClassName}>
                                {t('pages.users.modals.invite.selectHotelHint', { defaultValue: 'Select at least one hotel to send this invite.' })}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 border-t border-brand-slate/15 pt-3 dark:border-brand-slate/20">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 py-2.5 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                    >
                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:cursor-not-allowed disabled:opacity-50"
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
