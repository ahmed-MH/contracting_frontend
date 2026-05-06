import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, ServerCog } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import IntegrationEndpointModal from '../components/IntegrationEndpointModal';
import { IntegrationDetailTile, IntegrationEmptyState, IntegrationHero, IntegrationSectionCard, IntegrationSecurityNote, IntegrationStatusBadge } from '../components/IntegrationUi';
import { useIntegrationEndpoints } from '../hooks/useIntegrations';
import type { IntegrationEndpoint } from '../types/integrations.types';

const formatDateTime = (value: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function IntegrationEndpointsPage() {
    const { t, i18n } = useTranslation('common');
    const { data: endpoints = [], isLoading } = useIntegrationEndpoints();
    const [editingEndpoint, setEditingEndpoint] = useState<IntegrationEndpoint | null>(null);
    const [detailEndpoint, setDetailEndpoint] = useState<IntegrationEndpoint | null>(null);

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.endpoints.header.eyebrow')}
                title={t('pages.integrations.endpoints.header.title')}
                description={t('pages.integrations.endpoints.header.subtitle')}
                badge={t('pages.integrations.endpoints.header.badge', { count: endpoints.length })}
            />

            <IntegrationSectionCard
                eyebrow={t('pages.integrations.endpoints.section.eyebrow')}
                title={t('pages.integrations.endpoints.section.title')}
                description={t('pages.integrations.endpoints.section.description')}
            >
                <IntegrationSecurityNote>
                    {t('pages.integrations.endpoints.section.predefinedOnly')}
                </IntegrationSecurityNote>

                {isLoading ? (
                    <div className="mt-5 flex h-32 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                ) : endpoints.length === 0 ? (
                    <div className="mt-5">
                        <IntegrationEmptyState title={t('pages.integrations.endpoints.table.empty')} icon={<ServerCog size={18} />} />
                    </div>
                ) : (
                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/60 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/75 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="w-[24%] whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.endpoints.table.code')}</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.endpoints.table.path')}</th>
                                        <th className="w-36 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.endpoints.table.status')}</th>
                                        <th className="w-44 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.endpoints.table.rateLimit')}</th>
                                        <th className="w-32 whitespace-nowrap px-5 py-3 text-right font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.endpoints.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {endpoints.map((endpoint) => (
                                        <tr
                                            key={endpoint.id}
                                            onClick={() => setDetailEndpoint(endpoint)}
                                            className="cursor-pointer bg-brand-light/35 transition hover:bg-brand-light/75 dark:bg-transparent dark:hover:bg-brand-light/5"
                                        >
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">{endpoint.code}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <IntegrationStatusBadge tone="info" label={endpoint.method} />
                                                    <span className="min-w-0 break-all font-mono text-xs text-brand-navy dark:text-brand-light">{endpoint.path}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <IntegrationStatusBadge
                                                    tone={endpoint.status === 'ACTIVE' ? 'success' : 'warning'}
                                                    label={endpoint.status === 'ACTIVE' ? t('pages.integrations.status.active') : t('pages.integrations.status.inactive')}
                                                />
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">{t('pages.integrations.endpoints.table.rateLimitValue', { value: endpoint.rateLimitPerMinute })}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setEditingEndpoint(endpoint);
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/75 text-brand-slate shadow-sm transition hover:border-brand-mint/30 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                        title={t('pages.integrations.endpoints.actions.edit')}
                                                    >
                                                        <Pencil size={15} />
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

            <IntegrationEndpointModal
                isOpen={!!editingEndpoint}
                onClose={() => setEditingEndpoint(null)}
                endpoint={editingEndpoint}
            />
            <Modal
                isOpen={!!detailEndpoint}
                onClose={() => setDetailEndpoint(null)}
                title={t('pages.integrations.endpoints.details.title')}
                maxWidth="max-w-4xl"
            >
                {detailEndpoint ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.code')} value={detailEndpoint.code} mono />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.method')} value={detailEndpoint.method} />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.path')} value={detailEndpoint.path} mono />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.version')} value={detailEndpoint.version} />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.status')} value={detailEndpoint.status === 'ACTIVE' ? t('pages.integrations.status.active') : t('pages.integrations.status.inactive')} />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.rateLimit')} value={t('pages.integrations.endpoints.table.rateLimitValue', { value: detailEndpoint.rateLimitPerMinute })} />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.requiresApiKey')} value={detailEndpoint.requiresApiKey ? t('pages.integrations.endpoints.table.requiresApiKeyYes') : t('pages.integrations.endpoints.table.requiresApiKeyNo')} />
                        <IntegrationDetailTile label={t('pages.integrations.endpoints.table.updated')} value={formatDateTime(detailEndpoint.updatedAt, i18n.language)} />
                        <IntegrationDetailTile label={t('pages.integrations.common.updatedBy')} value={detailEndpoint.updatedByName ?? t('pages.integrations.common.emptyValue')} />
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
