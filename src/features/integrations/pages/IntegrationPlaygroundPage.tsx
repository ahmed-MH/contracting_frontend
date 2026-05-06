import { useEffect, useState } from 'react';
import { Copy, Plus, Trash2, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Spinner } from '../../../components/ui/Spinner';
import type { Arrangement } from '../../arrangements/types/arrangement.types';
import type { Hotel } from '../../hotel/types/hotel.types';
import { IntegrationCodeBlock, IntegrationEmptyState, IntegrationHero, IntegrationSectionCard, IntegrationStatusBadge } from '../components/IntegrationUi';
import {
    useIntegrationPlaygroundAffiliates,
    useIntegrationPlaygroundArrangements,
    useIntegrationPlaygroundHotels,
    useIntegrationPlaygroundRoomTypes,
    useRunIntegrationPlaygroundQuote,
} from '../hooks/useIntegrations';
import type {
    IntegrationPlaygroundRequest,
    IntegrationPlaygroundResponse,
} from '../types/integrations.types';

const INPUT_CLASS = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';

const createInitialRequest = (): IntegrationPlaygroundRequest => ({
    requestId: `PLAY-${Date.now()}`,
    hotelCode: '',
    partnerCode: '',
    reservationDate: '',
    checkIn: '',
    checkOut: '',
    currency: 'EUR',
    roomTypeCode: '',
    boardCode: '',
    adults: 2,
    childrenAges: [],
});

const getHotelCode = (hotel: Hotel | null | undefined) => hotel?.reference ?? hotel?.name ?? '';
const getPartnerCode = (partner: { reference?: string; companyName: string } | null | undefined) =>
    partner?.reference ?? partner?.companyName ?? '';
const getRoomTypeCode = (roomType: { code?: string | null; reference?: string | null } | null | undefined) =>
    roomType?.code ?? roomType?.reference ?? '';
const getArrangementCode = (arrangement: Arrangement | null | undefined) =>
    arrangement?.code ?? arrangement?.reference ?? '';

const isQuotedResponse = (
    response: IntegrationPlaygroundResponse | null,
): response is Extract<IntegrationPlaygroundResponse, { status: 'QUOTED' }> =>
    response?.status === 'QUOTED';

type PlaygroundValidationErrors = Partial<Record<keyof IntegrationPlaygroundRequest, string>>;

const PLAYGROUND_FIELD_IDS = {
    requestId: 'integration-playground-request-id',
    hotelId: 'integration-playground-hotel',
    hotelCode: 'integration-playground-hotel-code',
    partnerCode: 'integration-playground-partner-code',
    reservationDate: 'integration-playground-reservation-date',
    checkIn: 'integration-playground-check-in',
    checkOut: 'integration-playground-check-out',
    currency: 'integration-playground-currency',
    roomTypeCode: 'integration-playground-room-type',
    boardCode: 'integration-playground-board-code',
    adults: 'integration-playground-adults',
    jsonEditor: 'integration-playground-json-editor',
} as const;

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

const normalizePlaygroundRequest = (input: IntegrationPlaygroundRequest): IntegrationPlaygroundRequest => ({
    ...input,
    requestId: input.requestId.trim(),
    hotelCode: input.hotelCode.trim(),
    partnerCode: input.partnerCode.trim(),
    reservationDate: input.reservationDate.trim(),
    checkIn: input.checkIn.trim(),
    checkOut: input.checkOut.trim(),
    currency: input.currency.trim().toUpperCase(),
    roomTypeCode: input.roomTypeCode.trim(),
    boardCode: input.boardCode.trim(),
    adults: Number(input.adults),
    childrenAges: Array.isArray(input.childrenAges)
        ? input.childrenAges.map((age) => Number(age))
        : [],
});

const hasValidationErrors = (errors: PlaygroundValidationErrors) => Object.keys(errors).length > 0;

