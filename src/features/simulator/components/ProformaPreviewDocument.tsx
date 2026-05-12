import { useEffect, useState } from 'react';
import { AlertTriangle, BedDouble, Building2, Calendar, FileText, Mail, Users, Utensils } from 'lucide-react';
import type { Hotel } from '../../hotel/types/hotel.types';
import type { DailyRate, ModifierDto, ProformaCommercialView, ProformaDiscountSource, ProformaInvoice } from '../types/simulator.types';
import {
    formatProformaCurrency,
    formatProformaDate,
    PROFORMA_DISCLAIMER,
    type ProformaPreviewLanguage,
} from '../utils/proformaFormatting';
import { resolveAssetUrl } from '../../../lib/asset-url';

interface ProformaPreviewDocumentProps {
    proforma: ProformaInvoice | null;
    hotel?: Hotel | null;
    language: ProformaPreviewLanguage;
    missingReasons: string[];
}

type RoomingSummaryItem = {
    roomName?: string;
    roomTypeName?: string;
    adults?: number;
    children?: number;
    childrenAges?: number[];
    boardTypeName?: string;
};

type CalculationRoomBreakdown = {
    roomIndex?: number;
    roomId?: number;
    roomTypeName?: string;
    roomTotalNet?: number;
    occupantsBreakdown?: {
        adults?: number;
        children?: number;
    };
    dailyRates?: DailyRate[];
};

