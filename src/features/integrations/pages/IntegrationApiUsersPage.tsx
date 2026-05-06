import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useHotels } from '../../hotel/hooks/useHotels';
import Modal from '../../../components/ui/Modal';
import IntegrationApiUserModal from '../components/IntegrationApiUserModal';
import { IntegrationDetailTile, IntegrationEmptyState, IntegrationHero, IntegrationSectionCard, IntegrationStatusBadge } from '../components/IntegrationUi';
import { useIntegrationApiUsers, useUpdateIntegrationApiUser } from '../hooks/useIntegrations';
import type { IntegrationApiUser } from '../types/integrations.types';

export default function IntegrationApiUsersPage() {
    const { t } = useTranslation('common');
    const { data: apiUsers = [], isLoading } = useIntegrationApiUsers();
    const { data: hotels = [] } = useHotels();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<IntegrationApiUser | null>(null);
    const [detailUser, setDetailUser] = useState<IntegrationApiUser | null>(null);
    const updateMutation = useUpdateIntegrationApiUser();

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.users.header.eyebrow')}
                title={t('pages.integrations.users.header.title')}
                description={t('pages.integrations.users.header.subtitle')}
                badge={t('pages.integrations.users.header.badge', { count: apiUsers.length })}
                actions={(
                    <button
                        type="button"
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.integrations.users.header.cta')}
                    </button>
                )}
            />

            <IntegrationSectionCard
                eyebrow={t('pages.integrations.users.section.eyebrow')}
                title={t('pages.integrations.users.section.title')}
                description={t('pages.integrations.users.section.description')}
            >
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                ) : apiUsers.length === 0 ? (
                    <IntegrationEmptyState title={t('pages.integrations.users.table.empty')} icon={<KeyRound size={18} />} />
                ) : (
                    <div className="overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/60 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/75 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="w-[32%] whitespace-nowrap px-5 py-4 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.users.table.name')}</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.users.table.permissions')}</th>
                                        <th className="w-44 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.users.table.hotels')}</th>
                                        <th className="w-36 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.users.table.status')}</th>
                                        <th className="w-40 whitespace-nowrap px-5 py-3 text-right font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.users.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {apiUsers.map((apiUser) => (
                                        <tr
                                            key={apiUser.id}
                                            onClick={() => setDetailUser(apiUser)}
                                            className="cursor-pointer bg-brand-light/35 transition hover:bg-brand-light/75 dark:bg-transparent dark:hover:bg-brand-light/5"
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">{apiUser.name}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/8 px-3 py-1 text-xs font-semibold text-brand-mint">
                                                    <KeyRound size={12} />
                                                    {t('pages.integrations.permissions.reservationsQuote')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-brand-slate dark:text-brand-light/75">
                                                {apiUser.allowedHotels.length}
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <IntegrationStatusBadge
                                                    tone={apiUser.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                    label={apiUser.status === 'ACTIVE' ? t('pages.integrations.status.active') : t('pages.integrations.status.inactive')}
                                                />
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setEditingUser(apiUser);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/75 text-brand-slate shadow-sm transition hover:border-brand-mint/30 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                        title={t('pages.integrations.users.actions.edit')}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            updateMutation.mutate({
                                                                id: apiUser.id,
                                                                payload: { status: apiUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
                                                            });
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/75 text-brand-slate shadow-sm transition hover:border-brand-mint/30 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                        title={apiUser.status === 'ACTIVE' ? t('pages.integrations.users.actions.deactivate') : t('pages.integrations.users.actions.activate')}
                                                    >
                                                        {apiUser.status === 'ACTIVE' ? <PowerOff size={15} /> : <Power size={15} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </IntegrationSectionCard>

            <IntegrationApiUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingUser={editingUser}
                hotels={hotels}
            />
            <Modal
                isOpen={!!detailUser}
                onClose={() => setDetailUser(null)}
                title={t('pages.integrations.users.details.title')}
                maxWidth="max-w-3xl"
            >
                {detailUser ? (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <IntegrationDetailTile label={t('pages.integrations.users.modal.name')} value={detailUser.name} />
                            <IntegrationDetailTile label={t('pages.integrations.users.modal.status')} value={detailUser.status === 'ACTIVE' ? t('pages.integrations.status.active') : t('pages.integrations.status.inactive')} />
                            <IntegrationDetailTile label={t('pages.integrations.users.modal.description')} value={detailUser.description || t('pages.integrations.users.table.noDescription')} />
                            <IntegrationDetailTile label={t('pages.integrations.users.modal.permissions')} value={t('pages.integrations.permissions.reservationsQuote')} />
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold text-brand-navy dark:text-brand-light">{t('pages.integrations.users.modal.allowedHotels')}</p>
                            <div className="flex flex-wrap gap-2">
                                {detailUser.allowedHotels.map((hotel) => (
                                    <span key={hotel.id} className="rounded-full border border-brand-light/80 bg-brand-light/80 px-3 py-1 text-xs font-medium text-brand-navy shadow-sm dark:border-brand-light/10 dark:bg-brand-light/6 dark:text-brand-light">
                                        {hotel.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
