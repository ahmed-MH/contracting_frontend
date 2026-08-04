import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    BedDouble,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    Gauge,
    Gift,
    Hotel,
    LineChart,
    Package,
    Percent,
    ShieldAlert,
    Sparkles,
    Users,
    UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorkspaceContainer } from '../../../components/layout/Workspace';
import { useHotel } from '../../hotel/context/HotelContext';
import { useContracts } from '../../contracts/hooks/useContracts';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useRoomTypes } from '../../rooms/hooks/useRoomTypes';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useTemplateSupplements } from '../../catalog/supplements/hooks/useTemplateSupplements';
import { useTemplateReductions } from '../../catalog/reductions/hooks/useTemplateReductions';
import { useTemplateEarlyBookings } from '../../catalog/early-bookings/hooks/useTemplateEarlyBookings';
import apiClient from '../../../services/api.client';
import type { Contract, ContractStatus, PaginatedResult, TemplateSpo } from '../../../types';
import type { ContractLineData } from '../../contracts/services/contract.service';
import type { ProformaInvoice } from '../../simulator/types/simulator.types';
import type { AffiliateEmailSpo } from '../../partners/types/affiliate-email-spo.types';

type Tone = 'mint' | 'navy' | 'amber' | 'slate';

interface MetricCardProps {
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone?: Tone;
}

interface SectionHeaderProps {
    eyebrow: string;
    title: string;
    description?: string;
    icon?: LucideIcon;
}

interface MiniStatProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    detail?: string;
}

interface MonthlyPoint {
    label: string;
    value: number;
}

interface PartnerValuePoint {
    id: number | string;
    name: string;
    value: number;
    share: number;
    invoices: number;
    activeContracts: number;
    draftContracts: number;
}

interface ContractPriceSummary {
    contractId: number;
    expectedCells: number;
    completedCells: number;
    missingCells: number;
    zeroPriceAlerts: number;
}

interface RuleSummary {
    contractId: number;
    totalRules: number;
    cancellationRules: number;
}

interface AffiliateEmailSpoSummary {
    affiliateId: number;
    activeCount: number;
}

interface SeasonWindow {
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    contractIds: number[];
}

const statusOrder: ContractStatus[] = ['ACTIVE', 'DRAFT', 'EXPIRED', 'TERMINATED'];

const toneClasses: Record<Tone, string> = {
    mint: 'bg-brand-mint/12 text-brand-mint',
    navy: 'bg-brand-navy/8 text-brand-navy dark:bg-brand-light/10 dark:text-brand-light',
    amber: 'bg-brand-slate/12 text-brand-slate dark:bg-brand-light/10 dark:text-brand-light/75',
    slate: 'bg-brand-light/70 text-brand-slate dark:bg-brand-light/10 dark:text-brand-light/70',
};

function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDate(value?: string | null): string {
    return value ? value.slice(0, 10) : '';
}

function isDateInsideRange(dateValue: string | null | undefined, startDate: string, endDate: string): boolean {
    const date = parseDate(dateValue);
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!date || !start || !end) return false;
    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return date >= start && date <= end;
}

function daysUntil(value?: string | null): number | null {
    const date = parseDate(value);
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number): string {
    return `${Math.round(value)}%`;
}