const copy = {
    en: {
        title: 'Proforma Invoice',
        number: 'No',
        issueDate: 'Issue date',
        billTo: 'Bill To',
        stayDetails: 'Stay Details',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        bookingDate: 'Booking date',
        voucherNumber: 'Voucher / reservation',
        notSpecified: 'Not specified',
        boardType: 'Board type',
        nights: 'Nights',
        night: 'night',
        nightsValue: 'nights',
        adults: 'Adults',
        children: 'Children',
        occupancy: 'Occupancy',
        roomingList: 'Rooming List',
        pricingBreakdown: 'Detailed Pricing Breakdown',
        roomTotal: 'Room gross total',
        roomNetTotal: 'Room net total',
        date: 'Date',
        baseRate: 'Base Rate',
        netRate: 'Net Rate',
        finalRate: 'Final Rate',
        notes: 'Notes',
        noAdjustments: 'No adjustments',
        unavailable: 'Unavailable',
        stayModifiers: 'Stay modifiers',
        invoiceNotes: 'Commercial Notes',
        subtotal: 'Subtotal',
        grossSubtotal: 'Gross / subtotal before discounts',
        discounts: 'Discounts',
        discountSummary: 'Discount summary',
        netBeforeTax: 'Net before tax',
        grandTotal: 'Grand Total',
        taxStatus: 'VAT / tax',
        grossNightly: 'Nightly room amount',
        perPersonNight: 'per adult / night',
        perExtraAdultNight: 'per extra adult / night',
        perChildNight: 'per child / night',
        perRoomNight: 'per room / night',
        ofAdultRate: 'of adult rate',
        discountRate: 'discount',
        multipliedBy: 'x',
        nightlyDiscount: 'Nightly discount',
        netNightly: 'Commercial nightly rate',
        lineModeNote: 'Nightly amounts are before stay-level discounts. Discounts are summarized below.',
        inactiveOverrideTitle: 'Exceptional commercial override',
        inactiveOverrideBody: 'This proforma was generated from a non-active contract.',
        contractStatus: 'Contract status',
        overrideReason: 'Reason',
        signatureSection: 'Signature and Stamp',
        placeAndDate: 'Place and date',
        cachetStamp: 'Signature and stamp',
        missingTitle: 'Complete the required selections to preview this proforma invoice',
        missingBody: 'The invoice sheet will render as soon as the required context is available.',
        missingFallback: 'Missing invoice data',
        requiredContext: 'Required context',
        includedInSummary: 'Included in summary',
        years: 'yrs',
    },
    fr: {
        title: 'Facture proforma',
        number: 'No',
        issueDate: 'Date d emission',
        billTo: 'Facture a',
        stayDetails: 'Details du sejour',
        checkIn: 'Arrivee',
        checkOut: 'Depart',
        bookingDate: 'Date de reservation',
        voucherNumber: 'Voucher / reservation',
        notSpecified: 'Non precise',
        boardType: 'Pension',
        nights: 'Nuits',
        night: 'nuit',
        nightsValue: 'nuits',
        adults: 'Adultes',
        children: 'Enfants',
        occupancy: 'Occupation',
        roomingList: 'Rooming list',
        pricingBreakdown: 'Detail des prix par nuit',
        roomTotal: 'Total chambre brut',
        roomNetTotal: 'Total chambre net',
        date: 'Date',
        baseRate: 'Tarif base',
        netRate: 'Tarif net',
        finalRate: 'Tarif final',
        notes: 'Notes',
        noAdjustments: 'Aucun ajustement',
        unavailable: 'Indisponible',
        stayModifiers: 'Ajustements sejour',
        invoiceNotes: 'Notes commerciales',
        subtotal: 'Sous-total',
        grossSubtotal: 'Brut / sous-total avant remises',
        discounts: 'Remises',
        discountSummary: 'Resume des remises',
        netBeforeTax: 'Net avant taxe',
        grandTotal: 'Total general',
        taxStatus: 'TVA / taxe',
        grossNightly: 'Montant chambre par nuit',
        perPersonNight: 'par adulte / nuit',
        perExtraAdultNight: 'par adulte supp. / nuit',
        perChildNight: 'par enfant / nuit',
        perRoomNight: 'par chambre / nuit',
        ofAdultRate: 'du tarif adulte',
        discountRate: 'remise',
        multipliedBy: 'x',
        nightlyDiscount: 'Remise nuit',
        netNightly: 'Tarif nuit commercial',
        lineModeNote: 'Montants par nuit avant remises sejour. Remises resumees ci-dessous.',
        inactiveOverrideTitle: 'Derogation commerciale exceptionnelle',
        inactiveOverrideBody: 'Cette proforma a ete generee depuis un contrat non actif.',
        contractStatus: 'Statut contrat',
        overrideReason: 'Raison',
        signatureSection: 'Signature et cachet',
        placeAndDate: 'Lieu et date',
        cachetStamp: 'Signature et cachet',
        missingTitle: 'Completez les selections requises pour previsualiser cette facture proforma',
        missingBody: 'La facture sera generee des que le contexte requis sera disponible.',
        missingFallback: 'Donnees de facture manquantes',
        requiredContext: 'Contexte requis',
        includedInSummary: 'Inclus dans le recapitulatif',
        years: 'ans',
    },
} as const;

function translate(language: ProformaPreviewLanguage, key: keyof typeof copy.en) {
    return copy[language][key];
}

function nightsBetween(checkIn: string, checkOut: string) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function splitAddress(address?: string | null) {
    return (address ?? '')
        .split(/,\s*|\n+/)
        .map((part) => part.trim())
        .filter(Boolean);
}

function formatOccupancy(adults = 0, children = 0, t: (key: keyof typeof copy.en) => string) {
    const parts = [`${adults} ${t('adults')}`];
    if (children > 0) parts.push(`${children} ${t('children')}`);
    return parts.join(', ');
}

function cleanModifierName(name: string) {
    return name
        .replace(/^SPO\s*\((.*)\)$/i, '$1')
        .replace(/^Early Booking\s*\((.*)\)$/i, 'Early Booking - $1')
        .replace(/^Promotion\s*\((.*)\)$/i, '$1')
        .replace(/^Adulte\s+(\d+)\s+Suppl\.?$/i, 'Adulte $1')
        .replace(/\s*\+\s*/g, '\n')
        .trim();
}

function modifierLabel(modifier: ModifierDto) {
    return cleanModifierName(modifier.name);
}

function discountLabel(discount: ProformaDiscountSource) {
    return cleanModifierName(discount.commercialLabel ?? discount.label);
}

function discountKey(label: string, amount: number) {
    return `${label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}:${Math.abs(amount).toFixed(2)}`;
}

