import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyProfile, getNotifications, getProviders, getProvider, token } from '../../services/api';
import { SERVICE_CATALOG } from '../../data/serviceCatalog';
import { ECHAGUE_BARANGAYS } from '../../data/echagueBarangays';
import './FindService.css';
import myLogo from '../../assets/images/handyman-mark.svg';
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
const normalizeServiceName = (value = '') => String(value)
    .toLowerCase()
    .replace(/trouble\s*shooting/g, 'troubleshooting')
    .replace(/clearing/g, 'cleaning')
    .replace(/installation/g, 'install')
    .replace(/move\s*in\s*\/\s*move\s*out/g, 'move')
    .replace(/full\s*body/g, 'fullbody')
    .replace(/blow\s*dry/g, 'blowdry')
    .replace(/[^a-z0-9]/g, '');
const providerOffersService = (provider, requestedService) => servicesForProvider(provider).some((service) => {
    const advertised = normalizeServiceName(service.name);
    const requested = normalizeServiceName(requestedService);
    return advertised === requested || advertised.includes(requested) || requested.includes(advertised);
});
const categoryMatchesProvider = (category, provider) => {
    const searchable = [
        provider.name,
        provider.category,
        ...(provider.capabilities || []),
        ...(provider.specificServices || []),
    ].filter(Boolean).join(' ').toLowerCase();
    return category.matches.some((term) => searchable.includes(term));
};
const normalizedLocationPart = (value = '') => value
    .replace(/^(?:barangay|brgy\.?)\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
const providerMatchesEchague = (provider, barangay) => {
    const [locationBarangay, locationMunicipality] = (provider.location || '')
        .split(',')
        .map(normalizedLocationPart);
    const providerBarangay = normalizedLocationPart(provider.barangay || locationBarangay);
    const municipality = normalizedLocationPart(
        (provider.municipality || locationMunicipality).split(',')[0]
    );
    return municipality === 'echague'
        && (barangay === 'all' || providerBarangay === normalizedLocationPart(barangay));
};

export default function FindService() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoriesRef = useRef(null);
    const [providers, setProviders] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All Services');
    const [selectedServiceName, setSelectedServiceName] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('all');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('recommended');
    const [selectedProviderId, setSelectedProviderId] = useState(null);
    const [providerDetails, setProviderDetails] = useState(null);
    const [providerDetailsError, setProviderDetailsError] = useState(null);
    const [user, setUser] = useState({ fullName: 'Homeowner', profilePicture: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [detailTab, setDetailTab] = useState('Details');
    const [isHomeowner, setIsHomeowner] = useState(() => {
        try {
            return Boolean(token()) && JSON.parse(localStorage.getItem('user') || '{}').role === 'homeowner';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        getNotifications().then((items) => setUnreadCount(items.filter((item) => !item.isRead).length)).catch(() => {});
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([getProviders(), getMyProfile().catch(() => null)])
            .then(([providerRows, profile]) => {
                if (!active) return;
                setProviders(providerRows);
                if (profile) {
                    setUser({ fullName: profile.fullName || 'Homeowner', profilePicture: profile.profilePicture || '' });
                    setIsHomeowner(profile.role === 'homeowner');
                }
                else {
                    setIsHomeowner(false);
                    try {
                        const cached = JSON.parse(localStorage.getItem('user') || '{}');
                        setUser({ fullName: cached.fullName || 'Homeowner', profilePicture: cached.profilePicture || '' });
                    } catch { /* Use the neutral account fallback. */ }
                }
            })
            .catch((loadError) => { if (active) setError(loadError.message || 'Unable to load service providers.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const requestedCategory = searchParams.get('category');
        const normalized = requestedCategory?.trim().toLowerCase() || '';
        const matchingCategory = requestedCategory && SERVICE_CATEGORIES.find((category) =>
            category.name.toLowerCase() === normalized
            || category.matches.some((term) => normalized.includes(term) || term.includes(normalized))
        );
        setSelectedProviderId(null);
        setSelectedCategory(matchingCategory?.name || 'All Services');
        setSelectedServiceName(searchParams.get('service') || '');
    }, [searchParams]);

    const selectCategory = (categoryName) => {
        setSelectedProviderId(null);
        setSearchParams(categoryName === 'All Services' ? {} : { category: categoryName });
    };

    const selectService = (serviceName) => {
        setSelectedProviderId(null);
        const params = {};
        if (selectedCategory !== 'All Services') params.category = selectedCategory;
        params.service = serviceName;
        setSearchParams(params);
    };

    const openProviderProfile = (providerId) => {
        const profileParams = new URLSearchParams();
        if (selectedCategory !== 'All Services') profileParams.set('category', selectedCategory);
        if (selectedServiceName) profileParams.set('service', selectedServiceName);
        const profileQuery = profileParams.toString();
        navigate(`/provider/${providerId}${profileQuery ? `?${profileQuery}` : ''}`);
    };

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
            const matchesService = !selectedServiceName || providerOffersService(provider, selectedServiceName);
            return matchesCategory && matchesQuery && matchesService && providerMatchesEchague(provider, selectedBarangay);
        });
        if (sort === 'price-low') rows.sort((a, b) => (a.rate ?? Number.MAX_VALUE) - (b.rate ?? Number.MAX_VALUE));
        if (sort === 'price-high') rows.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
        return rows;
    }, [providers, selectedCategory, selectedServiceName, selectedBarangay, query, sort]);

    const serviceOffers = useMemo(() => {
        const catalogEntries = selectedCategory === 'All Services'
            ? SERVICE_CATALOG
            : SERVICE_CATALOG.filter((entry) => entry.category === selectedCategory);
        const normalizedQuery = query.trim().toLowerCase();
        return catalogEntries.flatMap((entry) => entry.services.map((name) => {
            const matchingProviders = providers
                .filter((provider) => providerMatchesEchague(provider, selectedBarangay))
                .filter((provider) => providerOffersService(provider, name));
            const matchesSearch = !normalizedQuery
                || name.toLowerCase().includes(normalizedQuery)
                || matchingProviders.some((provider) => provider.name?.toLowerCase().includes(normalizedQuery));
            if (!matchesSearch) return null;
            const prices = matchingProviders.flatMap((provider) => servicesForProvider(provider)
                .filter((service) => normalizeServiceName(service.name) === normalizeServiceName(name))
                .filter((service) => service.price != null)
                .map((service) => Number(service.price))
                .filter(Number.isFinite));
            return {
                name,
                category: entry.category,
                providerCount: matchingProviders.length,
                startingPrice: prices.length ? Math.min(...prices) : null,
            };
        })).filter(Boolean);
    }, [providers, selectedCategory, selectedBarangay, query]);

    const showCategoryServices = selectedCategory !== 'All Services' && !selectedServiceName;

    const filteredSelection = filteredProviders.find((provider) => provider.id === selectedProviderId);
    const effectiveProviderId = filteredSelection?.id ?? null;
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
                <button type="button" className="find-services-brand" onClick={() => navigate(isHomeowner ? '/homeowner-dashboard' : '/')} aria-label={isHomeowner ? 'Return to homeowner dashboard' : 'Return to home page'} title={isHomeowner ? 'Click to return to dashboard' : 'Return home'}>
                    <img src={myLogo} alt="" />
                </button>
                <label className="find-services-global-search"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for services (e.g. cleaning, plumbing, electrical...)" /></label>
                <div className="find-services-account">
                    {isHomeowner ? <>
                        <button type="button" className="find-services-bell" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => navigate('/notifications')}><i className="bi bi-bell" />{unreadCount > 0 && <span />}</button>
                        <button type="button" className="find-services-user" onClick={() => navigate('/profile')}>
                            {user.profilePicture ? <img src={user.profilePicture} alt="" /> : <span className="find-services-user-fallback">{user.fullName.charAt(0).toUpperCase()}</span>}
                            <span><strong>{user.fullName}</strong><small>Homeowner</small></span><i className="bi bi-chevron-down" />
                        </button>
                    </> : <button type="button" className="find-services-auth-button" onClick={() => navigate('/auth/homeowner', { state: { from: { pathname: '/services', search: window.location.search } } })}>Homeowner Login / Sign Up</button>}
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
                        <button type="button" className={selectedCategory === 'All Services' ? 'selected' : ''} onClick={() => selectCategory('All Services')}><span className="category-icon mint"><i className="bi bi-grid-fill" /></span><small>All Services</small></button>
                        {SERVICE_CATEGORIES.map((category) => {
                            return <button type="button" key={category.name} className={selectedCategory === category.name ? 'selected' : ''} onClick={() => selectCategory(category.name)}><span className={`category-icon ${category.color}`}><i className={`bi ${category.icon}`} /></span><small>{category.name}</small></button>;
                        })}
                        <button type="button" className={selectedCategory === 'Other' ? 'selected' : ''} onClick={() => selectCategory('Other')}><span className="category-icon neutral"><i className="bi bi-three-dots" /></span><small>Other</small></button>
                    </nav>
                    <button type="button" className="find-services-category-arrow" aria-label="Scroll categories right" onClick={() => categoriesRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><i className="bi bi-chevron-right" /></button>
                </div>

                {showCategoryServices && <section className="find-services-subservices" aria-label={`${selectedCategory} specific services`}>
                    <h2>{selectedCategory} Services</h2>
                    {loading ? <div className="find-services-subservices-loading">Loading services...</div> : error ? <div className="find-services-subservices-loading">{error}</div> : serviceOffers.length ? (
                        <div className="find-services-subservice-list">
                            {serviceOffers.map((offer) => (
                                <button
                                    type="button"
                                    key={`${offer.category}-${offer.name}`}
                                    className="find-services-subservice"
                                    disabled={offer.providerCount === 0}
                                    onClick={() => selectService(offer.name)}
                                >
                                    <span>{offer.name}</span>
                                    <small>{offer.providerCount} {offer.providerCount === 1 ? 'provider' : 'providers'}</small>
                                    <i className="bi bi-arrow-right" />
                                </button>
                            ))}
                        </div>
                    ) : <div className="find-services-subservices-loading">No matching specific services.</div>}
                </section>}

                {!showCategoryServices && <div className={`find-services-workspace ${effectiveProviderId ? 'has-selected-provider' : ''}`}>
                    <section className="find-services-results">
                        <div className="find-services-results-heading"><div><h2>{selectedServiceName || selectedCategory}</h2></div>
                            <div className="find-services-tools">{selectedServiceName && <label className="find-services-sort"><span>Sort by:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>}<label className="find-services-sort find-services-barangay-filter"><span>Barangay:</span><select value={selectedBarangay} onChange={(event) => setSelectedBarangay(event.target.value)} aria-label="Filter providers by Echague barangay"><option value="all">All Echague</option>{ECHAGUE_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label><label className="find-services-inline-search"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={selectedServiceName ? 'Search providers...' : 'Search services...'} /></label></div>
                        </div>

                        {selectedServiceName && <button type="button" className="find-services-back-link" onClick={() => selectCategory(selectedCategory)}><i className="bi bi-arrow-left" /> Back to {selectedCategory} services</button>}
                        {loading ? <div className="find-services-state"><span className="spinner-border text-success" /><p>Loading available services...</p></div> : error ? <div className="find-services-state"><i className="bi bi-exclamation-circle" /><p>{error}</p></div> : !selectedServiceName ? serviceOffers.length ? <div className="find-services-grid find-service-offers-grid">
                            {serviceOffers.map((offer) => <article className="find-service-offer-card" key={`${offer.category}-${offer.name}`}>
                                <div className="find-service-offer-image" style={{ backgroundImage: `url("${visualFor(offer.category || offer.name).image}")` }} />
                                <div className="find-service-offer-body">
                                    <span className="find-service-offer-kicker"><i className="bi bi-tools" /> Service option</span>
                                    <h3>{offer.name}</h3>
                                    <p>{offer.providerCount} provider{offer.providerCount === 1 ? '' : 's'} available</p>
                                    <strong>{offer.startingPrice == null ? 'Ask for price' : `From ${formatPrice(offer.startingPrice)}`}</strong>
                                    <button type="button" className="find-service-book" disabled={offer.providerCount === 0} onClick={() => selectService(offer.name)}>{offer.providerCount ? 'View Providers' : 'No Providers Yet'} {offer.providerCount > 0 && <i className="bi bi-arrow-right" />}</button>
                                </div>
                            </article>)}
                        </div> : <div className="find-services-state"><i className="bi bi-search" /><h3>No services found</h3><p>Try another category, search term, or barangay.</p></div> : filteredProviders.length ? <div className="find-services-grid">
                            {filteredProviders.map((provider) => {
                                const providerServices = servicesForProvider(provider);
                                const serviceName = providerServices[0]?.name || provider.category || 'Home service';
                                const visual = visualFor(selectedCategory !== 'All Services' ? selectedCategory : provider.category || serviceName);
                                const cannotBook = provider.isOngoing || String(provider.availability || 'Available').toLowerCase() !== 'available';
                                const selectProvider = () => { setSelectedProviderId(provider.id); setDetailTab('Details'); };
                                return <article key={provider.id} className={`find-service-card ${effectiveProviderId === provider.id ? 'active' : ''}`} onClick={selectProvider}>
                                    <button type="button" className="find-service-card-image" aria-label={`View ${provider.name}`} style={{ backgroundImage: `url("${visual.image}")` }} onClick={selectProvider}><span className="find-service-verified"><i className="bi bi-patch-check-fill" /> Verified</span></button>
                                    <div className="find-service-card-body"><div className="find-service-card-title"><div><h3>{serviceName}</h3><p>{provider.name}</p></div><button type="button" className="find-service-open" aria-label={`View ${provider.name} details`} onClick={() => setSelectedProviderId(provider.id)}><i className="bi bi-arrow-up-right" /></button></div>
                                        <div className="find-service-card-meta"><span><i className="bi bi-star-fill" /> {provider.reviews > 0 ? `${provider.rating} (${provider.reviews} reviews)` : 'No reviews yet'}</span><span>{formatPrice(provider.rate)}</span></div>
                                        <p className="find-service-location"><i className="bi bi-geo-alt" /> {provider.location || 'Location not provided'}</p>
                                        <button type="button" className="find-service-book" disabled={cannotBook} onClick={(event) => { event.stopPropagation(); openProviderProfile(provider.id); }}><i className="bi bi-calendar-check" /> {provider.isOngoing ? 'At Work' : cannotBook ? 'Unavailable' : 'Book Now'}</button>
                                    </div>
                                </article>;
                            })}
                        </div> : <div className="find-services-state"><i className="bi bi-search" /><h3>No providers found</h3><p>Try another service, search term, or barangay.</p></div>}
                    </section>

                    {effectiveProviderId && <aside className="find-service-details">
                        {detailsLoading ? <div className="find-services-state"><span className="spinner-border spinner-border-sm text-success" /></div> : activeProviderDetails ? <>
                            <div className="find-service-detail-image" style={{ backgroundImage: `url("${visualFor(selectedCategory !== 'All Services' ? selectedCategory : activeProviderDetails.category).image}")` }}><button type="button" aria-label="Close service details" onClick={() => setSelectedProviderId(null)}><i className="bi bi-x-lg" /></button></div>
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
                                <button type="button" className="find-service-detail-book" disabled={activeProviderDetails.isOngoing || String(activeProviderDetails.availability || 'Available').toLowerCase() !== 'available'} onClick={() => openProviderProfile(activeProviderDetails.id)}><i className="bi bi-calendar-check" /> {activeProviderDetails.isOngoing ? 'At Work' : String(activeProviderDetails.availability || 'Available').toLowerCase() !== 'available' ? 'Unavailable' : 'Book Now'}</button>
                            </div>
                        </> : <div className="find-service-detail-empty"><i className="bi bi-hand-index-thumb" /><h3>Select a provider</h3><p>Choose a service card to see provider details.</p></div>}
                    </aside>}
                </div>}
            </div>

        </main>
    );
}
