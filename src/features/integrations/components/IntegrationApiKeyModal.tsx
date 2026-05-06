import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import { useCreateIntegrationApiKey, useUpdateIntegrationApiKey } from '../hooks/useIntegrations';
import type { IntegrationApiKey, IntegrationApiKeyEnvironment, IntegrationApiUser } from '../types/integrations.types';

interface IntegrationApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiUsers: IntegrationApiUser[];
    onCreated: (rawKey: string) => void;
    apiKey?: IntegrationApiKey | null;
}

const INPUT_CLASS = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';

export default function IntegrationApiKeyModal({
    isOpen,
    onClose,
    apiUsers,
    onCreated,
    apiKey,
}: IntegrationApiKeyModalProps) {
    const { t } = useTranslation('common');
    const [apiUserId, setApiUserId] = useState<number>(apiUsers[0]?.id ?? 0);
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [environment, setEnvironment] = useState<IntegrationApiKeyEnvironment>('TEST');
    const [allowedIps, setAllowedIps] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setApiUserId(apiKey?.apiUserId ?? apiUsers[0]?.id ?? 0);
        setName(apiKey?.name ?? '');
        setExpiresAt(apiKey?.expiresAt ? apiKey.expiresAt.slice(0, 10) : '');
        setEnvironment(apiKey?.environment ?? 'TEST');
        setAllowedIps((apiKey?.allowedIps ?? []).join('\n'));
    }, [apiKey, apiUsers, isOpen]);

    const createMutation = useCreateIntegrationApiKey((rawKey) => {
        onCreated(rawKey);
        onClose();
    });
    const updateMutation = useUpdateIntegrationApiKey(onClose);
    const parsedAllowedIps = allowedIps.split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
    const isEditing = !!apiKey;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('pages.integrations.keys.modal.editTitle') : t('pages.integrations.keys.modal.createTitle')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4">
                <div className={isEditing ? 'opacity-70' : ''}>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.keys.modal.apiUser')}
                    </label>
                    <select disabled={isEditing} value={apiUserId} onChange={(event) => setApiUserId(Number(event.target.value))} className={INPUT_CLASS}>
                        {apiUsers.map((apiUser) => (
                            <option key={apiUser.id} value={apiUser.id}>
                                {apiUser.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={isEditing ? 'opacity-70' : ''}>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.keys.modal.environment')}
                    </label>
                    <select
                        disabled={isEditing}
                        value={environment}
                        onChange={(event) => setEnvironment(event.target.value as IntegrationApiKeyEnvironment)}
                        className={INPUT_CLASS}
                    >
                        <option value="TEST">{t('pages.integrations.keys.environment.test')}</option>
                        <option value="PRODUCTION">{t('pages.integrations.keys.environment.production')}</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.keys.modal.name')}
                    </label>
                    <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.keys.modal.expiresAt')}
                    </label>
                    <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={INPUT_CLASS} />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                        {t('pages.integrations.keys.modal.allowedIps')}
                    </label>
                    <textarea
                        value={allowedIps}
                        onChange={(event) => setAllowedIps(event.target.value)}
                        className={`${INPUT_CLASS} min-h-28`}
                        placeholder={t('pages.integrations.keys.modal.allowedIpsPlaceholder')}
                    />
                    <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/75">
                        {t('pages.integrations.keys.modal.allowedIpsHint')}
                    </p>
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
                        disabled={createMutation.isPending || updateMutation.isPending || !apiUserId || !name.trim()}
                        onClick={() => {
                            const payload = { name, expiresAt: expiresAt || null, allowedIps: parsedAllowedIps };
                            if (apiKey) {
                                updateMutation.mutate({ id: apiKey.id, payload });
                                return;
                            }
                            createMutation.mutate({ apiUserId, environment, ...payload });
                        }}
                        className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                    >
                        {t('actions.save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