function visibleStayAdjustments(modifiers: ModifierDto[] = [], discounts: ProformaDiscountSource[] = []) {
    const discountKeys = new Set(discounts.map((discount) => discountKey(discountLabel(discount), discount.amount)));
    return modifiers.filter((modifier) => !discountKeys.has(discountKey(modifierLabel(modifier), modifier.amount)));
}

function nightlyBasisLabel(
    day: ProformaCommercialView['rooms'][number]['dailyRates'][number],
    currency: string,
    language: ProformaPreviewLanguage,
    t: (key: keyof typeof copy.en) => string,
) {
    if (Array.isArray(day.nightlyBasisParts) && day.nightlyBasisParts.length > 0) {
        return day.nightlyBasisParts
            .map((part) => {
                const unitAmount = numberOrNull(part.unitAmount);
                if (unitAmount == null) return null;
                const quantity = numberOrNull(part.quantity) ?? 1;
                const percentage = numberOrNull(part.percentageOfBase);

                if (part.type === 'adult') {
                    return `${formatProformaCurrency(unitAmount, currency, language)} ${t('perPersonNight')} ${t('multipliedBy')} ${quantity} ${t('adults')}`;
                }

                if (part.type === 'child') {
                    const percentageText = percentage != null ? ` (${percentage}% ${t('ofAdultRate')})` : '';
                    return `${formatProformaCurrency(unitAmount, currency, language)} ${t('perChildNight')}${percentageText}`;
                }

                if (part.type === 'extra_adult') {
                    const reductionPercentage = numberOrNull(part.reductionPercentage);
                    const reductionText = reductionPercentage != null && reductionPercentage > 0
                        ? ` (${t('discountRate')} ${reductionPercentage}%)`
                        : '';
                    return `${formatProformaCurrency(unitAmount, currency, language)} ${t('perExtraAdultNight')}${part.label ? ` ${part.label}` : ''}${reductionText}`;
                }

                if (part.type === 'room') {
                    return `${formatProformaCurrency(unitAmount, currency, language)} ${t('perRoomNight')}`;
                }

                const label = part.label ? `${part.label}: ` : '';
                return `${label}${formatProformaCurrency(unitAmount, currency, language)}`;
            })
            .filter(Boolean)
            .join(' + ');
    }

    if (numberOrNull(day.nightlyUnitAmount) == null) return null;

    if (day.rateMode === 'per_person' && (day.occupancyAdultsApplied ?? 0) > 0) {
        return `${formatProformaCurrency(day.nightlyUnitAmount, currency, language)} ${t('perPersonNight')} ${t('multipliedBy')} ${day.occupancyAdultsApplied} ${t('adults')}`;
    }

    if (day.rateMode === 'per_room') {
        return `${formatProformaCurrency(day.nightlyUnitAmount, currency, language)} ${t('perRoomNight')}`;
    }

    return null;
}

function dailyRateNotes(day: DailyRate, t: (key: keyof typeof copy.en) => string) {
    const notes: string[] = [];

    day.reductionsApplied?.forEach((reduction) => notes.push(modifierLabel(reduction)));
    if (day.promotionApplied) notes.push(modifierLabel(day.promotionApplied));
    day.supplementsApplied?.forEach((supplement) => notes.push(modifierLabel(supplement)));
    if (day.isAvailable === false) notes.push(`${t('unavailable')}: ${day.reason ?? 'N/A'}`);

    return notes;
}

function validThemeColor(value?: string | null) {
    return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : '#0D9488';
}

