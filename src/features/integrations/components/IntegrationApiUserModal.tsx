import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import type { Hotel } from '../../hotel/services/hotel.service';
import { useCreateIntegrationApiUser, useUpdateIntegrationApiUser } from '../hooks/useIntegrations';
import type {
    IntegrationApiUser,
    IntegrationApiUserStatus,
    IntegrationPermission,
} from '../types/integrations.types';

interface IntegrationApiUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: IntegrationApiUser | null;
    hotels: Hotel[];
}

const INPUT_CLASS = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';

export default function IntegrationApiUserModal({
    isOpen,
    onClose,
    editingUser,
    hotels,
}: IntegrationApiUserModalProps) {
    const { t } = useTranslation('common');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<IntegrationApiUserStatus>('ACTIVE');
    const [permissions, setPermissions] = useState<IntegrationPermission[]>(['RESERVATIONS_QUOTE']);
    const [allowedHotelIds, setAllowedHotelIds] = useState<number[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        setName(editingUser?.name ?? '');
        setDescription(editingUser?.description ?? '');
        setStatus(editingUser?.status ?? 'ACTIVE');
        setPermissions(editingUser?.permissions ?? ['RESERVATIONS_QUOTE']);
        setAllowedHotelIds(editingUser?.allowedHotels.map((hotel) => hotel.id) ?? []);
    }, [editingUser, isOpen]);

    const createMutation = useCreateIntegrationApiUser(onClose);
    const updateMutation = useUpdateIntegrationApiUser(onClose);
    const isPending = createMutation.isPending || updateMutation.isPending;

    const toggleHotel = (hotelId: number) => {
        setAllowedHotelIds((current) =>
            current.includes(hotelId)
                ? current.filter((id) => id !== hotelId)
                : [...current, hotelId],
        );
    };

    const handleSubmit = () => {
        const payload = {
            name,
            description,
            status,
            permissions,
            allowedHotelIds,
        };

        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, payload });
            return;
        }

        createMutation.mutate(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingUser ? t('pages.integrations.users.modal.editTitle') : t('pages.integrations.users.modal.createTitle')}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.users.modal.name')}
                    </label>
                    <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.users.modal.description')}
                    </label>
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={3}
                        className={`${INPUT_CLASS} resize-none`}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.integrations.users.modal.status')}
                        </label>
                        <select value={status} onChange={(event) => setStatus(event.target.value as IntegrationApiUserStatus)} className={INPUT_CLASS}>
                            <option value="ACTIVE">{t('pages.integrations.status.active')}</option>
                            <option value="INACTIVE">{t('pages.integrations.status.inactive')}</option>
                        </select>
                    </div>

                    <div>
                        <p className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.integrations.users.modal.permissions')}
                        </p>
                        <label className="flex items-center gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/60 px-4 py-3 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                            <input
                                type="checkbox"
                                checked={permissions.includes('RESERVATIONS_QUOTE')}
                                onChange={(event) => setPermissions(event.target.checked ? ['RESERVATIONS_QUOTE'] : [])}
                            />
                            <span>{t('pages.integrations.permissions.reservationsQuote')}</span>
                        </label>
                    </div>
                </div>

                <div>
                    <p className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.users.modal.allowedHotels')}
                    </p>
                    <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-brand-light/70 bg-brand-light/70 p-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                        {hotels.map((hotel) => (
                            <label key={hotel.id} className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm text-brand-navy transition hover:bg-brand-mint/8 dark:text-brand-light dark:hover:bg-brand-mint/10">
                                <input
                                    type="checkbox"
                                    checked={allowedHotelIds.includes(hotel.id)}
                                    onChange={() => toggleHotel(hotel.id)}
                                />
                                <span>{hotel.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-brand-slate/15 pt-3 dark:border-brand-slate/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 py-2.5 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                    >
                        {t('actions.cancel')}
                    </button>
                    <button
                        type="button"
                        disabled={isPending || !name.trim() || allowedHotelIds.length === 0 || permissions.length === 0}
                        onClick={handleSubmit}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                    >
                        {t('actions.save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
