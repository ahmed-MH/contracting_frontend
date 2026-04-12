import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'pricify-theme';
const THEME_EVENT_NAME = 'pricify:theme-change';

function isThemeMode(value: string | null | undefined): value is ThemeMode {
    return value === 'light' || value === 'dark';
}

function getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(storedTheme)) {
        return storedTheme;
    }

    if (window.document.documentElement.classList.contains('dark')) {
        return 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}

function persistTheme(theme: ThemeMode) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function publishTheme(theme: ThemeMode) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT_NAME, { detail: theme }));
}

export function useTheme() {
    const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
        persistTheme(theme);
        publishTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const syncTheme = (nextTheme: ThemeMode) => {
            setThemeState((currentTheme) => (currentTheme === nextTheme ? currentTheme : nextTheme));
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY || !isThemeMode(event.newValue)) {
                return;
            }

            syncTheme(event.newValue);
        };

        const onThemeChange = (event: Event) => {
            const nextTheme = (event as CustomEvent<ThemeMode>).detail;
            if (!isThemeMode(nextTheme)) {
                return;
            }

            syncTheme(nextTheme);
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener(THEME_EVENT_NAME, onThemeChange);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(THEME_EVENT_NAME, onThemeChange);
        };
    }, []);

    const setTheme = (nextTheme: ThemeMode) => {
        setThemeState(nextTheme);
    };

    const toggleTheme = () => {
        setThemeState((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    };

    return {
        isDark: theme === 'dark',
        theme,
        setTheme,
        toggleTheme,
    };
}
