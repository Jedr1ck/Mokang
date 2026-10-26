import { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getAdminBookingAnalytics } from "../../services/api";
import "./AdminDashboard.css";

const EMPTY_ANALYTICS = {
    totalBookings: 0,
    peakSeason: { name: "—", bookings: 0 },
    peakMonth: { name: "—", bookings: 0 },
    peakQuarter: { name: "—", bookings: 0 },
    seasons: [],
    preferences: [],
    history: [],
    forecast: [],
    forecastAvailable: false,
    forecastMessage: "",
};

const formatCount = (count) => (
    Number.isInteger(count) ? count.toLocaleString() : count.toFixed(1)
);

function ReportsAnalytics() {
    const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getAdminBookingAnalytics()
            .then((data) => {
                if (active) setAnalytics(data);
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.message || "Unable to load booking analytics.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const forecastChart = useMemo(() => {
        const actual = analytics.history.slice(-9).map((item) => ({
            ...item,
            type: "actual",
        }));
        return [
            ...actual,
            ...analytics.forecast.map((item) => ({
                ...item,
                type: "forecast",
            })),
        ];
    }, [analytics.history, analytics.forecast]);

    const maxForecastCount = Math.max(
        1,
        ...forecastChart.map((item) => item.count)
    );
    const maxSeasonCount = Math.max(
        1,
        ...analytics.seasons.map((item) => item.bookings)
    );
    const maxPreferenceCount = Math.max(
        1,
        ...analytics.preferences.map((item) => item.bookings)
    );
    const preferences = analytics.preferences.slice(0, 6);

    return (
        <div className="reports-analytics-page booking-insights-page">
            <header className="reports-page-header">
                <div>
                    <span className="reports-section-label">BOOKING INSIGHTS</span>
                    <h2>Peak Season &amp; Preferences</h2>
                    <p>
                        Discover when homeowners schedule services, what they request,
                        and how booking demand may trend.
                    </p>
                </div>
                <span className="booking-insights-date-note">
                    Based on preferred service dates
                </span>
            </header>

            {error && (
                <div className="booking-insights-error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="booking-insights-state" role="status">
                    <span className="spinner-border text-success" aria-hidden="true"></span>
                    <span>Loading booking analytics...</span>
                </div>
            ) : !error ? (
                <>
                    <section className="booking-insights-summary">
                        <article className="booking-insights-kpi">
                            <span className="booking-insights-kpi-icon green">
                                <i className="bi bi-calendar2-check"></i>
                            </span>
                            <div>
                                <span>Total booking requests</span>
                                <strong>{analytics.totalBookings.toLocaleString()}</strong>
                            </div>
                        </article>
                        <article className="booking-insights-kpi">
                            <span className="booking-insights-kpi-icon orange">
                                <i className="bi bi-sun"></i>
                            </span>
                            <div>
                                <span>Peak season</span>
                                <strong>{analytics.peakSeason.name}</strong>
                                <small>{analytics.peakSeason.bookings.toLocaleString()} bookings</small>
                            </div>
                        </article>
                        <article className="booking-insights-kpi">
                            <span className="booking-insights-kpi-icon blue">
                                <i className="bi bi-grid"></i>
                            </span>
                            <div>
                                <span>Most requested service</span>
                                <strong>{preferences[0]?.name || "No data yet"}</strong>
                                {preferences[0] && (
                                    <small>{preferences[0].bookings.toLocaleString()} bookings</small>
                                )}
                            </div>
                        </article>
                    </section>

                    <section className="booking-insights-grid">
                        <article className="booking-insights-panel">
                            <div className="booking-insights-panel-heading">
                                <div>
                                    <span className="booking-insights-eyebrow">SEASONAL DEMAND</span>
                                    <h3>Peak Season</h3>
                                    <p>
                                        Bookings grouped by the month homeowners prefer service.
                                    </p>
                                </div>
                                <span className="booking-insights-panel-icon orange">
                                    <i className="bi bi-sun"></i>
                                </span>
                            </div>
                            {analytics.totalBookings ? (
                                <div className="booking-season-list">
                                    {analytics.seasons.map((season) => (
                                        <div className="booking-season-row" key={season.name}>
                                            <div className="booking-season-label">
                                                <span>{season.name}</span>
                                                <strong>{season.bookings.toLocaleString()}</strong>
                                            </div>
                                            <div
                                                className="booking-insights-track"
                                                role="img"
                                                aria-label={`${season.name}: ${season.bookings} bookings`}
                                            >
                                                <span
                                                    className="booking-insights-fill orange"
                                                    style={{ width: `${(season.bookings / maxSeasonCount) * 100}%` }}
                                                ></span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="booking-season-highlights">
                                        <span><i className="bi bi-calendar3"></i> Busiest month: <strong>{analytics.peakMonth.name}</strong></span>
                                        <span><i className="bi bi-bar-chart"></i> Busiest quarter: <strong>{analytics.peakQuarter.name}</strong></span>
                                    </div>
                                </div>
                            ) : (
                                <div className="booking-insights-empty">
                                    Booking season insights will appear when bookings have preferred dates.
                                </div>
                            )}
                        </article>

                        <article className="booking-insights-panel">
                            <div className="booking-insights-panel-heading">
                                <div>
                                    <span className="booking-insights-eyebrow">HOMEOWNER DEMAND</span>
                                    <h3>Service Preferences</h3>
                                    <p>Most requested service categories across booking requests.</p>
                                </div>
                                <span className="booking-insights-panel-icon green">
                                    <i className="bi bi-heart"></i>
                                </span>
                            </div>
                            {preferences.length ? (
                                <div className="booking-preference-list">
                                    {preferences.map((preference, index) => (
                                        <div className="booking-preference-row" key={preference.name}>
                                            <span className="booking-preference-rank">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <div className="booking-preference-main">
                                                <div className="booking-season-label">
                                                    <span>{preference.name}</span>
                                                    <strong>{preference.bookings.toLocaleString()}</strong>
                                                </div>
                                                <div
                                                    className="booking-insights-track"
                                                    role="img"
                                                    aria-label={`${preference.name}: ${preference.bookings} bookings`}
                                                >
                                                    <span
                                                        className="booking-insights-fill green"
                                                        style={{ width: `${(preference.bookings / maxPreferenceCount) * 100}%` }}
                                                    ></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="booking-insights-empty">
                                    Service preferences will appear when bookings are recorded.
                                </div>
                            )}
                        </article>

                        <article className="booking-insights-panel booking-forecast-panel">
                            <div className="booking-insights-panel-heading">
                                <div>
                                    <span className="booking-insights-eyebrow">DEMAND FORECAST</span>
                                    <h3>ARIMA Booking Trend</h3>
                                    <p>Monthly bookings with a three-month ARIMA(1,1,1) projection.</p>
                                </div>
                                <span className="booking-insights-panel-icon blue">
                                    <i className="bi bi-graph-up-arrow"></i>
                                </span>
                            </div>
                            {analytics.forecastAvailable ? (
                                <>
                                    <div className="booking-forecast-chart">
                                        {forecastChart.map((item) => (
                                            <div className="booking-forecast-column" key={`${item.type}-${item.year}-${item.month}`}>
                                                <span className="booking-forecast-value">
                                                    {formatCount(item.count)}
                                                </span>
                                                <div className="booking-forecast-bar-area">
                                                    <span
                                                        className={`booking-forecast-bar ${item.type}`}
                                                        style={{
                                                            height: `${Math.max((item.count / maxForecastCount) * 100, 4)}%`,
                                                        }}
                                                        title={`${item.label}: ${formatCount(item.count)} ${item.type === "forecast" ? "forecast bookings" : "bookings"}`}
                                                    ></span>
                                                </div>
                                                <span className="booking-forecast-month">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="booking-forecast-legend">
                                        <span><i className="actual"></i> Historical</span>
                                        <span><i className="forecast"></i> ARIMA forecast</span>
                                    </div>
                                </>
                            ) : (
                                <div className="booking-insights-empty booking-forecast-empty">
                                    <i className="bi bi-hourglass-split"></i>
                                    <strong>Forecast not available yet</strong>
                                    <span>{analytics.forecastMessage}</span>
                                </div>
                            )}
                        </article>
                    </section>
                </>
            ) : null}
        </div>
    );
}

export default ReportsAnalytics;
