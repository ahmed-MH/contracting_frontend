import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    IntegrationCodeBlock,
    IntegrationDetailTile,
    IntegrationHero,
    IntegrationSectionCard,
    IntegrationStatusBadge,
} from '../components/IntegrationUi';

const endpointUrl = '/api/v1/reservations/quote';
const headers = 'Content-Type: application/json\nX-API-Key: pk_test_xxxxx.your-secret';
const requestJson = `{
  "requestId": "REQ-001",
  "hotelCode": "MARRIOTT_SOUSSE",
  "partnerCode": "SOLFERIAS",
  "reservationDate": "2025-06-01",
  "checkIn": "2025-07-10",
  "checkOut": "2025-07-17",
  "currency": "EUR",
  "roomTypeCode": "SEA_VIEW",
  "boardCode": "AI",
  "adults": 2,
  "childrenAges": [5]
}`;
const successJson = `{
  "requestId": "REQ-001",
  "status": "QUOTED",
  "hotelCode": "MARRIOTT_SOUSSE",
  "partnerCode": "SOLFERIAS",
  "contract": "SUMMER-2025",
  "stay": { "checkIn": "2025-07-10", "checkOut": "2025-07-17", "nights": 7 },
  "pricing": {
    "currency": "EUR",
    "nightlyRates": [],
    "discounts": [],
    "supplements": [],
    "taxes": [],
    "totalBeforeDiscount": 1400,
    "discountAmount": 0,
    "totalBeforeTax": 1400,
    "taxAmount": 0,
    "grandTotal": 1400
  },
  "warnings": []
}`;
const failureJson = `{
  "requestId": "REQ-001",
  "status": "FAILED",
  "errorCode": "NO_ACTIVE_CONTRACT",
  "error": { "code": "NO_ACTIVE_CONTRACT", "message": "No active contract covers the requested partner and stay." },
  "message": "No active contract covers the requested partner and stay."
}`;
const curlExample = `curl -X POST https://your-pricify-domain.com${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: pk_test_xxxxx.your-secret" \\
  -d '${requestJson.replace(/\n/g, '')}'`;

export default function IntegrationDeveloperDocsPage() {
    const { t } = useTranslation('common');
    const copy = async (value: string) => {
        await navigator.clipboard.writeText(value);
        toast.success(t('pages.integrations.docs.copied'));
    };

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.docs.header.eyebrow')}
                title={t('pages.integrations.docs.header.title')}
                description={t('pages.integrations.docs.header.subtitle')}
                badge="POST /api/v1/reservations/quote"
            />

            <IntegrationSectionCard eyebrow={t('pages.integrations.docs.endpoint.eyebrow')} title={t('pages.integrations.docs.endpoint.title')} tone="success">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <IntegrationDetailTile label={t('pages.integrations.docs.blocks.endpoint')} value={endpointUrl} mono tone="success" />
                    <IntegrationDetailTile label={t('pages.integrations.endpoints.table.method')} value={<IntegrationStatusBadge tone="info" label="POST" />} />
                    <IntegrationDetailTile label={t('pages.integrations.endpoints.table.version')} value={<IntegrationStatusBadge tone="neutral" label="v1" />} />
                    <IntegrationDetailTile label={t('pages.integrations.endpoints.table.requiresApiKey')} value={<IntegrationStatusBadge tone="success" label={t('pages.integrations.endpoints.table.requiresApiKeyYes')} />} />
                </div>
            </IntegrationSectionCard>

            <IntegrationSectionCard eyebrow={t('pages.integrations.docs.purpose.eyebrow')} title={t('pages.integrations.docs.purpose.title')} tone="info">
                <div className="grid gap-4 text-sm leading-6 text-brand-slate dark:text-brand-light/75 md:grid-cols-2">
                    {['purpose', 'noReservation', 'oneRoomStay', 'reservationDate', 'currency', 'zeroTax', 'traceability', 'versioning', 'rateLimit'].map((key) => (
                        <div key={key} className="rounded-[1.25rem] border border-brand-light/70 bg-brand-light/55 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <p>{t(`pages.integrations.docs.notes.${key}`)}</p>
                        </div>
                    ))}
                </div>
            </IntegrationSectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
                <DocBlock title={t('pages.integrations.docs.blocks.endpoint')} value={endpointUrl} onCopy={copy} />
                <DocBlock title={t('pages.integrations.docs.blocks.headers')} value={headers} onCopy={copy} />
                <DocBlock title={t('pages.integrations.docs.blocks.curl')} value={curlExample} onCopy={copy} />
                <DocBlock title={t('pages.integrations.docs.blocks.request')} value={requestJson} onCopy={copy} />
                <DocBlock title={t('pages.integrations.docs.blocks.success')} value={successJson} onCopy={copy} />
                <DocBlock title={t('pages.integrations.docs.blocks.failure')} value={failureJson} onCopy={copy} />
            </div>

            <IntegrationSectionCard eyebrow={t('pages.integrations.docs.errors.eyebrow')} title={t('pages.integrations.docs.errors.title')} tone="warning">
                <div className="overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/60 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                    <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-brand-light/75 text-brand-slate dark:bg-brand-light/5">
                            <tr>
                                <th className="px-4 py-3">{t('pages.integrations.docs.errors.code')}</th>
                                <th className="px-4 py-3">{t('pages.integrations.docs.errors.meaning')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                'INVALID_API_KEY',
                                'API_USER_INACTIVE',
                                'PERMISSION_DENIED',
                                'IP_NOT_ALLOWED',
                                'RATE_LIMIT_EXCEEDED',
                                'ENDPOINT_DISABLED',
                                'INVALID_PAYLOAD',
                                'HOTEL_NOT_ALLOWED',
                                'HOTEL_NOT_FOUND',
                                'PARTNER_NOT_FOUND',
                                'ROOM_TYPE_NOT_FOUND',
                                'BOARD_NOT_FOUND',
                                'NO_ACTIVE_CONTRACT',
                                'MISSING_RATE',
                                'MIN_STAY_NOT_SATISFIED',
                                'RELEASE_DAYS_NOT_SATISFIED',
                                'CURRENCY_CONVERSION_MISSING',
                                'INTERNAL_ERROR',
                            ].map((code) => (
                                <tr key={code} className="border-t border-brand-light/70 transition hover:bg-brand-light/70 dark:border-brand-light/10 dark:hover:bg-brand-light/5">
                                    <td className="px-4 py-3 font-mono text-xs">{code}</td>
                                    <td className="px-4 py-3">{t(`pages.integrations.docs.errorMeanings.${code}`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </IntegrationSectionCard>
        </div>
    );
}

function DocBlock({ title, value, onCopy }: { title: string; value: string; onCopy: (value: string) => void }) {
    const { t } = useTranslation('common');
    return (
        <IntegrationSectionCard
            eyebrow={t('pages.integrations.docs.blocks.versionEyebrow')}
            title={title}
            actions={(
                <button type="button" onClick={() => void onCopy(value)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                    <Copy size={16} />
                    <span className="sr-only">{t('actions.copy')}</span>
                </button>
            )}
        >
            <IntegrationCodeBlock value={value} />
        </IntegrationSectionCard>
    );
}
