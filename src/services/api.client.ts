import axios from 'axios';
import { toast } from 'sonner';

const HOTEL_ID_KEY = 'currentHotelId';
const TOKEN_KEY = 'authToken';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10_000,
});

// ─── Request: inject JWT + Hotel ID ──────────────────────────────────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    const hotelId = localStorage.getItem(HOTEL_ID_KEY);
    if (hotelId) {
        config.headers['x-hotel-id'] = hotelId;
    }

    return config;
});

// ─── Response: error handling ────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error.response?.data;
        const status = error.response?.status;

        // Extract NestJS error message (handles string or string[])
        let message = 'Une erreur est survenue';
        if (data?.message) {
            message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        }

        if (status === 401) {
            // Clear auth state and redirect to login
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('authUser');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    },
);

export default apiClient;
