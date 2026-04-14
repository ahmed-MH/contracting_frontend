import type { ReactNode } from 'react';
import type { Contract, ContractRoom, Period } from '../types/contract.types';
import type { ContractLineData } from '../services/contract.service';
import type { Hotel } from '../../hotel/types/hotel.types';
import type { ContractSupplement } from '../../catalog/supplements/types/supplements.types';
import type { ContractReduction } from '../../catalog/reductions/types/reductions.types';
import type { ContractEarlyBooking } from '../../catalog/early-bookings/types/early-bookings.types';
import type { ContractSpo } from '../../catalog/spos/types/spos.types';
import type { ContractMonoparentalRule } from '../../catalog/monoparental/types/monoparental.types';
import type { ContractCancellationRule } from '../../catalog/cancellation/types/cancellation.types';

interface AffiliateParty {
    id: number;
    reference?: string;
    companyName: string;
    representativeName?: string | null;
    address?: string | null;
    phone?: string | null;
    emails?: { label: string; address: string }[];
}

interface RateCell {
    arrangement: string;
    amount: number;
    minStay?: number;
    releaseDays?: number;
}

interface PeriodTarget {
    period?: (Partial<Period> & { id: number });
    periodId?: number;
}

interface RoomTarget {
    contractRoom?: {
        roomType?: {
            name?: string | null;
        } | null;
    } | null;
}

interface PeriodMatrixRow {
    key: string | number;
    baseCells: ReactNode[];
    periodValues: Map<number, ReactNode>;
    applicablePeriodIds: Set<number>;
}

const MAX_MATRIX_PERIODS = 7;

export interface ContractPreviewData {
    contract: Contract;
    hotel: Hotel | null;
    selectedPartner?: AffiliateParty | null;
    prices: ContractLineData[];
    supplements: ContractSupplement[];
    reductions: ContractReduction[];
    monoparentalRules: ContractMonoparentalRule[];
    earlyBookings: ContractEarlyBooking[];
    spos: ContractSpo[];
    cancellations: ContractCancellationRule[];
}

interface ContractPreviewProps {
    data: ContractPreviewData;
}

