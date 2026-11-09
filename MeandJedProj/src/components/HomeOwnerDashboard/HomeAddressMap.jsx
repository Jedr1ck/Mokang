import { useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HomeAddressMap.css';
import { reverseGeocodeLocation } from './addressGeocoding';
import { ECHAGUE_BOUNDARY, isWithinEchague } from '../../services/echagueLocation';
import { ECHAGUE_BARANGAYS } from '../../data/echagueBarangays';

const DEFAULT_CENTER = [16.7, 121.7];
const SEARCH_URL = 'https://photon.komoot.io/api/';
const ECHAGUE_BOUNDS = L.geoJSON(ECHAGUE_BOUNDARY).getBounds();

function fitMapToEchague(map) {
  map.invalidateSize({ pan: false });
  map.fitBounds(ECHAGUE_BOUNDS, {
    padding: [24, 24],
    maxZoom: 10,
  });
}

const homeIcon = L.divIcon({
  className: 'home-location-marker',
  html: '<span><i class="bi bi-house-fill"></i></span>',
  iconSize: [38, 44],
  iconAnchor: [19, 42],
  popupAnchor: [0, -38],
});

function MapViewport({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.lat != null && coords?.lng != null) {
      map.flyTo([coords.lat, coords.lng], 17, { duration: 0.7 });
      return undefined;
    }

    let fitted = false;
    let animationFrame = 0;
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      if (fitted || !container.clientWidth || !container.clientHeight) return;
      fitted = true;
      animationFrame = window.requestAnimationFrame(() => fitMapToEchague(map));
      observer.disconnect();
    });

    observer.observe(container);
    const fitAfterLayout = window.setTimeout(() => {
      if (fitted || !container.clientWidth || !container.clientHeight) return;
      fitted = true;
      animationFrame = window.requestAnimationFrame(() => fitMapToEchague(map));
      observer.disconnect();
    }, 250);

    return () => {
      window.clearTimeout(fitAfterLayout);
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [coords?.lat, coords?.lng, map]);
  return null;
}

function ResetMapButton() {
  const map = useMap();
  return (
    <button
      type="button"
      className="hp-map-reset-button"
      onClick={() => fitMapToEchague(map)}
    >
      <i className="bi bi-crosshair" aria-hidden="true" /> Reset to Echague
    </button>
  );
}