export default function IntegrationPlaygroundPage() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const [mode, setMode] = useState<'FORM' | 'JSON'>('FORM');
    const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
    const [requestForm, setRequestForm] = useState<IntegrationPlaygroundRequest>(() => createInitialRequest());
    const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(createInitialRequest(), null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<PlaygroundValidationErrors>({});
    const [runResult, setRunResult] = useState<ReturnType<typeof useRunIntegrationPlaygroundQuote>['data'] | null>(null);

    const { data: hotels = [] } = useIntegrationPlaygroundHotels();
    const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId) ?? null;
    const { data: affiliates = [] } = useIntegrationPlaygroundAffiliates(selectedHotelId);
    const { data: roomTypes = [] } = useIntegrationPlaygroundRoomTypes(selectedHotelId);
    const { data: arrangements = [] } = useIntegrationPlaygroundArrangements(selectedHotelId);
    const runQuoteMutation = useRunIntegrationPlaygroundQuote();

    useEffect(() => {
        const state = location.state as { prefillPayload?: IntegrationPlaygroundRequest; hotelId?: number | null } | null;
        if (!state?.prefillPayload) return;
        const payload = normalizePlaygroundRequest(state.prefillPayload);
        setRequestForm(payload);
        setJsonDraft(JSON.stringify(payload, null, 2));
        setJsonError(null);
        setFieldErrors({});
        if (state.hotelId) {
            setSelectedHotelId(state.hotelId);
        }
    }, [location.state]);

    useEffect(() => {
        if (!selectedHotelId && hotels.length > 0) {
            setSelectedHotelId(hotels[0].id);
        }
    }, [hotels, selectedHotelId]);

    useEffect(() => {
        if (!selectedHotel) return;
        setRequestForm((current) => ({
            ...current,
            hotelCode: getHotelCode(selectedHotel),
            currency: current.currency || selectedHotel.defaultCurrency || 'EUR',
        }));
    }, [selectedHotel]);

    useEffect(() => {
        if (mode === 'FORM') {
            setJsonDraft(JSON.stringify(requestForm, null, 2));
        }
    }, [mode, requestForm]);

    useEffect(() => {
        if (affiliates.length === 0) {
            setRequestForm((current) => ({ ...current, partnerCode: '' }));
            return;
        }

        setRequestForm((current) => {
            const exists = affiliates.some((partner) => getPartnerCode(partner) === current.partnerCode);
            return exists ? current : { ...current, partnerCode: getPartnerCode(affiliates[0]) };
        });
    }, [affiliates]);

    useEffect(() => {
        setRequestForm((current) => ({
            ...current,
            roomTypeCode: roomTypes.some((roomType) => getRoomTypeCode(roomType) === current.roomTypeCode)
                ? current.roomTypeCode
                : getRoomTypeCode(roomTypes[0]),
            boardCode: arrangements.some((arrangement) => getArrangementCode(arrangement) === current.boardCode)
                ? current.boardCode
                : getArrangementCode(arrangements[0]),
        }));
    }, [arrangements, roomTypes]);

    const updateForm = (patch: Partial<IntegrationPlaygroundRequest>) => {
        setRequestForm((current) => ({ ...current, ...patch }));
        setFieldErrors((current) => {
            const next = { ...current };
            for (const key of Object.keys(patch) as Array<keyof IntegrationPlaygroundRequest>) {
                delete next[key];
                if (key === 'checkIn' || key === 'checkOut') {
                    delete next.checkIn;
                    delete next.checkOut;
                }
            }
            return next;
        });
    };

    const addChildAge = () => {
        setRequestForm((current) => ({
            ...current,
            childrenAges: [...current.childrenAges, 0],
        }));
    };

    const updateChildAge = (index: number, value: number) => {
        setRequestForm((current) => ({
            ...current,
            childrenAges: current.childrenAges.map((age, ageIndex) => (ageIndex === index ? value : age)),
        }));
    };

    const removeChildAge = (index: number) => {
        setRequestForm((current) => ({
            ...current,
            childrenAges: current.childrenAges.filter((_, ageIndex) => ageIndex !== index),
        }));
    };

    const copyToClipboard = async (value: string, toastKey: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(t(toastKey));
            return;
        } catch {
            const fallbackInput = document.createElement('textarea');
            fallbackInput.value = value;
            fallbackInput.setAttribute('readonly', 'true');
            fallbackInput.style.position = 'absolute';
            fallbackInput.style.left = '-9999px';
            document.body.appendChild(fallbackInput);
            fallbackInput.select();

            try {
                const copied = document.execCommand('copy');
                if (!copied) {
                    throw new Error('copy failed');
                }
                toast.success(t(toastKey));
            } catch {
                toast.error(t('pages.integrations.playground.toasts.copyFailed'));
            } finally {
                document.body.removeChild(fallbackInput);
            }
        }
    };

    const parseJsonDraft = (): IntegrationPlaygroundRequest | null => {
        try {
            const parsed = normalizePlaygroundRequest(JSON.parse(jsonDraft) as IntegrationPlaygroundRequest);
            setJsonError(null);
            return parsed;
        } catch {
            setJsonError(t('pages.integrations.playground.json.invalid'));
            return null;
        }
    };

    const validatePayload = (payload: IntegrationPlaygroundRequest): PlaygroundValidationErrors => {
        const normalized = normalizePlaygroundRequest(payload);
        const errors: PlaygroundValidationErrors = {};

        if (!normalized.requestId) errors.requestId = t('pages.integrations.playground.validation.requestIdRequired');
        if (!normalized.hotelCode) errors.hotelCode = t('pages.integrations.playground.validation.hotelCodeRequired');
        if (!normalized.partnerCode) errors.partnerCode = t('pages.integrations.playground.validation.partnerRequired');
        if (!normalized.reservationDate) {
            errors.reservationDate = t('pages.integrations.playground.validation.reservationDateRequired');
        } else if (!isIsoDate(normalized.reservationDate)) {
            errors.reservationDate = t('pages.integrations.playground.validation.reservationDateInvalid');
        }
        if (!normalized.checkIn) {
            errors.checkIn = t('pages.integrations.playground.validation.checkInRequired');
        } else if (!isIsoDate(normalized.checkIn)) {
            errors.checkIn = t('pages.integrations.playground.validation.checkInInvalid');
        }
        if (!normalized.checkOut) {
            errors.checkOut = t('pages.integrations.playground.validation.checkOutRequired');
        } else if (!isIsoDate(normalized.checkOut)) {
            errors.checkOut = t('pages.integrations.playground.validation.checkOutInvalid');
        }
        if (
            isIsoDate(normalized.checkIn)
            && isIsoDate(normalized.checkOut)
            && new Date(normalized.checkOut).getTime() <= new Date(normalized.checkIn).getTime()
        ) {
            errors.checkOut = t('pages.integrations.playground.validation.checkOutAfterCheckIn');
        }
        if (!normalized.currency) {
            errors.currency = t('pages.integrations.playground.validation.currencyRequired');
        } else if (!/^[A-Z]{3}$/.test(normalized.currency)) {
            errors.currency = t('pages.integrations.playground.validation.currencyInvalid');
        }
        if (!normalized.roomTypeCode) errors.roomTypeCode = t('pages.integrations.playground.validation.roomTypeRequired');
        if (!normalized.boardCode) errors.boardCode = t('pages.integrations.playground.validation.boardRequired');
        if (!Number.isInteger(normalized.adults) || normalized.adults < 1) {
            errors.adults = t('pages.integrations.playground.validation.adultsInvalid');
        }
        if (normalized.childrenAges.some((age) => !Number.isFinite(age) || age < 0)) {
            errors.childrenAges = t('pages.integrations.playground.validation.childrenAgesInvalid');
        }

        return errors;
    };

    const formatJsonValidationError = (errors: PlaygroundValidationErrors) =>
        Object.values(errors)
            .filter(Boolean)
            .join('\n');

    const syncJsonToForm = (payload: IntegrationPlaygroundRequest) => {
        setRequestForm(payload);
        setFieldErrors({});
        const matchingHotel = hotels.find((hotel) => getHotelCode(hotel) === payload.hotelCode);
        if (matchingHotel) {
            setSelectedHotelId(matchingHotel.id);
        }
    };

    const handleModeChange = (nextMode: 'FORM' | 'JSON') => {
        if (nextMode === mode) return;

        if (nextMode === 'JSON') {
            setJsonDraft(JSON.stringify(requestForm, null, 2));
            setJsonError(null);
            setMode('JSON');
            return;
        }

        const parsed = parseJsonDraft();
        if (parsed) {
            const errors = validatePayload(parsed);
            if (!hasValidationErrors(errors)) {
                syncJsonToForm(parsed);
            } else {
                setJsonError(formatJsonValidationError(errors));
            }
        }

        setMode('FORM');
    };

    const runQuote = async () => {
        if (!selectedHotelId) {
            toast.error(t('pages.integrations.playground.validation.hotelRequired'));
            return;
        }

        const payload = mode === 'JSON' ? parseJsonDraft() : normalizePlaygroundRequest(requestForm);
        if (!payload) {
            return;
        }

        const errors = validatePayload(payload);
        if (hasValidationErrors(errors)) {
            if (mode === 'JSON') {
                setJsonError(formatJsonValidationError(errors));
            } else {
                setFieldErrors(errors);
            }
            return;
        }

        if (mode === 'JSON') {
            syncJsonToForm(payload);
        } else {
            setFieldErrors({});
        }

        setJsonError(null);
        setRunResult(null);

        const result = await runQuoteMutation.mutateAsync({ hotelId: selectedHotelId, payload });
        setRunResult(result);
    };

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.playground.header.eyebrow')}
                title={t('pages.integrations.playground.header.title')}
                description={t('pages.integrations.playground.header.subtitle')}
                badge={t('pages.integrations.playground.header.badge')}
            />

            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <IntegrationSectionCard
                    eyebrow={t('pages.integrations.playground.editor.eyebrow')}
                    title={t('pages.integrations.playground.editor.title')}
                    description={t('pages.integrations.playground.editor.description')}
                    actions={(
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleModeChange('FORM')}
                                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-mint/30 ${mode === 'FORM' ? 'bg-brand-navy text-brand-light shadow-md dark:bg-brand-light/12' : 'border border-brand-light/70 bg-brand-light/70 text-brand-slate hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light'}`}
                            >
                                {t('pages.integrations.playground.modes.form')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('JSON')}
                                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-mint/30 ${mode === 'JSON' ? 'bg-brand-navy text-brand-light shadow-md dark:bg-brand-light/12' : 'border border-brand-light/70 bg-brand-light/70 text-brand-slate hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light'}`}
                            >
                                {t('pages.integrations.playground.modes.json')}
                            </button>
                        </div>
                    )}
                >
                    <div className="space-y-6">
                        {mode === 'FORM' ? (
                            <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label={t('pages.integrations.playground.fields.requestId')} inputId={PLAYGROUND_FIELD_IDS.requestId} error={fieldErrors.requestId}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.requestId}
                                            value={requestForm.requestId}
                                            onChange={(event) => updateForm({ requestId: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.requestId)}
                                            className={INPUT_CLASS}
                                        />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.hotel')} inputId={PLAYGROUND_FIELD_IDS.hotelId}>
                                        <select
                                            id={PLAYGROUND_FIELD_IDS.hotelId}
                                            value={selectedHotelId ?? ''}
                                            onChange={(event) => setSelectedHotelId(event.target.value ? Number(event.target.value) : null)}
                                            className={INPUT_CLASS}
                                        >
                                            <option value="">{t('pages.integrations.playground.placeholders.selectHotel')}</option>
                                            {hotels.map((hotel) => (
                                                <option key={hotel.id} value={hotel.id}>
                                                    {hotel.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.hotelCode')} inputId={PLAYGROUND_FIELD_IDS.hotelCode} error={fieldErrors.hotelCode}>
                                        <input id={PLAYGROUND_FIELD_IDS.hotelCode} value={requestForm.hotelCode} readOnly aria-invalid={Boolean(fieldErrors.hotelCode)} className={`${INPUT_CLASS} opacity-75`} />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.partner')} inputId={PLAYGROUND_FIELD_IDS.partnerCode} error={fieldErrors.partnerCode}>
                                        <select
                                            id={PLAYGROUND_FIELD_IDS.partnerCode}
                                            value={requestForm.partnerCode}
                                            onChange={(event) => updateForm({ partnerCode: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.partnerCode)}
                                            className={INPUT_CLASS}
                                        >
                                            <option value="">{t('pages.integrations.playground.placeholders.selectPartner')}</option>
                                            {affiliates.map((partner) => (
                                                <option key={partner.id} value={getPartnerCode(partner)}>
                                                    {partner.companyName}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.reservationDate')} inputId={PLAYGROUND_FIELD_IDS.reservationDate} error={fieldErrors.reservationDate}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.reservationDate}
                                            type="date"
                                            value={requestForm.reservationDate}
                                            onChange={(event) => updateForm({ reservationDate: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.reservationDate)}
                                            className={INPUT_CLASS}
                                        />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.currency')} inputId={PLAYGROUND_FIELD_IDS.currency} error={fieldErrors.currency}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.currency}
                                            value={requestForm.currency}
                                            onChange={(event) => updateForm({ currency: event.target.value.toUpperCase() })}
                                            aria-invalid={Boolean(fieldErrors.currency)}
                                            className={INPUT_CLASS}
                                            maxLength={3}
                                        />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.checkIn')} inputId={PLAYGROUND_FIELD_IDS.checkIn} error={fieldErrors.checkIn}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.checkIn}
                                            type="date"
                                            value={requestForm.checkIn}
                                            onChange={(event) => updateForm({ checkIn: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.checkIn)}
                                            className={INPUT_CLASS}
                                        />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.checkOut')} inputId={PLAYGROUND_FIELD_IDS.checkOut} error={fieldErrors.checkOut}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.checkOut}
                                            type="date"
                                            min={requestForm.checkIn || undefined}
                                            value={requestForm.checkOut}
                                            onChange={(event) => updateForm({ checkOut: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.checkOut)}
                                            className={INPUT_CLASS}
                                        />
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.roomType')} inputId={PLAYGROUND_FIELD_IDS.roomTypeCode} error={fieldErrors.roomTypeCode}>
                                        <select
                                            id={PLAYGROUND_FIELD_IDS.roomTypeCode}
                                            value={requestForm.roomTypeCode}
                                            onChange={(event) => updateForm({ roomTypeCode: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.roomTypeCode)}
                                            className={INPUT_CLASS}
                                        >
                                            <option value="">{t('pages.integrations.playground.placeholders.selectRoomType')}</option>
                                            {roomTypes.map((roomType) => (
                                                <option key={roomType.id} value={getRoomTypeCode(roomType)}>
                                                    {getRoomTypeCode(roomType)} - {roomType.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.board')} inputId={PLAYGROUND_FIELD_IDS.boardCode} error={fieldErrors.boardCode}>
                                        <select
                                            id={PLAYGROUND_FIELD_IDS.boardCode}
                                            value={requestForm.boardCode}
                                            onChange={(event) => updateForm({ boardCode: event.target.value })}
                                            aria-invalid={Boolean(fieldErrors.boardCode)}
                                            className={INPUT_CLASS}
                                        >
                                            <option value="">{t('pages.integrations.playground.placeholders.selectBoard')}</option>
                                            {arrangements.map((arrangement) => (
                                                <option key={arrangement.id} value={getArrangementCode(arrangement)}>
                                                    {getArrangementCode(arrangement)} - {arrangement.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label={t('pages.integrations.playground.fields.adults')} inputId={PLAYGROUND_FIELD_IDS.adults} error={fieldErrors.adults}>
                                        <input
                                            id={PLAYGROUND_FIELD_IDS.adults}
                                            type="number"
                                            min={1}
                                            value={requestForm.adults}
                                            onChange={(event) => updateForm({ adults: Number(event.target.value) })}
                                            aria-invalid={Boolean(fieldErrors.adults)}
                                            className={INPUT_CLASS}
                                        />
                                    </Field>
                                </div>

                                <div className="space-y-3 rounded-3xl border border-brand-light/70 bg-brand-light/45 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                {t('pages.integrations.playground.fields.childrenAges')}
                                            </h3>
                                            <p className="text-sm text-brand-slate dark:text-brand-light/75">
                                                {t('pages.integrations.playground.children.description')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addChildAge}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-brand-light/70 bg-brand-light/70 px-3 py-2 text-sm text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                        >
                                            <Plus size={14} />
                                            {t('pages.integrations.playground.actions.addChildAge')}
                                        </button>
                                    </div>
                                    {requestForm.childrenAges.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/35 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                            {t('pages.integrations.playground.children.empty')}
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {requestForm.childrenAges.map((age, index) => (
                                                <div key={`${index}-${age}`} className="flex items-center gap-3">
                                                    <input
                                                        id={`integration-playground-child-age-${index}`}
                                                        type="number"
                                                        min={0}
                                                        value={age}
                                                        onChange={(event) => updateChildAge(index, Number(event.target.value))}
                                                        className={INPUT_CLASS}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChildAge(index)}
                                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-coral/30 bg-brand-coral/10 text-brand-coral transition"
                                                        aria-label={t('pages.integrations.playground.actions.removeChildAge')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {fieldErrors.childrenAges ? (
                                        <p className="text-sm text-brand-coral">{fieldErrors.childrenAges}</p>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void copyToClipboard(jsonDraft, 'pages.integrations.playground.toasts.requestCopied')}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                    >
                                        <Copy size={16} />
                                        {t('pages.integrations.playground.actions.copyRequest')}
                                    </button>
                                </div>
                                <textarea
                                    id={PLAYGROUND_FIELD_IDS.jsonEditor}
                                    aria-label={t('pages.integrations.playground.json.editorLabel')}
                                    value={jsonDraft}
                                    onChange={(event) => {
                                        setJsonDraft(event.target.value);
                                        setJsonError(null);
                                    }}
                                    className="min-h-[560px] w-full resize-y rounded-[1.5rem] border border-brand-navy/10 bg-brand-navy px-4 py-4 font-mono text-sm leading-6 text-brand-light shadow-inner outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10"
                                    spellCheck={false}
                                />
                                {jsonError ? (
                                    <div className="rounded-2xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral whitespace-pre-wrap break-words">
                                        {jsonError}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-slate/15 pt-4 dark:border-brand-slate/20">
                            <p className="text-sm text-brand-slate dark:text-brand-light/75">
                                {t('pages.integrations.playground.editor.helper')}
                            </p>
                            <button
                                type="button"
                                onClick={() => void runQuote()}
                                disabled={runQuoteMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                            >
                                {runQuoteMutation.isPending ? <Spinner /> : <WandSparkles size={16} />}
                                {runQuoteMutation.isPending
                                    ? t('pages.integrations.playground.actions.runningQuote')
                                    : t('pages.integrations.playground.actions.runQuote')}
                            </button>
                        </div>
                    </div>
                </IntegrationSectionCard>

                <div className="space-y-6">
                    <IntegrationSectionCard
                        eyebrow={t('pages.integrations.playground.response.eyebrow')}
                        title={t('pages.integrations.playground.response.title')}
                        description={t('pages.integrations.playground.response.description')}
                        tone={runResult ? (runResult.statusCode < 400 ? 'success' : 'danger') : 'neutral'}
                        actions={runResult ? (
                            <button
                                type="button"
                                onClick={() => void copyToClipboard(JSON.stringify(runResult.payload, null, 2), 'pages.integrations.playground.toasts.responseCopied')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                            >
                                <Copy size={16} />
                                {t('pages.integrations.playground.actions.copyResponse')}
                            </button>
                        ) : null}
                    >
                        {runQuoteMutation.isPending ? (
                            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/35 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                <span className="flex items-center gap-3">
                                    <Spinner />
                                    {t('pages.integrations.playground.response.loading')}
                                </span>
                            </div>
                        ) : !runResult ? (
                            <IntegrationEmptyState title={t('pages.integrations.playground.response.empty')} />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <IntegrationStatusBadge
                                        tone={runResult.statusCode < 400 ? 'success' : 'danger'}
                                        label={runResult.statusCode < 400
                                            ? t('pages.integrations.playground.response.success')
                                            : t('pages.integrations.playground.response.failure')}
                                    />
                                    <span className="text-sm text-brand-slate dark:text-brand-light/75">
                                        {t('pages.integrations.playground.response.httpStatus', { value: runResult.statusCode })}
                                    </span>
                                </div>

                                {isQuotedResponse(runResult.payload) ? (
                                    <>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <SummaryCard
                                                label={t('pages.integrations.playground.response.summaryGrandTotal')}
                                                value={`${runResult.payload.pricing.grandTotal} ${runResult.payload.pricing.currency}`}
                                            />
                                            <SummaryCard
                                                label={t('pages.integrations.playground.response.summaryBeforeTax')}
                                                value={`${runResult.payload.pricing.totalBeforeTax} ${runResult.payload.pricing.currency}`}
                                            />
                                            <SummaryCard
                                                label={t('pages.integrations.playground.response.summaryNights')}
                                                value={String(runResult.payload.stay.nights)}
                                            />
                                        </div>

                                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/50 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                            <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                {t('pages.integrations.playground.response.warnings')}
                                            </p>
                                            {runResult.payload.warnings.length === 0 ? (
                                                <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                                                    {t('pages.integrations.playground.response.noWarnings')}
                                                </p>
                                                ) : (
                                                <ul className="mt-2 space-y-2 text-sm text-brand-slate dark:text-brand-light/75">
                                                    {runResult.payload.warnings.map((warning) => (
                                                        <li key={warning} className="break-words">{warning}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-brand-coral/30 bg-brand-coral/10 p-4 text-sm text-brand-coral whitespace-pre-wrap break-words">
                                        <p className="font-semibold">{runResult.payload.errorCode}</p>
                                        <p className="mt-1">{runResult.payload.message}</p>
                                    </div>
                                )}

                                <IntegrationCodeBlock value={JSON.stringify(runResult.payload, null, 2)} className="max-h-[520px]" />
                            </div>
                        )}
                    </IntegrationSectionCard>

                    <IntegrationSectionCard
                        eyebrow={t('pages.integrations.playground.trace.eyebrow')}
                        title={t('pages.integrations.playground.trace.title')}
                        description={t('pages.integrations.playground.trace.description')}
                    >
                        {!runResult ? (
                            <IntegrationEmptyState title={t('pages.integrations.playground.trace.empty')} />
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                <TraceField label={t('pages.integrations.playground.trace.requestId')} value={runResult.trace.requestId} emptyLabel={t('pages.integrations.common.emptyValue')} />
                                <TraceField label={t('pages.integrations.playground.trace.durationMs')} value={runResult.trace.durationMs == null ? null : `${runResult.trace.durationMs}`} emptyLabel={t('pages.integrations.common.emptyValue')} />
                                <TraceField label={t('pages.integrations.playground.trace.endpointCode')} value={runResult.trace.endpointCode} emptyLabel={t('pages.integrations.common.emptyValue')} />
                                <TraceField label={t('pages.integrations.playground.trace.source')} value={runResult.trace.source} emptyLabel={t('pages.integrations.common.emptyValue')} />
                                <TraceField label={t('pages.integrations.playground.trace.apiContext')} value={t('pages.integrations.playground.trace.apiContextValue')} emptyLabel={t('pages.integrations.common.emptyValue')} />
                                <TraceField label={t('pages.integrations.playground.trace.errorCode')} value={runResult.trace.errorCode} emptyLabel={t('pages.integrations.common.emptyValue')} />
                            </div>
                        )}
                    </IntegrationSectionCard>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    children,
    inputId,
    error,
}: {
    label: string;
    children: React.ReactNode;
    inputId?: string;
    error?: string;
}) {
    return (
        <div>
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light">
                {label}
            </label>
            {children}
            {error ? (
                <p className="mt-2 text-sm text-brand-coral">{error}</p>
            ) : null}
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/50 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/75">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-brand-navy dark:text-brand-light">{value}</p>
        </div>
    );
}

function TraceField({ label, value, emptyLabel }: { label: string; value: string | null; emptyLabel: string }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/50 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/75">{label}</p>
            <p className="mt-2 text-sm font-medium text-brand-navy dark:text-brand-light">{value || emptyLabel}</p>
        </div>
    );
}
