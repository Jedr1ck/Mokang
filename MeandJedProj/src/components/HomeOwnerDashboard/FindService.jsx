import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getNotifications, getProviders, getProvider } from '../../services/api';
import BookingModal from './BookingModal';
import './FindService.css';
import myLogo from '../../assets/images/logo.png';
import heroBackground from '../../assets/images/hero-background.png';
import cleaningImage from '../../assets/services/deep-cleaner.jpg';
import plumbingImage from '../../assets/services/plumber.jpg';
import airconImage from '../../assets/services/aircon.jpg';
import electricalImage from '../../assets/services/electrician.jpg';
import paintingImage from '../../assets/services/painter.jpg';
import applianceImage from '../../assets/services/appliance-repair.jpg';
import carpentryImage from '../../assets/services/carpenter.jpg';
import pestImage from '../../assets/services/pest-control.jpg';
import locksmithImage from '../../assets/services/locksmith.jpg';
import massageImage from '../../assets/services/massage.jpg';
import barberImage from '../../assets/services/barber.jpg';
import nailImage from '../../assets/services/nail-technician.jpg';
import makeupImage from '../../assets/services/makeup-artist.jpg';
import caregiverImage from '../../assets/services/caregiver.jpg';
import physicalTherapyImage from '../../assets/services/physical-therapist.jpg';
import computerCctvImage from '../../assets/services/computer-cctv.jpg';
import tutorFitnessImage from '../../assets/services/tutor-fitness.jpg';

const CATEGORY_VISUALS = [
    { name: 'Deep Cleaner', matches: ['clean'], icon: 'bi-stars', color: 'mint', image: cleaningImage },
    { name: 'Plumber', matches: ['plumb'], icon: 'bi-water', color: 'blue', image: plumbingImage },
    { name: 'Electrician', matches: ['electric'], icon: 'bi-lightning-charge-fill', color: 'orange', image: electricalImage },
    { name: 'Aircon Technician', matches: ['aircon', 'air con', 'cool'], icon: 'bi-snow', color: 'blue', image: airconImage },
    { name: 'Painter', matches: ['paint'], icon: 'bi-brush-fill', color: 'orange', image: paintingImage },
    { name: 'Appliance Repair Technician', matches: ['appliance'], icon: 'bi-house-gear-fill', color: 'mint', image: applianceImage },
    { name: 'Carpenter', matches: ['carpent', 'wood'], icon: 'bi-hammer', color: 'orange', image: carpentryImage },
    { name: 'Pest Control Technician', matches: ['pest'], icon: 'bi-bug-fill', color: 'mint', image: pestImage },
    { name: 'Locksmith', matches: ['lock', 'key duplication'], icon: 'bi-key-fill', color: 'blue', image: locksmithImage },
    { name: 'Massage Therapist', matches: ['massage'], icon: 'bi-heart-pulse', color: 'mint', image: massageImage },
    { name: 'Hair Stylist / Barber', matches: ['hair', 'barber', 'haircut'], icon: 'bi-scissors', color: 'orange', image: barberImage },
    { name: 'Nail Technician (Manicurist/Pedicurist)', matches: ['nail', 'manicure', 'pedicure'], icon: 'bi-hand-index-thumb', color: 'mint', image: nailImage },
    { name: 'Makeup Artist', matches: ['makeup', 'make up'], icon: 'bi-brush', color: 'orange', image: makeupImage },
    { name: 'Private Nurse / Caregiver', matches: ['nurse', 'caregiver', 'elderly assistance'], icon: 'bi-heart-pulse-fill', color: 'mint', image: caregiverImage },
    { name: 'Physical Therapist', matches: ['physical therapist', 'rehabilitation', 'mobility exercises'], icon: 'bi-person-walking', color: 'blue', image: physicalTherapyImage },
    { name: 'Computer / CCTV Technician', matches: ['computer', 'cctv'], icon: 'bi-camera-video', color: 'blue', image: computerCctvImage },
    { name: 'Private Tutor / Personal Fitness Trainer', matches: ['tutor', 'fitness', 'academic tutoring'], icon: 'bi-book', color: 'orange', image: tutorFitnessImage },
];
const SERVICE_CATEGORIES = CATEGORY_VISUALS.filter((item) => item.name);
const visualFor = (label = '') => CATEGORY_VISUALS.find((item) => item.matches.some((word) => label.toLowerCase().includes(word))) || CATEGORY_VISUALS[0];
const formatPrice = (price) => price == null ? 'Ask for price' : `₱${Number(price).toLocaleString()}`;
const formatReviewDate = (date) => date ? new Date(date).toLocaleDateString() : '';
const servicesForProvider = (provider) => {
    if (provider.services?.length) return provider.services;
    const names = provider.specificServices || provider.capabilities || [];
    if (names.length) {
        return names.map((name) => ({
            name,
            category: provider.category?.split(',')[0]?.trim() || name,
            price: provider.servicePrices?.[name] ?? provider.rate ?? null,
        }));
    }
    return provider.category
        ? [{ name: provider.category, category: provider.category, price: provider.rate ?? null }]
        : [];
};
const categoryMatchesProvider = (category, provider) => {
    const searchable = [
        provider.name,
        provider.category,
        ...(provider.capabilities || []),
        ...(provider.specificServices || []),
    ].filter(Boolean).join(' ').toLowerCase();
    return category.matches.some((term) => searchable.includes(term));
};