function numberOrNull(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function inactiveOverride(proforma: ProformaInvoice) {
    const calculationOverride = proforma.calculationSnapshot?.inactiveContractOverride;
    if (calculationOverride?.enabled) {
        return {
            enabled: true,
            contractStatus: calculationOverride.contractStatus ?? proforma.calculationSnapshot?.contractStatus,
            reason: calculationOverride.reason,
        };
    }

    const context = proforma.simulationInputSnapshot?.contractOverrideContext;
    if (context?.includeInactive || proforma.simulationInputSnapshot?.includeInactive) {
        return {
            enabled: true,
            contractStatus: context?.contractStatus ?? proforma.calculationSnapshot?.contractStatus,
            reason: context?.overrideReason ?? proforma.simulationInputSnapshot?.inactiveOverrideReason,
        };
    }

    return { enabled: false };
}

function issuedDate(proforma: ProformaInvoice) {
    return proforma.issuedAt ?? proforma.generatedAt;
}

function documentHotel(proforma: ProformaInvoice, hotel?: Hotel | null) {
    return proforma.documentSnapshot?.hotel ?? hotel ?? null;
}

function documentAffiliate(proforma: ProformaInvoice) {
    return proforma.documentSnapshot?.affiliate ?? proforma.affiliate ?? null;
}

function PlaceholderDocument({ language, missingReasons }: Pick<ProformaPreviewDocumentProps, 'language' | 'missingReasons'>) {
    return (
        <article id="proforma-document" className="contract-a4 mx-auto flex min-h-[297mm] w-full max-w-[210mm] items-center justify-center bg-white px-[16mm] py-[15mm] text-center text-slate-900 shadow-xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
            <div className="max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-brand-mint/30 bg-brand-mint/10 text-brand-navy">
                    <FileText size={26} />
                </div>
                <h1 className="mt-5 text-2xl font-black text-brand-navy">
                    {translate(language, 'missingTitle')}
                </h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {translate(language, 'missingBody')}
                </p>
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {translate(language, 'requiredContext')}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                        {(missingReasons.length ? missingReasons : [translate(language, 'missingFallback')]).map((reason) => (
                            <li key={reason} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-mint" />
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </article>
    );
}

export function ProformaPreviewDocument({
    proforma,
    hotel,
    language,
    missingReasons,
}: ProformaPreviewDocumentProps) {
    if (!proforma || missingReasons.length > 0) {
        return <PlaceholderDocument language={language} missingReasons={missingReasons} />;
    }

    const t = (key: keyof typeof copy.en) => translate(language, key);
    const nights = nightsBetween(proforma.checkIn, proforma.checkOut);
    const rooms = (proforma.roomingSummary ?? []) as RoomingSummaryItem[];
    const totals = proforma.totalsSnapshot;
    const calculation = proforma.calculationSnapshot as ({ roomsBreakdown?: CalculationRoomBreakdown[]; stayModifiers?: ModifierDto[]; proformaView?: ProformaCommercialView } | null);
    const proformaView = calculation?.proformaView;
    const viewTotals = proformaView?.totals;
    const commercialRooms = proformaView?.rooms ?? [];
    const dailyBreakdowns = calculation?.roomsBreakdown ?? [];
    const totalAdults = rooms.reduce((acc, room) => acc + (room.adults ?? 0), 0);
    const totalChildren = rooms.reduce((acc, room) => acc + (room.children ?? 0), 0);
    const currency = proforma.currency.toUpperCase();
    const hotelDetails = documentHotel(proforma, hotel);
    const affiliateDetails = documentAffiliate(proforma);
    const customerAddressLines = splitAddress(affiliateDetails?.address);
    const themeColor = validThemeColor(proforma.documentSnapshot?.hotel?.themeColor ?? proforma.documentThemeColor ?? hotel?.preferredThemeColor);
    const logoUrl = resolveAssetUrl(proforma.documentSnapshot?.hotel?.logoUrl ?? proforma.documentLogoUrl ?? hotel?.logoUrl);
    const [logoFailed, setLogoFailed] = useState(false);
    const override = inactiveOverride(proforma);
    const taxEnabled = viewTotals?.taxEnabled === true || totals.taxEnabled === true || proforma.taxEnabled === true;
    const taxLabel = viewTotals?.taxName ?? totals.taxName ?? t('taxStatus');
    const taxAmount = numberOrNull(viewTotals?.taxAmount) ?? numberOrNull(totals.taxAmount) ?? numberOrNull(proforma.taxAmount) ?? 0;
    const grossSubtotal = numberOrNull(viewTotals?.grossAmountBeforeDiscount) ?? numberOrNull(totals.grossAmountBeforeDiscount) ?? numberOrNull(totals.subtotal) ?? 0;
    const discountAmount = numberOrNull(viewTotals?.discountAmount) ?? numberOrNull(totals.discountAmount) ?? numberOrNull(totals.discountTotal) ?? 0;
    const netBeforeTax = numberOrNull(viewTotals?.netAmountBeforeTax) ?? numberOrNull(totals.netAmountBeforeTax) ?? numberOrNull(totals.netBeforeTax) ?? (numberOrNull(totals.grandTotal) ?? 0) - (taxEnabled ? taxAmount : 0);
    const grandTotal = numberOrNull(viewTotals?.totalAmount) ?? numberOrNull(totals.totalAmount) ?? numberOrNull(totals.grandTotal) ?? 0;
    const discountSources = proformaView?.discountSummary ?? totals.discountSources ?? [];
    const documentDiscountSources = discountSources.filter((source) => source.scope !== 'room');
    const stayAdjustments = visibleStayAdjustments(proformaView?.stayAdjustments, documentDiscountSources);
    const lineModeNote = t('lineModeNote');

    useEffect(() => {
        setLogoFailed(false);
    }, [logoUrl]);

    return (
        <article id="proforma-document" className="contract-a4 mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[16mm] py-[15mm] text-slate-900 shadow-xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
            <header className="border-b-2 pb-8" style={{ borderColor: themeColor }}>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                            {logoUrl && !logoFailed ? (
                                <img src={logoUrl} alt="" className="max-h-14 max-w-14 object-contain" onError={() => setLogoFailed(true)} />
                            ) : (
                                <Building2 size={26} style={{ color: themeColor }} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-brand-navy">
                                PROFORMA INVOICE
                            </h1>
                        <dl className="mt-4 grid gap-2 font-semibold text-slate-600">
                            <div className="flex gap-2">
                                <dt className="min-w-20 text-sm text-slate-400">{t('number')}:</dt>
                                <dd className="text-base font-black text-brand-navy">
                                    {proforma.status === 'ISSUED' || proforma.status === 'GENERATED' ? proforma.reference : 'Draft preview'}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="min-w-20 text-xs text-slate-400">{t('issueDate')}:</dt>
                                <dd className="text-xs">
                                    {proforma.status === 'ISSUED' || proforma.status === 'GENERATED'
                                        ? formatProformaDate(issuedDate(proforma), language)
                                        : 'Not issued yet'}
                                </dd>
                            </div>
                        </dl>
                        </div>
                    </div>

                    {hotelDetails && (
                        <div className="text-left sm:max-w-[45%] sm:text-right">
                            <div className="flex items-center gap-2 sm:justify-end">
                                <Building2 size={18} style={{ color: themeColor }} />
                                <span className="text-lg font-black text-brand-navy">{hotelDetails.name}</span>
                            </div>
                            {splitAddress(hotelDetails.address).map((line) => (
                                <p key={line} className="mt-1 text-xs font-semibold text-slate-500">
                                    {line}
                                </p>
                            ))}
                            {hotelDetails.phone && (
                                <p className="mt-3 text-xs font-semibold text-slate-500">
                                    Tel: {hotelDetails.phone}
                                </p>
                            )}
                            {hotelDetails.emails?.[0]?.address && (
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 sm:justify-end">
                                    <Mail size={12} />
                                    {hotelDetails.emails[0].address}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="mt-9 space-y-9">
                <section className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {t('billTo')}
                        </p>
                        <p className="mt-2 text-lg font-black text-brand-navy">{proforma.customerName}</p>
                        {proforma.customerEmail && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                                <Mail size={13} />
                                {proforma.customerEmail}
                            </p>
                        )}
                        {customerAddressLines.map((line) => (
                            <p key={line} className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                                {line}
                            </p>
                        ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {t('stayDetails')}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t('checkIn')}</dt>
                                <dd className="mt-1 font-bold text-brand-navy">{formatProformaDate(proforma.checkIn, language)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t('checkOut')}</dt>
                                <dd className="mt-1 font-bold text-brand-navy">{formatProformaDate(proforma.checkOut, language)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t('bookingDate')}</dt>
                                <dd className="mt-1 font-bold text-brand-navy">{formatProformaDate(proforma.bookingDate, language)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t('voucherNumber')}</dt>
                                <dd className="mt-1 font-bold text-brand-navy">{proforma.voucherNumber?.trim() || t('notSpecified')}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t('nights')}</dt>
                                <dd className="mt-1 font-bold text-brand-navy">{nights} {nights === 1 ? t('night') : t('nightsValue')}</dd>
                            </div>
                        </dl>
                        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-navy">
                            <Utensils size={14} style={{ color: themeColor }} />
                            <span>{proforma.boardTypeName}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-navy">
                            <Users size={14} style={{ color: themeColor }} />
                            <span>{formatOccupancy(totalAdults, totalChildren, t)}</span>
                        </div>
                    </div>
                </section>

                {override.enabled && (
                    <section className="contract-page-section rounded-lg border border-amber-300 bg-amber-50 p-5">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                                    {t('inactiveOverrideTitle')}
                                </p>
                                <p className="mt-2 text-sm font-bold text-amber-950">
                                    {t('inactiveOverrideBody')}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-amber-800">
                                    {t('contractStatus')}: {override.contractStatus ?? '-'}
                                </p>
                                {override.reason && (
                                    <p className="mt-1 text-xs font-semibold text-amber-800">
                                        {t('overrideReason')}: {override.reason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <section className="contract-page-section">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-brand-navy">
                        <BedDouble size={16} style={{ color: themeColor }} />
                        {t('roomingList')}
                    </h2>
                    <div className="grid gap-3">
                        {rooms.map((room, index) => (
                            <div key={`${room.roomName ?? 'room'}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                    {room.roomName ?? `Room ${index + 1}`}
                                </p>
                                <p className="mt-1 text-sm font-black text-brand-navy">
                                    {room.roomTypeName ?? t('includedInSummary')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {t('occupancy')}: {formatOccupancy(room.adults ?? 0, room.children ?? 0, t)}
                                    {!!room.childrenAges?.length && ` (${room.childrenAges.join(', ')} ${t('years')})`}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-400">{room.boardTypeName ?? proforma.boardTypeName}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="contract-page-section">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-brand-navy">
                        <FileText size={16} style={{ color: themeColor }} />
                        {t('pricingBreakdown')}
                    </h2>

                    <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                        {lineModeNote}
                    </p>

                    <div className="space-y-5">
                        {commercialRooms.length > 0 ? commercialRooms.map((room, roomIndex) => {
                            const roomNumber = room.roomIndex ?? roomIndex + 1;
                            const dailyRates = room.dailyRates ?? [];
                            const showNightlyDiscountColumn = dailyRates.some((day) => day.displayDiscountInRow && day.nightlyDiscountAmount > 0);

                            return (
                                <div key={`${room.roomId ?? roomNumber}-${roomIndex}`} className="overflow-hidden rounded-lg border border-slate-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                Room {roomNumber}
                                            </p>
                                            <p className="mt-1 text-sm font-black text-brand-navy">
                                                {room.roomTypeName ?? rooms[roomIndex]?.roomTypeName ?? t('includedInSummary')}
                                            </p>
                                        </div>
                                        <p className="text-sm font-black" style={{ color: themeColor }}>
                                            {t('roomTotal')}: {formatProformaCurrency(room.roomGrossAmountBeforeDiscount, currency, language)}
                                        </p>
                                    </div>

                                    {dailyRates.length > 0 ? (
                                        <div className="contract-table-scroll overflow-x-auto">
                                            <table className="contract-table w-full min-w-[720px] text-sm">
                                                <thead>
                                                    <tr className="border-y border-slate-200 bg-white">
                                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('date')}</th>
                                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('grossNightly')}</th>
                                                        {showNightlyDiscountColumn && (
                                                            <>
                                                                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('nightlyDiscount')}</th>
                                                                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('netNightly')}</th>
                                                            </>
                                                        )}
                                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('notes')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {dailyRates.map((day) => {
                                                        const notes = day.notes ?? [];
                                                        const basisLabel = nightlyBasisLabel(day, currency, language, t);
                                                        return (
                                                            <tr key={day.date} className={day.isAvailable === false ? 'bg-slate-50 text-slate-400' : undefined}>
                                                                <td className="px-4 py-3 font-bold text-brand-navy">
                                                                    <Calendar size={13} className="mr-1.5 inline" style={{ color: themeColor }} />
                                                                    {formatProformaDate(day.date, language)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-semibold text-slate-600">
                                                                    <span className="block">
                                                                        {formatProformaCurrency(day.nightlyCommercialAmount ?? day.baseNightlyAmount ?? day.grossNightlyAmount, currency, language)}
                                                                    </span>
                                                                    {basisLabel && (
                                                                        <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                                                                            {basisLabel}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                {showNightlyDiscountColumn && (
                                                                    <>
                                                                        <td className="px-4 py-3 text-right font-semibold text-red-500">
                                                                            {day.displayDiscountInRow && day.nightlyDiscountAmount ? `-${formatProformaCurrency(Math.abs(day.nightlyDiscountAmount), currency, language)}` : '-'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-black text-brand-navy">
                                                                            {formatProformaCurrency(day.netNightlyAmount, currency, language)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className="px-4 py-3">
                                                                    {notes.length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {notes.map((note) => (
                                                                                <p key={note} className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-500">
                                                                                    {cleanModifierName(note)}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs font-semibold text-slate-400">{t('noAdjustments')}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 text-sm font-semibold text-slate-500">
                                            {t('roomTotal')}: {formatProformaCurrency(room.roomGrossAmountBeforeDiscount, currency, language)}
                                        </div>
                                    )}

                                    {!!room.discountSummary?.length && (
                                        <div className="border-t border-slate-200 bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('discountSummary')}</p>
                                            <div className="mt-2 grid gap-1.5">
                                                {room.discountSummary.map((source, index) => (
                                                    <div key={`${source.label}-${index}`} className="flex justify-between gap-4 text-xs font-semibold text-slate-600">
                                                        <span>{discountLabel(source)}</span>
                                                        <span className="text-red-500">-{formatProformaCurrency(Math.abs(source.amount), currency, language)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : dailyBreakdowns.map((room, roomIndex) => {
                            const roomNumber = room.roomIndex ?? roomIndex + 1;
                            const dailyRates = room.dailyRates ?? [];

                            return (
                                <div key={`${room.roomId ?? roomNumber}-${roomIndex}`} className="overflow-hidden rounded-lg border border-slate-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                Room {roomNumber}
                                            </p>
                                            <p className="mt-1 text-sm font-black text-brand-navy">
                                                {room.roomTypeName ?? rooms[roomIndex]?.roomTypeName ?? t('includedInSummary')}
                                            </p>
                                        </div>
                                        <p className="text-sm font-black" style={{ color: themeColor }}>
                                            {t('roomNetTotal')}: {formatProformaCurrency(room.roomTotalNet, currency, language)}
                                        </p>
                                    </div>

                                    {dailyRates.length > 0 ? (
                                        <div className="contract-table-scroll overflow-x-auto">
                                            <table className="contract-table w-full min-w-[720px] text-sm">
                                                <thead>
                                                    <tr className="border-y border-slate-200 bg-white">
                                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('date')}</th>
                                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('baseRate')}</th>
                                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('netRate')}</th>
                                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('finalRate')}</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('notes')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {dailyRates.map((day) => {
                                                        const notes = dailyRateNotes(day, t);
                                                        return (
                                                            <tr key={day.date} className={day.isAvailable === false ? 'bg-slate-50 text-slate-400' : undefined}>
                                                                <td className="px-4 py-3 font-bold text-brand-navy">
                                                                    <Calendar size={13} className="mr-1.5 inline" style={{ color: themeColor }} />
                                                                    {formatProformaDate(day.date, language)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-semibold text-slate-600">
                                                                    {formatProformaCurrency(day.baseRate, currency, language)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-semibold text-slate-600">
                                                                    {formatProformaCurrency(day.netRate, currency, language)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-black text-brand-navy">
                                                                    {formatProformaCurrency(day.finalDailyRate, currency, language)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {notes.length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {notes.map((note) => (
                                                                                <p key={note} className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-500">
                                                                                    {note}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs font-semibold text-slate-400">{t('noAdjustments')}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 text-sm font-semibold text-slate-500">
                                            {t('roomNetTotal')}: {formatProformaCurrency(room.roomTotalNet, currency, language)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {documentDiscountSources.length > 0 && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('discountSummary')}</p>
                            <div className="mt-3 grid gap-2">
                                {documentDiscountSources.map((source, index) => (
                                    <div key={`${source.label}-${index}`} className="flex justify-between gap-4 text-sm font-semibold text-slate-600">
                                        <span>{discountLabel(source)}</span>
                                        <span className="text-red-500">-{formatProformaCurrency(Math.abs(source.amount), currency, language)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {stayAdjustments.length > 0 && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('stayModifiers')}</p>
                            <div className="mt-3 grid gap-2">
                                {stayAdjustments.map((modifier, index) => (
                                    <div key={`${modifier.name}-${index}`} className="flex justify-between gap-4 text-sm font-semibold text-slate-600">
                                        <span>{modifier.name}</span>
                                        <span>{formatProformaCurrency(modifier.amount, currency, language)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!!calculation?.stayModifiers?.length && !proformaView && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t('stayModifiers')}</p>
                            <div className="mt-3 grid gap-2">
                                {calculation.stayModifiers.map((modifier, index) => (
                                    <div key={`${modifier.name}-${index}`} className="flex justify-between gap-4 text-sm font-semibold text-slate-600">
                                        <span>{modifier.name}</span>
                                        <span>{formatProformaCurrency(modifier.amount, currency, language)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {proforma.notes && (
                    <section className="contract-page-section rounded-lg border border-slate-200 bg-slate-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: themeColor }}>
                            {t('invoiceNotes')}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-brand-navy">
                            {proforma.notes}
                        </p>
                    </section>
                )}

                <section className="contract-page-section flex justify-end">
                    <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-500">{t('grossSubtotal')}</span>
                                <span className="font-bold text-brand-navy">{formatProformaCurrency(grossSubtotal, currency, language)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-500">{t('discounts')}</span>
                                <span className="font-bold text-red-500">
                                    {discountAmount ? `-${formatProformaCurrency(Math.abs(discountAmount), currency, language)}` : formatProformaCurrency(0, currency, language)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-500">{t('netBeforeTax')}</span>
                                <span className="font-bold text-brand-navy">{formatProformaCurrency(netBeforeTax, currency, language)}</span>
                            </div>
                            {taxEnabled && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-500">{taxLabel}</span>
                                    <span className="font-bold text-slate-500">{formatProformaCurrency(taxAmount, currency, language)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-base font-black uppercase tracking-[0.08em] text-brand-navy">{t('grandTotal')}</span>
                                    <span className="text-2xl font-black" style={{ color: themeColor }}>
                                        {formatProformaCurrency(grandTotal, currency, language)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="contract-page-section">
                    <div className="rounded-lg border border-slate-300 p-5">
                        <p className="text-sm font-black text-brand-navy">
                            {hotelDetails?.name ?? '-'}
                        </p>
                        <div className="mt-12 grid gap-5 sm:grid-cols-2">
                            <div className="border-t border-slate-400 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                {t('placeAndDate')}
                            </div>
                            <div className="border-t border-slate-400 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                {t('cachetStamp')}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="mt-8 border-t border-slate-200 pt-5 text-center">
                <p className="text-[10px] leading-5 text-slate-400">
                    {PROFORMA_DISCLAIMER}
                </p>
            </footer>
        </article>
    );
}

export type { ProformaPreviewLanguage };