function formatDate(value?: string | Date | null) {
    if (!value) return 'Not specified';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not specified';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function formatDateRange(start?: string | Date | null, end?: string | Date | null) {
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatBookingWindow(start?: string | Date | null, end?: string | Date | null) {
    if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
    if (end) return `Until ${formatDate(end)}`;
    if (start) return `From ${formatDate(start)}`;
    return 'As agreed';
}

function formatStayWindow(start?: string | Date | null, end?: string | Date | null) {
    if (!start && !end) return 'Full stay validity';
    return formatDateRange(start, end);
}

function dateSortValue(value?: string | Date | null) {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function formatMoney(value: number | string | null | undefined, currency: string) {
    const amount = Number(value ?? 0);
    return `${new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)} ${currency}`;
}

function labelize(value?: string | null) {
    if (!value) return 'Not specified';
    const compactLabels: Record<string, string> = {
        PER_NIGHT_PER_PERSON: 'Per person/night',
        PER_NIGHT_PER_ROOM: 'Per room/night',
        FLAT_RATE_PER_STAY: 'Per stay',
        FIRST_CHILD: 'First child',
        SECOND_CHILD: 'Second child',
        THIRD_CHILD: 'Third child',
        THIRD_ADULT: 'Third adult',
        SINGLE: 'SGL',
        DOUBLE: 'DBL',
        HALF_SINGLE: '1/2 SGL',
        HALF_DOUBLE: '1/2 DBL',
    };
    if (compactLabels[value]) return compactLabels[value];
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatModifier(
    calculationType: string | undefined,
    value: number | string | null | undefined,
    currency: string,
    prefix = '',
) {
    if (value === null || value === undefined) return 'Not specified';
    if (calculationType === 'PERCENTAGE') return `${prefix}${Number(value)}%`;
    if (calculationType === 'FREE') return 'Free';
    return `${prefix}${formatMoney(value, currency)}`;
}

function ageRange(minAge?: number | null, maxAge?: number | null) {
    if (minAge === null && maxAge === null) return 'All ages';
    if (minAge === undefined && maxAge === undefined) return 'All ages';
    if ((minAge ?? 0) <= 0 && (maxAge ?? 99) >= 99) return 'All ages';
    return `${minAge ?? 0}-${maxAge ?? '+'} years`;
}

function compactScope(parts: (string | null | undefined)[]) {
    return parts.filter((part): part is string => Boolean(part && part.trim())).join(' | ');
}

function formatPaymentCondition(value?: string | null) {
    if (!value) return 'Payment terms to be confirmed by the parties.';
    if (value === 'PREPAYMENT_100') return '100% prepayment';
    if (value === 'DEPOSIT') return 'Deposit payment';
    return labelize(value);
}

function firstHotelEmail(hotel: Hotel | null) {
    return hotel?.emails?.[0]?.address ?? 'Not specified';
}

function firstAffiliateEmail(affiliate: AffiliateParty) {
    return affiliate.emails?.[0]?.address ?? 'Not specified';
}

function buildRatesLookup(lines: ContractLineData[]) {
    const lookup = new Map<string, RateCell[]>();

    for (const line of lines) {
        if (!line.period || !line.contractRoom) continue;
        lookup.set(
            `${line.period.id}_${line.contractRoom.id}`,
            (line.prices ?? []).map((price) => ({
                arrangement: price.arrangement?.code || price.arrangement?.name || 'Base',
                amount: Number(price.amount) || 0,
                minStay: price.minStay,
                releaseDays: price.releaseDays,
            })),
        );
    }

    return lookup;
}

function formatTargets(
    rooms?: { contractRoom?: ContractRoom }[],
    periods?: { period?: Period }[],
) {
    const roomNames = rooms?.map((item) => item.contractRoom?.roomType?.name).filter(Boolean) ?? [];
    const periodNames = periods?.map((item) => item.period?.name).filter(Boolean) ?? [];
    const roomText = roomNames.length > 0 ? roomNames.join(', ') : 'All rooms';
    const periodText = periodNames.length > 0 ? periodNames.join(', ') : 'All periods';
    return `${roomText} / ${periodText}`;
}

function normalizePeriodName(name?: string | null) {
    if (!name) return 'Period';
    return name.replace(/^p[ée]riode\b/i, 'Period');
}

function sortPeriods(periods: Period[] = []) {
    return [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function getPeriodId(target?: PeriodTarget | null) {
    return target?.period?.id ?? target?.periodId ?? null;
}

function resolveRulePeriods(contractPeriods: Period[], targets?: PeriodTarget[]) {
    const orderedPeriods = sortPeriods(contractPeriods);
    const targetIds = new Set((targets ?? []).map(getPeriodId).filter((id): id is number => typeof id === 'number'));
    if (targetIds.size === 0) return orderedPeriods;

    const resolved = orderedPeriods.filter((period) => targetIds.has(period.id));
    const missing = (targets ?? [])
        .map((target) => target.period)
        .filter((period): period is Period => {
            if (!period?.startDate || !period.endDate) return false;
            return !resolved.some((item) => item.id === period.id);
        });
    return sortPeriods([...resolved, ...missing]);
}

function findPeriodTarget<T extends PeriodTarget>(targets: T[] | undefined, periodId: number) {
    return targets?.find((target) => getPeriodId(target) === periodId);
}

function valuesVary(values: string[]) {
    return new Set(values.map((value) => value.trim())).size > 1;
}

function roomScope(rooms?: RoomTarget[]) {
    const roomNames = rooms?.map((item) => item.contractRoom?.roomType?.name).filter(Boolean) ?? [];
    return roomNames.length > 0 ? roomNames.join(', ') : 'All rooms';
}

function matrixChunks(periods: Period[]) {
    return periods.length > MAX_MATRIX_PERIODS ? chunk(periods, MAX_MATRIX_PERIODS) : [periods];
}

function chunk<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function spoBenefit(spo: ContractSpo) {
    if (spo.stayNights && spo.payNights) return `Stay ${spo.stayNights} / Pay ${spo.payNights}`;
    if (spo.benefitType === 'PERCENTAGE_DISCOUNT') return `-${spo.benefitValue ?? spo.value ?? 0}%`;
    if (spo.benefitType === 'FIXED_DISCOUNT') return `Fixed discount ${spo.benefitValue ?? spo.value ?? 0}`;
    if (spo.benefitType === 'FREE_NIGHTS') return `${spo.benefitValue ?? spo.value ?? 0} free night(s)`;
    return labelize(spo.benefitType);
}

function spoPeriodBenefit(spo: ContractSpo, overrideValue: number | null | undefined, currency: string) {
    if (overrideValue === null || overrideValue === undefined) return spoBenefit(spo);
    if (spo.benefitType === 'PERCENTAGE_DISCOUNT') return `-${Number(overrideValue)}%`;
    if (spo.benefitType === 'FIXED_DISCOUNT') return `Fixed discount ${formatMoney(overrideValue, currency)}`;
    if (spo.benefitType === 'FREE_NIGHTS') return `${Number(overrideValue)} free night(s)`;
    if (spo.stayNights && spo.payNights) return `Stay ${spo.stayNights} / Pay ${overrideValue}`;
    return `${labelize(spo.benefitType)} ${Number(overrideValue)}`;
}

function cancellationPenalty(rule: ContractCancellationRule, currency: string) {
    if (rule.penaltyType === 'PERCENTAGE') return `${Number(rule.baseValue)}%`;
    if (rule.penaltyType === 'FIXED_AMOUNT') return formatMoney(rule.baseValue, currency);
    return `${Number(rule.baseValue)} night(s)`;
}

function cancellationPeriodPenalty(rule: ContractCancellationRule, overrideValue: number | null | undefined, currency: string) {
    if (overrideValue === null || overrideValue === undefined) return cancellationPenalty(rule, currency);
    if (rule.penaltyType === 'PERCENTAGE') return `${Number(overrideValue)}%`;
    if (rule.penaltyType === 'FIXED_AMOUNT') return formatMoney(overrideValue, currency);
    return `${Number(overrideValue)} night(s)`;
}

function supplementPeriodValue(supplement: ContractSupplement, overrideValue: number | null | undefined, currency: string) {
    if (supplement.type === 'FORMULA') return supplement.formula || 'Formula applies';
    return formatModifier(supplement.type, overrideValue ?? supplement.value, currency);
}

function reductionPeriodValue(reduction: ContractReduction, overrideValue: number | null | undefined, currency: string) {
    return formatModifier(reduction.calculationType, overrideValue ?? reduction.value, currency, '-');
}

function earlyBookingPeriodValue(offer: ContractEarlyBooking, overrideValue: number | null | undefined, currency: string) {
    return formatModifier(offer.calculationType, overrideValue ?? offer.value, currency, '-');
}

function cleanEarlyBookingName(offer: ContractEarlyBooking, currency: string) {
    const advantage = earlyBookingPeriodValue(offer, null, currency).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return offer.name.replace(new RegExp(`\\s*\\(${advantage}\\)\\s*$`, 'i'), '').trim() || offer.name;
}

function earlyBookingConditions(offer: ContractEarlyBooking) {
    const conditions = [
        offer.releaseDays && offer.releaseDays > 0 ? `Release: ${offer.releaseDays} days` : null,
        offer.isPrepaid ? `Prepayment: ${offer.prepaymentPercentage ?? 0}%` : null,
    ].filter(Boolean);

    return conditions.length > 0 ? conditions.join(' / ') : 'Standard booking conditions';
}

function sortEarlyBookings(offers: ContractEarlyBooking[]) {
    return [...offers].sort((a, b) => {
        const endDiff = dateSortValue(a.bookingWindowEnd) - dateSortValue(b.bookingWindowEnd);
        if (endDiff !== 0) return endDiff;
        const startDiff = dateSortValue(a.bookingWindowStart) - dateSortValue(b.bookingWindowStart);
        if (startDiff !== 0) return startDiff;
        return a.name.localeCompare(b.name);
    });
}

function monoparentalPeriodValue(
    rule: ContractMonoparentalRule,
    override?: ContractMonoparentalRule['applicablePeriods'][number],
) {
    const baseRateType = override?.overrideBaseRateType ?? rule.baseRateType;
    const surchargeBase = override?.overrideChildSurchargeBase ?? rule.childSurchargeBase;
    const surchargeValue = override?.overrideChildSurchargeValue ?? rule.childSurchargePercentage;
    return `${labelize(baseRateType)} + ${surchargeValue}% ${labelize(surchargeBase)}`;
}

function DocumentSection({ index, title, children }: { index: string; title: string; children: ReactNode }) {
    return (
        <section className="contract-page-section border-t border-slate-300 pt-5 first:border-t-0 first:pt-0">
            <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-mint/50 bg-brand-mint/10 text-[11px] font-black text-brand-navy">
                    {index}
                </span>
                <h2 className="text-[13px] font-black uppercase tracking-[0.22em] text-brand-navy">
                    {title}
                </h2>
            </div>
            {children}
        </section>
    );
}

function SubsectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="mb-2 border-l-4 border-brand-mint pl-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
            {children}
        </h3>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            {label}
        </p>
    );
}

function InfoGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
    return (
        <dl className="grid grid-cols-1 border border-slate-300 sm:grid-cols-2">
            {items.map((item) => (
                <div key={item.label} className="min-h-14 border-b border-r border-slate-200 px-3 py-2 last:border-b-0 even:border-r-0">
                    <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</dt>
                    <dd className="mt-1 text-[12px] font-semibold leading-5 text-slate-900">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export function ContractHeader({ contract, hotel, selectedPartner }: { contract: Contract; hotel: Hotel | null; selectedPartner?: AffiliateParty | null }) {
    const title = contract.name || 'Commercial Agreement';

    return (
        <header className="border-b-2 border-brand-navy pb-5">
            <div className="flex items-start justify-between gap-8">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-slate-300 bg-white">
                        {hotel?.logoUrl ? (
                            <img src={hotel.logoUrl} alt={`${hotel.name} logo`} className="h-full w-full object-contain p-2" />
                        ) : (
                            <span className="text-2xl font-black text-brand-navy">{(hotel?.name ?? 'P').slice(0, 1)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-mint">Hotel contracting agreement</p>
                        <h1 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight text-brand-navy">
                            {title}
                        </h1>
                        <p className="mt-1 text-[12px] font-semibold text-slate-600">{hotel?.name ?? 'Hotel name not specified'}</p>
                        <p className="mt-1 max-w-[420px] text-[10px] leading-4 text-slate-500">{hotel?.address ?? 'Hotel address not specified'}</p>
                    </div>
                </div>

                <div className="w-44 shrink-0 border border-slate-300 text-right">
                    <div className="bg-brand-navy px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        Commercial Agreement
                    </div>
                    <div className="space-y-2 px-3 py-3 text-[11px] text-slate-700">
                        <p><span className="font-bold">Ref:</span> {contract.reference || `CTR-${contract.id}`}</p>
                        <p><span className="font-bold">Season:</span> {title}</p>
                        <p><span className="font-bold">Partner:</span> {selectedPartner?.companyName ?? 'Select partner'}</p>
                        <p><span className="font-bold">Currency:</span> {contract.currency}</p>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 border border-slate-300 sm:grid-cols-3">
                <div className="border-b border-r border-slate-200 px-3 py-2 sm:border-b-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Season</p>
                    <p className="mt-1 text-[12px] font-bold text-brand-navy">{title}</p>
                </div>
                <div className="border-b border-r border-slate-200 px-3 py-2 sm:border-b-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Stay validity</p>
                    <p className="mt-1 text-[12px] font-bold text-brand-navy">{formatDateRange(contract.startDate, contract.endDate)}</p>
                </div>
                <div className="px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Rate basis</p>
                    <p className="mt-1 text-[12px] font-bold text-brand-navy">Per person per night</p>
                </div>
            </div>
        </header>
    );
}

export function PartiesSection({ hotel, selectedPartner }: { hotel: Hotel | null; selectedPartner?: AffiliateParty | null }) {
    return (
        <DocumentSection index="01" title="Contracting Parties">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <SubsectionTitle>Hotel representative</SubsectionTitle>
                    <InfoGrid
                        items={[
                            { label: 'Company', value: hotel?.fiscalName || hotel?.name || 'Not specified' },
                            { label: 'Representative', value: hotel?.legalRepresentative || 'Not specified' },
                            { label: 'Email', value: firstHotelEmail(hotel) },
                            { label: 'Phone', value: hotel?.phone || 'Not specified' },
                        ]}
                    />
                </div>
                <div>
                    <SubsectionTitle>Tour operator representative</SubsectionTitle>
                    {selectedPartner ? (
                        <InfoGrid
                            items={[
                                { label: 'Company', value: selectedPartner.companyName },
                                { label: 'Address', value: selectedPartner.address || 'Not specified' },
                                { label: 'Representative', value: selectedPartner.representativeName || 'Not specified' },
                                { label: 'Email', value: firstAffiliateEmail(selectedPartner) },
                                { label: 'Phone', value: selectedPartner.phone || 'Not specified' },
                                { label: 'Reference', value: selectedPartner.reference || `TO-${selectedPartner.id}` },
                            ]}
                        />
                    ) : (
                        <EmptyState label="Select a tour operator partner to preview this contract." />
                    )}
                </div>
            </div>
        </DocumentSection>
    );
}

export function RatesSection({ contract, prices }: { contract: Contract; prices: ContractLineData[] }) {
    const periods = [...(contract.periods ?? [])].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    const rooms = contract.contractRooms ?? [];
    const lookup = buildRatesLookup(prices);
    const rows: PeriodMatrixRow[] = rooms.map((room) => ({
        key: room.id,
        baseCells: [
            <span className="font-black text-brand-navy">
                {room.roomType?.name ?? 'Room'}
                {room.reference && <span className="mt-1 block text-[9px] font-semibold text-slate-500">{room.reference}</span>}
            </span>,
        ],
        applicablePeriodIds: new Set(periods.map((period) => period.id)),
        periodValues: new Map(periods.map((period) => {
            const rates = lookup.get(`${period.id}_${room.id}`) ?? [];
            return [
                period.id,
                rates.length > 0 ? (
                    <div className="space-y-1 text-left">
                        {rates.map((rate) => (
                            <div key={`${rate.arrangement}-${rate.amount}`} className="leading-4">
                                <span className="font-black text-brand-navy">{rate.arrangement}</span>{' '}
                                <span className="font-bold text-slate-900">{formatMoney(rate.amount, contract.currency)}</span>
                                {(rate.minStay || rate.releaseDays) && (
                                    <span className="block text-[9px] font-medium text-slate-500">
                                        {rate.minStay ? `min ${rate.minStay}n` : ''}
                                        {rate.minStay && rate.releaseDays ? ' / ' : ''}
                                        {rate.releaseDays ? `rel ${rate.releaseDays}d` : ''}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="font-medium text-slate-400">Not contracted</span>
                ),
            ];
        })),
    }));

    return (
        <DocumentSection index="02" title="Contractual Tariff">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
                <p>Rates are expressed in <strong>{contract.currency}</strong>, per person per night, unless otherwise stated.</p>
                <p>Base board: <strong>{contract.baseArrangement ? `${contract.baseArrangement.name} (${contract.baseArrangement.code})` : 'Not specified'}</strong></p>
            </div>

            {renderPeriodMatrix({
                baseColumns: ['Room type'],
                periods,
                rows: rooms.length > 0 && periods.length > 0 ? rows : [],
                emptyLabel: 'Rooms and periods must be configured before the rate grid can be rendered.',
            })}
        </DocumentSection>
    );
}

function renderRuleTable({
    columns,
    rows,
    emptyLabel,
}: {
    columns: string[];
    rows: ReactNode[][];
    emptyLabel: string;
}) {
    if (rows.length === 0) return <EmptyState label={emptyLabel} />;
    return <SimpleTable columns={columns} rows={rows} />;
}

function renderPeriodMatrix({
    baseColumns,
    periods,
    rows,
    emptyLabel,
}: {
    baseColumns: string[];
    periods: Period[];
    rows: PeriodMatrixRow[];
    emptyLabel: string;
}) {
    if (rows.length === 0 || periods.length === 0) return <EmptyState label={emptyLabel} />;
    return <PeriodMatrixTable baseColumns={baseColumns} periods={periods} rows={rows} />;
}

function PeriodMatrixTable({
    baseColumns,
    periods,
    rows,
}: {
    baseColumns: string[];
    periods: Period[];
    rows: PeriodMatrixRow[];
}) {
    const periodChunks = matrixChunks(periods);

    return (
        <div className="space-y-2">
            {periodChunks.map((periodChunk, chunkIndex) => (
                <div key={chunkIndex}>
                    {chunkIndex > 0 && (
                        <p className="mb-1 border-l-2 border-slate-300 pl-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Matrix continuation · {normalizePeriodName(periodChunk[0]?.name)} to {normalizePeriodName(periodChunk[periodChunk.length - 1]?.name)}
                        </p>
                    )}
                    <div className="contract-table-scroll overflow-x-auto border border-slate-300">
                        <table className="contract-table min-w-full border-collapse text-[10px]">
                            <thead>
                                <tr>
                                    {baseColumns.map((column) => (
                                        <th key={column} className="border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-left font-black uppercase tracking-[0.1em] text-slate-700">
                                            {column}
                                        </th>
                                    ))}
                                    {periodChunk.map((period) => (
                                        <th key={period.id} className="min-w-24 border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-center font-black uppercase tracking-[0.08em] text-slate-700 last:border-r-0">
                                            <span className="block">{normalizePeriodName(period.name)}</span>
                                            <span className="mt-1 block text-[9px] font-semibold normal-case tracking-normal text-slate-500">
                                                {formatDateRange(period.startDate, period.endDate)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={`${row.key}-${chunkIndex}`}>
                                        {row.baseCells.map((cell, cellIndex) => (
                                            <td key={`${row.key}-base-${cellIndex}`} className="border-b border-r border-slate-300 px-2 py-2 align-top leading-4 text-slate-700">
                                                {cell}
                                            </td>
                                        ))}
                                        {periodChunk.map((period) => (
                                            <td key={`${row.key}-${period.id}`} className="border-b border-r border-slate-300 px-2 py-2 text-center align-top font-bold leading-4 text-brand-navy last:border-r-0">
                                                {row.applicablePeriodIds.has(period.id) ? row.periodValues.get(period.id) : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EarlyBookingRules({ contract, offers }: { contract: Contract; offers: ContractEarlyBooking[] }) {
    return renderRuleTable({
        columns: ['Offer', 'Advantage', 'Booking window', 'Stay validity', 'Conditions', 'Room scope'],
        rows: sortEarlyBookings(offers).map((offer) => [
            cleanEarlyBookingName(offer, contract.currency),
            earlyBookingPeriodValue(offer, null, contract.currency),
            formatBookingWindow(offer.bookingWindowStart, offer.bookingWindowEnd),
            formatStayWindow(offer.stayWindowStart, offer.stayWindowEnd),
            earlyBookingConditions(offer),
            roomScope(offer.applicableContractRooms),
        ]),
        emptyLabel: 'No early booking offer configured.',
    });
}

function SpoRules({ contract, spos }: { contract: Contract; spos: ContractSpo[] }) {
    const periods = sortPeriods(contract.periods ?? []);
    const matrixRows: PeriodMatrixRow[] = spos.map((spo) => {
        const applicablePeriods = resolveRulePeriods(periods, spo.applicablePeriods);
        const condition = spo.conditionType === 'MIN_NIGHTS' ? `Minimum ${spo.conditionValue ?? spo.stayNights} nights` : labelize(spo.conditionType);
        const scope = compactScope([condition, labelize(spo.applicationType), roomScope(spo.applicableContractRooms)]);
        return {
            key: spo.id,
            baseCells: [spo.name, scope],
            applicablePeriodIds: new Set(applicablePeriods.map((period) => period.id)),
            periodValues: new Map(applicablePeriods.map((period) => {
                const target = findPeriodTarget(spo.applicablePeriods, period.id);
                return [period.id, spoPeriodBenefit(spo, target?.overrideValue, contract.currency)];
            })),
        };
    });

    return renderPeriodMatrix({
        baseColumns: ['Offer', 'Trigger / scope'],
        periods,
        rows: matrixRows,
        emptyLabel: 'No special offer configured.',
    });
}

function SupplementRules({ contract, supplements }: { contract: Contract; supplements: ContractSupplement[] }) {
    const periods = sortPeriods(contract.periods ?? []);
    const matrixRows: PeriodMatrixRow[] = supplements.map((supplement) => {
        const applicablePeriods = resolveRulePeriods(periods, supplement.applicablePeriods);
        const name = `${supplement.name}${supplement.isMandatory ? ' (mandatory)' : ''}`;
        const scope = compactScope([roomScope(supplement.applicableContractRooms), ageRange(supplement.minAge, supplement.maxAge), labelize(supplement.applicationType)]);
        return {
            key: supplement.id,
            baseCells: [name, scope],
            applicablePeriodIds: new Set(applicablePeriods.map((period) => period.id)),
            periodValues: new Map(applicablePeriods.map((period) => {
                const target = findPeriodTarget(supplement.applicablePeriods, period.id);
                return [period.id, supplementPeriodValue(supplement, target?.overrideValue, contract.currency)];
            })),
        };
    });

    return renderPeriodMatrix({
        baseColumns: ['Supplement', 'Scope'],
        periods,
        rows: matrixRows,
        emptyLabel: 'No supplement configured.',
    });
}

function ReductionRules({ contract, reductions }: { contract: Contract; reductions: ContractReduction[] }) {
    const periods = sortPeriods(contract.periods ?? []);
    const matrixRows: PeriodMatrixRow[] = reductions.map((reduction) => {
        const applicablePeriods = resolveRulePeriods(periods, reduction.applicablePeriods);
        const passengerBasis = compactScope([
            `${labelize(reduction.paxType)} ${reduction.paxOrder ? `#${reduction.paxOrder}` : ''}`.trim(),
            ageRange(reduction.minAge, reduction.maxAge),
            roomScope(reduction.applicableContractRooms),
        ]);
        return {
            key: reduction.id,
            baseCells: [reduction.name, passengerBasis],
            applicablePeriodIds: new Set(applicablePeriods.map((period) => period.id)),
            periodValues: new Map(applicablePeriods.map((period) => {
                const target = findPeriodTarget(reduction.applicablePeriods, period.id);
                return [period.id, reductionPeriodValue(reduction, target?.overrideValue, contract.currency)];
            })),
        };
    });

    return renderPeriodMatrix({
        baseColumns: ['Reduction', 'Pax'],
        periods,
        rows: matrixRows,
        emptyLabel: 'No reduction configured.',
    });
}

function MonoparentalRules({ contract, rules }: { contract: Contract; rules: ContractMonoparentalRule[] }) {
    const periods = sortPeriods(contract.periods ?? []);
    const matrixRows: PeriodMatrixRow[] = rules.map((rule) => {
        const applicablePeriods = resolveRulePeriods(periods, rule.applicablePeriods);
        const occupancy = compactScope([
            `${rule.adultCount} adult(s) + ${rule.childCount} child(ren)`,
            ageRange(rule.minAge, rule.maxAge),
            roomScope(rule.applicableContractRooms),
        ]);
        return {
            key: rule.id,
            baseCells: [rule.name, occupancy],
            applicablePeriodIds: new Set(applicablePeriods.map((period) => period.id)),
            periodValues: new Map(applicablePeriods.map((period) => [
                period.id,
                monoparentalPeriodValue(rule, findPeriodTarget(rule.applicablePeriods, period.id)),
            ])),
        };
    });

    return renderPeriodMatrix({
        baseColumns: ['Rule', 'Occupancy / scope'],
        periods,
        rows: matrixRows,
        emptyLabel: 'No monoparental rule configured.',
    });
}

function CancellationRules({ contract, cancellations }: { contract: Contract; cancellations: ContractCancellationRule[] }) {
    const periods = sortPeriods(contract.periods ?? []);
    const rows = cancellations.map((rule) => {
        const applicablePeriods = resolveRulePeriods(periods, rule.applicablePeriods);
        const values = applicablePeriods.map((period) => {
            const target = findPeriodTarget(rule.applicablePeriods, period.id);
            return cancellationPeriodPenalty(rule, target?.overrideValue, contract.currency);
        });
        const penalty = valuesVary(values)
            ? applicablePeriods.map((period, index) => `${normalizePeriodName(period.name)}: ${values[index]}`).join(' / ')
            : values[0] ?? cancellationPenalty(rule, contract.currency);
        const remarks = `${rule.appliesToNoShow ? 'Includes no-show' : 'Standard cancellation'}${rule.minStayCondition ? ` / min stay ${rule.minStayCondition}n` : ''}`;

        return [
            `${rule.name} / D-${rule.daysBeforeArrival}`,
            penalty,
            remarks,
            roomScope(rule.applicableRooms),
        ];
    });

    return renderRuleTable({
        columns: ['Cancellation window', 'Penalty', 'Conditions', 'Room scope'],
        rows,
        emptyLabel: 'No cancellation rule configured.',
    });
}

function paymentPolicyItems(contract: Contract, hotel: Hotel | null) {
    return [
        contract.paymentCondition ? `Payment condition: ${formatPaymentCondition(contract.paymentCondition)}.` : 'Payment terms to be confirmed by the parties.',
        contract.depositAmount ? `Deposit: ${formatMoney(contract.depositAmount, contract.currency)}.` : null,
        contract.creditDays ? `Credit facility: ${contract.creditDays} day(s) from invoice date.` : null,
        contract.paymentMethods?.length ? `Accepted methods: ${contract.paymentMethods.map(labelize).join(', ')}.` : null,
        hotel?.bankName ? `Bank: ${hotel.bankName}.` : null,
        hotel?.ibanCode ? `IBAN: ${hotel.ibanCode}.` : null,
    ].filter(Boolean);
}

const commercialRemarkItems = [
    'Rates are confidential and valid only for the tour operator parties listed in this agreement.',
    'All offers are subject to stop sales, allotment availability, and written hotel confirmation.',
    'Taxes, city fees, and exceptional government charges may be updated if imposed by local regulation.',
];

const generalConditionItems = [
    'This commercial agreement applies for the stay validity stated above and replaces previous unsigned tariff communications for the same season.',
    'Any amendment, special operation, or exception must be confirmed in writing by both parties.',
    'The tour operator is responsible for respecting release dates, rooming list deadlines, payment deadlines, and cancellation conditions.',
];

export function CommercialRemarksSection({ index }: { index: string }) {
    return (
        <DocumentSection index={index} title="Commercial Remarks / Additional Conditions">
            <PolicyBlock title="Commercial remarks" items={commercialRemarkItems} />
        </DocumentSection>
    );
}

export function PaymentTermsSection({ index, contract, hotel }: { index: string; contract: Contract; hotel: Hotel | null }) {
    const paymentItems = paymentPolicyItems(contract, hotel);

    return (
        <DocumentSection index={index} title="Payment Terms">
            <PolicyBlock title="Payment terms" items={paymentItems.length > 0 ? paymentItems : ['Payment terms to be confirmed by the parties.']} />
        </DocumentSection>
    );
}

export function GeneralConditionsSection({ index }: { index: string }) {
    return (
        <DocumentSection index={index} title="General Conditions">
            <PolicyBlock title="General conditions" items={generalConditionItems} />
        </DocumentSection>
    );
}

function PolicyBlock({ title, items }: { title: string; items: (string | null)[] }) {
    return (
        <div className="border border-slate-300">
            <div className="bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">{title}</div>
            <ol className="list-decimal space-y-1 px-6 py-3 text-[11px] leading-5 text-slate-700">
                {items.filter(Boolean).map((item) => <li key={item}>{item}</li>)}
            </ol>
        </div>
    );
}

export function SignatureSection({ index = '12', selectedPartner, hotel }: { index?: string; selectedPartner?: AffiliateParty | null; hotel: Hotel | null }) {
    const affiliateName = selectedPartner?.companyName || 'Tour Operator';

    return (
        <DocumentSection index={index} title="Acceptance and Signatures">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SignatureBox title="For the hotel" company={hotel?.name ?? 'Hotel'} representative={hotel?.legalRepresentative || 'Name and title'} />
                <SignatureBox title="For the tour operator" company={affiliateName} representative={selectedPartner?.representativeName || 'Authorized signatory'} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 text-[11px] text-slate-700 md:grid-cols-3">
                <div className="border-b border-slate-400 pb-2">Place: ____________________</div>
                <div className="border-b border-slate-400 pb-2">Date: ____ / ____ / ______</div>
                <div className="border-b border-slate-400 pb-2">Stamp: ___________________</div>
            </div>
        </DocumentSection>
    );
}

function SignatureBox({ title, company, representative }: { title: string; company: string; representative: string }) {
    return (
        <div className="min-h-36 border border-slate-300 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-navy">{title}</p>
            <p className="mt-2 text-[12px] font-bold text-slate-900">{company}</p>
            <p className="text-[11px] text-slate-600">Representative: {representative}</p>
            <div className="mt-12 border-t border-slate-400 pt-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Signature and company stamp
            </div>
        </div>
    );
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
    return (
        <div className="contract-table-scroll overflow-x-auto border border-slate-300">
            <table className="contract-table min-w-full border-collapse text-[10px]">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column} className="border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-left font-black uppercase tracking-[0.1em] text-slate-700 last:border-r-0">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={`${rowIndex}-${cellIndex}`} className="border-b border-r border-slate-300 px-2 py-2 align-top leading-4 text-slate-700 last:border-r-0">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ContractPreview({ data }: ContractPreviewProps) {
    const { contract } = data;

    return (
        <article id="contract-document" className="contract-a4 mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[14mm] py-[13mm] text-slate-900 shadow-2xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
            <ContractHeader contract={data.contract} hotel={data.hotel} selectedPartner={data.selectedPartner} />
            <div className="mt-7 space-y-7">
                <PartiesSection hotel={data.hotel} selectedPartner={data.selectedPartner} />
                <RatesSection contract={contract} prices={data.prices} />
                <DocumentSection index="03" title="Supplements">
                    <SupplementRules contract={contract} supplements={data.supplements} />
                </DocumentSection>
                <DocumentSection index="04" title="Reductions">
                    <ReductionRules contract={contract} reductions={data.reductions} />
                </DocumentSection>
                <DocumentSection index="05" title="Monoparental">
                    <MonoparentalRules contract={contract} rules={data.monoparentalRules} />
                </DocumentSection>
                <DocumentSection index="06" title="Special Offers">
                    <SpoRules contract={contract} spos={data.spos} />
                </DocumentSection>
                <DocumentSection index="07" title="Early Booking">
                    <EarlyBookingRules contract={contract} offers={data.earlyBookings} />
                </DocumentSection>
                <CommercialRemarksSection index="08" />
                <PaymentTermsSection index="09" contract={contract} hotel={data.hotel} />
                <DocumentSection index="10" title="Cancellation">
                    <CancellationRules contract={contract} cancellations={data.cancellations} />
                </DocumentSection>
                <GeneralConditionsSection index="11" />
                <SignatureSection index="12" selectedPartner={data.selectedPartner} hotel={data.hotel} />
            </div>
        </article>
    );
}
