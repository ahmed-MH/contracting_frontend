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
    Utensils,
    Building2,
    AlertCircle,
    Trash2,
    BedDouble,
    ChevronDown, 
    ChevronUp, 
    Flame, 
    CheckCircle2, 
    Ticket
} from 'lucide-react';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useContracts, useContract } from '../../contracts/hooks/useContracts';
import { useHotel } from '../../hotel/context/HotelContext';
import { useCalculateSimulation } from '../hooks/useSimulator';
import { SimulationRequest, OccupantType } from '../types/simulator.types';

interface RoomingState {
    id: string;
    roomId: string;
    occupants: { id: string; type: OccupantType; age: number }[];
}

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
    const [arrangementId, setArrangementId] = useState<string>('');
    
    // Rooming List V2 State
    const generateId = () => crypto.randomUUID();
    
    const [roomingList, setRoomingList] = useState<RoomingState[]>([
        { 
            id: generateId(), 
            roomId: '', 
            occupants: [
                { id: generateId(), type: OccupantType.ADULT, age: 30 },
                { id: generateId(), type: OccupantType.ADULT, age: 30 }
            ] 
        }
    ]);

    const [expandedNights, setExpandedNights] = useState<Record<string, boolean>>({});

    const { mutate: runSimulation, data: simulationResult, isPending: isSimulating } = useCalculateSimulation();

    // ─── Derived State: Find Active Contract ──────────────────────────
    const activeContractSummary = useMemo(() => {
        if (!selectedAffiliateId || !contracts) return null;
        return contracts.find(c =>
            c.status === 'ACTIVE' &&
            c.affiliates.some(a => a.id === Number(selectedAffiliateId))
        );
    }, [selectedAffiliateId, contracts]);

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

    // ─── Logic ────────────────────────────────────────────────────────

    useEffect(() => {
        // Reset rooming list when contract changes
        setRoomingList([
            { 
                id: generateId(), 
                roomId: '', 
                occupants: [
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                    { id: generateId(), type: OccupantType.ADULT, age: 30 }
                ] 
            }
        ]);
        setArrangementId('');
    }, [activeContract?.id]);

    // Rooming List Actions
    const addRoom = () => {
        setRoomingList(prev => [
            ...prev,
            {
                id: generateId(),
                roomId: '',
                occupants: [
                    { id: generateId(), type: OccupantType.ADULT, age: 30 },
                    { id: generateId(), type: OccupantType.ADULT, age: 30 }
                ]
            }
        ]);
    };

    const removeRoom = (index: number) => {
        setRoomingList(prev => prev.filter((_, i) => i !== index));
    };

    const updateRoomType = (roomIndex: number, roomId: string) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].roomId = roomId;
        setRoomingList(newRooms);
    };

    const addOccupant = (roomIndex: number, type: OccupantType) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants.push({
            id: generateId(),
            type,
            age: type === OccupantType.ADULT ? 30 : 8 // default age based on type
        });
        setRoomingList(newRooms);
    };

    const removeOccupant = (roomIndex: number, occupantIndex: number) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants = newRooms[roomIndex].occupants.filter((_, i) => i !== occupantIndex);
        setRoomingList(newRooms);
    };

    const updateOccupantAge = (roomIndex: number, occupantIndex: number, age: number) => {
        const newRooms = [...roomingList];
        newRooms[roomIndex].occupants[occupantIndex].age = age;
        setRoomingList(newRooms);
    };

    const isFormValid = useMemo(() => {
        if (!activeContract || !arrangementId || !checkIn || !checkOut) return false;
        if (roomingList.length === 0) return false;
        
        for (const room of roomingList) {
            if (!room.roomId) return false;
            if (room.occupants.length === 0) return false;
            if (!room.occupants.some(o => o.type === OccupantType.ADULT)) return false; // At least one adult per room
        }
        return true;
    }, [activeContract, arrangementId, checkIn, checkOut, roomingList]);


    const handleRunSimulation = () => {
        if (!isFormValid || !activeContract) return;

        const request: SimulationRequest = {
            contractId: activeContract.id,
            boardTypeId: parseInt(arrangementId),
            checkIn,
            checkOut,
            bookingDate,
            roomingList: roomingList.map(room => {
                let paxOrder = 1;
                return {
                    roomId: parseInt(room.roomId),
                    occupants: room.occupants.map(occ => ({
                        paxOrder: paxOrder++,
                        type: occ.type,
                        age: occ.age
                    }))
                };
            })
        };

        runSimulation(request);
    };

    const toggleNight = (date: string) => {
        setExpandedNights(prev => ({ ...prev, [date]: !prev[date] }));
    };

    // Calculate total occupants for display
    const totalAdults = roomingList.reduce((acc, room) => acc + room.occupants.filter(o => o.type === OccupantType.ADULT).length, 0);
    const totalChildren = roomingList.reduce((acc, room) => acc + room.occupants.filter(o => o.type !== OccupantType.ADULT).length, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">

            {/* ─── Header ────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulateur de Prix (V2)</h1>
                <p className="text-gray-500 mt-1">Calculez instantanément le prix d'un séjour avec Rooming List détaillée.</p>
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
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* ─── LEFT: Form Inputs (2/3) ─── */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Card A: Dates & Arrangement */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Paramètres du Séjour</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                            <option value="">Sélectionner...</option>
                                            {allowedArrangements.map(a => (
                                                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                                            ))}
                                        </select>
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

                        {/* Card B: Rooming List (V2) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <BedDouble size={20} className="text-indigo-600"/>
                                    Rooming List
                                </h3>
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-md">
                                    {roomingList.length} Chambre{roomingList.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {roomingList.map((room, roomIndex) => {
                                const selectedRoomMeta = activeContract.contractRooms.find(cr => String(cr.roomType.id) === room.roomId)?.roomType;

                                return (
                                    <div key={room.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                                                    {roomIndex + 1}
                                                </span>
                                                <h4 className="font-semibold text-gray-800">Chambre {roomIndex + 1}</h4>
                                            </div>
                                            {roomingList.length > 1 && (
                                                <button 
                                                    onClick={() => removeRoom(roomIndex)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                    title="Supprimer la chambre"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="p-5 space-y-6">
                                            <div className="space-y-1.5 max-w-md">
                                                <label className="text-sm font-medium text-gray-700">Type de Chambre</label>
                                                <select
                                                    value={room.roomId}
                                                    onChange={(e) => updateRoomType(roomIndex, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none cursor-pointer"
                                                >
                                                    <option value="">Sélectionner une chambre</option>
                                                    {activeContract.contractRooms?.map(cr => (
                                                        <option key={cr.id} value={cr.roomType.id}>
                                                            {cr.roomType.name} ({cr.roomType.code})
                                                        </option>
                                                    ))}
                                                </select>
                                                {selectedRoomMeta && (
                                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                                                        <Info size={12} className="text-indigo-400"/>
                                                        Capacité: {selectedRoomMeta.minAdults}-{selectedRoomMeta.maxAdults} Adulte(s), Max {selectedRoomMeta.maxChildren} Enfant(s)
                                                    </p>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                        <User size={16} className="text-gray-500"/>
                                                        Occupants de la chambre
                                                    </h5>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => addOccupant(roomIndex, OccupantType.ADULT)}
                                                            className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Plus size={14}/> Adulte
                                                        </button>
                                                        <button 
                                                            onClick={() => addOccupant(roomIndex, OccupantType.CHILD)}
                                                            className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Plus size={14}/> Enfant
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    {room.occupants.map((occ, occIndex) => (
                                                        <div key={occ.id} className="flex items-center gap-4 bg-white p-3 rounded-md border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center gap-2 w-32 shrink-0">
                                                                {occ.type === OccupantType.ADULT ? (
                                                                    <User size={16} className="text-indigo-500"/>
                                                                ) : (
                                                                    <Baby size={16} className="text-pink-500"/>
                                                                )}
                                                                <span className="text-sm font-semibold text-gray-700">
                                                                    {occ.type === OccupantType.ADULT ? 'Adulte' : 'Enfant'}
                                                                </span>
                                                            </div>

                                                            <div className="flex-1 flex items-center gap-3">
                                                                <label className="text-xs text-gray-500 font-medium">Âge</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="99"
                                                                    value={occ.age}
                                                                    onChange={(e) => updateOccupantAge(roomIndex, occIndex, parseInt(e.target.value) || 0)}
                                                                    className="w-20 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                />
                                                                <span className="text-xs text-gray-400">ans</span>
                                                            </div>

                                                            <button 
                                                                onClick={() => removeOccupant(roomIndex, occIndex)}
                                                                disabled={room.occupants.length <= 1} // Prevent removing last occupant
                                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                            >
                                                                <Minus size={16}/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {room.occupants.length === 0 && (
                                                        <p className="text-sm text-red-500 italic py-2">La chambre doit avoir au moins un occupant.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <button
                                onClick={addRoom}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Ajouter une autre chambre
                            </button>
                        </div>

                        <button
                            onClick={handleRunSimulation}
                            disabled={!isFormValid || isSimulating}
                            className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-xl shadow-gray-200 overflow-hidden mt-8"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {isSimulating ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Calculator size={22} />
                            )}
                            {isSimulating ? 'Calcul en cours...' : 'Lancer la simulation (Rooming List)'}
                        </button>
                    </div>

                    {/* ─── RIGHT: Results Panel (1/3) ─── */}
                    <div className="xl:col-span-1">
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
                                            {/* Display Mode Toggle removed because V2 breaks it down by room explicitly */}

                                            <div className="text-4xl font-black tracking-tight">
                                                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalNet)}
                                                <span className="text-xl ml-2 font-medium text-indigo-200">{simulationResult.currency}</span>
                                            </div>
                                            <p className="text-indigo-100 text-sm mt-2 flex items-center gap-2">
                                                <Calendar size={14} />
                                                {simulationResult.roomsBreakdown?.[0]?.dailyRates.length || 0} {simulationResult.roomsBreakdown?.[0]?.dailyRates.length > 1 ? 'nuits' : 'nuit'} • {totalAdults} {totalAdults > 1 ? 'Adultes' : 'Adulte'} {totalChildren > 0 && `• ${totalChildren} ${totalChildren > 1 ? 'Enfants' : 'Enfant'}`}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold">Détail du Devis</h3>
                                            <p className="text-gray-400 text-sm mt-1">Configurez le rooming list pour voir le prix final.</p>
                                        </>
                                    )}
                                </div>

                                <div className="p-0 flex-1 flex flex-col">
                                    {simulationResult ? (
                                        <div className="flex-1 overflow-y-auto max-h-[600px] bg-gray-50/50 custom-scrollbar">
                                            {simulationResult.roomsBreakdown.map((roomBreakdown, rbIdx) => (
                                                <div key={rbIdx} className="border-b border-gray-200 last:border-0">
                                                    {/* Room Header */}
                                                    <div className="bg-gray-100/80 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                                                                Chambre {roomBreakdown.roomIndex} 
                                                            </span>
                                                            {activeContract.contractRooms.find(cr => cr.roomType.id === roomBreakdown.roomId) && (
                                                                <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                                    {activeContract.contractRooms.find(cr => cr.roomType.id === roomBreakdown.roomId)?.roomType.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-black text-indigo-600">
                                                            {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(roomBreakdown.roomTotalNet)} {simulationResult.currency}
                                                        </span>
                                                    </div>

                                                    <div className="divide-y divide-gray-100 bg-white">
                                                        {roomBreakdown.dailyRates.map((day, idx) => {
                                                            const displayDailyRate = day.finalDailyRate;
                                                            // We cannot simply divide baseRate by adults anymore because occupants are mixed. The API returns full room data.
                                                            const isDetailed = expandedNights[`${rbIdx}-${day.date}`];

                                                            return (
                                                                <div key={day.date} className="group">
                                                                    <button
                                                                        onClick={() => toggleNight(`${rbIdx}-${day.date}`)}
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
                                                                                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(displayDailyRate)} {day.currency}
                                                                                {isDetailed ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                                            </p>
                                                                        </div>
                                                                    </button>

                                                                    {isDetailed && (
                                                                        <div className="bg-gray-50 p-4 mx-6 mb-4 rounded-lg border border-gray-100 text-sm animate-in slide-in-from-top-2 duration-200 shadow-inner">
                                                                            {/* Ligne 1 : La Base (occupational net before promos/supplements if possible, or just base unit rate) */}
                                                                            <div className="flex justify-between text-gray-600 mb-1">
                                                                                <span>Tarif de base / Occupation</span>
                                                                                <span className={(day.promotionApplied || day.reductionsApplied.length > 0) ? 'line-through opacity-70' : ''}>
                                                                                    {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(day.netRate)} {day.currency}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            {/* Reductions (Occupational - Extra Pax / Mono) */}
                                                                            {day.reductionsApplied.map((red, rIdx) => (
                                                                                <div key={rIdx} className="flex justify-between text-gray-600 mb-1">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Info size={12} className="text-gray-400" />
                                                                                        {red.name}
                                                                                    </span>
                                                                                    <span>+{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(red.amount)} {day.currency}</span>
                                                                                </div>
                                                                            ))}

                                                                            {/* Promotion */}
                                                                            {day.promotionApplied && (
                                                                                <div className="flex justify-between text-emerald-600 font-medium mb-1">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Flame size={12} className="text-orange-500" />
                                                                                        {day.promotionApplied.name}
                                                                                    </span>
                                                                                    <span>{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(day.promotionApplied.amount)} {day.currency}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Supplements */}
                                                                            {day.supplementsApplied.map((sup, sIdx) => (
                                                                                <div key={sIdx} className="flex justify-between text-gray-600 mb-1">
                                                                                    <span>{sup.name}</span>
                                                                                    <span>+{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sup.amount)} {day.currency}</span>
                                                                                </div>
                                                                            ))}

                                                                            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2 mt-2">
                                                                                <span>Net pour cette Nuit</span>
                                                                                <span className="text-indigo-600">{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(day.finalDailyRate)} {day.currency}</span>
                                                                            </div>

                                                                            {!day.isAvailable && (
                                                                                <p className="text-[10px] text-red-500 font-medium italic mt-2">
                                                                                    Indisponible: {day.reason}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
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
                                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                                    <span>Total Brut (Global)</span>
                                                    <span>{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalBrut)} {simulationResult.currency}</span>
                                                </div>
                                                {simulationResult.totalRemise > 0 && (
                                                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                                                        <span>Remises Globales</span>
                                                        <span>-{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalRemise)} {simulationResult.currency}</span>
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
                                                {simulationResult.stayModifiers.map((mod, mIdx) => {
                                                    const parts = mod.name.split(' - Formule: ');
                                                    const title = parts[0];
                                                    const formula = parts[1];

                                                    return (
                                                        <div key={mIdx} className="bg-white p-2.5 rounded-xl border border-indigo-50 shadow-sm flex justify-between items-start gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-800">{title}</span>
                                                                {formula && (
                                                                    <span className="text-[10px] text-gray-500 mt-0.5">{formula}</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs font-black whitespace-nowrap shrink-0 ${mod.amount < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {mod.amount > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(mod.amount)} {simulationResult.currency}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-end border-t border-gray-200 pt-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Total Net Final</span>
                                                <div className="text-3xl font-black text-gray-900 transition-all duration-700">
                                                    {simulationResult ? (
                                                        <>
                                                            {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulationResult.totalNet)}
                                                            <span className="text-sm font-bold text-gray-500 ml-1">{simulationResult.currency}</span>
                                                        </>
                                                    ) : '0,00'}
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