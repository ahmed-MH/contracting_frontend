void i18n.t('common:bootstrap.ready', { defaultValue: 'ready' });
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/context/AuthContext';
import { HotelProvider } from './features/hotel/context/HotelContext';
import { ConfirmProvider } from './context/ConfirmContext';
import './index.css';
import './lib/i18n';
import App from './App';
import i18n from './lib/i18n';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <HotelProvider>
                    <ConfirmProvider>
                        <App />
                    </ConfirmProvider>
                </HotelProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
