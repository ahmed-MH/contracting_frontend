import { useState, useMemo, useEffect } from 'react';
import {
    Calendar,
    User,
    Baby,
    Calculator,
    Info,
    Plus,
    Minus,
    Receipt,
    Clock,
    Home,
    Utensils,
    Building2,
    AlertCircle
} from 'lucide-react';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useContracts, useContract } from '../../contracts/hooks/useContracts';
import { useHotel } from '../../hotel/context/HotelContext';
import { useCalculateSimulation } from '../hooks/useSimulator';
import { SimulationRequest } from '../types/simulator.types';
import { ChevronDown, ChevronUp, Flame, CheckCircle2, Ticket } from 'lucide-react';

export default function SimulatorPage() {
    const { currentHotel } = useHotel();
    const { data: affiliates } = useAffiliates();
    const { data: contracts, isLoading: loadingContracts } = useContracts();
    const { data: allArrangements } = useArrangements();

    // ─── Selection State ──────────────────────────────────────────────
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('');

    // ─── Simulation Form State ────────────────────────────────────────
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [roomTypeId, setRoomTypeId] = useState<string>('');
    const [arrangementId, setArrangementId] = useState<string>('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childrenAges, setChildrenAges] = useState<number[]>([]);
    const [expandedNights, setExpandedNights] = useState<Record<string, boolean>>({});
    const [displayMode, setDisplayMode] = useState<'ROOM' | 'PERSON'>('ROOM');

    const { mutate: runSimulation, data: simulationResult, isPending: isSimulating } = useCalculateSimulation();

    // ─── Derived State: Find Active Contract ──────────────────────────
    const activeContractSummary = useMemo(() => {
        if (!selectedAffiliateId || !contracts) return null;
        return contracts.find(c =>
            c.status === 'ACTIVE' &&
            c.affiliates.some(a => a.id === Number(selectedAffiliateId))
        );
    }, [selectedAffiliateId, contracts]);

    // Fetch full detail of the active contract (needed for rooms and base arrangement)
    const { data: activeContract, isLoading: loadingActiveContract } = useContract(activeContractSummary?.id);

    // ─── Derived State: Allowed Arrangements for Contract ─────────────
    const allowedArrangements = useMemo(() => {
        if (!allArrangements || !activeContract) return [];
        let filtered = allArrangements;
        if (activeContract.baseArrangement?.id) {
            const baseLevel = allArrangements.find(a => a.id === activeContract.baseArrangement!.id)?.level ?? 0;
            filtered = allArrangements.filter(a => (a.level ?? 0) >= baseLevel);
        }
        return [...filtered].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    }, [allArrangements, activeContract]);

    // ─── Derived State: Room Metadata ─────────────────────────────────
    const selectedRoomType = useMemo(() => {
        if (!roomTypeId || !activeContract) return null;
        return activeContract.contractRooms.find(cr => String(cr.roomType.id) === roomTypeId)?.roomType;
    }, [roomTypeId, activeContract]);

    // ─── Logic ────────────────────────────────────────────────────────

    // Reset room and arrangement selection when contract changes
    useEffect(() => {
        setRoomTypeId('');
        setArrangementId('');
    }, [activeContract?.id]);

    const handleChildrenCountChange = (value: string) => {
        const count = Math.max(0, parseInt(value) || 0);
        setChildren(count);
        setChildrenAges(prev => {
            if (count > prev.length) {
                return [...prev, ...Array(count - prev.length).fill(5)];
            } else {
                return prev.slice(0, count);
            }
        });
    };

    const updateChildAge = (index: number, age: number) => {
        const newAges = [...childrenAges];
        newAges[index] = Math.max(0, Math.min(17, age));
        setChildrenAges(newAges);
    };

    const handleRunSimulation = () => {
        if (!activeContract || !roomTypeId || !arrangementId || !checkIn || !checkOut) return;

        const request: SimulationRequest = {
            contractId: activeContract.id,
            roomId: parseInt(roomTypeId),
            boardTypeId: parseInt(arrangementId),
            checkIn,
            checkOut,
            bookingDate,
            occupants: {
                adults,
                childrenAges
            }
        };

        runSimulation(request);
    };

    const toggleNight = (date: string) => {
        setExpandedNights(prev => ({ ...prev, [date]: !prev[date] }));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">

            {/* ─── Header ────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulateur de Prix</h1>
                <p className="text-gray-500 mt-1">Calculez instantanément le prix d'un séjour en fonction du contrat actif d'un partenaire.</p>
            </div>

            {/* ─── Step 1: Partner Selection ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-600" />
                            Sélectionner un Partenaire (Affilié / TO)
                        </label>
                        <select
                            value={selectedAffiliateId}
                            onChange={(e) => setSelectedAffiliateId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                        >
                            <option value="">-- Choisir un partenaire --</option>
                            {affiliates?.map(a => (
                                <option key={a.id} value={a.id}>{a.companyName} {a.reference ? `(${a.reference})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    {selectedAffiliateId && (
                        <div className="flex-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            {activeContract ? (
                                <div className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Contrat Actif Détecté</p>
                                        <p className="text-sm font-semibold text-emerald-900">{activeContract.name}</p>
                                    </div>
                                    <div className="ml-auto text-right pr-2">
                                        <p className="text-[10px] text-emerald-600 font-medium">Validité</p>
                                        <p className="text-xs font-bold text-emerald-800"> Jusqu'au {new Date(activeContract.endDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ) : (loadingContracts || loadingActiveContract || (activeContractSummary && !activeContract)) ? (
                                <div className="h-16 w-full bg-gray-100 animate-pulse rounded-xl" />
                            ) : (
                                <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Aucun Contrat Actif</p>
                                        <p className="text-sm font-medium text-amber-900 text-pretty">Ce partenaire n'a pas de contrat actif pour l'hôtel {currentHotel?.name}.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Step 2: Simulation Form (Only if active contract) ─────── */}
            {activeContract && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ─── LEFT: Form Inputs (2/3) ─── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Card A: Dates */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Période du Séjour</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Date de Check-in</label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            min={activeContract.startDate.split('T')[0]}
                                            max={activeContract.endDate.split('T')[0]}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium italic">
                                            Min: {new Date(activeContract.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Date de Check-out</label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            min={checkIn || activeContract.startDate.split('T')[0]}
                                            max={activeContract.endDate.split('T')[0]}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium italic">
                                            Max: {new Date(activeContract.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="max-w-xs space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            Date de Réservation Simulée
                                        </label>
                                        <input
                                            type="date"
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                                            <Info size={12} className="text-indigo-500" />
                                            Nécessaire pour calculer l'Early Booking ou les SPO.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card B: Accommodation */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Home size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Hébergement & Arrangement</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Type de Chambre (Hôtel & Contrat)</label>
                                    <select
                                        value={roomTypeId}
                                        onChange={(e) => setRoomTypeId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="">Sélectionner une chambre</option>
                                        {activeContract.contractRooms?.map(cr => (
                                            <option key={cr.id} value={cr.roomType.id}>
                                                {cr.roomType.name} ({cr.roomType.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <Utensils size={14} />
                                        Arrangement (Pension)
                                    </label>
                                    <select
                                        value={arrangementId}
                                        onChange={(e) => setArrangementId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="">Sélectionner un arrangement</option>
                                        {allowedArrangements.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({a.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Card C: Occupancy */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <User size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Occupation</h3>
                            </div>
                            <div className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Adults */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700">Adultes</label>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Min 1</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setAdults(prev => Math.max(selectedRoomType?.minAdults || 1, prev - 1))}
                                                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                min={selectedRoomType?.minAdults || 1}
                                                max={selectedRoomType?.maxAdults || 10}
                                                value={adults}
                                                onChange={(e) => setAdults(Math.max(selectedRoomType?.minAdults || 1, parseInt(e.target.value) || 1))}
                                                className="w-16 text-center font-semibold text-lg bg-transparent border-none focus:ring-0"
                                            />
                                            <button
                                                onClick={() => setAdults(prev => Math.min(selectedRoomType?.maxAdults || 10, prev + 1))}
                                                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        {selectedRoomType && (
                                            <p className="text-[10px] text-gray-400">
                                                Capacité : {selectedRoomType.minAdults} - {selectedRoomType.maxAdults} adultes
                                            </p>
                                        )}
                                    </div>

                                    {/* Children */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700">Enfants</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleChildrenCountChange(Math.max(selectedRoomType?.minChildren || 0, children - 1).toString())}
                                                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                min={selectedRoomType?.minChildren || 0}
                                                max={selectedRoomType?.maxChildren || 10}
                                                value={children}
                                                onChange={(e) => handleChildrenCountChange(e.target.value)}
                                                className="w-16 text-center font-semibold text-lg bg-transparent border-none focus:ring-0"
                                            />
                                            <button
                                                onClick={() => handleChildrenCountChange(Math.min(selectedRoomType?.maxChildren || 10, children + 1).toString())}
                                                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        {selectedRoomType && (
                                            <p className="text-[10px] text-gray-400">
                                                Max enfant : {selectedRoomType.maxChildren}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {children > 0 && (
                                    <div className="pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Baby size={16} className="text-pink-500" />
                                            <h4 className="text-sm font-semibold text-gray-900">Âges des enfants</h4>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {childrenAges.map((age, index) => (
                                                <div key={index} className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Enfant {index + 1}</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={age}
                                                            onChange={(e) => updateChildAge(index, parseInt(e.target.value) || 0)}
                                                            className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            min="0"
                                                            max="17"
                                                        />
                                                        <span className="text-xs text-gray-400">ans</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleRunSimulation}
                            disabled={!roomTypeId || !arrangementId || !checkIn || !checkOut || isSimulating}
                            className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-xl shadow-gray-200 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {isSimulating ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Calculator size={22} />
                            )}
                            {isSimulating ? 'Calcul en cours...' : 'Lancer la simulation'}
                        </button>
                    </div>

                    {/* ─── RIGHT: Results Panel (1/3) ─── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            <div className={`bg-white rounded-2xl border ${simulationResult ? 'border-indigo-500 shadow-indigo-100' : 'border-gray-200'} shadow-xl overflow-hidden flex flex-col transition-all duration-500`}>

                                <div className={`${simulationResult ? 'bg-indigo-600' : 'bg-gray-800'} px-6 py-8 text-white transition-colors duration-500`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <Receipt size={24} className="opacity-80" />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${simulationResult ? 'bg-white/20' : 'bg-gray-700'}`}>
                                            {simulationResult ? 'Simulation Complétée' : 'Attente du calcul'}
                                        </span>
                                    </div>

                                    {simulationResult ? (
                                        <div className="animate-in fade-in zoom-in-95 duration-500">
                                            {/* Display Mode Toggle */}
                                            <div className="flex bg-white/10 p-1 rounded-lg mb-4 w-fit">
                                                <button
                                                    onClick={() => setDisplayMode('ROOM')}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${displayMode === 'ROOM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
                                                >
                                                    PAR CHAMBRE
                                                </button>
                                                <button
                                                    onClick={() => setDisplayMode('PERSON')}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${displayMode === 'PERSON' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/60 hover:text-white'}`}
                                                >
                                                    PAR PERSONNE
                                                </button>
                                            </div>

                                            <div className="text-4xl font-black tracking-tight">
                                                {displayMode === 'ROOM' 
                                                    ? simulationResult.totalGross.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                                                    : simulationResult.perAdultRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                                                }
                                                <span className="text-xl ml-2 font-medium text-indigo-200">{simulationResult.currency}</span>
                                            </div>
                                            <p className="text-indigo-100 text-sm mt-2 flex items-center gap-2">
                                                <Calendar size={14} />
                                                {simulationResult.dailyBreakdown.length} nuits • {adults} Adulte(s) {children > 0 && `• ${children} Enfant(s)`}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold">Détail du Devis</h3>
                                            <p className="text-gray-400 text-sm mt-1">Configurez les paramètres pour voir le prix final.</p>
                                        </>
                                    )}
                                </div>

                                <div className="p-0 flex-1 flex flex-col">
                                    {simulationResult ? (
                                        <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-gray-100 custom-scrollbar">
                                            {simulationResult.dailyBreakdown.map((day, idx) => {
                                                const displayDailyRate = displayMode === 'ROOM' ? day.finalDailyRate : day.finalDailyRate / adults;
                                                const displayBaseRate = displayMode === 'ROOM' ? day.baseRate * (adults === 1 ? 1 : 2) : (day.baseRate * (adults === 1 ? 1 : 2)) / adults;

                                                return (
                                                    <div key={day.date} className="group">
                                                        <button
                                                            onClick={() => toggleNight(day.date)}
                                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-left">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Nuit {idx + 1}</p>
                                                                    <p className="text-sm font-bold text-gray-900">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                                </div>
                                                                {!day.isAvailable && (
                                                                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">N/A</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                                                                    {displayDailyRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}
                                                                    {expandedNights[day.date] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                                </p>
                                                                {displayMode === 'PERSON' && <span className="text-[10px] text-gray-500 font-medium">Moyenne / Adulte</span>}
                                                            </div>
                                                        </button>

                                                        {expandedNights[day.date] && (
                                                            <div className="px-6 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                                {displayMode === 'ROOM' ? (
                                                                    <>
                                                                        {/* Detailed Room Mode */}
                                                                        <div className="flex justify-between text-xs text-gray-500">
                                                                            <span>Tarif de base Chambre (Double/Single)</span>
                                                                            <span className={day.reductionsApplied.length > 0 || day.promotionApplied ? 'line-through' : ''}>
                                                                                {displayBaseRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}
                                                                            </span>
                                                                        </div>

                                                                        {/* Reductions (Occupational - Extra Pax / Mono) */}
                                                                        {day.reductionsApplied.map((red, rIdx) => (
                                                                            <div key={rIdx} className="flex justify-between text-xs text-emerald-600 font-medium">
                                                                                <span className="flex items-center gap-1">
                                                                                    <CheckCircle2 size={12} />
                                                                                    {red.name}
                                                                                </span>
                                                                                <span>+{red.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}</span>
                                                                            </div>
                                                                        ))}

                                                                        {/* Net Rate after pax additions */}
                                                                        {(day.reductionsApplied.length > 0) && (
                                                                            <div className="flex justify-between text-[11px] font-bold text-gray-700 py-1 border-y border-gray-50">
                                                                                <span>Net Occupation (Total Pax)</span>
                                                                                <span>{day.netRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}</span>
                                                                            </div>
                                                                        )}

                                                                        {/* Promotion */}
                                                                        {day.promotionApplied && (
                                                                            <div className="flex justify-between text-xs text-indigo-600 font-bold bg-indigo-50 p-2 rounded-lg">
                                                                                <span className="flex items-center gap-1">
                                                                                    <Flame size={12} className="text-orange-500" />
                                                                                    {day.promotionApplied.name}
                                                                                </span>
                                                                                <span>{day.promotionApplied.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}</span>
                                                                            </div>
                                                                        )}

                                                                        {/* Supplements */}
                                                                        {day.supplementsApplied.map((sup, sIdx) => (
                                                                            <div key={sIdx} className="flex justify-between text-xs text-amber-600 font-medium">
                                                                                <span>{sup.name}</span>
                                                                                <span>+{sup.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}</span>
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Simple Person Mode */}
                                                                        <div className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                            <span className="font-medium flex items-center gap-1.5">
                                                                                <Info size={12} className="text-gray-400" />
                                                                                Affichage lissé par adulte
                                                                            </span>
                                                                            <span className="font-bold">
                                                                                {displayDailyRate.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {day.currency}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {!day.isAvailable && (
                                                                    <p className="text-[10px] text-red-500 font-medium italic">
                                                                        Raison: {day.reason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex-1 p-6 space-y-8 opacity-40">
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm italic">
                                                    <span>Séjour de -- nuits</span>
                                                    <span>--</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`p-6 mt-auto border-t ${simulationResult ? 'bg-gray-50' : 'bg-white'}`}>
                                        {simulationResult && (
                                            <div className="mb-4 space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    <span>Total Brut</span>
                                                    <span>{simulationResult.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {simulationResult.currency}</span>
                                                </div>
                                                {simulationResult.totalRemise > 0 && (
                                                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                                                        <span>Remises</span>
                                                        <span>-{simulationResult.totalRemise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {simulationResult.currency}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Stay Modifiers (Flat Rates) Details */}
                                        {simulationResult?.stayModifiers && simulationResult.stayModifiers.length > 0 && (
                                            <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 border-t border-indigo-100 pt-3 bg-indigo-50/20 -mx-6 px-6 pb-3">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Calculator size={12} className="text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Modificateurs de Séjour</span>
                                                </div>
                                                {simulationResult.stayModifiers.map((mod, mIdx) => (
                                                    <div key={mIdx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-indigo-50 shadow-sm">
                                                        <span className="text-xs font-bold text-gray-700">{mod.name}</span>
                                                        <span className={`text-xs font-black ${mod.amount < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            {mod.amount > 0 ? '+' : ''}{mod.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {simulationResult.currency}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-end border-t border-gray-200 pt-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Total Net Final</span>
                                                <div className="text-3xl font-black text-gray-900 transition-all duration-700">
                                                    {simulationResult ? (
                                                        <>
                                                            {simulationResult.totalGross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                            <span className="text-sm font-bold text-gray-500 ml-1">{simulationResult.currency}</span>
                                                        </>
                                                    ) : '0.00'}
                                                </div>
                                            </div>
                                            <Ticket className={`${simulationResult ? 'text-indigo-600' : 'text-gray-200'} transition-colors duration-500`} size={40} />
                                        </div>

                                        {simulationResult && (
                                            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 animate-in slide-in-from-bottom-2">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                                    Le prix a été validé selon les conditions du contrat <strong>{activeContract.name}</strong>.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {!activeContract && selectedAffiliateId && !loadingContracts && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-gray-100 rounded-full">
                        <Calculator size={48} className="text-gray-400" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-bold text-gray-900">Formulaire Indisponible</h3>
                        <p className="text-gray-500 text-sm mt-2">
                            Nous ne pouvons pas charger le simulateur car aucun contrat <strong>ACTIF</strong> n'a été trouvé pour ce partenaire sur cet hôtel.
                        </p>
                    </div>
                </div>
            )}

            {!selectedAffiliateId && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 bg-indigo-50/30 rounded-3xl border-2 border-dashed border-indigo-100">
                    <div className="p-4 bg-indigo-50 rounded-full animate-bounce">
                        <Building2 size={48} className="text-indigo-400" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-bold text-indigo-900">Sélection du Partenaire</h3>
                        <p className="text-indigo-600/70 text-sm mt-2 font-medium">
                            Veuillez sélectionner un partenaire ci-dessus pour charger son contrat et commencer la simulation tarifaire.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper icons missing in imports
function FileText({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    )
}
