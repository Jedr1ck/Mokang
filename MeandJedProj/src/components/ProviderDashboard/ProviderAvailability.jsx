import { useEffect, useMemo, useState } from 'react';
import {
    getProviderVerification,
    updateProviderAvailabilitySlots,
} from '../../services/api';
import './ProviderAvailability.css';

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function currentWeekDays(mondayValue) {
    const monday = new Date(`${mondayValue}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
            date: formatDate(date),
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
    });
}

function mondayOfWeek(dateValue) {
    const monday = new Date(`${dateValue}T00:00:00`);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return formatDate(monday);
}

function addHour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const total = hours * 60 + minutes + 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function ProviderAvailability({ onScheduleSaved }) {
    const [clock, setClock] = useState(() => new Date());
    const todayValue = formatDate(clock);
    const weekStart = mondayOfWeek(todayValue);
    const weekDays = useMemo(() => currentWeekDays(weekStart), [weekStart]);
    const [daySettings, setDaySettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const intervalId = window.setInterval(() => setClock(new Date()), 30000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getProviderVerification()
            .then((verification) => {
                if (!active) return;
                const savedSlots = Array.isArray(verification?.availability_slots)
                    ? verification.availability_slots
                    : [];
                const hasDateSpecificSchedule = savedSlots.length > 0;
                const legacySchedule = Array.isArray(verification?.working_schedule)
                    ? verification.working_schedule
                    : [];

                const settings = Object.fromEntries(weekDays.map(({ date, day }) => {
                    const daySlots = savedSlots
                        .filter((slot) => slot.date === date && /^\d{2}:\d{2}$/.test(slot.time || ''))
                        .map((slot) => slot.time)
                        .sort();
                    if (daySlots.length) {
                        return [date, {
                            enabled: true,
                            start_time: daySlots[0],
                            end_time: addHour(daySlots[daySlots.length - 1]),
                        }];
                    }

                    const oldDay = !hasDateSpecificSchedule && legacySchedule.find((item) => (item.day || item.weekday) === day);
                    return [date, {
                        enabled: Boolean(oldDay),
                        start_time: oldDay?.start_time || oldDay?.startTime || '08:00',
                        end_time: oldDay?.end_time || oldDay?.endTime || '18:00',
                    }];
                }));
                setDaySettings(settings);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || 'Unable to load your availability.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [weekDays]);

    const updateDay = (date, changes) => {
        setMessage('');
        setError('');
        setDaySettings((current) => ({
            ...current,
            [date]: { ...current[date], ...changes },
        }));
    };

    const invalidSchedule = weekDays.some(({ date }) => {
        const setting = daySettings[date];
        return date >= todayValue && setting?.enabled && (!setting.start_time || !setting.end_time || setting.start_time >= setting.end_time);
    });

    const saveSchedule = async () => {
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const today = formatDate(new Date());
            const currentTime = new Date().toTimeString().slice(0, 5);
            const slots = [];

            weekDays.forEach(({ date }) => {
                const setting = daySettings[date];
                if (!setting?.enabled) return;

                const start = Number(setting.start_time.slice(0, 2)) * 60 + Number(setting.start_time.slice(3, 5));
                const end = Number(setting.end_time.slice(0, 2)) * 60 + Number(setting.end_time.slice(3, 5));
                for (let minutes = start; minutes + 60 <= end; minutes += 60) {
                    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
                    if (date > today || (date === today && time > currentTime)) slots.push({ date, time });
                }
            });

            const result = await updateProviderAvailabilitySlots(slots);
            setMessage(slots.length ? "This week's availability has been saved." : 'This week is now closed for bookings.');
            onScheduleSaved?.(result.availability_slots || []);
            if (result.availability_slots?.length) {
                setDaySettings((current) => {
                    const next = { ...current };
                    weekDays.forEach(({ date }) => {
                        const daySlots = result.availability_slots.filter((slot) => slot.date === date).map((slot) => slot.time).sort();
                        if (!daySlots.length) return;
                        next[date] = { enabled: true, start_time: daySlots[0], end_time: addHour(daySlots[daySlots.length - 1]) };
                    });
                    return next;
                });
            }
        } catch (saveError) {
            setError(saveError.message || 'Unable to save your availability.');
        } finally {
            setSaving(false);
        }
    };

    const weekLabel = weekDays.length
        ? `${weekDays[0].label} - ${weekDays[6].label}`
        : '';

    return (
        <section className="provider-availability-page" aria-labelledby="provider-availability-title">
            <header className="provider-availability-heading">
                <span className="provider-availability-heading-icon"><i className="bi bi-calendar-week" /></span>
                <div>
                    <h1 id="provider-availability-title">Booking Availability</h1>
                    <p>This week / Monday-Sunday / {weekLabel}</p>
                </div>
            </header>

            {error && <div className="provider-availability-alert error" role="alert">{error}</div>}
            {message && <div className="provider-availability-alert success" role="status">{message}</div>}

            {loading ? (
                <div className="provider-availability-loading" role="status">Loading this week's schedule...</div>
            ) : (
                <>
                    <div className="provider-availability-days">
                        {weekDays.map(({ date, day, label }) => {
                            const past = date < todayValue;
                            const setting = daySettings[date] || { enabled: false, start_time: '08:00', end_time: '18:00' };
                            return (
                                <article className={`provider-availability-day ${setting.enabled ? 'is-active' : ''} ${past ? 'is-past' : ''}`} key={date}>
                                    <label className="provider-availability-day-name" htmlFor={`availability-${date}`}>
                                        <input
                                            id={`availability-${date}`}
                                            type="checkbox"
                                            checked={setting.enabled}
                                            disabled={past}
                                            onChange={(event) => updateDay(date, { enabled: event.target.checked })}
                                        />
                                        <span>{day}</span>
                                        <small>{label}</small>
                                    </label>
                                    {past ? (
                                        <span className="provider-availability-day-off">Past</span>
                                    ) : setting.enabled ? (
                                        <div className="provider-availability-time-range">
                                            <label>
                                                <span>From</span>
                                                <input type="time" value={setting.start_time} onChange={(event) => updateDay(date, { start_time: event.target.value })} />
                                            </label>
                                            <span className="provider-availability-time-separator">to</span>
                                            <label>
                                                <span>To</span>
                                                <input type="time" value={setting.end_time} onChange={(event) => updateDay(date, { end_time: event.target.value })} />
                                            </label>
                                        </div>
                                    ) : (
                                        <span className="provider-availability-day-off">Day off</span>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <p className="provider-availability-note">This schedule applies to this week only. Set your hours again next week. Bookings start every hour within the selected time range.</p>
                    <button className="provider-availability-save" type="button" onClick={saveSchedule} disabled={saving || invalidSchedule}>
                        {saving ? 'Saving...' : 'Save this week'}
                    </button>
                </>
            )}
        </section>
    );
}
