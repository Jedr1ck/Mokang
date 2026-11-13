import { useEffect, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProviderVerification } from '../../services/api';
import { ECHAGUE_BOUNDARY } from '../../services/echagueLocation';
import './ProviderServiceMap.css';

const boundaryBounds = L.geoJSON(ECHAGUE_BOUNDARY).getBounds();

function fitMapToEchague(map) {
    map.invalidateSize({ pan: false });
    map.fitBounds(boundaryBounds, {
        padding: [28, 28],
        maxZoom: 10,
    });
}

function FitEchagueBounds() {
    const map = useMap();

    useEffect(() => {
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
    }, [map]);

    return null;
}

function ResetMapButton() {
    const map = useMap();

    return (
        <button
            type="button"
            className="provider-service-map-reset"
            onClick={() => fitMapToEchague(map)}
        >
            <i className="bi bi-crosshair" aria-hidden="true" />
            Reset to Echague
        </button>
    );
}

export default function ProviderServiceMap() {
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        getProviderVerification()
            .then((data) => {
                if (active) setVerification(data);
            })
            .catch((loadError) => {
                if (active) {
                    setError(loadError.message || 'Unable to load your registered service address.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const address = [
        verification?.street_address || verification?.street,
        verification?.barangay_name || verification?.barangay,
        verification?.city_municipality_name || verification?.city,
        verification?.province_name || verification?.province,
    ].filter(Boolean).join(', ');

    return (
        <section className="provider-service-map-page">
            <header className="provider-service-map-heading">
                <div>
                    <h1>Service Map</h1>
                </div>
                <span className="provider-service-map-area">
                    <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                    Echague, Isabela
                </span>
            </header>

            <div className="provider-service-map-card">
                <div className="provider-service-map-location">
                    <div className="provider-service-map-location-icon">
                        <i className="bi bi-house-check-fill" aria-hidden="true" />
                    </div>
                    <div>
                        <span>Registered service address</span>
                        {loading ? (
                            <strong>Loading address...</strong>
                        ) : error ? (
                            <strong role="status">{error}</strong>
                        ) : (
                            <strong>{address || 'No service address on your provider profile yet.'}</strong>
                        )}
                    </div>
                </div>

                <div className="provider-service-map-frame">
                    <div className="provider-service-map-coverage-label" role="note">
                        <span className="provider-service-map-coverage-icon">
                            <i className="bi bi-bullseye" aria-hidden="true" />
                        </span>
                        <span>
                            <strong>Service area</strong>
                            <small>Only within Echague, Isabela</small>
                        </span>
                    </div>
                    <MapContainer
                        center={[16.7, 121.7]}
                        zoom={11}
                        minZoom={9}
                        scrollWheelZoom
                        className="provider-service-leaflet-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <GeoJSON
                            data={ECHAGUE_BOUNDARY}
                            style={{
                                color: '#f56b12',
                                weight: 4,
                                opacity: 0.95,
                                fillColor: '#f56b12',
                                fillOpacity: 0.26,
                            }}
                        />
                        <FitEchagueBounds />
                        <ResetMapButton />
                    </MapContainer>
                </div>

                <div className="provider-service-map-legend">
                    <span><i aria-hidden="true" /> Provider service coverage — Echague only</span>
                    <span>Map data &copy; OpenStreetMap contributors</span>
                </div>
                <p className="provider-service-map-note">
                    The shaded area marks where this provider offers services. Locations outside Echague are not covered. The registered address above is not a precise map pin.
                </p>
            </div>
        </section>
    );
}
