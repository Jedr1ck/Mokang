import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, sendMessage, updateBookingStatus } from '../../services/api';
import myLogo from '../../assets/images/logo.png';
import airconImage from '../../assets/services/aircon.jpg';
import applianceRepairImage from '../../assets/services/appliance-repair.jpg';
import deepCleanerImage from '../../assets/services/deep-cleaner.jpg';
import electricianImage from '../../assets/services/electrician.jpg';
import plumberImage from '../../assets/services/plumber.jpg';
import './ProviderJobs.css';

const PAGE_SIZE = 5;
const TABS = ['All Jobs', 'Pending', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];
const SERVICE_IMAGES = [
    { keywords: ['clean'], image: deepCleanerImage },
    { keywords: ['aircon', 'air con', 'air conditioning'], image: airconImage },
    { keywords: ['electric', 'electrical'], image: electricianImage },
    { keywords: ['plumb'], image: plumberImage },
    { keywords: ['appliance'], image: applianceRepairImage },
];
const toDate = (date) => date ? new Date(`${date}T00:00:00`) : null;
const displayDate = (date) => toDate(date)?.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
}) || 'Date not set';
const displayTime = (time) => time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
}) : 'Time not set';
const serviceImage = (service) => {
    const normalizedService = service.toLowerCase();
    return SERVICE_IMAGES.find(({ keywords }) => keywords.some((keyword) => normalizedService.includes(keyword)))?.image;
};
const statusGroup = (status) => {
    if (status === 'Pending') return 'Pending';
    if (status === 'In Progress' || status === 'On the Way') return 'In Progress';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled' || status === 'Rejected') return 'Cancelled';
    return 'Upcoming';
};

