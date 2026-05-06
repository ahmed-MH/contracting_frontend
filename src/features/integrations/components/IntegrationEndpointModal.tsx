import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import { useUpdateIntegrationEndpoint } from '../hooks/useIntegrations';
import type { IntegrationEndpoint, IntegrationEndpointStatus } from '../types/integrations.types';

interface IntegrationEndpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    endpoint: IntegrationEndpoint | null;
}

const INPUT_CLASS = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';

export default function IntegrationEndpointModal({
    isOpen,
    onClose,
    endpoint,
}: IntegrationEndpointModalProps) {
    const { t } = useTranslation('common');
    const isApiKeyRequirementLocked = endpoint?.code === 'reservations.quote';
    const [status, setStatus] = useState<IntegrationEndpointStatus>('ACTIVE');
    const [requiresApiKey, setRequiresApiKey] = useState(true);
    const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);

    useEffect(() => {
        if (!endpoint || !isOpen) return;
        setStatus(endpoint.status);
        setRequiresApiKey(endpoint.code === 'reservations.quote' ? true : endpoint.requiresApiKey);
        setRateLimitPerMinute(endpoint.rateLimitPerMinute);
    }, [endpoint, isOpen]);

    const updateMutation = useUpdateIntegrationEndpoint(onClose);

    if (!endpoint) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pages.integrations.endpoints.modal.title')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4">
                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/65 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/75">{endpoint.code}</p>
                    <p className="mt-2 text-lg font-semibold text-brand-navy dark:text-brand-light">{endpoint.method} {endpoint.path}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.integrations.endpoints.modal.status')}
                        </label>
                        <select value={status} onChange={(event) => setStatus(event.target.value as IntegrationEndpointStatus)} className={INPUT_CLASS}>
                            <option value="ACTIVE">{t('pages.integrations.status.active')}</option>
                            <option value="INACTIVE">{t('pages.integrations.status.inactive')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                            {t('pages.integrations.endpoints.modal.rateLimit')}
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={rateLimitPerMinute}
                            onChange={(event) => setRateLimitPerMinute(Number(event.target.value))}
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/65 px-4 py-3 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                    <input
                        type="checkbox"
                        checked={requiresApiKey}
                        disabled={isApiKeyRequirementLocked}
                        onChange={(event) => setRequiresApiKey(event.target.checked)}
                    />
                    <div>
                        <p>{t('pages.integrations.endpoints.modal.requiresApiKey')}</p>
                        {isApiKeyRequirementLocked ? (
                            <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/75">
                                {t('pages.integrations.endpoints.modal.requiresApiKeyLocked')}
                            </p>
                        ) : null}
                    </div>
                </label>

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
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: endpoint.id, payload: { status, requiresApiKey, rateLimitPerMinute } })}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                    >
                        {t('actions.save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