function MapClickHandler({ onPinMove, enabled }) {
  useMapEvents({
    click(event) {
      if (enabled) onPinMove(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function normalizeAddressPart(value = '') {
  return String(value)
    .replace(/^(?:barangay|brgy\.?)\s*/i, '')
    .replace(/\s*\(pob\.\)\s*/gi, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getAddressParts(query) {
  const match = query.trim().match(/^(purok\s+[^,]+?)(?:\s*,\s*|\s+)(.+)$/i);
  return {
    purok: match?.[1]?.trim() || '',
    locality: (match?.[2] || query)
      .replace(/\bEchague\b.*$/i, '')
      .replace(/\bIsabela\b.*$/i, '')
      .replace(/\bPhilippines\b.*$/i, '')
      .replace(/[, ]+$/g, '')
      .trim(),
  };
}

function getBarangaySuggestions(query) {
  const { purok, locality } = getAddressParts(query);
  const normalizedLocality = normalizeAddressPart(locality);
  if (!normalizedLocality) return [];

  return ECHAGUE_BARANGAYS
    .filter((barangay) => normalizedLocality.includes(normalizeAddressPart(barangay)))
    .slice(0, 6)
    .map((barangay) => ({
      kind: 'barangay',
      barangay,
      label: [purok, barangay, 'Echague', 'Isabela'].filter(Boolean).join(', '),
    }));
}

function formatPlace(feature) {
  const p = feature?.properties || {};
  const knownNames = [
    p.locality,
    p.district,
    p.suburb,
    p.neighbourhood,
    p.city,
    p.name,
  ].filter(Boolean).map(normalizeAddressPart);
  const barangay = ECHAGUE_BARANGAYS.find((name) =>
    knownNames.includes(normalizeAddressPart(name))
  );
  const placeName = p.name?.trim();
  const street = [p.housenumber, p.street].filter(Boolean).join(' ').trim();
  const details = [
    placeName && normalizeAddressPart(placeName) !== normalizeAddressPart(barangay || '')
      ? placeName
      : '',
    street && normalizeAddressPart(street) !== normalizeAddressPart(placeName || '')
      ? street
      : '',
    barangay,
    'Echague',
    'Isabela',
  ];
  return [...new Set(details.filter(Boolean))].join(', ');
}

export default function HomeAddressMap({
  value = '',
  coords = null,
  disabled = false,
  searchLabel = 'Search home address',
  onLocationChange,
  onAddressChange,
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [pin, setPin] = useState(coords || null);
  const requestRef = useRef(0);

  useEffect(() => setQuery(value || ''), [value]);
  useEffect(() => setPin(coords || null), [coords]);

  useEffect(() => {
    const trimmed = query.trim();
    if (disabled || trimmed.length < 3) {
      setSuggestions([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }

    const barangaySuggestions = getBarangaySuggestions(trimmed);
    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const params = new URLSearchParams({
          q: `${trimmed}, Echague, Isabela, Philippines`,
          limit: '6',
          lang: 'en',
          lat: '16.7',
          lon: '121.7',
        });
        const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Address search is temporarily unavailable.');
        const data = await response.json();
        if (requestId === requestRef.current) {
          const placeSuggestions = (data.features || [])
            .filter((item) => {
              const coordinates = item?.geometry?.coordinates;
              return coordinates?.length === 2 && isWithinEchague(coordinates[1], coordinates[0]);
            })
            .map((feature) => ({
              kind: 'place',
              feature,
              label: formatPlace(feature),
            }));
          const combined = [...barangaySuggestions, ...placeSuggestions]
            .filter((suggestion, index, items) =>
              items.findIndex((item) => item.label.toLowerCase() === suggestion.label.toLowerCase()) === index
            );
          setSuggestions(combined);
          if (!combined.length) setSearchError('No matching address or barangay was found within Echague. Try a Purok and barangay name.');
        }
      } catch (error) {
        if (requestId === requestRef.current) {
          setSuggestions(barangaySuggestions);
          setSearchError(
            barangaySuggestions.length
              ? 'Showing official barangay matches. Choose a map point in Echague to confirm the exact location.'
              : error.message || 'Could not load address suggestions. You can still select a location on the Echague map.'
          );
        }
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [query, disabled]);

  const choosePlace = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    if (!isWithinEchague(lat, lng)) {
      setLocationError('Choose an address within Echague, Isabela.');
      setSuggestions([]);
      return;
    }
    const address = formatPlace(feature) || query.trim();
    const next = { lat, lng };
    setPin(next);
    setQuery(address);
    setSuggestions([]);
    setSearchError('');
    setLocationError('');
    onLocationChange?.({ address, ...next });
  };

  const chooseBarangay = (suggestion) => {
    setPin(null);
    setQuery(suggestion.label);
    setSuggestions([]);
    setSearchError('Barangay selected. Choose the exact location on the Echague map to place your pin.');
    setLocationError('');
    onAddressChange?.(suggestion.label);
  };

  const movePin = async (lat, lng) => {
    if (!isWithinEchague(lat, lng)) {
      setLocationError('Service locations must be within Echague, Isabela.');
      return;
    }
    const next = { lat, lng };
    setPin(next);
    setLocationError('');
    onLocationChange?.({ address: '', ...next });
    try {
      const reverseAddress = await reverseGeocodeLocation(lat, lng);
      const { purok } = getAddressParts(query);
      const barangay = getBarangaySuggestions(query)[0]?.barangay;
      const address = barangay
        ? [purok, barangay, 'Echague', 'Isabela'].filter(Boolean).join(', ')
        : reverseAddress;
      if (address) {
        setQuery(address);
        onLocationChange?.({ address, lat, lng });
      } else {
        setSearchError('Location selected, but no address was returned. Enter the complete address manually.');
      }
    } catch (error) {
      setSearchError(error.message || 'Location selected, but its address could not be looked up.');
    }
  };

  const center = pin ? [pin.lat, pin.lng] : DEFAULT_CENTER;

  return (
    <div className="hp-address-map-widget">
      <label className="hp-map-search-label" htmlFor="home-address-search">{searchLabel}</label>
      <div className="hp-map-search-wrap">
        <i className="bi bi-search hp-map-search-icon" aria-hidden="true" />
        <input
          id="home-address-search"
          className="hp-map-search-input"
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            onAddressChange?.(event.target.value);
          }}
          onKeyDown={(event) => { if (event.key === 'Escape') setSuggestions([]); }}
          placeholder="Purok / street, barangay, municipality, province"
          autoComplete="off"
          aria-describedby="hp-map-search-help"
          aria-expanded={suggestions.length > 0}
        />
        {searching && <span className="hp-map-search-spinner" aria-label="Searching" />}
        {suggestions.length > 0 && !disabled && (
          <ul className="hp-map-suggestions" role="listbox" aria-label="Address suggestions">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.kind}-${suggestion.label}-${index}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => suggestion.kind === 'place'
                    ? choosePlace(suggestion.feature)
                    : chooseBarangay(suggestion)}
                >
                  <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                  <span>
                    <strong>{suggestion.label}</strong>
                    {suggestion.kind === 'barangay' && (
                      <small>Official barangay · choose the map to set the exact Purok</small>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p id="hp-map-search-help" className="hp-map-search-help">
        {disabled ? 'Your saved address is shown here. Location selection is limited to Echague.' : 'Address format: Purok (optional), Barangay, Echague, Isabela. Choose an official barangay suggestion, then select the exact location on the map.'}
      </p>
      {searchError && <p className="hp-map-search-message" role="status">{searchError}</p>}
      {locationError && <p className="hp-map-location-error" role="alert">{locationError}</p>}

      <div className="hp-map-frame hp-leaflet-frame">
        <MapContainer center={center} zoom={pin ? 16 : 10} minZoom={9} scrollWheelZoom={!disabled} className="hp-leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={ECHAGUE_BOUNDARY}
            style={{ color: '#FF6900', weight: 3, opacity: 0.9, fillColor: '#FF6900', fillOpacity: 0.08 }}
          />
          <MapViewport coords={pin} />
          <MapClickHandler enabled={!disabled} onPinMove={movePin} />
          <ResetMapButton />
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={homeIcon}
              draggable={!disabled}
              eventHandlers={{ dragend: (event) => {
                const position = event.target.getLatLng();
                if (!isWithinEchague(position.lat, position.lng)) {
                  event.target.setLatLng([pin.lat, pin.lng]);
                  setLocationError('Service locations must be within Echague, Isabela.');
                  return;
                }
                movePin(position.lat, position.lng);
              } }}
            />
          )}
        </MapContainer>
        {!pin && <div className="hp-map-overlay-hint"><i className="bi bi-geo-alt-fill" /> Choose an address to place your home pin</div>}
      </div>
      {pin && <p className="hp-map-coordinates">Selected pin: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</p>}
      <p className="hp-map-attribution-note">Address suggestions by Photon. Map data &copy; OpenStreetMap contributors.</p>
      <p className="hp-map-boundary-attribution">Municipal boundary: geoBoundaries (NAMRIA, PSA, OCHA Philippines, 2020), CC BY 3.0 IGO.</p>
    </div>
  );
}
