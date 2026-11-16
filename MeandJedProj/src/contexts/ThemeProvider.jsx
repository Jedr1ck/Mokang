import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContext';

const STORAGE_KEY = 'smarthome-color-theme';

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';

    let theme = null;
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') theme = saved;
    } catch {
        // Continue with the operating-system preference when storage is unavailable.
    }

    theme ||= window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    return theme;
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // The active theme still works for this session if storage is unavailable.
        }
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
