import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, RefreshCw, ShieldX } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import IntegrationApiKeyModal from '../components/IntegrationApiKeyModal';
import RawApiKeyModal from '../components/RawApiKeyModal';
import { IntegrationDetailTile, IntegrationEmptyState, IntegrationHero, IntegrationSectionCard, IntegrationStatusBadge } from '../components/IntegrationUi';
import { useIntegrationApiKeys, useIntegrationApiUsers, useRevokeIntegrationApiKey, useRotateIntegrationApiKey } from '../hooks/useIntegrations';
import { useConfirm } from '../../../context/ConfirmContext';
import type { IntegrationApiKey } from '../types/integrations.types';

const formatDateTime = (value: string | null, locale: string, fallback: string) =>
    value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : fallback;

export default function IntegrationApiKeysPage() {
    const { t, i18n } = useTranslation('common');
    const { confirm } = useConfirm();
    const { data: apiKeys = [], isLoading } = useIntegrationApiKeys();
    const { data: apiUsers = [] } = useIntegrationApiUsers();
    const revokeMutation = useRevokeIntegrationApiKey();
    const rotateMutation = useRotateIntegrationApiKey((nextRawKey) => setRawKey(nextRawKey));
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingApiKey, setEditingApiKey] = useState<IntegrationApiKey | null>(null);
    const [detailApiKey, setDetailApiKey] = useState<IntegrationApiKey | null>(null);
    const [rawKey, setRawKey] = useState<string | null>(null);

    const activeUsers = useMemo(() => apiUsers.filter((apiUser) => apiUser.status === 'ACTIVE'), [apiUsers]);

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.keys.header.eyebrow')}
                title={t('pages.integrations.keys.header.title')}
                description={t('pages.integrations.keys.header.subtitle')}
                badge={t('pages.integrations.keys.header.badge', { count: apiKeys.length })}
                actions={(
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.integrations.keys.header.cta')}
                    </button>
                )}
            />

            <IntegrationSectionCard
                eyebrow={t('pages.integrations.keys.section.eyebrow')}
                title={t('pages.integrations.keys.section.title')}
                description={t('pages.integrations.keys.section.description')}
            >
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                ) : apiKeys.length === 0 ? (
                    <IntegrationEmptyState title={t('pages.integrations.keys.table.empty')} icon={<RefreshCw size={18} />} />
                ) : (
                    <div className="overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/60 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/75 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="w-[24%] whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.prefix')}</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.apiUser')}</th>
                                        <th className="w-36 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.environment')}</th>
                                        <th className="w-36 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.status')}</th>
                                        <th className="w-44 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.lastUsedAt')}</th>
                                        <th className="w-44 whitespace-nowrap px-5 py-3 text-right font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.keys.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {apiKeys.map((apiKey) => (
                                        <tr
                                            key={apiKey.id}
                                            onClick={() => setDetailApiKey(apiKey)}
                                            className="cursor-pointer bg-brand-light/35 transition hover:bg-brand-light/75 dark:bg-transparent dark:hover:bg-brand-light/5"
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-mono text-sm font-semibold text-brand-navy dark:text-brand-light">{apiKey.prefix}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-medium text-brand-navy dark:text-brand-light">{apiKey.apiUser?.name ?? t('pages.integrations.common.emptyValue')}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <IntegrationStatusBadge
                                                    tone={apiKey.environment === 'PRODUCTION' ? 'production' : 'test'}
                                                    label={t(`pages.integrations.keys.environment.${apiKey.environment === 'PRODUCTION' ? 'production' : 'test'}`)}
                                                />
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <IntegrationStatusBadge
                                                    tone={apiKey.status === 'ACTIVE' ? 'success' : apiKey.status === 'EXPIRED' ? 'warning' : 'danger'}
                                                    label={t(`pages.integrations.keys.status.${apiKey.status.toLowerCase()}`)}
                                                />
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                {formatDateTime(apiKey.lastUsedAt, i18n.language, t('pages.integrations.common.emptyValue'))}
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setEditingApiKey(apiKey);
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/75 text-brand-slate shadow-sm transition hover:border-brand-mint/30 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                        title={t('pages.integrations.keys.actions.edit')}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={apiKey.status !== 'ACTIVE' || rotateMutation.isPending}
                                                        onClick={async (event) => {
                                                            event.stopPropagation();
                                                            if (apiKey.status !== 'ACTIVE') return;
                                                            if (await confirm({
                                                                title: t('pages.integrations.keys.confirmRotate.title'),
                                                                description: t('pages.integrations.keys.confirmRotate.description'),
                                                                confirmLabel: t('pages.integrations.keys.confirmRotate.confirmLabel'),
                                                            })) {
                                                                rotateMutation.mutate({
                                                                    id: apiKey.id,
                                                                    payload: {
                                                                        name: `${apiKey.name} rotation`,
                                                                        expiresAt: apiKey.expiresAt,
                                                                        allowedIps: apiKey.allowedIps ?? [],
                                                                    },
                                                                });
                                                            }
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/75 text-brand-slate shadow-sm transition hover:border-brand-mint/30 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 disabled:opacity-40 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                        title={t('pages.integrations.keys.actions.rotate')}
                                                    >
                                                        <RefreshCw size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={apiKey.status !== 'ACTIVE'}
                                                        onClick={async (event) => {
                                                            event.stopPropagation();
                                                            if (apiKey.status !== 'ACTIVE') return;
                                                            if (await confirm({
                                                                title: t('pages.integrations.keys.confirmRevoke.title'),
                                                                description: t('pages.integrations.keys.confirmRevoke.description'),
                                                                confirmLabel: t('pages.integrations.keys.confirmRevoke.confirmLabel'),
                                                                variant: 'danger',
                                                            })) {
                                                                revokeMutation.mutate(apiKey.id);
                                                            }
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-coral/25 bg-brand-coral/8 text-brand-coral shadow-sm transition hover:bg-brand-coral/12 focus:outline-none focus:ring-2 focus:ring-brand-coral/25 disabled:opacity-40"
                                                        title={t('pages.integrations.keys.actions.revoke')}
                                                    >
                                                        <ShieldX size={15} />
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

            <IntegrationApiKeyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                apiUsers={activeUsers}
                onCreated={(nextRawKey) => setRawKey(nextRawKey)}
            />
            <IntegrationApiKeyModal
                isOpen={!!editingApiKey}
                onClose={() => setEditingApiKey(null)}
                apiUsers={apiUsers}
                apiKey={editingApiKey}
                onCreated={(nextRawKey) => setRawKey(nextRawKey)}
            />
            <RawApiKeyModal isOpen={!!rawKey} rawKey={rawKey} onClose={() => setRawKey(null)} />
            <Modal
                isOpen={!!detailApiKey}
                onClose={() => setDetailApiKey(null)}
                title={t('pages.integrations.keys.details.title')}
                maxWidth="max-w-4xl"
            >
                {detailApiKey ? (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.prefix')} value={detailApiKey.prefix} mono />
                            <IntegrationDetailTile label={t('pages.integrations.keys.modal.name')} value={detailApiKey.name} />
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.apiUser')} value={detailApiKey.apiUser?.name ?? t('pages.integrations.common.emptyValue')} />
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.environment')} value={t(`pages.integrations.keys.environment.${detailApiKey.environment === 'PRODUCTION' ? 'production' : 'test'}`)} />
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.status')} value={t(`pages.integrations.keys.status.${detailApiKey.status.toLowerCase()}`)} />
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.expiresAt')} value={formatDateTime(detailApiKey.expiresAt, i18n.language, t('pages.integrations.common.emptyValue'))} />
                            <IntegrationDetailTile label={t('pages.integrations.keys.table.lastUsedAt')} value={formatDateTime(detailApiKey.lastUsedAt, i18n.language, t('pages.integrations.common.emptyValue'))} />
                            <IntegrationDetailTile
                                label={t('pages.integrations.keys.table.rotation')}
                                value={detailApiKey.rotatedFrom?.prefix
                                    ? t('pages.integrations.keys.table.rotatedFrom', { prefix: detailApiKey.rotatedFrom.prefix })
                                    : detailApiKey.rotatedTo?.prefix
                                        ? t('pages.integrations.keys.table.rotatedTo', { prefix: detailApiKey.rotatedTo.prefix })
                                        : t('pages.integrations.common.emptyValue')}
                                mono
                            />
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold text-brand-navy dark:text-brand-light">{t('pages.integrations.keys.table.allowedIps')}</p>
                            {(detailApiKey.allowedIps ?? []).length === 0 ? (
                                <p className="text-sm text-brand-slate dark:text-brand-light/70">{t('pages.integrations.keys.table.unrestricted')}</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(detailApiKey.allowedIps ?? []).map((ip) => (
                                        <span key={ip} className="rounded-full border border-brand-light/80 bg-brand-light/80 px-3 py-1 font-mono text-xs text-brand-navy shadow-sm dark:border-brand-light/10 dark:bg-brand-light/6 dark:text-brand-light">
                                            {ip}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
