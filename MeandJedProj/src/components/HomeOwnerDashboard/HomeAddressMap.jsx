import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HomeAddressMap.css';
import { reverseGeocodeLocation } from './addressGeocoding';

// Photon provides address/place suggestions without a Google Maps API key.
// Use a short debounce and only search after 3 characters.
const DEFAULT_CENTER = [16.7, 121.7]; // Isabela, Philippines
const SEARCH_URL = 'https://photon.komoot.io/api/';

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
    }
  }, [coords?.lat, coords?.lng, map]);
  return null;
}

function MapClickHandler({ onPinMove, enabled }) {
  useMapEvents({
    click(event) {
      if (enabled) onPinMove(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function formatPlace(feature) {
  const p = feature?.properties || {};
  const parts = [p.name, p.street, p.district, p.city, p.state, p.country]
    .filter((part, index, array) => part && array.indexOf(part) === index);
  return parts.join(', ');
}

export default function HomeAddressMap({ value = '', coords = null, disabled = false, onLocationChange, onAddressChange }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
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

    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const params = new URLSearchParams({
          q: `${trimmed}, Philippines`,
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
          setSuggestions((data.features || []).filter((item) => item?.geometry?.coordinates?.length === 2));
          if (!(data.features || []).length) setSearchError('No suggestions found. Try adding the barangay or municipality.');
        }
      } catch {
        if (requestId === requestRef.current) setSearchError('Could not load address suggestions. You can still move the pin manually.');
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [query, disabled]);

  const choosePlace = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const address = formatPlace(feature) || query.trim();
    const next = { lat, lng };
    setPin(next);
    setQuery(address);
    setSuggestions([]);
    setSearchError('');
    onLocationChange?.({ address, ...next });
  };

  const movePin = async (lat, lng) => {
    const next = { lat, lng };
    setPin(next);
    onLocationChange?.({ address: '', ...next });
    try {
      const address = await reverseGeocodeLocation(lat, lng);
      if (address) {
        setQuery(address);
        onLocationChange?.({ address, lat, lng });
      }
    } catch {
      // The pin still moves even if reverse geocoding is unavailable.
    }
  };

  const center = pin ? [pin.lat, pin.lng] : DEFAULT_CENTER;

  return (
    <div className="hp-address-map-widget">
      <label className="hp-map-search-label" htmlFor="home-address-search">Search home address</label>
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
            {suggestions.map((feature, index) => (
              <li key={`${feature.properties?.osm_id || feature.properties?.name || 'place'}-${index}`}>
                <button type="button" role="option" onClick={() => choosePlace(feature)}>
                  <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                  <span>{formatPlace(feature) || 'Unnamed place'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p id="hp-map-search-help" className="hp-map-search-help">
        {disabled ? 'Select Edit Address to change your location.' : 'Type at least 3 characters, then select a suggestion. You can also click the map or drag the pin.'}
      </p>
      {searchError && <p className="hp-map-search-message" role="status">{searchError}</p>}

      <div className="hp-map-frame hp-leaflet-frame">
        <MapContainer center={center} zoom={pin ? 16 : 9} scrollWheelZoom={!disabled} className="hp-leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport coords={pin} />
          <MapClickHandler enabled={!disabled} onPinMove={movePin} />
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={homeIcon}
              draggable={!disabled}
              eventHandlers={{ dragend: (event) => {
                const position = event.target.getLatLng();
                movePin(position.lat, position.lng);
              } }}
            />
          )}
        </MapContainer>
        {!pin && <div className="hp-map-overlay-hint"><i className="bi bi-geo-alt-fill" /> Choose an address to place your home pin</div>}
      </div>
      {pin && <p className="hp-map-coordinates">Selected pin: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</p>}
      <p className="hp-map-attribution-note">Address suggestions by Photon. Map data &copy; OpenStreetMap contributors.</p>
    </div>
  );
}
