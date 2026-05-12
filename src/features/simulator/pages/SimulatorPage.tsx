import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle,
    Baby,
    BedDouble,
    Building2,
    Calculator,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    FileText,
    Flame,
    Info,
    Loader2,
    Mail,
    Minus,
    Plus,
    Printer,
    Receipt,
    Ticket,
    Trash2,
    User,
    Utensils,
} from 'lucide-react';
import { GuidedPageHeader } from '../../../components/layout/Workspace';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useContract } from '../../contracts/hooks/useContracts';
import { useHotel } from '../../hotel/context/HotelContext';
import { useAuth } from '../../auth/context/AuthContext';
import { useCalculateSimulation, useSimulationContractMatches } from '../hooks/useSimulator';
import { useCreateProforma } from '../hooks/useProforma';
import { SimulationRequest, OccupantType } from '../types/simulator.types';
import apiClient from '../../../services/api.client';

interface RoomingState {
    id: string;
    roomId: string;
    boardTypeId: string;
    occupants: { id: string; type: OccupantType; age: number }[];
}

const inputClassName = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';
const selectClassName = `${inputClassName} cursor-pointer`;
const labelClassName = 'text-sm font-semibold text-brand-navy dark:text-brand-light';

function formatCurrency(value: number, currency: string) {
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

function baseOccupancyAmount(day: { netRate: number; reductionsApplied: Array<{ amount: number }> }) {
    const adjustmentsTotal = day.reductionsApplied.reduce((sum, adjustment) => sum + Number(adjustment.amount || 0), 0);
    return Math.max(0, day.netRate - adjustmentsTotal);
}

function hasNightlyReduction(day: { promotionApplied: { amount: number } | null; reductionsApplied: Array<{ amount: number }> }) {
    return Boolean(day.promotionApplied && day.promotionApplied.amount < 0)
        || day.reductionsApplied.some((adjustment) => Number(adjustment.amount || 0) < 0);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function filenameFromContentDisposition(header?: string) {
    if (!header) return 'simulation-ticket.pdf';

    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''));

    const asciiMatch = header.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? 'simulation-ticket.pdf';
}

