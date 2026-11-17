export function formatTime12Hour(value) {
    if (!value) return '';
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return value;
    const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export function getPhilippinesDateTime() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date()).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`,
    };
}

export function hasBookingTimeArrived(date, time) {
    if (!date || !time) return false;
    const now = getPhilippinesDateTime();
    const current = `${now.date}T${now.time}`;
    const requested = `${date}T${String(time).slice(0, 5)}`;
    return current >= requested;
}
