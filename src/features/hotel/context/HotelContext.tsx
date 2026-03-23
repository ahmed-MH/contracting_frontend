import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hotelService, type Hotel } from '../services/hotel.service';
import { useAuth } from '../../auth/context/AuthContext';

const HOTEL_ID_KEY = 'currentHotelId';

interface HotelContextValue {
    currentHotel: Hotel | null;
    availableHotels: Hotel[];
    isLoading: boolean;
    switchHotel: (hotelId: number) => void;
}

const HotelContext = createContext<HotelContextValue>({
    currentHotel: null,
    availableHotels: [],
    isLoading: true,
    switchHotel: () => { },
});

export function HotelProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [selectedId, setSelectedId] = useState<number | null>(() => {
        const stored = localStorage.getItem(HOTEL_ID_KEY);
        return stored ? Number(stored) : null;
    });

    // Track the previous user ID to detect user changes (login as different user)
    const prevUserIdRef = useRef<number | null | undefined>(undefined);

    // Reset hotel selection when the user changes or logs out
    useEffect(() => {
        const currentUserId = user?.id ?? null;

        // Skip initial mount (ref is undefined)
        if (prevUserIdRef.current === undefined) {
            prevUserIdRef.current = currentUserId;
            return;
        }

        // User changed (logout or login as someone else) — purge hotel state
        if (prevUserIdRef.current !== currentUserId) {
            prevUserIdRef.current = currentUserId;

            if (currentUserId === null) {
                // Logged out — reset everything
                setSelectedId(null);
                localStorage.removeItem(HOTEL_ID_KEY);
            } else {
                // Logged in as a different user — clear stale selection
                // so the auto-select effect picks the correct first hotel
                setSelectedId(null);
                localStorage.removeItem(HOTEL_ID_KEY);
            }
        }
    }, [user?.id]);

    // Admins see all hotels; non-admin users see only their assigned hotels
    const { data: hotels = [], isLoading } = useQuery({
        queryKey: ['hotels', isAdmin ? 'all' : 'mine', user?.id],
        queryFn: isAdmin ? hotelService.getHotels : hotelService.getMyHotels,
        enabled: isAuthenticated,
    });

    // Auto-select first hotel when list arrives and nothing is persisted
    useEffect(() => {
        if (!isLoading && hotels.length > 0 && selectedId === null) {
            const firstId = hotels[0].id;
            setSelectedId(firstId);
            localStorage.setItem(HOTEL_ID_KEY, String(firstId));
        }
    }, [isLoading, hotels, selectedId]);

    // Clear selected hotel if the user no longer has access to it
    useEffect(() => {
        if (!isLoading && hotels.length > 0 && selectedId !== null) {
            const stillValid = hotels.some((h) => h.id === selectedId);
            if (!stillValid) {
                const firstId = hotels[0].id;
                setSelectedId(firstId);
                localStorage.setItem(HOTEL_ID_KEY, String(firstId));
            }
        }
    }, [isLoading, hotels, selectedId]);

    const switchHotel = useCallback((hotelId: number) => {
        setSelectedId(hotelId);
        localStorage.setItem(HOTEL_ID_KEY, String(hotelId));
    }, []);

    const currentHotel = hotels.find((h) => h.id === selectedId) ?? null;

    return (
        <HotelContext.Provider value={{ currentHotel, availableHotels: hotels, isLoading, switchHotel }}>
            {children}
        </HotelContext.Provider>
    );
}

export function useHotel() {
    const ctx = useContext(HotelContext);
    if (!ctx) {
        throw new Error('useHotel must be used within a HotelProvider');
    }
    return ctx;
}
