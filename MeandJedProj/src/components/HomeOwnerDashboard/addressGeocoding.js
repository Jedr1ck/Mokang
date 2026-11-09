const REVERSE_SEARCH_URL = 'https://photon.komoot.io/reverse';

function formatPlace(feature) {
    const properties = feature?.properties || {};
    const parts = [
        properties.name,
        properties.street,
        properties.district,
        properties.city,
        properties.state,
        properties.country,
    ].filter((part, index, array) => part && array.indexOf(part) === index);
    for (const coverageName of ['Echague', 'Isabela', 'Philippines']) {
        if (!parts.some((part) => String(part).toLowerCase() === coverageName.toLowerCase())) parts.push(coverageName);
    }
    return parts.filter((part, index) => part && parts.indexOf(part) === index).join(', ');
}

export async function reverseGeocodeLocation(lat, lng) {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), lang: 'en' });
    const response = await fetch(`${REVERSE_SEARCH_URL}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Unable to find an address for this location.');
    const data = await response.json();
    return formatPlace(data.features?.[0]);
}
