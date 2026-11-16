import { useTheme } from '../contexts/useTheme';

export default function ThemeToggle({ compact = false }) {
    const { theme, setTheme } = useTheme();

    return (
        <div
            className={`theme-toggle${compact ? ' theme-toggle-compact' : ''}`}
            role="group"
            aria-label="Color theme"
        >
            <button
                type="button"
                className={`theme-toggle-button${theme === 'light' ? ' active' : ''}`}
                onClick={() => setTheme('light')}
                aria-label="Switch to light mode"
                aria-pressed={theme === 'light'}
                title="Light mode"
            >
                <i className="bi bi-sun-fill" aria-hidden="true" />
                <span className="theme-toggle-label">Light</span>
            </button>
            <button
                type="button"
                className={`theme-toggle-button${theme === 'dark' ? ' active' : ''}`}
                onClick={() => setTheme('dark')}
                aria-label="Switch to dark mode"
                aria-pressed={theme === 'dark'}
                title="Dark mode"
            >
                <i className="bi bi-moon-stars-fill" aria-hidden="true" />
                <span className="theme-toggle-label">Dark</span>
            </button>
        </div>
    );
}