export default function SimulatorPage() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentHotel } = useHotel();
    const { data: affiliates } = useAffiliates();
    const { data: allArrangements } = useArrangements();

    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('');
    const [selectedContractId, setSelectedContractId] = useState<number | undefined>();
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [inactiveOverrideReason, setInactiveOverrideReason] = useState('');

    const generateId = () => crypto.randomUUID();

    const [roomingList, setRoomingList] = useState<RoomingState[]>([
        {
            id: generateId(),
            roomId: '',
            boardTypeId: '',
            occupants: [
                { id: generateId(), type: OccupantType.ADULT, age: 30 },
                { id: generateId(), type: OccupantType.ADULT, age: 30 },
            ],
        },
    ]);

    const [expandedNights, setExpandedNights] = useState<Record<string, boolean>>({});
    const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);

    const { mutate: runSimulation, data: simulationResult, isPending: isSimulating } = useCalculateSimulation();
    const { mutate: createProforma, isPending: isCreatingProforma } = useCreateProforma((data) => navigate(`/proforma/${data.id}`));
    const canIncludeInactiveContracts = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';
    const effectiveIncludeInactive = canIncludeInactiveContracts ? includeInactive : false;

    const {
        data: contractMatches,
        isFetching: loadingContractMatches,
    } = useSimulationContractMatches({
        affiliateId: selectedAffiliateId ? Number(selectedAffiliateId) : undefined,
        checkIn,
        checkOut,
        includeInactive: effectiveIncludeInactive,
    });

    const { data: activeContract, isLoading: loadingActiveContract } = useContract(selectedContractId);
    const allowedArrangements = useMemo(() => {
        if (!allArrangements || !activeContract) return [];
        let filtered = allArrangements;

        if (activeContract.baseArrangement?.id) {
            const baseLevel = allArrangements.find((arrangement) => arrangement.id === activeContract.baseArrangement!.id)?.level ?? 0;
            filtered = allArrangements.filter((arrangement) => (arrangement.level ?? 0) >= baseLevel);
        }

        return [...filtered].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    }, [allArrangements, activeContract]);

    useEffect(() => {
        if (!selectedAffiliateId || !checkIn || !checkOut || !contractMatches) {
            setSelectedContractId(undefined);
            return;
        }

        if (contractMatches.status === 'single' && contractMatches.autoSelectedContractId) {
            setSelectedContractId(contractMatches.autoSelectedContractId);
            return;
        }

        if (contractMatches.status === 'multiple') {
            setSelectedContractId((currentId) => (
                contractMatches.candidates.some((candidate) => candidate.contractId === currentId)
                    ? currentId
                    : undefined
            ));
            return;
        }

        setSelectedContractId(undefined);
    }, [selectedAffiliateId, checkIn, checkOut, contractMatches]);

    useEffect(() => {
        setRoomingList([
            {
                id: generateId(),
                roomId: '',
                boardTypeId: '',
                occupants: [
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                ],
            },
        ]);
    }, [activeContract?.id]);

    useEffect(() => {
        if (!effectiveIncludeInactive) {
            setInactiveOverrideReason('');
        }
    }, [effectiveIncludeInactive]);

    const addRoom = () => {
        setRoomingList((prev) => [
            ...prev,
            {
                id: generateId(),
                roomId: '',
                boardTypeId: '',
                occupants: [
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                ],
            },
        ]);
    };

    const removeRoom = (index: number) => {
        setRoomingList((prev) => prev.filter((_, roomIndex) => roomIndex !== index));
    };

    const updateRoomType = (roomIndex: number, roomId: string) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].roomId = roomId;
        setRoomingList(newRooms);
    };

    const updateRoomBoardType = (roomIndex: number, boardTypeId: string) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].boardTypeId = boardTypeId;
        setRoomingList(newRooms);
    };

    const addOccupant = (roomIndex: number, type: OccupantType) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants.push({
            id: generateId(),
            type,
            age: type === OccupantType.ADULT ? 30 : 8,
        });
        setRoomingList(newRooms);
    };

    const removeOccupant = (roomIndex: number, occupantIndex: number) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants = newRooms[roomIndex].occupants.filter((_, index) => index !== occupantIndex);
        setRoomingList(newRooms);
    };

    const updateOccupantAge = (roomIndex: number, occupantIndex: number, age: number) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants[occupantIndex].age = age;
        setRoomingList(newRooms);
    };

    const isFormValid = useMemo(() => {
        if (!activeContract || !checkIn || !checkOut) return false;
        if (roomingList.length === 0) return false;

        for (const room of roomingList) {
            if (!room.roomId) return false;
            if (!room.boardTypeId) return false;
            if (room.occupants.length === 0) return false;
            if (!room.occupants.some((occupant) => occupant.type === OccupantType.ADULT)) return false;
        }

        return true;
    }, [activeContract, checkIn, checkOut, roomingList]);

    const buildSimulationRequest = (): SimulationRequest | null => {
        if (!isFormValid || !activeContract) return null;

        return {
            contractId: activeContract.id,
            affiliateId: Number(selectedAffiliateId),
            checkIn,
            checkOut,
            bookingDate,
            includeInactive: effectiveIncludeInactive,
            inactiveOverrideReason: effectiveIncludeInactive ? inactiveOverrideReason.trim() || undefined : undefined,
            roomingList: roomingList.map((room) => {
                let paxOrder = 1;
                return {
                    roomId: parseInt(room.roomId),
                    boardTypeId: parseInt(room.boardTypeId),
                    occupants: room.occupants.map((occupant) => ({
                        paxOrder: paxOrder++,
                        type: occupant.type,
                        age: occupant.age,
                    })),
                };
            }),
        };
    };

    const handleRunSimulation = () => {
        const request = buildSimulationRequest();
        if (!request) return;

        runSimulation(request);
    };

    const handleDownloadAgentTicket = async () => {
        const request = buildSimulationRequest();
        if (!request) return;

        setIsDownloadingTicket(true);
        try {
            const response = await apiClient.post<Blob>('/simulation/ticket', request, {
                responseType: 'blob',
                timeout: 30_000,
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = filenameFromContentDisposition(response.headers['content-disposition']);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloadingTicket(false);
        }
    };

    const toggleNight = (date: string) => {
        setExpandedNights((prev) => ({ ...prev, [date]: !prev[date] }));
    };

    const totalAdults = roomingList.reduce((acc, room) => acc + room.occupants.filter((occupant) => occupant.type === OccupantType.ADULT).length, 0);
    const totalChildren = roomingList.reduce((acc, room) => acc + room.occupants.filter((occupant) => occupant.type !== OccupantType.ADULT).length, 0);
    const selectedAffiliate = affiliates?.find((affiliate) => String(affiliate.id) === selectedAffiliateId);
    const nightsCount = simulationResult?.roomsBreakdown?.[0]?.dailyRates.length ?? 0;
    const selectedContractCandidate = contractMatches?.candidates.find((candidate) => candidate.contractId === selectedContractId);
    const selectedContractIsInactive = selectedContractCandidate?.status && selectedContractCandidate.status !== 'ACTIVE';
    const isAgent = user?.role === 'AGENT';
    const stayNights = useMemo(() => {
        if (!checkIn || !checkOut) return undefined;

        const start = new Date(`${checkIn}T00:00:00`);
        const end = new Date(`${checkOut}T00:00:00`);
        const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);

        return nights > 0 ? nights : undefined;
    }, [checkIn, checkOut]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <GuidedPageHeader
                icon={Calculator}
                kicker={t('pages.simulator.header.eyebrow', { defaultValue: 'Pricing Simulator' })}
                title={t('pages.simulator.header.title', { defaultValue: 'Quote a stay with contract precision.' })}
                description={t('pages.simulator.header.subtitle', { defaultValue: 'Select a partner, compose a rooming list, and calculate a detailed net quote against the active contract.' })}
                actions={(
                <div className="hidden">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.simulator.header.eyebrow', { defaultValue: 'Pricing Simulator' })}
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            {t('pages.simulator.header.title', { defaultValue: 'Quote a stay with contract precision.' })}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {t('pages.simulator.header.subtitle', { defaultValue: 'Select a partner, compose a rooming list, and calculate a detailed net quote against the active contract.' })}
                        </p>
                    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/65 p-3 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="rounded-2xl bg-brand-navy px-4 py-3 text-brand-light">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light/60">{t('auto.features.simulator.pages.simulatorpage.dde75327', { defaultValue: "Rooms" })}</p>
                            <p className="mt-2 text-2xl font-semibold">{roomingList.length}</p>
                        </div>
                        <div className="rounded-2xl bg-brand-mint/10 px-4 py-3 text-brand-mint">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{t('auto.features.simulator.pages.simulatorpage.155e9de1', { defaultValue: "Adults" })}</p>
                            <p className="mt-2 text-2xl font-semibold">{totalAdults}</p>
                        </div>
                        <div className="rounded-2xl bg-brand-light/75 px-4 py-3 text-brand-navy dark:bg-brand-light/5 dark:text-brand-light">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate">{t('auto.features.simulator.pages.simulatorpage.29ca0350', { defaultValue: "Kids" })}</p>
                            <p className="mt-2 text-2xl font-semibold">{totalChildren}</p>
                        </div>
                    </div>
                </div>
                )}
            />

            <section className="premium-surface p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-3 border-b border-brand-light/60 pb-4 dark:border-brand-light/10 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-brand-light">
                        <Calendar size={17} className="text-brand-mint" />
                        Booking criteria
                    </h2>

                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                        <span className="premium-pill border-brand-light/70 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                            {stayNights ? `${stayNights} night${stayNights > 1 ? 's' : ''}` : 'Stay dates pending'}
                        </span>
                        <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {effectiveIncludeInactive ? 'Inactive matching enabled' : 'Active contracts only'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
                    <div className="space-y-2">
                        <label className={`${labelClassName} flex items-center gap-2`}>
                            <Building2 size={16} className="text-brand-mint" />
                            {t('pages.simulator.partner.label', { defaultValue: 'Partner / affiliate' })}
                        </label>
                        <select
                            value={selectedAffiliateId}
                            onChange={(event) => setSelectedAffiliateId(event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">{t('pages.simulator.partner.placeholder', { defaultValue: 'Choose a partner' })}</option>
                            {affiliates?.map((affiliate) => (
                                <option key={affiliate.id} value={affiliate.id}>
                                    {affiliate.companyName} {affiliate.reference ? `(${affiliate.reference})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className={`${labelClassName} flex items-center gap-2`}>
                            <Clock size={14} className="text-brand-mint" />
                            Booking date for offers
                        </label>
                        <input
                            type="date"
                            value={bookingDate}
                            onChange={(event) => setBookingDate(event.target.value)}
                            className={inputClassName}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className={`${labelClassName} flex items-center gap-2`}>
                            <Calendar size={15} className="text-brand-mint" />
                            Check-in
                        </label>
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(event) => setCheckIn(event.target.value)}
                            className={inputClassName}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label className={labelClassName}>
                                Check-out
                            </label>
                            {stayNights && (
                                <span className="text-xs font-semibold text-brand-mint">
                                    {stayNights} night{stayNights > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <input
                            type="date"
                            value={checkOut}
                            min={checkIn || undefined}
                            onChange={(event) => setCheckOut(event.target.value)}
                            className={inputClassName}
                        />
                    </div>
                </div>

                {canIncludeInactiveContracts && (
                    <div className="mt-4 border-t border-brand-light/60 pt-4 dark:border-brand-light/10">
                        <label className="flex flex-col gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/45 px-4 py-3 text-sm font-medium text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light sm:flex-row sm:items-center sm:justify-between">
                            <span className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={includeInactive}
                                    onChange={(event) => setIncludeInactive(event.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-brand-slate/40 text-brand-mint focus:ring-brand-mint"
                                />
                                <span>
                                    Include inactive / expired contracts
                                    <span className="mt-1 block text-xs font-normal text-brand-slate dark:text-brand-light/70">
                                        Enable only for controlled commercial simulations.
                                    </span>
                                </span>
                            </span>
                            <span className={`premium-pill self-start ${includeInactive ? 'border-amber-300/50 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200' : 'border-brand-light/70 bg-brand-light/80 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70'}`}>
                                {includeInactive ? 'Override on' : 'Default'}
                            </span>
                        </label>

                        {includeInactive && (
                            <label className="mt-3 block space-y-2">
                                <span className="text-xs font-semibold text-brand-slate dark:text-brand-light/70">
                                    Override reason
                                </span>
                                <textarea
                                    value={inactiveOverrideReason}
                                    onChange={(event) => setInactiveOverrideReason(event.target.value)}
                                    rows={2}
                                    placeholder="Optional reason for using an inactive contract"
                                    className="w-full resize-none rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 py-3 text-xs text-brand-navy shadow-sm outline-none transition placeholder:text-brand-slate/50 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                />
                            </label>
                        )}
                    </div>
                )}

                {selectedAffiliateId && (
                    <div className="mt-5 animate-in fade-in slide-in-from-left-2 duration-300">
                        {!checkIn || !checkOut ? (
                            <div className="flex items-center gap-4 rounded-2xl border border-brand-slate/30 bg-brand-slate/10 p-4 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-slate/20 text-brand-light">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Stay dates required</p>
                                    <p className="text-sm font-medium">Choose check-in and check-out dates to find matching active contracts.</p>
                                </div>
                            </div>
                        ) : loadingContractMatches || loadingActiveContract ? (
                            <div className="h-20 w-full animate-pulse rounded-2xl border border-brand-light/70 bg-brand-light/55 dark:border-brand-light/10 dark:bg-brand-light/5" />
                        ) : contractMatches?.status === 'multiple' ? (
                            <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/8 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-light">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-mint">Multiple matching contracts</p>
                                        <p className="text-sm font-medium text-brand-navy dark:text-brand-light">
                                            Select the contract to use for this stay.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {contractMatches.candidates.map((candidate) => (
                                        <button
                                            key={candidate.contractId}
                                            type="button"
                                            onClick={() => setSelectedContractId(candidate.contractId)}
                                            className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedContractId === candidate.contractId ? 'border-brand-mint bg-brand-mint/12' : 'border-brand-light/70 bg-brand-light/80 dark:border-brand-light/10 dark:bg-brand-light/5'}`}
                                        >
                                            <p className="text-sm font-bold text-brand-navy dark:text-brand-light">{candidate.name}</p>
                                            <p className="mt-1 text-xs font-medium text-brand-slate">
                                                {candidate.reference ? `${candidate.reference} - ` : ''}{formatDate(candidate.startDate)} to {formatDate(candidate.endDate)}
                                            </p>
                                            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-mint">
                                                {candidate.currency}{candidate.baseArrangement ? ` / ${candidate.baseArrangement.name}` : ''}
                                            </p>
                                            {candidate.status !== 'ACTIVE' && (
                                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                                                    {candidate.status} contract
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : activeContract ? (
                            <div className={`flex items-center gap-4 rounded-2xl border p-4 ${selectedContractIsInactive ? 'border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100' : 'border-brand-mint/20 bg-brand-mint/8'}`}>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-light">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-mint">
                                        {selectedContractIsInactive ? 'Inactive contract selected' : contractMatches?.status === 'single' ? 'Matching contract found' : t('pages.simulator.partner.activeContract', { defaultValue: 'Active contract found' })}
                                    </p>
                                    <p className="truncate text-sm font-semibold text-brand-navy dark:text-brand-light">{activeContract.name}</p>
                                    {selectedContractIsInactive && (
                                        <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-200">
                                            Status: {selectedContractCandidate?.status}. This simulation uses an explicit inactive-contract override.
                                        </p>
                                    )}
                                </div>
                                <div className="ml-auto hidden text-right sm:block">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate">{t('auto.features.simulator.pages.simulatorpage.de15aed4', { defaultValue: "Valid until" })}</p>
                                    <p className="text-xs font-bold text-brand-navy dark:text-brand-light">{formatDate(activeContract.endDate)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 rounded-2xl border border-brand-slate/30 bg-brand-slate/10 p-4 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-slate/20 text-brand-light">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                                        {effectiveIncludeInactive ? 'No allowed contract' : t('auto.features.simulator.pages.simulatorpage.f9fa769d', { defaultValue: "No active contract" })}
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedAffiliate?.companyName} has no {effectiveIncludeInactive ? 'allowed' : 'active'} contract covering {formatDate(checkIn)} to {formatDate(checkOut)} for {currentHotel?.name ?? 'this hotel'}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {activeContract && (
                <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <section className="premium-surface overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-brand-light/60 px-6 py-5 dark:border-brand-light/10">
                                <div className="rounded-2xl bg-brand-mint/12 p-3 text-brand-mint">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">
                                        {t('pages.simulator.stay.eyebrow', { defaultValue: 'Stay Setup' })}
                                    </p>
                                    <h2 className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                                        {t('pages.simulator.stay.title', { defaultValue: 'Dates and room boards' })}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-6 p-6">
                                <p className="flex items-center gap-2 text-sm font-medium text-brand-slate dark:text-brand-light/75">
                                    <Info size={14} className="text-brand-mint" />
                                    Dates are matched against the selected contract above. Choose a board separately for each simulated room below.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">
                                        {t('pages.simulator.roomingList.eyebrow', { defaultValue: 'Occupancy' })}
                                    </p>
                                    <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-brand-navy dark:text-brand-light">
                                        <BedDouble size={20} className="text-brand-mint" />
                                        {t('pages.simulator.roomingList.title', { defaultValue: 'Rooming List' })}
                                    </h2>
                                </div>
                                <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                                    {roomingList.length} room{roomingList.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {roomingList.map((room, roomIndex) => {
                                const selectedRoomMeta = activeContract.contractRooms.find((contractRoom) => String(contractRoom.roomType.id) === room.roomId)?.roomType;

                                return (
                                    <article key={room.id} className="premium-surface overflow-hidden transition hover:-translate-y-0.5">
                                        <div className="flex items-center justify-between border-b border-brand-light/60 bg-brand-light/45 px-5 py-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-navy text-xs font-bold text-brand-light">
                                                    {roomIndex + 1}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-brand-navy dark:text-brand-light">Room {roomIndex + 1}</h3>
                                                    <p className="text-xs text-brand-slate dark:text-brand-light/75">{room.occupants.length} occupant{room.occupants.length > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            {roomingList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoom(roomIndex)}
                                                    className="rounded-2xl border border-brand-slate/30 bg-brand-slate/10 p-2 text-brand-slate transition hover:bg-brand-slate/10 dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75"
                                                    title={t('auto.features.simulator.pages.simulatorpage.title.a4dfb77a', { defaultValue: "Remove room" })}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-6 p-5">
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className={labelClassName}>{t('auto.features.simulator.pages.simulatorpage.35b620e0', { defaultValue: "Room type" })}</label>
                                                    <select
                                                        value={room.roomId}
                                                        onChange={(event) => updateRoomType(roomIndex, event.target.value)}
                                                        className={selectClassName}
                                                    >
                                                        <option value="">{t('auto.features.simulator.pages.simulatorpage.10642227', { defaultValue: "Select a room" })}</option>
                                                        {activeContract.contractRooms?.map((contractRoom) => (
                                                            <option key={contractRoom.id} value={contractRoom.roomType.id}>
                                                                {contractRoom.roomType.name} ({contractRoom.roomType.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {selectedRoomMeta && (
                                                        <p className="flex items-center gap-1 text-[11px] font-medium text-brand-slate dark:text-brand-light/75">
                                                            <Info size={12} className="text-brand-mint" />
                                                            Capacity: {selectedRoomMeta.minAdults}-{selectedRoomMeta.maxAdults} adult(s), max {selectedRoomMeta.maxChildren} child(ren)
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className={`${labelClassName} flex items-center gap-2`}>
                                                        <Utensils size={14} className="text-brand-mint" />
                                                        Board
                                                    </label>
                                                    <select
                                                        value={room.boardTypeId}
                                                        onChange={(event) => updateRoomBoardType(roomIndex, event.target.value)}
                                                        className={selectClassName}
                                                    >
                                                        <option value="">{t('auto.features.simulator.pages.simulatorpage.8773864b', { defaultValue: "Select arrangement" })}</option>
                                                        {allowedArrangements.map((arrangement) => (
                                                            <option key={arrangement.id} value={arrangement.id}>
                                                                {arrangement.name} ({arrangement.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="flex items-center gap-1 text-[11px] font-medium text-brand-slate dark:text-brand-light/75">
                                                        <Info size={12} className="text-brand-mint" />
                                                        Board supplements are calculated for this room only.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-brand-mint/15 bg-brand-mint/8 p-4">
                                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                        <User size={16} className="text-brand-mint" />
                                                        Room occupants
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => addOccupant(roomIndex, OccupantType.ADULT)}
                                                            className="inline-flex items-center gap-1 rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 text-xs font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-brand-mint/30 hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                                        >
                                                            <Plus size={14} /> Adult
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => addOccupant(roomIndex, OccupantType.CHILD)}
                                                            className="inline-flex items-center gap-1 rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 text-xs font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-brand-mint/30 hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                                        >
                                                            <Plus size={14} /> Child
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {room.occupants.map((occupant, occupantIndex) => (
                                                        <div key={occupant.id} className="flex flex-col gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/80 p-3 shadow-sm animate-in fade-in zoom-in-95 duration-200 dark:border-brand-light/10 dark:bg-brand-light/5 sm:flex-row sm:items-center">
                                                            <div className="flex w-32 shrink-0 items-center gap-2">
                                                                {occupant.type === OccupantType.ADULT ? (
                                                                    <User size={16} className="text-brand-mint" />
                                                                ) : (
                                                                    <Baby size={16} className="text-brand-mint" />
                                                                )}
                                                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                                    {occupant.type === OccupantType.ADULT ? 'Adult' : 'Child'}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-1 items-center gap-3">
                                                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">{t('auto.features.simulator.pages.simulatorpage.1b108074', { defaultValue: "Age" })}</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="99"
                                                                    value={occupant.age}
                                                                    onChange={(event) => updateOccupantAge(roomIndex, occupantIndex, parseInt(event.target.value) || 0)}
                                                                    className="w-24 rounded-xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 text-center text-sm font-semibold text-brand-navy outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                                                />
                                                                <span className="text-xs font-medium text-brand-slate">{t('auto.features.simulator.pages.simulatorpage.1c1e22af', { defaultValue: "years" })}</span>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeOccupant(roomIndex, occupantIndex)}
                                                                disabled={room.occupants.length <= 1}
                                                                className="self-start rounded-xl p-2 text-brand-slate transition hover:bg-brand-slate/10 hover:text-brand-slate disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-slate sm:self-auto"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {room.occupants.length === 0 && (
                                                        <p className="py-2 text-sm font-medium text-brand-slate">{t('auto.features.simulator.pages.simulatorpage.1ccd64b6', { defaultValue: "A room needs at least one occupant." })}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}

                            <button
                                type="button"
                                onClick={addRoom}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-mint/30 bg-brand-mint/8 py-4 text-sm font-semibold text-brand-mint transition hover:-translate-y-0.5 hover:border-brand-mint hover:bg-brand-mint/12"
                            >
                                <Plus size={18} />
                                Add another room
                            </button>
                        </section>

                        <button
                            type="button"
                            onClick={handleRunSimulation}
                            disabled={!isFormValid || isSimulating}
                            className="group relative mt-8 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-navy px-8 py-4 text-lg font-bold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint disabled:cursor-not-allowed disabled:bg-brand-slate/10 disabled:hover:translate-y-0 dark:disabled:bg-brand-light/10"
                        >
                            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-brand-light/0 via-brand-light/15 to-brand-light/0 transition-transform duration-1000 group-hover:translate-x-full" />
                            {isSimulating ? (
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
                            ) : (
                                <Calculator size={22} />
                            )}
                            {isSimulating ? 'Calculating...' : 'Run rooming list simulation'}
                        </button>
                    </div>

                    <aside className="xl:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            <section className={`premium-surface transition-all duration-500 ${simulationResult ? 'ring-1 ring-brand-mint/30' : ''}`}>
                                <div className="bg-brand-navy px-6 py-8 text-brand-light">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div className="rounded-2xl bg-brand-light/10 p-3">
                                            <Receipt size={24} />
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${simulationResult ? 'bg-brand-mint text-brand-light' : 'bg-brand-light/10 text-brand-light/70'}`}>
                                            {simulationResult ? 'Completed' : 'Awaiting quote'}
                                        </span>
                                    </div>

                                    {simulationResult ? (
                                        <div className="animate-in fade-in zoom-in-95 duration-500">
                                            <div className="text-4xl font-black tracking-tight">
                                                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalNet)}
                                                <span className="ml-2 text-xl font-medium text-brand-mint">{simulationResult.currency}</span>
                                            </div>
                                            <p className="mt-3 flex items-center gap-2 text-sm text-brand-light/70">
                                                <Calendar size={14} />
                                                {nightsCount} {nightsCount > 1 ? 'nights' : 'night'} / {totalAdults} {totalAdults > 1 ? 'adults' : 'adult'} {totalChildren > 0 && `/ ${totalChildren} ${totalChildren > 1 ? 'children' : 'child'}`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-xl font-bold">{t('auto.features.simulator.pages.simulatorpage.3e7dbe1c', { defaultValue: "Quote detail" })}</h3>
                                            <p className="mt-2 text-sm text-brand-light/60">{t('auto.features.simulator.pages.simulatorpage.52b26439', { defaultValue: "Complete the rooming list to reveal the final net price." })}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col">
                                    {simulationResult ? (
                                        <div className="max-h-[600px] flex-1 overflow-y-auto bg-brand-light/45 dark:bg-brand-light/[0.03]">
                                            {simulationResult.roomsBreakdown.map((roomBreakdown, roomBreakdownIndex) => {
                                                const emailSpoTraces = roomBreakdown.pricingTrace.filter((trace) => trace.stage === 'email_spo');

                                                return (
                                                <div key={roomBreakdownIndex} className="border-b border-brand-light/70 last:border-0 dark:border-brand-light/10">
                                                    <div className="flex items-center justify-between border-b border-brand-light/70 bg-brand-light/70 px-6 py-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-navy dark:text-brand-light">
                                                                Room {roomBreakdown.roomIndex}
                                                            </span>
                                                            {activeContract.contractRooms.find((contractRoom) => contractRoom.roomType.id === roomBreakdown.roomId) && (
                                                                <span className="mt-1 text-[11px] font-medium text-brand-slate dark:text-brand-light/75">
                                                                    {activeContract.contractRooms.find((contractRoom) => contractRoom.roomType.id === roomBreakdown.roomId)?.roomType.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-black text-brand-mint">
                                                            {formatCurrency(roomBreakdown.roomTotalNet, simulationResult.currency)}
                                                        </span>
                                                    </div>

                                                    {emailSpoTraces.length > 0 && (
                                                        <div className="border-b border-brand-light/70 bg-brand-mint/8 px-6 py-4 dark:border-brand-light/10">
                                                            <div className="mb-3 flex items-center gap-2">
                                                                <Mail size={14} className="text-brand-mint" />
                                                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-mint">
                                                                    Partner Email SPO
                                                                </span>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {emailSpoTraces.map((trace, traceIndex) => {
                                                                    const metadata = trace.metadata ?? {};
                                                                    const name = String(metadata.name ?? trace.label);
                                                                    const stepLabel = String(metadata.applicationStepLabel ?? trace.applicationStep ?? 'Configured position');
                                                                    const percent = trace.percent ?? Number(metadata.percent ?? 0);
                                                                    const stackMode = String(trace.stackMode ?? metadata.stackMode ?? '').toLowerCase();
                                                                    const discountAmount = trace.discountAmount ?? Math.abs(trace.deltaAmount);

                                                                    return (
                                                                        <div
                                                                            key={`${trace.sourceId ?? traceIndex}-${traceIndex}`}
                                                                            className="flex flex-col gap-2 rounded-2xl border border-brand-mint/15 bg-brand-light/80 p-4 dark:border-brand-light/10 dark:bg-brand-light/5 md:flex-row md:items-center md:justify-between"
                                                                        >
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                                                    Email SPO - {name}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/70">
                                                                                    {percent}% {stackMode || 'rolling'} - {stepLabel}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-sm font-bold text-brand-mint">
                                                                                -{formatCurrency(discountAmount, simulationResult.currency)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="divide-y divide-brand-light/70 bg-brand-light/50 dark:divide-brand-light/10 dark:bg-transparent">
                                                        {roomBreakdown.dailyRates.map((day, dayIndex) => {
                                                            const isDetailed = expandedNights[`${roomBreakdownIndex}-${day.date}`];

                                                            return (
                                                                <div key={day.date} className="group">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleNight(`${roomBreakdownIndex}-${day.date}`)}
                                                                        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-brand-mint/8"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div>
                                                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-slate">Night {dayIndex + 1}</p>
                                                                                <p className="text-sm font-bold text-brand-navy dark:text-brand-light">
                                                                                    {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                </p>
                                                                            </div>
                                                                            {!day.isAvailable && (
                                                                                <span className="rounded-full bg-brand-slate/10 px-2 py-1 text-[10px] font-bold uppercase text-brand-slate dark:bg-brand-navy/80 dark:text-brand-light/75">{t('auto.features.simulator.pages.simulatorpage.a59a3b70', { defaultValue: "N/A" })}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm font-black text-brand-navy dark:text-brand-light">
                                                                            {formatCurrency(day.finalDailyRate, day.currency)}
                                                                            {isDetailed ? <ChevronUp size={16} className="text-brand-slate" /> : <ChevronDown size={16} className="text-brand-slate" />}
                                                                        </div>
                                                                    </button>

                                                                    {isDetailed && (
                                                                        <div className="mx-6 mb-4 rounded-2xl border border-brand-light/70 bg-brand-light/80 p-4 text-sm shadow-inner animate-in slide-in-from-top-2 duration-200 dark:border-brand-light/10 dark:bg-brand-light/5">
                                                                            <div className="mb-1 flex justify-between text-brand-slate dark:text-brand-light/75">
                                                                                <span>{t('auto.features.simulator.pages.simulatorpage.afc48449', { defaultValue: "Base / occupancy" })}</span>
                                                                                <span className={hasNightlyReduction(day) ? 'line-through opacity-70' : ''}>
                                                                                    {formatCurrency(baseOccupancyAmount(day), day.currency)}
                                                                                </span>
                                                                            </div>

                                                                            {day.reductionsApplied.map((reduction, reductionIndex) => (
                                                                                <div key={reductionIndex} className="mb-1 flex justify-between text-brand-slate dark:text-brand-light/75">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Info size={12} className="text-brand-mint" />
                                                                                        {reduction.name}
                                                                                    </span>
                                                                                    <span>+{formatCurrency(reduction.amount, day.currency)}</span>
                                                                                </div>
                                                                            ))}

                                                                            {day.promotionApplied && (
                                                                                <div className="mb-1 flex justify-between font-medium text-brand-mint">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Flame size={12} className="text-brand-slate" />
                                                                                        {day.promotionApplied.name}
                                                                                    </span>
                                                                                    <span>{formatCurrency(day.promotionApplied.amount, day.currency)}</span>
                                                                                </div>
                                                                            )}

                                                                            {day.supplementsApplied.map((supplement, supplementIndex) => (
                                                                                <div key={supplementIndex} className="mb-1 flex justify-between text-brand-slate dark:text-brand-light/75">
                                                                                    <span>{supplement.name}</span>
                                                                                    <span>+{formatCurrency(supplement.amount, day.currency)}</span>
                                                                                </div>
                                                                            ))}

                                                                            <div className="mt-3 flex justify-between border-t border-brand-light/70 pt-3 font-bold text-brand-navy dark:border-brand-light/10 dark:text-brand-light">
                                                                                <span>{t('auto.features.simulator.pages.simulatorpage.5af1a6ca', { defaultValue: "Net for this night" })}</span>
                                                                                <span className="text-brand-mint">{formatCurrency(day.finalDailyRate, day.currency)}</span>
                                                                            </div>

                                                                            {!day.isAvailable && (
                                                                                <p className="mt-3 text-[11px] font-medium italic text-brand-slate">
                                                                                    Unavailable: {day.reason}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    ) : (
                                        <div className="flex-1 p-6">
                                            <div className="space-y-5 opacity-50">
                                                <div className="flex justify-between text-sm italic text-brand-slate">
                                                    <span>{t('auto.features.simulator.pages.simulatorpage.0b6d0510', { defaultValue: "Stay of -- nights" })}</span>
                                                    <span>--</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map((item) => (
                                                        <div key={item} className="h-4 w-full animate-pulse rounded-full bg-brand-mint/10" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`mt-auto border-t border-brand-light/70 p-6 dark:border-brand-light/10 ${simulationResult ? 'bg-brand-light/55 dark:bg-brand-light/5' : 'bg-brand-light/30 dark:bg-transparent'}`}>
                                        {simulationResult && (
                                            <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-brand-slate">
                                                    <span>{t('auto.features.simulator.pages.simulatorpage.ba95b01b', { defaultValue: "Total gross" })}</span>
                                                    <span>{formatCurrency(simulationResult.totalBrut, simulationResult.currency)}</span>
                                                </div>
                                                {simulationResult.totalRemise > 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-brand-mint">
                                                        <span>{t('auto.features.simulator.pages.simulatorpage.556bee2a', { defaultValue: "Global discounts" })}</span>
                                                        <span>-{formatCurrency(simulationResult.totalRemise, simulationResult.currency)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {simulationResult?.stayModifiers && simulationResult.stayModifiers.length > 0 && (
                                            <div className="-mx-6 mb-4 space-y-2 border-t border-brand-mint/20 bg-brand-mint/8 px-6 pb-3 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Calculator size={12} className="text-brand-mint" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-mint">{t('auto.features.simulator.pages.simulatorpage.2f0651d6', { defaultValue: "Stay modifiers" })}</span>
                                                </div>
                                                {simulationResult.stayModifiers.map((modifier, modifierIndex) => {
                                                    const parts = modifier.name.split(' - Formule: ');
                                                    const title = parts[0];
                                                    const formula = parts[1];

                                                    return (
                                                        <div key={modifierIndex} className="flex items-start justify-between gap-4 rounded-2xl border border-brand-light/70 bg-brand-light/80 p-3 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-brand-navy dark:text-brand-light">{title}</span>
                                                                {formula && (
                                                                    <span className="mt-1 text-[10px] text-brand-slate dark:text-brand-light/75">{formula}</span>
                                                                )}
                                                            </div>
                                                            <span className={`shrink-0 whitespace-nowrap text-xs font-black ${modifier.amount < 0 ? 'text-brand-mint' : 'text-brand-slate'}`}>
                                                                {modifier.amount > 0 ? '+' : ''}{formatCurrency(modifier.amount, simulationResult.currency)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="flex items-end justify-between border-t border-brand-light/70 pt-4 dark:border-brand-light/10">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-mint">{t('auto.features.simulator.pages.simulatorpage.a7cbe69d', { defaultValue: "Final net total" })}</span>
                                                <div className="text-3xl font-black text-brand-navy transition-all duration-700 dark:text-brand-light">
                                                    {simulationResult ? (
                                                        <>
                                                            {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalNet)}
                                                            <span className="ml-1 text-sm font-bold text-brand-slate">{simulationResult.currency}</span>
                                                        </>
                                                    ) : '0,00'}
                                                </div>
                                            </div>
                                            <Ticket className={`${simulationResult ? 'text-brand-mint' : 'text-brand-slate/30'} transition-colors duration-500`} size={40} />
                                        </div>

                                        {simulationResult && (
                                            <>
                                                <div className="mt-4 flex gap-3 rounded-2xl border border-brand-mint/20 bg-brand-mint/8 p-3 animate-in slide-in-from-bottom-2">
                                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-mint" />
                                                    <p className="text-[11px] font-medium leading-relaxed text-brand-navy dark:text-brand-light">
                                                        Price validated against the conditions of <strong>{activeContract.name}</strong>.
                                                    </p>
                                                </div>

                                                {simulationResult.inactiveContractOverride?.enabled && (
                                                    <div className="mt-3 flex gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-3 animate-in slide-in-from-bottom-2 dark:border-amber-400/30 dark:bg-amber-500/10">
                                                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
                                                        <div className="text-[11px] font-medium leading-relaxed text-amber-900 dark:text-amber-100">
                                                            <p>
                                                                Inactive contract override: <strong>{simulationResult.inactiveContractOverride.contractStatus}</strong>
                                                            </p>
                                                            {simulationResult.inactiveContractOverride.reason && (
                                                                <p className="mt-1 text-amber-800/80 dark:text-amber-100/80">
                                                                    Reason: {simulationResult.inactiveContractOverride.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {isAgent ? (
                                                    <div className="mt-4 space-y-3 animate-in slide-in-from-bottom-3 duration-500">
                                                        <button
                                                            type="button"
                                                            onClick={handleDownloadAgentTicket}
                                                            disabled={isDownloadingTicket}
                                                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-brand-navy bg-brand-navy px-6 py-3 text-sm font-bold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-brand-light/20 dark:bg-brand-light/10 dark:text-brand-light dark:hover:bg-brand-light/15"
                                                        >
                                                            {isDownloadingTicket ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <Printer size={16} />
                                                            )}
                                                            {isDownloadingTicket
                                                                ? t('pages.simulator.ticket.downloading', { defaultValue: 'Preparing ticket...' })
                                                                : t('pages.simulator.ticket.download', { defaultValue: 'Download ticket PDF' })}
                                                        </button>
                                                        <p className="text-center text-[11px] font-medium leading-5 text-brand-slate dark:text-brand-light/70">
                                                            {t('pages.simulator.ticket.helper', { defaultValue: 'Ticket format is for internal sharing only. It is not a proforma invoice.' })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                <div className="mt-4 space-y-3 animate-in slide-in-from-bottom-3 duration-500">
                                                    {/* Proforma create button - always show when no proforma created yet */}
                                                    <>
                                                        <button
                                                            id="create-proforma-btn"
                                                            type="button"
                                                            disabled={isCreatingProforma}
                                                            onClick={() => {
                                                                if (!activeContract || !simulationResult || !selectedAffiliate) return;

                                                                const roomingSummaryData = roomingList.map((room) => {
                                                                    const roomType = activeContract.contractRooms.find((cr) => String(cr.roomType.id) === room.roomId)?.roomType;
                                                                    const roomBoard = allowedArrangements.find((arrangement) => String(arrangement.id) === room.boardTypeId);
                                                                    const adults = room.occupants.filter((o) => o.type === OccupantType.ADULT).length;
                                                                    const childOccupants = room.occupants.filter((o) => o.type !== OccupantType.ADULT);
                                                                    return {
                                                                        roomName: roomType?.name ?? `Room`,
                                                                        roomTypeName: roomType?.name ?? 'Unknown',
                                                                        boardTypeId: roomBoard?.id ?? Number(room.boardTypeId),
                                                                        boardTypeName: roomBoard ? `${roomBoard.name} (${roomBoard.code})` : 'N/A',
                                                                        adults,
                                                                        children: childOccupants.length,
                                                                        childrenAges: childOccupants.map((o) => o.age),
                                                                    };
                                                                });
                                                                const boardLabels = [...new Set(roomingSummaryData.map((room) => room.boardTypeName))];

                                                                createProforma({
                                                                    affiliateId: Number(selectedAffiliateId),
                                                                    contractId: activeContract.id,
                                                                    customerName: selectedAffiliate.companyName,
                                                                    customerEmail: selectedAffiliate.emails?.[0]?.address,
                                                                    checkIn,
                                                                    checkOut,
                                                                    bookingDate,
                                                                    boardTypeName: boardLabels.length === 1 ? boardLabels[0] : 'Mixed boards',
                                                                    currency: simulationResult.currency,
                                                                    roomingSummary: roomingSummaryData,
                                                                    simulationInput: {
                                                                        contractId: activeContract.id,
                                                                        affiliateId: Number(selectedAffiliateId),
                                                                        checkIn,
                                                                        checkOut,
                                                                        bookingDate,
                                                                        includeInactive: effectiveIncludeInactive,
                                                                        inactiveOverrideReason: effectiveIncludeInactive ? inactiveOverrideReason.trim() || undefined : undefined,
                                                                        contractOverrideContext: {
                                                                            contractStatus: activeContract.status,
                                                                            includeInactive: effectiveIncludeInactive,
                                                                            overrideReason: effectiveIncludeInactive ? inactiveOverrideReason.trim() || undefined : undefined,
                                                                        },
                                                                        roomingList: roomingList.map((room) => ({
                                                                            roomId: parseInt(room.roomId),
                                                                            boardTypeId: parseInt(room.boardTypeId),
                                                                            occupants: room.occupants.map((o, i) => ({
                                                                                paxOrder: i + 1,
                                                                                type: o.type,
                                                                                age: o.age,
                                                                            })),
                                                                        })),
                                                                    },
                                                                    calculationResult: simulationResult,
                                                                    totals: {
                                                                        subtotal: simulationResult.totalBrut,
                                                                        discountTotal: simulationResult.totalRemise,
                                                                        grandTotal: simulationResult.totalNet,
                                                                    },
                                                                });
                                                            }}
                                                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-brand-navy bg-brand-navy px-6 py-3 text-sm font-bold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-brand-light/20 dark:bg-brand-light/10 dark:text-brand-light dark:hover:bg-brand-light/15"
                                                        >
                                                            {isCreatingProforma ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <FileText size={16} />
                                                            )}
                                                            {isCreatingProforma
                                                                ? t('pages.simulator.proforma.creating', { defaultValue: 'Preparing preview...' })
                                                                : t('pages.simulator.proforma.create', { defaultValue: 'Open Proforma Preview' })}
                                                        </button>
                                                    </>
                                                </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </aside>
                </div>
            )}

            {!activeContract && selectedAffiliateId && checkIn && checkOut && !loadingContractMatches && contractMatches?.status !== 'multiple' && (
                <section className="premium-surface flex flex-col items-center justify-center space-y-4 border-dashed px-4 py-20 text-center">
                    <div className="rounded-2xl bg-brand-mint/10 p-5 text-brand-mint">
                        <Calculator size={48} />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-bold text-brand-navy dark:text-brand-light">{t('auto.features.simulator.pages.simulatorpage.d729c3d7', { defaultValue: "Simulator unavailable" })}</h3>
                        <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                            No {effectiveIncludeInactive ? 'allowed' : 'active'} contract was found for this partner and stay date range.
                        </p>
                    </div>
                </section>
            )}

            {!selectedAffiliateId && (
                <section className="premium-surface flex flex-col items-center justify-center space-y-4 border-dashed px-4 py-20 text-center">
                    <div className="rounded-2xl bg-brand-mint/10 p-5 text-brand-mint">
                        <Building2 size={48} />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-bold text-brand-navy dark:text-brand-light">{t('auto.features.simulator.pages.simulatorpage.11e77796', { defaultValue: "Select a partner" })}</h3>
                        <p className="mt-2 text-sm font-medium text-brand-slate dark:text-brand-light/75">
                            Choose a partner above to load the active contract and start the rate simulation.
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
}