function formatMoney(value: number, currency: string, locale: string): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: value >= 10_000 ? 0 : 2,
        }).format(value);
    } catch {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${currency}`;
    }
}

function getInvoiceTotal(invoice: ProformaInvoice): number {
    return invoice.totalsSnapshot?.totalAmount
        ?? invoice.totalsSnapshot?.grandTotal
        ?? invoice.totalsSnapshot?.netAmountBeforeTax
        ?? invoice.totalsSnapshot?.subtotal
        ?? 0;
}

function getInvoicePartnerId(invoice: ProformaInvoice): number | string {
    return invoice.affiliateId ?? invoice.documentSnapshot?.affiliate?.id ?? `invoice-${invoice.id}`;
}

function getMonthlyTrend(invoices: ProformaInvoice[], locale: string): MonthlyPoint[] {
    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - index));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        return {
            key,
            label: date.toLocaleDateString(locale, { month: 'short' }),
            value: 0,
        };
    });

    invoices.forEach((invoice) => {
        const date = parseDate(invoice.issuedAt ?? invoice.generatedAt);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const bucket = months.find((item) => item.key === key);
        if (bucket) bucket.value += getInvoiceTotal(invoice);
    });

    return months.map(({ label, value }) => ({ label, value }));
}

function formatSeasonLabel(startDate: string, endDate: string, locale: string): string {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return 'Season';

    const formatter = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatCompactDate(value: string | null | undefined, locale: string): string {
    const date = parseDate(value);
    if (!date) return '-';

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function getSeasonWindows(contracts: Contract[], locale: string): {
    selectedSeason: SeasonWindow | null;
    nextSeason: SeasonWindow | null;
    seasons: SeasonWindow[];
} {
    const byRange = new Map<string, SeasonWindow>();

    contracts.forEach((contract) => {
        const startDate = normalizeDate(contract.startDate);
        const endDate = normalizeDate(contract.endDate);
        if (!startDate || !endDate || !parseDate(startDate) || !parseDate(endDate)) return;

        const key = `${startDate}|${endDate}`;
        const existing = byRange.get(key);
        if (existing) {
            existing.contractIds.push(contract.id);
            return;
        }

        byRange.set(key, {
            key,
            startDate,
            endDate,
            contractIds: [contract.id],
            label: formatSeasonLabel(startDate, endDate, locale),
        });
    });

    const seasons = [...byRange.values()].sort((a, b) => {
        const first = parseDate(a.startDate)?.getTime() ?? 0;
        const second = parseDate(b.startDate)?.getTime() ?? 0;
        return first - second;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentSeason = seasons
        .filter((season) => isDateInsideRange(today.toISOString(), season.startDate, season.endDate))
        .sort((a, b) => b.contractIds.length - a.contractIds.length)[0] ?? null;

    const upcomingSeasons = seasons.filter((season) => {
        const start = parseDate(season.startDate);
        return !!start && start >= today;
    });
    const selectedSeason = currentSeason ?? upcomingSeasons[0] ?? seasons[seasons.length - 1] ?? null;
    const nextSeason = selectedSeason
        ? seasons.find((season) => {
            const selectedStart = parseDate(selectedSeason.startDate)?.getTime() ?? 0;
            const start = parseDate(season.startDate)?.getTime() ?? 0;
            return start > selectedStart;
        }) ?? null
        : null;

    return { selectedSeason, nextSeason, seasons };
}

function summarizePriceGrid(contract: Contract, lines: ContractLineData[] | undefined): ContractPriceSummary {
    const modelExpectedCells = (contract.periods?.length ?? 0) * (contract.contractRooms?.length ?? 0);
    const lineCellKeys = new Set<string>();
    const completedKeys = new Set<string>();
    let zeroPriceAlerts = 0;

    lines?.forEach((line) => {
        const key = `${line.period.id}-${line.contractRoom.id}`;
        const positivePrices = (line.prices ?? []).filter((price) => Number(price.amount) > 0);
        zeroPriceAlerts += (line.prices ?? []).filter((price) => Number(price.amount) <= 0).length;

        if (line.isContracted) {
            lineCellKeys.add(key);
        }

        if (line.isContracted && positivePrices.length > 0) {
            completedKeys.add(key);
        }
    });

    const expectedCells = modelExpectedCells > 0 ? modelExpectedCells : lineCellKeys.size;
    const completedCells = Math.min(expectedCells, completedKeys.size);

    return {
        contractId: contract.id,
        expectedCells,
        completedCells,
        missingCells: Math.max(0, expectedCells - completedCells),
        zeroPriceAlerts,
    };
}

async function fetchCount(endpoint: string): Promise<number> {
    try {
        const { data } = await apiClient.get<unknown[]>(endpoint);
        return Array.isArray(data) ? data.length : 0;
    } catch {
        return 0;
    }
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'mint' }: MetricCardProps) {
    return (
        <article className="rounded-2xl border border-brand-light/70 bg-brand-light/78 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-brand-slate">{label}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{value}</p>
                </div>
                <div className={clsx('rounded-2xl p-3', toneClasses[tone])}>
                    <Icon size={18} />
                </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{detail}</p>
        </article>
    );
}

function SectionHeader({ eyebrow, title, description, icon: Icon }: SectionHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">{eyebrow}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{title}</h2>
                {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{description}</p>}
            </div>
            {Icon && (
                <span className="hidden rounded-2xl bg-brand-mint/10 p-3 text-brand-mint sm:inline-flex">
                    <Icon size={18} />
                </span>
            )}
        </div>
    );
}

function MiniStat({ label, value, detail, icon: Icon }: MiniStatProps) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/70 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-brand-slate">{label}</p>
                <Icon size={17} className="text-brand-mint" />
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{value}</p>
            {detail && <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/70">{detail}</p>}
        </div>
    );
}

function ProgressRow({ label, value, detail }: { label: string; value: number; detail?: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-brand-navy dark:text-brand-light">{label}</span>
                <span className="text-brand-slate dark:text-brand-light/75">{formatPercent(value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-brand-slate/10 dark:bg-brand-light/10">
                <div className="h-full rounded-full bg-brand-mint" style={{ width: `${clamp(value)}%` }} />
            </div>
            {detail && <p className="mt-2 text-xs text-brand-slate dark:text-brand-light/70">{detail}</p>}
        </div>
    );
}

function PartnerValueChart({
    rows,
    currency,
    locale,
    emptyLabel,
    selectedPartnerId,
    onPartnerSelect,
    onClearSelection,
}: {
    rows: PartnerValuePoint[];
    currency: string;
    locale: string;
    emptyLabel: string;
    selectedPartnerId: number | string | null;
    onPartnerSelect: (partnerId: number | string) => void;
    onClearSelection: () => void;
}) {
    const revenueRows = rows.filter((row) => row.value > 0);
    const noValueCount = rows.length - revenueRows.length;
    const shownRows = revenueRows.slice(0, 10);
    const hiddenRevenueCount = Math.max(0, revenueRows.length - shownRows.length);
    const selectedRow = selectedPartnerId === null ? null : rows.find((row) => row.id === selectedPartnerId) ?? null;

    if (rows.length === 0 || revenueRows.length === 0) {
        return (
            <div className="rounded-3xl border border-brand-light/70 bg-brand-light/72 p-5 dark:border-brand-light/10 dark:bg-brand-light/5">
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-brand-slate/20 p-6 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
                    {emptyLabel}
                </div>
                {rows.length > 0 && (
                    <div className="mt-3 text-center text-xs font-medium text-brand-slate dark:text-brand-light/65">
                        {rows.length} partners tracked, no issued value yet.
                    </div>
                )}
            </div>
        );
    }

    const maxValue = Math.max(...revenueRows.map((row) => row.value), 1);

    return (
        <div className="overflow-hidden rounded-3xl border border-brand-light/70 bg-brand-light/72 dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-light/70 px-4 py-3 text-xs font-semibold text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-mint/10 px-3 py-1 text-brand-mint">
                        Top {shownRows.length} by issued value
                    </span>
                    <span className="rounded-full bg-brand-light/80 px-3 py-1 dark:bg-brand-light/8">
                        {revenueRows.length} revenue partner{revenueRows.length > 1 ? 's' : ''}
                    </span>
                    {noValueCount > 0 && (
                        <span className="rounded-full bg-brand-light/80 px-3 py-1 dark:bg-brand-light/8">
                            {noValueCount} without issued value
                        </span>
                    )}
                </div>
                {selectedRow && (
                    <button
                        type="button"
                        onClick={onClearSelection}
                        className="rounded-full border border-brand-mint/30 bg-brand-mint/10 px-3 py-1 text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                    >
                        {selectedRow.name} x
                    </button>
                )}
            </div>
            <div className="max-h-[330px] divide-y divide-brand-light/70 overflow-y-auto dark:divide-brand-light/10">
                {shownRows.map((row, index) => {
                    const width = row.value > 0 ? Math.max(5, (row.value / maxValue) * 100) : 0;
                    const isSelected = row.id === selectedPartnerId;
                    const contractLabel = row.activeContracts > 0
                        ? `${row.activeContracts} active`
                        : row.draftContracts > 0
                            ? `${row.draftContracts} draft`
                            : 'No active contract';

                    return (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => onPartnerSelect(row.id)}
                            className={clsx(
                                'block w-full px-4 py-3 text-left transition hover:bg-brand-mint/5 dark:hover:bg-brand-light/5',
                                isSelected && 'bg-brand-mint/10 dark:bg-brand-mint/10',
                            )}
                        >
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),auto] sm:items-center">
                                <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className={clsx(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                                            isSelected ? 'bg-brand-mint text-brand-light' : 'bg-brand-mint/10 text-brand-mint',
                                        )}>
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-brand-navy dark:text-brand-light">{row.name}</p>
                                            <p className="mt-0.5 text-xs text-brand-slate dark:text-brand-light/65">
                                                {row.invoices} invoice{row.invoices > 1 ? 's' : ''} · {contractLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between gap-4 sm:block sm:text-right">
                                    <p className="font-semibold text-brand-navy dark:text-brand-light">{formatMoney(row.value, currency, locale)}</p>
                                    <p className="text-xs text-brand-slate dark:text-brand-light/65">{formatPercent(row.share)} share</p>
                                </div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-slate/10 dark:bg-brand-light/10">
                                <div
                                    className={clsx(
                                        'h-full rounded-full',
                                        isSelected ? 'bg-brand-light shadow-[0_0_0_1px_rgba(16,185,129,0.35)] dark:bg-brand-mint' : row.activeContracts > 0 ? 'bg-brand-mint' : row.draftContracts > 0 ? 'bg-brand-slate' : 'bg-brand-slate/40',
                                    )}
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
            {(hiddenRevenueCount > 0 || noValueCount > 0) && (
                <div className="border-t border-brand-light/70 px-4 py-3 text-xs font-medium text-brand-slate dark:border-brand-light/10 dark:text-brand-light/65">
                    {hiddenRevenueCount > 0 && `${hiddenRevenueCount} revenue partner${hiddenRevenueCount > 1 ? 's' : ''} hidden below the top 10. `}
                    {noValueCount > 0 && `${noValueCount} partner${noValueCount > 1 ? 's' : ''} tracked with no issued value in this season.`}
                </div>
            )}
        </div>
    );
}

export default function CommercialOverviewPage() {
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    const { currentHotel, isLoading: isHotelLoading } = useHotel();
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | string | null>(null);

    const contractsQuery = useContracts({ page: 1, limit: 100 });
    const affiliatesQuery = useAffiliates();
    const roomTypesQuery = useRoomTypes();
    const arrangementsQuery = useArrangements();
    const supplementsQuery = useTemplateSupplements(1, 1, '');
    const reductionsQuery = useTemplateReductions(1, 1, '');
    const earlyBookingsQuery = useTemplateEarlyBookings(1, 1, '');

    const contracts = contractsQuery.data?.data ?? [];
    const affiliates = affiliatesQuery.data ?? [];
    const roomTypes = roomTypesQuery.data ?? [];
    const arrangements = arrangementsQuery.data ?? [];

    const contractIds = contracts.map((contract) => contract.id).join(',');
    const affiliateIds = affiliates.map((affiliate) => affiliate.id).join(',');

    const sposQuery = useQuery<PaginatedResult<TemplateSpo>>({
        queryKey: ['commercial-overview', 'spos', currentHotel?.id],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResult<TemplateSpo>>('/hotel/spos', {
                params: { page: 1, limit: 1 },
            });
            return data;
        },
        enabled: !!currentHotel?.id,
    });

    const proformasQuery = useQuery<PaginatedResult<ProformaInvoice>>({
        queryKey: ['commercial-overview', 'proformas', currentHotel?.id],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResult<ProformaInvoice>>('/proforma/invoices', {
                params: { page: 1, limit: 100 },
            });
            return data;
        },
        enabled: !!currentHotel?.id,
    });

    const priceGridQuery = useQuery<ContractPriceSummary[]>({
        queryKey: ['commercial-overview', 'price-grid', currentHotel?.id, contractIds],
        queryFn: async () => {
            const results = await Promise.all(
                contracts.map(async (contract) => {
                    try {
                        const { data } = await apiClient.get<ContractLineData[]>(`/contracts/${contract.id}/prices`);
                        return summarizePriceGrid(contract, data);
                    } catch {
                        return summarizePriceGrid(contract, undefined);
                    }
                }),
            );
            return results;
        },
        enabled: !!currentHotel?.id && contracts.length > 0,
    });

    const ruleSummaryQuery = useQuery<RuleSummary[]>({
        queryKey: ['commercial-overview', 'rules', currentHotel?.id, contractIds],
        queryFn: async () => Promise.all(contracts.map(async (contract) => {
            const [
                supplements,
                reductions,
                spos,
                earlyBookings,
                cancellations,
                monoparental,
            ] = await Promise.all([
                fetchCount(`/contracts/${contract.id}/supplements`),
                fetchCount(`/contracts/${contract.id}/reductions`),
                fetchCount(`/contracts/${contract.id}/spos`),
                fetchCount(`/contracts/${contract.id}/early-bookings`),
                fetchCount(`/contracts/${contract.id}/cancellation-rules`),
                fetchCount(`/contracts/${contract.id}/monoparental-rules`),
            ]);

            return {
                contractId: contract.id,
                totalRules: supplements + reductions + spos + earlyBookings + cancellations + monoparental,
                cancellationRules: cancellations,
            };
        })),
        enabled: !!currentHotel?.id && contracts.length > 0,
    });

    const affiliateEmailSpoQuery = useQuery<AffiliateEmailSpoSummary[]>({
        queryKey: ['commercial-overview', 'affiliate-email-spos', currentHotel?.id, affiliateIds],
        queryFn: async () => Promise.all(affiliates.map(async (affiliate) => {
            try {
                const { data } = await apiClient.get<AffiliateEmailSpo[]>(`/affiliates/${affiliate.id}/email-spo`);
                return {
                    affiliateId: affiliate.id,
                    activeCount: data.filter((item) => item.status === 'ACTIVE').length,
                };
            } catch {
                return { affiliateId: affiliate.id, activeCount: 0 };
            }
        })),
        enabled: !!currentHotel?.id && affiliates.length > 0,
    });

    const supplementsTotal = supplementsQuery.data?.meta.total ?? 0;
    const reductionsTotal = reductionsQuery.data?.meta.total ?? 0;
    const earlyBookingsTotal = earlyBookingsQuery.data?.meta.total ?? 0;
    const sposTotal = sposQuery.data?.meta.total ?? 0;
    const proformas = proformasQuery.data?.data ?? [];
    const priceSummaries = priceGridQuery.data ?? [];
    const ruleSummaries = ruleSummaryQuery.data ?? [];
    const affiliateEmailSpos = affiliateEmailSpoQuery.data ?? [];
    const currency = currentHotel?.defaultCurrency ?? proformas[0]?.currency ?? contracts[0]?.currency ?? 'TND';
    const isLoading = isHotelLoading || contractsQuery.isLoading || affiliatesQuery.isLoading || roomTypesQuery.isLoading;

    const dashboard = useMemo(() => {
        const { selectedSeason, nextSeason, seasons } = getSeasonWindows(contracts, locale);
        const selectedSeasonIds = new Set(selectedSeason?.contractIds ?? []);
        const seasonContracts = selectedSeason
            ? contracts.filter((contract) => selectedSeasonIds.has(contract.id))
            : contracts;
        const seasonPriceSummaries = selectedSeason
            ? priceSummaries.filter((summary) => selectedSeasonIds.has(summary.contractId))
            : priceSummaries;
        const seasonRuleSummaries = selectedSeason
            ? ruleSummaries.filter((summary) => selectedSeasonIds.has(summary.contractId))
            : ruleSummaries;
        const statusCounts = statusOrder.reduce<Record<ContractStatus, number>>((acc, status) => {
            acc[status] = seasonContracts.filter((contract) => contract.status === status).length;
            return acc;
        }, {
            ACTIVE: 0,
            DRAFT: 0,
            EXPIRED: 0,
            TERMINATED: 0,
        });

        const activeContracts = seasonContracts.filter((contract) => contract.status === 'ACTIVE');
        const draftContracts = seasonContracts.filter((contract) => contract.status === 'DRAFT');
        const activePartnerIds = new Set<number>();
        activeContracts.forEach((contract) => {
            contract.affiliates?.forEach((affiliate) => activePartnerIds.add(affiliate.id));
        });
        const uncontractedAffiliates = affiliates.filter((affiliate) => !activePartnerIds.has(affiliate.id));
        const activeContractCoverage = affiliates.length > 0 ? (activePartnerIds.size / affiliates.length) * 100 : 0;

        const expiring30 = activeContracts.filter((contract) => {
            const days = daysUntil(contract.endDate);
            return days !== null && days >= 0 && days <= 30;
        });
        const expiring60 = activeContracts.filter((contract) => {
            const days = daysUntil(contract.endDate);
            return days !== null && days > 30 && days <= 60;
        });
        const expiring90 = activeContracts.filter((contract) => {
            const days = daysUntil(contract.endDate);
            return days !== null && days > 60 && days <= 90;
        });
        const seasonEndingContracts = selectedSeason
            ? seasonContracts.filter((contract) => normalizeDate(contract.endDate) === selectedSeason.endDate)
            : activeContracts.filter((contract) => {
                const days = daysUntil(contract.endDate);
                return days !== null && days >= 0;
            });
        const selectedSeasonDaysRemaining = selectedSeason ? daysUntil(selectedSeason.endDate) : null;
        const nextSeasonContractCount = nextSeason?.contractIds.length ?? 0;
        const nextSeasonCoverage = seasonContracts.length > 0
            ? (nextSeasonContractCount / seasonContracts.length) * 100
            : 0;
        const selectedSeasonYear = parseDate(selectedSeason?.startDate)?.getFullYear() ?? new Date().getFullYear();
        const annualSeasonWindows = seasons.filter((season) => {
            const startYear = parseDate(season.startDate)?.getFullYear();
            const endYear = parseDate(season.endDate)?.getFullYear();
            return startYear === selectedSeasonYear || endYear === selectedSeasonYear;
        });

        const missingRooms = seasonContracts.filter((contract) => (contract.contractRooms?.length ?? 0) === 0);
        const missingPeriods = seasonContracts.filter((contract) => (contract.periods?.length ?? 0) === 0);
        const priceExpectedCells = seasonPriceSummaries.reduce((sum, item) => sum + item.expectedCells, 0);
        const priceCompletedCells = seasonPriceSummaries.reduce((sum, item) => sum + item.completedCells, 0);
        const missingRateCells = seasonPriceSummaries.reduce((sum, item) => sum + item.missingCells, 0);
        const zeroPriceAlerts = seasonPriceSummaries.reduce((sum, item) => sum + item.zeroPriceAlerts, 0);
        const hasPriceGridCells = priceExpectedCells > 0;
        const priceGridCompletion = priceExpectedCells > 0 ? (priceCompletedCells / priceExpectedCells) * 100 : 0;
        const rulesAttachedToContracts = seasonRuleSummaries.reduce((sum, item) => sum + item.totalRules, 0);
        const contractsMissingRules = seasonContracts.filter((contract) => {
            const summary = seasonRuleSummaries.find((item) => item.contractId === contract.id);
            return !summary || summary.totalRules === 0;
        });
        const activeWithoutCancellationRules = activeContracts.filter((contract) => {
            const summary = seasonRuleSummaries.find((item) => item.contractId === contract.id);
            return !summary || summary.cancellationRules === 0;
        });

        const commercialRulesTotal = supplementsTotal + reductionsTotal + earlyBookingsTotal + sposTotal;
        const readinessChecks = [
            {
                score: currentHotel?.name && currentHotel?.defaultCurrency ? 1 : 0,
                label: t('pages.commercialOverview.readiness.hotelProfile', { defaultValue: 'hotel profile and currency' }),
            },
            {
                score: roomTypes.length > 0 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.roomInventory', { defaultValue: 'room inventory' }),
            },
            {
                score: arrangements.length > 0 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.arrangements', { defaultValue: 'board arrangements' }),
            },
            {
                score: affiliates.length > 0 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.affiliates', { defaultValue: 'affiliate partners' }),
            },
            {
                score: activeContracts.length > 0 ? 1 : draftContracts.length > 0 ? 0.5 : 0,
                label: activeContracts.length > 0
                    ? t('pages.commercialOverview.readiness.activeContracts', { defaultValue: 'active contracts for the focus season' })
                    : draftContracts.length > 0
                        ? t('pages.commercialOverview.readiness.activateDraftContracts', { defaultValue: 'activate draft contracts for the focus season' })
                        : t('pages.commercialOverview.readiness.activeContracts', { defaultValue: 'active contracts for the focus season' }),
            },
            {
                score: priceGridCompletion >= 70 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.priceGrid', { defaultValue: 'price grid completion' }),
            },
            {
                score: commercialRulesTotal > 0 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.commercialRules', { defaultValue: 'commercial rules' }),
            },
            {
                score: activeWithoutCancellationRules.length === 0 ? 1 : 0,
                label: t('pages.commercialOverview.readiness.cancellationRules', { defaultValue: 'cancellation rules on active contracts' }),
            },
        ];
        const readinessGaps = readinessChecks.filter((check) => check.score < 1).map((check) => check.label);
        const readinessScore = readinessChecks.reduce((sum, check) => sum + check.score, 0);
        const contractingReadiness = Math.round((readinessScore / readinessChecks.length) * 100);

        const invoicesForValue = proformas.filter((invoice) =>
            invoice.status !== 'CANCELLED'
            && (!selectedSeason || isDateInsideRange(invoice.checkIn, selectedSeason.startDate, selectedSeason.endDate)),
        );
        const issuedInvoices = invoicesForValue.filter((invoice) => invoice.status === 'ISSUED' || invoice.status === 'GENERATED');
        const issuedValue = issuedInvoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0);
        const averageProformaValue = issuedInvoices.length > 0 ? issuedValue / issuedInvoices.length : 0;
        const partnerValueMap = new Map<number | string, PartnerValuePoint>();

        affiliates.forEach((affiliate) => {
            partnerValueMap.set(affiliate.id, {
                id: affiliate.id,
                name: affiliate.companyName,
                value: 0,
                share: 0,
                invoices: 0,
                activeContracts: activeContracts.filter((contract) =>
                    contract.affiliates?.some((item) => item.id === affiliate.id),
                ).length,
                draftContracts: draftContracts.filter((contract) =>
                    contract.affiliates?.some((item) => item.id === affiliate.id),
                ).length,
            });
        });

        issuedInvoices.forEach((invoice) => {
            const id = getInvoicePartnerId(invoice);
            const existing = partnerValueMap.get(id);
            const fallbackName = invoice.affiliate?.companyName
                ?? invoice.documentSnapshot?.affiliate?.companyName
                ?? t('pages.commercialOverview.output.unknownPartner', { defaultValue: 'Unknown partner' });

            if (!existing) {
                partnerValueMap.set(id, {
                    id,
                    name: fallbackName,
                    value: getInvoiceTotal(invoice),
                    share: 0,
                    invoices: 1,
                    activeContracts: activeContracts.filter((contract) =>
                        contract.affiliates?.some((item) => item.id === id),
                    ).length,
                    draftContracts: draftContracts.filter((contract) =>
                        contract.affiliates?.some((item) => item.id === id),
                    ).length,
                });
                return;
            }

            existing.value += getInvoiceTotal(invoice);
            existing.invoices += 1;
        });

        const partnerValueTotal = [...partnerValueMap.values()].reduce((sum, item) => sum + item.value, 0);
        const partnerValueRows = [...partnerValueMap.values()]
            .map((item) => ({
                ...item,
                share: partnerValueTotal > 0 ? (item.value / partnerValueTotal) * 100 : 0,
            }))
            .sort((a, b) => {
                if (b.value !== a.value) return b.value - a.value;
                if (b.activeContracts !== a.activeContracts) return b.activeContracts - a.activeContracts;
                return a.name.localeCompare(b.name, locale);
            });
        const topCommercialPartner = partnerValueRows.find((item) => item.value > 0) ?? null;
        const selectedPartner = selectedPartnerId === null
            ? null
            : partnerValueRows.find((item) => item.id === selectedPartnerId) ?? null;
        const outputInvoices = selectedPartner
            ? issuedInvoices.filter((invoice) => getInvoicePartnerId(invoice) === selectedPartner.id)
            : issuedInvoices;
        const outputIssuedValue = outputInvoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0);
        const outputAverageProformaValue = outputInvoices.length > 0 ? outputIssuedValue / outputInvoices.length : 0;

        const partnerRows = affiliates
            .map((affiliate) => ({
                id: affiliate.id,
                name: affiliate.companyName,
                activeContracts: activeContracts.filter((contract) =>
                    contract.affiliates?.some((item) => item.id === affiliate.id),
                ).length,
            }))
            .sort((a, b) => b.activeContracts - a.activeContracts)
            .slice(0, 5);

        const affiliatesWithEmailSpo = affiliateEmailSpos.filter((item) => item.activeCount > 0);
        const emailSpoCoverage = affiliates.length > 0 ? (affiliatesWithEmailSpo.length / affiliates.length) * 100 : 0;

        const priceGapItems = seasonPriceSummaries
            .filter((summary) => summary.expectedCells > 0 && summary.missingCells > 0)
            .map((summary) => {
                const contract = seasonContracts.find((item) => item.id === summary.contractId);
                return contract ? {
                    label: contract.name,
                    detail: t('pages.commercialOverview.attention.priceGrid', {
                        defaultValue: '{{count}} missing price grid cells.',
                        count: summary.missingCells,
                    }),
                    to: `/contracts/${contract.id}/rates-grid`,
                } : null;
            })
            .filter((item): item is { label: string; detail: string; to: string } => Boolean(item));

        const zeroPriceItems = seasonPriceSummaries
            .filter((summary) => summary.zeroPriceAlerts > 0)
            .map((summary) => {
                const contract = seasonContracts.find((item) => item.id === summary.contractId);
                return contract ? {
                    label: contract.name,
                    detail: t('pages.commercialOverview.attention.zeroPrices', {
                        defaultValue: '{{count}} zero price alerts.',
                        count: summary.zeroPriceAlerts,
                    }),
                    to: `/contracts/${contract.id}/rates-grid`,
                } : null;
            })
            .filter((item): item is { label: string; detail: string; to: string } => Boolean(item));

        const noPeriodPriceItems = seasonPriceSummaries
            .filter((summary) => summary.expectedCells > 0 && summary.completedCells === 0)
            .map((summary) => {
                const contract = seasonContracts.find((item) => item.id === summary.contractId);
                return contract ? {
                    label: contract.name,
                    detail: t('pages.commercialOverview.attention.noPeriodPrices', { defaultValue: 'Rooms exist, but no period prices are configured.' }),
                    to: `/contracts/${contract.id}/rates-grid`,
                } : null;
            })
            .filter((item): item is { label: string; detail: string; to: string } => Boolean(item));

        const expiringItems = activeContracts
            .filter((contract) => {
                const days = daysUntil(contract.endDate);
                return days !== null && days >= 0 && days <= 60;
            })
            .map((contract) => ({
                label: contract.name,
                detail: t('pages.commercialOverview.attention.expiring', {
                    defaultValue: 'Ends in {{count}} days. Prepare renewal terms.',
                    count: daysUntil(contract.endDate) ?? 0,
                }),
                to: `/contracts/${contract.id}`,
            }));

        const affiliateItems = uncontractedAffiliates.slice(0, 3).map((affiliate) => ({
            label: affiliate.companyName,
            detail: t('pages.commercialOverview.attention.uncontractedAffiliate', { defaultValue: 'Affiliate has no active contract coverage.' }),
            to: '/partners/affiliates',
        }));

        const cancellationItems = activeWithoutCancellationRules.map((contract) => ({
            label: contract.name,
            detail: t('pages.commercialOverview.attention.noCancellation', { defaultValue: 'Active contract without cancellation rules.' }),
            to: `/contracts/${contract.id}/cancellation`,
            }));

        const draftReadyItems = seasonContracts
            .filter((contract) => contract.status === 'DRAFT')
            .filter((contract) => {
                const price = seasonPriceSummaries.find((item) => item.contractId === contract.id);
                const rules = seasonRuleSummaries.find((item) => item.contractId === contract.id);
                return (contract.periods?.length ?? 0) > 0
                    && (contract.contractRooms?.length ?? 0) > 0
                    && !!price
                    && price.expectedCells > 0
                    && price.missingCells === 0
                    && !!rules
                    && rules.totalRules > 0;
            })
            .map((contract) => ({
                label: contract.name,
                detail: t('pages.commercialOverview.attention.readyDraft', { defaultValue: 'Draft looks ready for activation review.' }),
                to: `/contracts/${contract.id}`,
            }));

        return {
            activeContractCoverage,
            activeContracts,
            activePartnerIds,
            activeWithoutCancellationRules,
            affiliateItems,
            affiliatesWithEmailSpo,
            attentionQueue: [
                ...priceGapItems,
                ...noPeriodPriceItems,
                ...zeroPriceItems,
                ...expiringItems,
                ...affiliateItems,
                ...cancellationItems,
                ...draftReadyItems,
            ].slice(0, 8),
            averageProformaValue,
            commercialRulesTotal,
            contractingReadiness,
            contractsMissingRules,
            draftContracts,
            draftReadyItems,
            emailSpoCoverage,
            expiring30,
            expiring60,
            expiring90,
            issuedInvoices,
            issuedValue,
            missingPeriods,
            missingRateCells,
            missingRooms,
            monthlyTrend: getMonthlyTrend(outputInvoices, locale),
            annualSeasonWindows,
            nextSeasonContractCount,
            nextSeasonCoverage,
            outputAverageProformaValue,
            outputInvoices,
            outputIssuedValue,
            partnerRows,
            partnerValueRows,
            partnerValueTotal,
            hasPriceGridCells,
            priceCompletedCells,
            priceExpectedCells,
            priceGridCompletion,
            readinessGaps,
            rulesAttachedToContracts,
            seasonEndingContracts,
            selectedSeasonDaysRemaining,
            seasonContracts,
            seasons,
            selectedSeason,
            selectedPartner,
            nextSeason,
            statusCounts,
            topCommercialPartner,
            uncontractedAffiliates,
            zeroPriceAlerts,
        };
    }, [
        affiliateEmailSpos,
        affiliates,
        arrangements.length,
        contracts,
        currentHotel?.defaultCurrency,
        currentHotel?.name,
        earlyBookingsTotal,
        locale,
        priceSummaries,
        proformas,
        reductionsTotal,
        roomTypes.length,
        ruleSummaries,
        selectedPartnerId,
        sposTotal,
        supplementsTotal,
        t,
    ]);

    const statusLabels: Record<ContractStatus, string> = {
        ACTIVE: t('pages.contractDetails.status.active', { defaultValue: 'Active' }),
        DRAFT: t('pages.contractDetails.status.draft', { defaultValue: 'Draft' }),
        EXPIRED: t('pages.contractDetails.status.expired', { defaultValue: 'Expired' }),
        TERMINATED: t('pages.contractDetails.status.terminated', { defaultValue: 'Terminated' }),
    };
    const maxTrendValue = Math.max(...dashboard.monthlyTrend.map((point) => point.value), 1);

    if (!currentHotel && !isHotelLoading) {
        return (
            <WorkspaceContainer>
                <section className="premium-surface p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                        <Hotel size={26} />
                    </div>
                    <h1 className="mt-5 text-2xl font-semibold text-brand-navy dark:text-brand-light">
                        {t('pages.commercialOverview.noHotel.title', { defaultValue: 'Select a hotel to open the commercial cockpit' })}
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        {t('pages.commercialOverview.noHotel.description', { defaultValue: 'The overview is scoped to one hotel at a time so contract, catalogue, partner, and invoice signals stay precise.' })}
                    </p>
                </section>
            </WorkspaceContainer>
        );
    }

    return (
        <WorkspaceContainer className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-brand-navy p-6 text-brand-light shadow-xl md:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-mint/25 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-brand-light/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="premium-pill border-brand-mint/30 bg-brand-mint/10 text-brand-mint">
                            {t('pages.commercialOverview.hero.eyebrow', { defaultValue: 'Commercial Command Center' })}
                        </p>
                        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
                            {t('pages.commercialOverview.hero.title', {
                                defaultValue: '{{hotel}} operating dashboard',
                                hotel: currentHotel?.name ?? t('common.hotel', { defaultValue: 'Hotel' }),
                            })}
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-light/72 md:text-base">
                            {t('pages.commercialOverview.hero.description', { defaultValue: 'A seasonal operating assistant for contract readiness, price-grid quality, partner coverage, and commercial output.' })}
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-brand-light/10 bg-brand-light/8 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-brand-slate">
                                    {t('pages.commercialOverview.hero.focusSeason', { defaultValue: 'Focus season' })}
                                </p>
                                <p className="mt-3 text-sm font-semibold leading-6">
                                    {dashboard.selectedSeason?.label ?? t('pages.commercialOverview.hero.noSeason', { defaultValue: 'No season detected' })}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-brand-light/10 bg-brand-light/8 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-brand-slate">
                                    {t('pages.commercialOverview.hero.seasonContracts', { defaultValue: 'Season contracts' })}
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{dashboard.seasonContracts.length}</p>
                            </div>
                            <div className="rounded-2xl border border-brand-light/10 bg-brand-light/8 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-brand-slate">
                                    {t('pages.commercialOverview.hero.nextSeason', { defaultValue: 'Next season' })}
                                </p>
                                <p className="mt-3 text-sm font-semibold leading-6">
                                    {dashboard.nextSeason?.label ?? t('pages.commercialOverview.hero.notPlanned', { defaultValue: 'Not planned yet' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Link
                        to="/contracts"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90"
                    >
                        {t('pages.commercialOverview.hero.openContracts', { defaultValue: 'Open contracts' })}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-40 animate-pulse rounded-2xl bg-brand-light/70 dark:bg-brand-light/5" />
                    ))}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label={t('pages.commercialOverview.command.readiness', { defaultValue: 'Season Readiness' })}
                    value={formatPercent(dashboard.contractingReadiness)}
                    detail={dashboard.readinessGaps.length === 0
                        ? t('pages.commercialOverview.command.readinessReadyDetail', { defaultValue: 'All focus-season readiness checks are complete.' })
                        : t('pages.commercialOverview.command.readinessGapDetail', {
                            defaultValue: 'Not ready yet: {{items}}.',
                            items: dashboard.readinessGaps.join(', '),
                        })}
                    icon={Gauge}
                />
                <MetricCard
                    label={t('pages.commercialOverview.command.coverage', { defaultValue: 'Season Active Coverage' })}
                    value={`${dashboard.activePartnerIds.size} / ${affiliates.length}`}
                    detail={dashboard.draftContracts.length > 0
                        ? t('pages.commercialOverview.command.coverageDraftDetail', {
                            defaultValue: 'Only active contracts count as coverage; {{count}} draft contract remains pending activation.',
                            count: dashboard.draftContracts.length,
                        })
                        : t('pages.commercialOverview.command.coverageDetail', { defaultValue: 'Affiliates covered by at least one active contract in the focus season.' })}
                    icon={Users}
                    tone="navy"
                />
                <MetricCard
                    label={t('pages.commercialOverview.command.priceCompletion', { defaultValue: 'Price Grid Completion' })}
                    value={dashboard.hasPriceGridCells
                        ? formatPercent(dashboard.priceGridCompletion)
                        : t('pages.commercialOverview.command.priceCompletionEmptyValue', { defaultValue: 'No grid' })}
                    detail={dashboard.hasPriceGridCells
                        ? t('pages.commercialOverview.command.priceCompletionDetail', {
                            defaultValue: '{{completed}} / {{total}} rate cells completed, {{missing}} still missing.',
                            completed: dashboard.priceCompletedCells,
                            total: dashboard.priceExpectedCells,
                            missing: dashboard.missingRateCells,
                        })
                        : t('pages.commercialOverview.command.priceCompletionEmptyDetail', {
                            defaultValue: 'No room-period rate cells exist in the focus season yet, so completion is not measurable.',
                        })}
                    icon={Percent}
                    tone="amber"
                />
                <MetricCard
                    label={t('pages.commercialOverview.command.issuedValue', { defaultValue: 'Issued Commercial Value' })}
                    value={formatMoney(dashboard.issuedValue, currency, locale)}
                    detail={t('pages.commercialOverview.command.issuedValueDetail', {
                        defaultValue: '{{count}} issued invoices for stays in the focus season.',
                        count: dashboard.issuedInvoices.length,
                    })}
                    icon={CircleDollarSign}
                    tone="slate"
                />
            </section>

            <section className="premium-surface p-5">
                <SectionHeader
                    eyebrow={t('pages.commercialOverview.health.eyebrow', { defaultValue: 'Section 2' })}
                    title={t('pages.commercialOverview.health.title', { defaultValue: 'Contract Portfolio Health' })}
                    description={t('pages.commercialOverview.health.description', {
                        defaultValue: 'Seasonal portfolio alignment and setup blockers for {{season}}.',
                        season: dashboard.selectedSeason?.label ?? t('pages.commercialOverview.hero.noSeason', { defaultValue: 'the detected season' }),
                    })}
                    icon={FileText}
                />
                <div className="mt-5 space-y-5">
                    <div className="space-y-4">
                        {statusOrder.map((status) => {
                            const count = dashboard.statusCounts[status];
                            const width = dashboard.seasonContracts.length > 0 ? (count / dashboard.seasonContracts.length) * 100 : 0;
                            return (
                                <ProgressRow
                                    key={status}
                                    label={`${statusLabels[status]} (${count})`}
                                    value={width}
                                />
                            );
                        })}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <MiniStat
                            label={t('pages.commercialOverview.health.seasonEndWave', { defaultValue: 'Season end wave' })}
                            value={dashboard.seasonEndingContracts.length}
                            icon={CalendarClock}
                            detail={dashboard.selectedSeasonDaysRemaining === null
                                ? t('pages.commercialOverview.health.noSeasonEnd', { defaultValue: 'No shared season end detected yet.' })
                                : t('pages.commercialOverview.health.seasonEndWaveDetail', {
                                    defaultValue: 'Ends {{date}} with {{count}} contracts aligned.',
                                    date: formatCompactDate(dashboard.selectedSeason?.endDate, locale),
                                    count: dashboard.seasonEndingContracts.length,
                                })}
                        />
                        <MiniStat
                            label={t('pages.commercialOverview.health.nextSeasonLoaded', { defaultValue: 'Next period loaded' })}
                            value={`${dashboard.nextSeasonContractCount} / ${dashboard.seasonContracts.length}`}
                            icon={ArrowRight}
                            detail={dashboard.nextSeason
                                ? t('pages.commercialOverview.health.nextSeasonLoadedDetail', {
                                    defaultValue: '{{coverage}} of current-period contracts already exist for the next contractual period.',
                                    coverage: formatPercent(dashboard.nextSeasonCoverage),
                                })
                                : t('pages.commercialOverview.health.nextSeasonMissing', { defaultValue: 'Winter or summer renewal period is not planned yet.' })}
                        />
                        <MiniStat
                            label={t('pages.commercialOverview.health.seasonCadence', { defaultValue: 'Season cadence' })}
                            value={`${dashboard.annualSeasonWindows.length} / 2`}
                            icon={Gauge}
                            detail={dashboard.annualSeasonWindows.length === 2
                                ? t('pages.commercialOverview.health.seasonCadenceHealthy', { defaultValue: 'Winter and summer contractual periods are detected.' })
                                : t('pages.commercialOverview.health.seasonCadenceDetail', {
                                    defaultValue: 'Hospitality baseline is two yearly periods: winter and summer.',
                                })}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                <div className="premium-surface p-5">
                    <SectionHeader
                        eyebrow={t('pages.commercialOverview.pricing.eyebrow', { defaultValue: 'Section 3' })}
                        title={t('pages.commercialOverview.pricing.title', { defaultValue: 'Pricing Setup Quality' })}
                        description={t('pages.commercialOverview.pricing.description', { defaultValue: 'Focus-season signals that prove the platform understands operational price-grid completeness.' })}
                        icon={BarChart3}
                    />
                    <div className="mt-6 rounded-3xl bg-brand-navy p-5 text-brand-light">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-brand-slate">{t('pages.commercialOverview.pricing.completion', { defaultValue: 'Price Grid Completion' })}</p>
                                <p className="mt-2 text-5xl font-semibold">
                                    {dashboard.hasPriceGridCells
                                        ? formatPercent(dashboard.priceGridCompletion)
                                        : t('pages.commercialOverview.pricing.noGridValue', { defaultValue: 'No grid' })}
                                </p>
                            </div>
                            <div
                                className="flex h-24 w-24 items-center justify-center rounded-full"
                                style={{
                                    background: `conic-gradient(var(--color-brand-mint) ${dashboard.hasPriceGridCells ? dashboard.priceGridCompletion * 3.6 : 0}deg, rgba(248,250,252,0.14) 0deg)`,
                                }}
                            >
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy text-lg font-semibold">
                                    {dashboard.hasPriceGridCells ? Math.round(dashboard.priceGridCompletion) : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MiniStat label={t('pages.commercialOverview.pricing.missingCells', { defaultValue: 'Missing rate cells' })} value={dashboard.missingRateCells} icon={AlertTriangle} />
                        <MiniStat label={t('pages.commercialOverview.pricing.zeroAlerts', { defaultValue: 'Zero price alerts' })} value={dashboard.zeroPriceAlerts} icon={CircleDollarSign} />
                        <MiniStat label={t('pages.commercialOverview.pricing.rulesAttached', { defaultValue: 'Rules attached' })} value={dashboard.rulesAttachedToContracts} icon={Sparkles} />
                    </div>
                </div>

                <div className="premium-surface p-5">
                    <SectionHeader
                        eyebrow={t('pages.commercialOverview.partners.eyebrow', { defaultValue: 'Section 4' })}
                        title={t('pages.commercialOverview.partners.title', { defaultValue: 'Partner Distribution Coverage' })}
                        description={t('pages.commercialOverview.partners.description', { defaultValue: 'Which affiliates have active coverage in the focus season, and where distribution incentives are concentrated.' })}
                        icon={Users}
                    />
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <MiniStat
                            label={t('pages.commercialOverview.partners.activeCoverage', { defaultValue: 'Affiliates with active contracts' })}
                            value={`${dashboard.activePartnerIds.size} / ${affiliates.length}`}
                            icon={Users}
                            detail={formatPercent(dashboard.activeContractCoverage)}
                        />
                        <MiniStat label={t('pages.commercialOverview.partners.uncontracted', { defaultValue: 'Uncontracted affiliates' })} value={dashboard.uncontractedAffiliates.length} icon={ShieldAlert} />
                        <MiniStat
                            label={t('pages.commercialOverview.partners.emailSpoCoverage', { defaultValue: 'Email SPO coverage' })}
                            value={`${dashboard.affiliatesWithEmailSpo.length} / ${affiliates.length}`}
                            icon={Gift}
                            detail={formatPercent(dashboard.emailSpoCoverage)}
                        />
                    </div>
                    <div className="mt-5 space-y-3">
                        {dashboard.partnerRows.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-brand-slate/20 p-5 text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/75">
                                {t('pages.commercialOverview.partners.empty', { defaultValue: 'Add partners to begin measuring distribution coverage.' })}
                            </p>
                        ) : (
                            dashboard.partnerRows.map((partner) => {
                                const width = dashboard.activeContracts.length > 0 ? (partner.activeContracts / dashboard.activeContracts.length) * 100 : 0;
                                return (
                                    <div key={partner.id} className="rounded-2xl border border-brand-light/70 bg-brand-light/70 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <div className="flex items-center justify-between gap-4 text-sm">
                                            <span className="font-semibold text-brand-navy dark:text-brand-light">{partner.name}</span>
                                            <span className="text-brand-slate dark:text-brand-light/75">
                                                {t('pages.commercialOverview.partners.contractCount', {
                                                    defaultValue: '{{count}} active contracts',
                                                    count: partner.activeContracts,
                                                })}
                                            </span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-slate/10 dark:bg-brand-light/10">
                                            <div className="h-full rounded-full bg-brand-mint" style={{ width: `${Math.max(8, width)}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            <section className="premium-surface p-5">
                <SectionHeader
                    eyebrow={t('pages.commercialOverview.output.eyebrow', { defaultValue: 'Section 5' })}
                        title={t('pages.commercialOverview.output.title', { defaultValue: 'Commercial Output' })}
                    description={t('pages.commercialOverview.output.description', { defaultValue: 'Issued invoice value for stays belonging to the focus season.' })}
                    icon={LineChart}
                />
                <div className="mt-5 grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <MiniStat
                            label={dashboard.selectedPartner
                                ? t('pages.commercialOverview.output.filteredIssuedValue', { defaultValue: 'Partner issued value' })
                                : t('pages.commercialOverview.output.issuedValue', { defaultValue: 'Issued invoice value' })}
                            value={formatMoney(dashboard.outputIssuedValue, currency, locale)}
                            icon={CircleDollarSign}
                            detail={dashboard.selectedPartner?.name}
                        />
                        <MiniStat
                            label={dashboard.selectedPartner
                                ? t('pages.commercialOverview.output.filteredIssuedCount', { defaultValue: 'Partner invoices' })
                                : t('pages.commercialOverview.output.issuedCount', { defaultValue: 'Issued invoices' })}
                            value={dashboard.outputInvoices.length}
                            icon={FileText}
                        />
                        <MiniStat
                            label={t('pages.commercialOverview.output.averageValue', { defaultValue: 'Average invoice value' })}
                            value={formatMoney(dashboard.outputAverageProformaValue, currency, locale)}
                            icon={Activity}
                        />
                        <MiniStat
                            label={t('pages.commercialOverview.output.topPartner', { defaultValue: 'Top partner' })}
                            value={dashboard.topCommercialPartner ? formatMoney(dashboard.topCommercialPartner.value, currency, locale) : '-'}
                            icon={Users}
                            detail={dashboard.topCommercialPartner
                                ? dashboard.topCommercialPartner.name
                                : t('pages.commercialOverview.output.noPartnerValue', { defaultValue: 'No issued partner value yet.' })}
                        />
                    </div>
                    <div>
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                    {t('pages.commercialOverview.output.partnerValueTitle', { defaultValue: 'Partner Commercial Value' })}
                                </p>
                                <p className="text-xs leading-5 text-brand-slate dark:text-brand-light/70">
                                    {t('pages.commercialOverview.output.partnerValueDescription', { defaultValue: 'Issued value by affiliate for stays in the focus season.' })}
                                </p>
                            </div>
                            <span className="text-xs font-semibold text-brand-slate dark:text-brand-light/65">
                                {formatMoney(dashboard.partnerValueTotal, currency, locale)}
                            </span>
                        </div>
                        <PartnerValueChart
                            rows={dashboard.partnerValueRows}
                            currency={currency}
                            locale={locale}
                            selectedPartnerId={selectedPartnerId}
                            onPartnerSelect={(partnerId) => setSelectedPartnerId((current) => current === partnerId ? null : partnerId)}
                            onClearSelection={() => setSelectedPartnerId(null)}
                            emptyLabel={t('pages.commercialOverview.output.partnerValueEmpty', { defaultValue: 'Issue invoices to start ranking commercial partners.' })}
                        />
                    </div>
                    <div className="rounded-3xl bg-brand-navy p-5 xl:col-span-2">
                        <div className="flex h-60 items-end gap-3">
                            {dashboard.monthlyTrend.map((point) => (
                                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                                    <div
                                        className="w-full rounded-t-2xl bg-gradient-to-t from-brand-mint to-brand-light/80"
                                        style={{ height: `${Math.max(10, (point.value / maxTrendValue) * 190)}px` }}
                                        title={formatMoney(point.value, currency, locale)}
                                    />
                                    <span className="text-xs font-semibold text-brand-light/65">{point.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="premium-surface p-5">
                <SectionHeader
                    eyebrow={t('pages.commercialOverview.attention.eyebrow', { defaultValue: 'Section 6' })}
                    title={t('pages.commercialOverview.attention.title', { defaultValue: 'Attention Queue' })}
                    description={t('pages.commercialOverview.attention.description', { defaultValue: 'Prioritized operational assistant feed: price-grid gaps, renewal risk, uncovered affiliates, missing rules, and activation-ready drafts.' })}
                    icon={Activity}
                />
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {dashboard.attentionQueue.length === 0 ? (
                        <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/8 p-5 text-sm text-brand-navy dark:text-brand-light lg:col-span-2">
                            <CheckCircle2 size={18} className="mb-3 text-brand-mint" />
                            {t('pages.commercialOverview.attention.clear', { defaultValue: 'No urgent commercial gaps detected. The workspace is looking calm.' })}
                        </div>
                    ) : (
                        dashboard.attentionQueue.map((item) => (
                            <Link
                                key={`${item.to}-${item.label}-${item.detail}`}
                                to={item.to}
                                className="group rounded-2xl border border-brand-light/70 bg-brand-light/70 p-4 transition hover:-translate-y-0.5 hover:border-brand-mint/25 hover:bg-brand-mint/8 dark:border-brand-light/10 dark:bg-brand-light/5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-brand-navy dark:text-brand-light">{item.label}</p>
                                        <p className="mt-1 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{item.detail}</p>
                                    </div>
                                    <ArrowRight size={16} className="mt-1 shrink-0 text-brand-mint transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {[
                    {
                        title: t('pages.commercialOverview.next.contracts.title', { defaultValue: 'Contract workbench' }),
                        description: t('pages.commercialOverview.next.contracts.description', { defaultValue: 'Open contracts, activate completed agreements, and fix missing setup gaps.' }),
                        to: '/contracts',
                        icon: FileText,
                    },
                    {
                        title: t('pages.commercialOverview.next.catalog.title', { defaultValue: 'Catalogue rules' }),
                        description: t('pages.commercialOverview.next.catalog.description', { defaultValue: 'Tune supplements, reductions, SPOs, and early-booking incentives.' }),
                        to: '/product/supplements',
                        icon: Package,
                    },
                    {
                        title: t('pages.commercialOverview.next.simulator.title', { defaultValue: 'Rate Simulation' }),
                        description: t('pages.commercialOverview.next.simulator.description', { defaultValue: 'Validate selling prices and produce a clean invoice preview.' }),
                        to: '/simulator',
                        icon: Sparkles,
                    },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="group rounded-2xl border border-brand-light/70 bg-brand-light/74 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-mint/25 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5"
                        >
                            <span className="inline-flex rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                <Icon size={18} />
                            </span>
                            <p className="mt-4 font-semibold text-brand-navy dark:text-brand-light">{item.title}</p>
                            <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{item.description}</p>
                            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-mint">
                                {t('actions.open', { defaultValue: 'Open' })}
                                <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                            </span>
                        </Link>
                    );
                })}
            </section>

            <section className="premium-surface p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MiniStat label={t('pages.commercialOverview.catalog.rooms', { defaultValue: 'Rooms' })} value={roomTypes.length} icon={BedDouble} />
                    <MiniStat label={t('pages.commercialOverview.catalog.arrangements', { defaultValue: 'Arrangements' })} value={arrangements.length} icon={UtensilsCrossed} />
                    <MiniStat label={t('pages.commercialOverview.catalog.supplementsReductions', { defaultValue: 'Supplements + reductions' })} value={supplementsTotal + reductionsTotal} icon={Package} />
                    <MiniStat label={t('pages.commercialOverview.catalog.sposEarlyBooking', { defaultValue: 'SPO + early booking' })} value={sposTotal + earlyBookingsTotal} icon={Gift} />
                </div>
            </section>
        </WorkspaceContainer>
    );
}