export default function ProviderJobs() {
    const navigate = useNavigate();
    const [profile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (profileError) {
            console.error('Unable to read provider account:', profileError);
            return {};
        }
    });
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('All Jobs');
    const [search, setSearch] = useState('');
    const [serviceFilter, setServiceFilter] = useState('All Service Types');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const loadJobs = () => getMyBookings().then((bookings) => setJobs(bookings.map((booking) => ({
        id: booking.id,
        recipientId: booking.homeownerId,
        requestNo: booking.bookingCode || `#${booking.id}`,
        customerName: booking.customerName || 'Homeowner',
        customerPhoto: booking.customerProfilePicture,
        service: booking.category || 'Service request',
        location: booking.address || 'Location not provided',
        contact: booking.customerPhone || 'Not provided',
        dateValue: booking.preferredDate || '',
        date: displayDate(booking.preferredDate),
        time: displayTime(booking.preferredTime),
        status: booking.status || 'Pending',
        description: booking.description || '',
    })))).catch((loadError) => setError(loadError.message || 'Unable to load jobs.'));

    useEffect(() => { loadJobs(); }, []);

    const counts = useMemo(() => ({
        upcoming: jobs.filter((job) => statusGroup(job.status) === 'Upcoming').length,
        pending: jobs.filter((job) => job.status === 'Pending').length,
        progress: jobs.filter((job) => statusGroup(job.status) === 'In Progress').length,
        completed: jobs.filter((job) => job.status === 'Completed').length,
        cancelled: jobs.filter((job) => statusGroup(job.status) === 'Cancelled').length,
    }), [jobs]);

    const services = useMemo(() => [...new Set(jobs.map((job) => job.service))].sort(), [jobs]);
    const filteredJobs = useMemo(() => jobs.filter((job) => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || [job.requestNo, job.customerName, job.service, job.location]
            .some((value) => value.toLowerCase().includes(term));
        const matchesTab = activeTab === 'All Jobs' || statusGroup(job.status) === activeTab;
        const matchesService = serviceFilter === 'All Service Types' || job.service === serviceFilter;
        const matchesStatus = statusFilter === 'All Status' || job.status === statusFilter;
        const matchesStart = !dateFrom || job.dateValue >= dateFrom;
        const matchesEnd = !dateTo || job.dateValue <= dateTo;
        return matchesSearch && matchesTab && matchesService && matchesStatus && matchesStart && matchesEnd;
    }).sort((a, b) => `${a.dateValue} ${a.time}`.localeCompare(`${b.dateValue} ${b.time}`)),
    [jobs, search, activeTab, serviceFilter, statusFilter, dateFrom, dateTo]);

    useEffect(() => setPage(1), [search, activeTab, serviceFilter, statusFilter, dateFrom, dateTo]);
    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
    const visibleJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const updateStatus = async (job, status) => {
        setBusyId(job.id);
        setError('');
        try {
            const updated = await updateBookingStatus(job.id, status);
            setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: updated.status || status } : item));
            setSelectedJob((current) => current?.id === job.id ? { ...current, status: updated.status || status } : current);
        } catch (statusError) {
            setError(statusError.message || 'Unable to update this job.');
        } finally {
            setBusyId(null);
        }
    };

    const submitMessage = async () => {
        if (!selectedJob || !message.trim()) return;
        try {
            await sendMessage(selectedJob.recipientId, message.trim(), selectedJob.id);
            setMessage('');
            setShowMessage(false);
        } catch (sendError) {
            setError(sendError.message || 'Unable to send your message.');
        }
    };

    const statusClass = (status) => `job-pill job-pill-${status.toLowerCase().replaceAll(' ', '-')}`;
    const showDetails = (job) => setSelectedJob(job);

    return (
        <section className="provider-my-jobs">
            <header className="my-jobs-topbar">
                <button type="button" className="my-jobs-brand" aria-label="Go to Provider Dashboard" onClick={() => navigate('/provider-dashboard')}>
                    <img src={myLogo} alt="" />
                </button>
                <label className="my-jobs-topbar-search">
                    <i className="bi bi-search" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs, customers, or service type..." aria-label="Search jobs, customers, or service type" />
                </label>
                <button type="button" className="my-jobs-notifications" aria-label="Notifications" onClick={() => navigate('/provider-notifications')}>
                    <i className="bi bi-bell" /><span />
                </button>
                <button type="button" className="my-jobs-profile" onClick={() => navigate('/provider-profile')}>
                    {profile.profilePicture || profile.profileImage || profile.profilePhoto || profile.photo || profile.image
                        ? <img src={profile.profilePicture || profile.profileImage || profile.profilePhoto || profile.photo || profile.image} alt="" />
                        : <span className="my-jobs-profile-placeholder"><i className="bi bi-person" /></span>}
                    <span><strong>{profile.fullName || profile.name || 'Provider'}</strong><small>Service Provider</small></span>
                    <i className="bi bi-chevron-down" />
                </button>
            </header>

            <header className="my-jobs-heading">
                <div>
                    <h1>My Jobs</h1>
                    <p>View and manage all your service jobs in one place.</p>
                </div>
                <button type="button" className="my-jobs-availability" onClick={() => navigate('/provider-availability')}>
                    <i className="bi bi-calendar2-week" /> Set Availability <i className="bi bi-arrow-right" />
                </button>
            </header>

            <div className="my-jobs-stats">
                <Summary icon="calendar2-check" value={counts.upcoming} label="Upcoming Jobs" tone="green" />
                <Summary icon="hourglass-split" value={counts.pending} label="Pending Requests" tone="orange" />
                <Summary icon="play-circle-fill" value={counts.progress} label="In Progress" tone="blue" />
                <Summary icon="check-circle-fill" value={counts.completed} label="Completed" tone="green" />
                <Summary icon="x-circle-fill" value={counts.cancelled} label="Cancelled" tone="red" />
            </div>

            <nav className="my-jobs-tabs" aria-label="Filter jobs by status">
                {TABS.map((tab) => <button type="button" key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                    {tab}{tab === 'Pending' ? ` (${counts.pending})` : tab === 'Upcoming' ? ` (${counts.upcoming})` : tab === 'In Progress' ? ` (${counts.progress})` : tab === 'Completed' ? ` (${counts.completed})` : tab === 'Cancelled' ? ` (${counts.cancelled})` : ''}
                </button>)}
            </nav>

            <div className="my-jobs-filters">
                <label className="my-jobs-search"><i className="bi bi-search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs..." /></label>
                <select aria-label="Filter by service type" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
                    <option>All Service Types</option>{services.map((service) => <option key={service}>{service}</option>)}
                </select>
                <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option>All Status</option>{[...new Set(jobs.map((job) => job.status))].sort().map((status) => <option key={status}>{status}</option>)}
                </select>
                <div className="my-jobs-date-filter"><i className="bi bi-calendar-event" /><input aria-label="Start date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /><span>to</span><input aria-label="End date" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></div>
            </div>

            {error && <div className="my-jobs-error" role="alert">{error}</div>}
            <div className="my-jobs-table-wrap">
                <table className="my-jobs-table">
                    <thead><tr><th>#</th><th>Service Details</th><th>Customer</th><th>Date &amp; Time</th></tr></thead>
                    <tbody>{visibleJobs.map((job) => <Fragment key={job.id}><tr
                        className={`job-row-clickable${expandedJobId === job.id ? ' job-row-selected' : ''}`}
                        tabIndex={0}
                        aria-expanded={expandedJobId === job.id}
                        aria-controls={`job-expanded-${job.id}`}
                        aria-label={`Show location, status, and actions for ${job.service} booking ${job.requestNo}`}
                        onClick={() => setExpandedJobId((current) => current === job.id ? null : job.id)}
                        onKeyDown={(event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                setExpandedJobId((current) => current === job.id ? null : job.id);
                            }
                        }}
                    >
                        <td className="job-code">{job.requestNo}</td>
                        <td><div className="job-service-cell">{serviceImage(job.service) ? <img className="job-service-image" src={serviceImage(job.service)} alt="" /> : <span className="job-service-icon"><i className="bi bi-tools" /></span>}<div><strong>{job.service}</strong><small>{job.service}</small></div></div></td>
                        <td><div className="job-customer-cell">{job.customerPhoto ? <img src={job.customerPhoto} alt="" /> : <span className="job-customer-initial">{job.customerName.charAt(0).toUpperCase()}</span>}<div><strong>{job.customerName}</strong><small>{job.contact}</small></div></div></td>
                        <td><div className="job-datetime"><span><i className="bi bi-calendar3" />{job.date}</span><span><i className="bi bi-clock" />{job.time}</span></div></td>
                    </tr>
                    {expandedJobId === job.id && <tr className="job-expanded-row" id={`job-expanded-${job.id}`}>
                        <td colSpan="4">
                            <div className="job-expanded-details">
                                <div className="job-expanded-location"><small>Location</small><span className="job-location-cell"><i className="bi bi-geo-alt" />{job.location}</span></div>
                                <div className="job-expanded-status"><small>Status</small><span className={statusClass(job.status)}>{job.status === 'Accepted' || job.status === 'Matched' ? 'Upcoming' : job.status}</span></div>
                                <div className="job-expanded-actions"><small>Actions</small><div className="job-row-actions">
                                    {job.status === 'Pending' && <button type="button" className="job-accept-button" disabled={busyId === job.id} onClick={() => updateStatus(job, 'Accepted')}>Accept</button>}
                                    <button type="button" className="job-view-button" onClick={() => showDetails(job)}>View Details</button>
                                </div></div>
                            </div>
                        </td>
                    </tr>}
                    </Fragment>)}</tbody>
                </table>
                {visibleJobs.length === 0 && <div className="my-jobs-empty">No jobs match these filters.</div>}
                <footer className="my-jobs-pagination"><span>Showing {filteredJobs.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length} jobs</span><div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><i className="bi bi-chevron-left" /></button><strong>{page}</strong><button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}><i className="bi bi-chevron-right" /></button></div></footer>
            </div>

            {selectedJob && <div className="job-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null); }}>
                <section className="job-details-modal" role="dialog" aria-modal="true" aria-labelledby="job-details-title">
                    <header className="job-modal-header"><div><span>BOOKING</span><h2 id="job-details-title">{selectedJob.requestNo}</h2></div><button type="button" className="modal-close" aria-label="Close" onClick={() => setSelectedJob(null)}>×</button></header>
                    <div className="job-modal-body"><span className={statusClass(selectedJob.status)}>{selectedJob.status}</span>
                        <h3>{selectedJob.service}</h3><p>{selectedJob.description || 'No additional job details provided.'}</p>
                        <dl className="job-details-list"><div><dt>Customer</dt><dd>{selectedJob.customerName}</dd></div><div><dt>Contact</dt><dd>{selectedJob.contact}</dd></div><div><dt>Date and time</dt><dd>{selectedJob.date} · {selectedJob.time}</dd></div><div><dt>Location</dt><dd>{selectedJob.location}</dd></div></dl>
                    </div>
                    <footer className="job-modal-footer"><button type="button" className="btn btn-outline-success" onClick={() => setShowMessage(true)}>Message Customer</button>{selectedJob.status === 'Pending' ? <button type="button" className="btn btn-success" disabled={busyId === selectedJob.id} onClick={() => updateStatus(selectedJob, 'Accepted')}>Accept Request</button> : ['Accepted', 'On the Way', 'In Progress'].includes(selectedJob.status) && <button type="button" className="btn btn-success" disabled={busyId === selectedJob.id} onClick={() => updateStatus(selectedJob, selectedJob.status === 'Accepted' ? 'On the Way' : selectedJob.status === 'On the Way' ? 'In Progress' : 'Completed')}>{selectedJob.status === 'Accepted' ? 'Mark On the Way' : selectedJob.status === 'On the Way' ? 'Start Job' : 'Mark Completed'}</button>}</footer>
                </section>
            </div>}

            {showMessage && selectedJob && <div className="job-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMessage(false); }}>
                <section className="message-modal" role="dialog" aria-modal="true" aria-labelledby="job-message-title"><header className="message-modal-header"><h2 id="job-message-title">Message {selectedJob.customerName}</h2><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowMessage(false)}>×</button></header><div className="message-modal-body"><textarea className="form-control" rows="5" maxLength="1000" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." /></div><footer className="message-modal-footer"><button type="button" className="btn btn-light" onClick={() => setShowMessage(false)}>Cancel</button><button type="button" className="btn btn-success" disabled={!message.trim()} onClick={submitMessage}>Send Message</button></footer></section>
            </div>}
        </section>
    );
}

function Summary({ icon, value, label, tone }) {
    return <article className={`my-jobs-stat my-jobs-stat-${tone}`}><span className="my-jobs-stat-icon"><i className={`bi bi-${icon}`} /></span><div><strong>{value}</strong><small>{label}</small></div><i className="bi bi-chevron-right my-jobs-stat-arrow" /></article>;
}