export default function FindService() {
    const navigate = useNavigate();
    const categoriesRef = useRef(null);
    const [providers, setProviders] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All Services');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('recommended');
    const [selectedProviderId, setSelectedProviderId] = useState(null);
    const [providerDetails, setProviderDetails] = useState(null);
    const [providerDetailsError, setProviderDetailsError] = useState(null);
    const [user, setUser] = useState({ fullName: 'Homeowner', profilePicture: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBooking, setShowBooking] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [detailTab, setDetailTab] = useState('Details');

    useEffect(() => {
        getNotifications().then((items) => setUnreadCount(items.filter((item) => !item.isRead).length)).catch(() => {});
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([getProviders(), getMyProfile().catch(() => null)])
            .then(([providerRows, profile]) => {
                if (!active) return;
                setProviders(providerRows);
                if (profile) setUser({ fullName: profile.fullName || 'Homeowner', profilePicture: profile.profilePicture || '' });
                else {
                    try {
                        const cached = JSON.parse(localStorage.getItem('user') || '{}');
                        setUser({ fullName: cached.fullName || 'Homeowner', profilePicture: cached.profilePicture || '' });
                    } catch { /* Use the neutral account fallback. */ }
                }
                setSelectedProviderId(providerRows[0]?.id ?? null);
            })
            .catch((loadError) => { if (active) setError(loadError.message || 'Unable to load service providers.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const filteredProviders = useMemo(() => {
        const term = query.trim().toLowerCase();
        const rows = providers.filter((provider) => {
            const skills = provider.capabilities || provider.specificServices || [];
            const matchesQuery = !term || [provider.name, provider.category, provider.location, ...skills]
                .filter(Boolean).some((value) => value.toLowerCase().includes(term));
            const selectedService = SERVICE_CATEGORIES.find((category) => category.name === selectedCategory);
            const matchesKnownCategory = SERVICE_CATEGORIES.some((category) => categoryMatchesProvider(category, provider));
            const matchesCategory = selectedCategory === 'All Services'
                || (selectedCategory === 'Other'
                    ? !matchesKnownCategory
                    : selectedService && categoryMatchesProvider(selectedService, provider));
            return matchesCategory && matchesQuery;
        });
        if (sort === 'price-low') rows.sort((a, b) => (a.rate ?? Number.MAX_VALUE) - (b.rate ?? Number.MAX_VALUE));
        if (sort === 'price-high') rows.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
        return rows;
    }, [providers, selectedCategory, query, sort]);

    const filteredSelection = filteredProviders.find((provider) => provider.id === selectedProviderId);
    const effectiveProviderId = selectedProviderId === null
        ? null
        : filteredSelection?.id ?? filteredProviders[0]?.id ?? null;
    const detailsLoading = Boolean(
        effectiveProviderId && providerDetails?.id !== effectiveProviderId
    );

    useEffect(() => {
        if (!effectiveProviderId) return undefined;
        let active = true;
        getProvider(effectiveProviderId)
            .then((provider) => {
                if (active) {
                    setProviderDetails(provider);
                    setProviderDetailsError(null);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setProviderDetails(providers.find((item) => item.id === effectiveProviderId) || null);
                    setProviderDetailsError({
                        id: effectiveProviderId,
                        message: loadError.message || 'Unable to load provider details.',
                    });
                }
            })
        return () => { active = false; };
    }, [effectiveProviderId, providers]);

    const activeProviderDetails = providerDetails?.id === effectiveProviderId ? providerDetails : null;
    const activeProviderDetailsError = providerDetailsError?.id === effectiveProviderId
        ? providerDetailsError.message
        : '';
    const bookingServices = activeProviderDetails ? servicesForProvider(activeProviderDetails) : [];

    return (
        <main className="find-services-page">
            <header className="find-services-topbar">
                <button type="button" className="find-services-brand" onClick={() => navigate('/homeowner-dashboard')} aria-label="Go to homeowner dashboard" title="Dashboard">
                    <img src={myLogo} alt="" />
                </button>
                <label className="find-services-global-search"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for services (e.g. cleaning, plumbing, electrical...)" /></label>
                <div className="find-services-account">
                <button type="button" className="find-services-bell" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => navigate('/notifications')}><i className="bi bi-bell" />{unreadCount > 0 && <span />}</button>
                    <button type="button" className="find-services-user" onClick={() => navigate('/profile')}>
                        {user.profilePicture ? <img src={user.profilePicture} alt="" /> : <span className="find-services-user-fallback">{user.fullName.charAt(0).toUpperCase()}</span>}
                        <span><strong>{user.fullName}</strong><small>Homeowner</small></span><i className="bi bi-chevron-down" />
                    </button>
                </div>
            </header>

            <div className="find-services-content">
                <section className="find-services-hero" style={{ backgroundImage: `url("${heroBackground}")` }}>
                    <div className="find-services-hero-copy">
                        <h1>Book the service <em>you want.</em></h1>
                    </div>
                </section>

                <div className="find-services-category-bar">
                    <button type="button" className="find-services-category-arrow" aria-label="Scroll categories left" onClick={() => categoriesRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><i className="bi bi-chevron-left" /></button>
                    <nav className="find-services-categories" aria-label="Service categories" ref={categoriesRef}>
                        <button type="button" className={selectedCategory === 'All Services' ? 'selected' : ''} onClick={() => setSelectedCategory('All Services')}><span className="category-icon mint"><i className="bi bi-grid-fill" /></span><small>All Services</small></button>
                        {SERVICE_CATEGORIES.map((category) => {
                            return <button type="button" key={category.name} className={selectedCategory === category.name ? 'selected' : ''} onClick={() => setSelectedCategory(category.name)}><span className={`category-icon ${category.color}`}><i className={`bi ${category.icon}`} /></span><small>{category.name}</small></button>;
                        })}
                        <button type="button" className={selectedCategory === 'Other' ? 'selected' : ''} onClick={() => setSelectedCategory('Other')}><span className="category-icon neutral"><i className="bi bi-three-dots" /></span><small>Other</small></button>
                    </nav>
                    <button type="button" className="find-services-category-arrow" aria-label="Scroll categories right" onClick={() => categoriesRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><i className="bi bi-chevron-right" /></button>
                </div>

                <div className="find-services-workspace">
                    <section className="find-services-results">
                        <div className="find-services-results-heading"><div><h2>{selectedCategory}</h2><p>Browse verified providers and book the service you need.</p></div>
                            <div className="find-services-tools"><label className="find-services-sort"><span>Sort by:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><label className="find-services-inline-search"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services..." /></label></div>
                        </div>

                        {loading ? <div className="find-services-state"><span className="spinner-border text-success" /><p>Loading verified providers...</p></div> : error ? <div className="find-services-state"><i className="bi bi-exclamation-circle" /><p>{error}</p></div> : filteredProviders.length ? <div className="find-services-grid">
                            {filteredProviders.map((provider) => {
                                const providerServices = servicesForProvider(provider);
                                const serviceName = providerServices[0]?.name || provider.category || 'Home service';
                                const visual = visualFor(serviceName);
                                const selectProvider = () => { setSelectedProviderId(provider.id); setDetailTab('Details'); };
                                return <article key={provider.id} className={`find-service-card ${effectiveProviderId === provider.id ? 'active' : ''}`} onClick={selectProvider}>
                                    <button type="button" className="find-service-card-image" aria-label={`View ${provider.name}`} style={{ backgroundImage: `url("${visual.image}")` }} onClick={selectProvider}><span className="find-service-verified"><i className="bi bi-patch-check-fill" /> Verified</span></button>
                                    <div className="find-service-card-body"><div className="find-service-card-title"><div><h3>{serviceName}</h3><p>{provider.name}</p></div><button type="button" className="find-service-open" aria-label={`View ${provider.name} details`} onClick={() => setSelectedProviderId(provider.id)}><i className="bi bi-arrow-up-right" /></button></div>
                                        <div className="find-service-card-meta"><span><i className="bi bi-star-fill" /> {provider.reviews > 0 ? `${provider.rating} (${provider.reviews} reviews)` : 'No reviews yet'}</span><span>{formatPrice(provider.rate)}</span></div>
                                        <p className="find-service-location"><i className="bi bi-geo-alt" /> {provider.location || 'Location not provided'}</p>
                                        <button type="button" className="find-service-book" onClick={(event) => { event.stopPropagation(); selectProvider(); setShowBooking(true); }}>Book Now <i className="bi bi-arrow-right" /></button>
                                    </div>
                                </article>;
                            })}
                        </div> : <div className="find-services-state"><i className="bi bi-search" /><h3>No providers found</h3><p>Try another category or search term.</p></div>}
                    </section>

                    <aside className="find-service-details">
                        {detailsLoading ? <div className="find-services-state"><span className="spinner-border spinner-border-sm text-success" /></div> : activeProviderDetails ? <>
                            <div className="find-service-detail-image" style={{ backgroundImage: `url("${visualFor(bookingServices[0]?.name || activeProviderDetails.category).image}")` }}><button type="button" aria-label="Close service details" onClick={() => setSelectedProviderId(null)}><i className="bi bi-x-lg" /></button></div>
                            <div className="find-service-detail-body">
                                <div className="find-service-provider-heading">
                                    {activeProviderDetails.image
                                        ? <img className="find-service-provider-avatar" src={activeProviderDetails.image} alt={`${activeProviderDetails.fullName || activeProviderDetails.name} profile`} />
                                        : <span className="find-service-provider-avatar find-service-provider-avatar-fallback"><i className="bi bi-person-fill" /></span>}
                                    <div><span className="find-service-detail-category">{activeProviderDetails.category || 'Home Service'}</span><h2>{activeProviderDetails.name}</h2></div>
                                </div>
                                <p className="find-service-detail-rating"><i className="bi bi-star-fill" /> {activeProviderDetails.rating > 0 ? Number(activeProviderDetails.rating).toFixed(1) : 'No reviews yet'} {activeProviderDetails.reviews > 0 && `(${activeProviderDetails.reviews} reviews)`}</p>
                                <div className="find-service-detail-tabs">{['Details', 'Services', 'Reviews'].map((tab) => <button type="button" key={tab} className={detailTab === tab ? 'active' : ''} onClick={() => setDetailTab(tab)}>{tab}{tab === 'Reviews' && activeProviderDetails.reviews > 0 ? ` (${activeProviderDetails.reviews})` : ''}</button>)}</div>
                                {detailTab === 'Details' ? <dl className="find-service-detail-list"><div><dt><i className="bi bi-person-badge" /> Provider</dt><dd>{activeProviderDetails.fullName || activeProviderDetails.name}</dd></div><div><dt><i className="bi bi-card-text" /> About</dt><dd>{activeProviderDetails.bio || activeProviderDetails.qualifications || 'Verified service provider.'}</dd></div><div><dt><i className="bi bi-geo-alt" /> Service Area</dt><dd>{activeProviderDetails.serviceArea || activeProviderDetails.location || 'Not provided'}</dd></div><div><dt><i className="bi bi-cash-coin" /> Starting Price</dt><dd>{formatPrice(activeProviderDetails.rate)}</dd></div></dl> : detailTab === 'Services' ? <div className="find-service-detail-list find-service-offerings">{bookingServices.length ? bookingServices.map((service, index) => <div key={`${service.name}-${index}`}><dt><i className="bi bi-check-circle" /> {service.name}</dt><dd>{formatPrice(service.price)}</dd></div>) : <p>Contact provider for service details.</p>}</div> : <div className="find-service-reviews">{activeProviderDetailsError ? <p className="find-service-no-reviews">{activeProviderDetailsError}</p> : activeProviderDetails.reviewDetails?.length ? activeProviderDetails.reviewDetails.map((review) => <article className="find-service-review" key={review.id}><div className="find-service-review-heading"><strong><i className="bi bi-person-circle" /> Homeowner</strong><span>{formatReviewDate(review.createdAt)}</span></div><p className="find-service-review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} <small>{review.rating}/5</small></p><p className="find-service-review-comment">{review.comment || 'No comment provided.'}</p>{review.service && <small className="find-service-review-service">{review.service}</small>}</article>) : <p className="find-service-no-reviews">{Array.isArray(activeProviderDetails.reviewDetails) ? 'Wala pang review para sa provider na ito.' : 'Naglo-load ang reviews...'}</p>}</div>}
                                <button type="button" className="find-service-detail-book" onClick={() => setShowBooking(true)}><i className="bi bi-calendar-check" /> Book This Service</button>
                            </div>
                        </> : <div className="find-service-detail-empty"><i className="bi bi-hand-index-thumb" /><h3>Select a provider</h3><p>Choose a service card to see provider details.</p></div>}
                    </aside>
                </div>
            </div>

            {activeProviderDetails && <BookingModal show={showBooking} handleClose={() => setShowBooking(false)} providerId={activeProviderDetails.id} initialCategory={bookingServices[0]?.category || activeProviderDetails.category?.split(',')[0]?.trim() || 'Home service'} providerServices={bookingServices} />}
        </main>
    );
}
