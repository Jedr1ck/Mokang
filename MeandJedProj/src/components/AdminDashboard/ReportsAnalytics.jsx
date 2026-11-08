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
    monthlyBookingDistribution: [],
    bookingStatusDistribution: [],
    preferences: [],
    history: [],
    trainingHistory: [],
    weeklyBookingActivity: [],
    bookingDemandInsights: {
        totalBookings: 0,
        peakBookingDay: null,
        mostRequestedService: null,
        cancellationRate: null,
        cancelledBookings: 0,
        startDate: "",
        endDate: "",
        dateBasis: "scheduled_date",
    },
    forecast: [],
    sampleData: false,
    dataSourceLabel: "Recorded bookings",
    forecastAccuracy: {
        mae: null,
        rmse: null,
        mape: null,
        wape: null,
        backtestPeriods: 0,
        baseline: { mae: null, rmse: null, mape: null, wape: null },
        baselines: {
            "Last-period naive": { mae: null, rmse: null, wape: null },
            "Zero-booking baseline": { mae: null, rmse: null, wape: null },
            "Historical average baseline": { mae: null, rmse: null, wape: null },
        },
        bestBaselineMethod: null,
        bestBaseline: { mae: null, rmse: null, wape: null },
        comparisonBaselines: {
            "Last-period naive": { mae: null, rmse: null, wape: null },
            "Zero-booking baseline": { mae: null, rmse: null, wape: null },
            "Historical average baseline": { mae: null, rmse: null, wape: null },
        },
        comparisonBaselineMethod: null,
        comparisonBaseline: { mae: null, rmse: null, wape: null },
        sameValidationPeriods: 0,
        successfulArimaBacktestFolds: 0,
        failedArimaBacktestFolds: 0,
        peakSpikeMae: null,
        baselinePeakSpikeMae: null,
        arimaMaeImprovementPercent: null,
        validation: [],
    },
    frequency: "monthly",
    horizon: 3,
    historicalPeriodCount: 0,
    historyObservationCount: 0,
    verifiedPeriodCount: 0,
    periodsWithBookings: 0,
    periodsWithRecordedBookings: 0,
    validConsecutiveObservationCount: 0,
    zeroBookingPeriodCount: 0,
    missingPeriodCount: 0,
    undatedBookingCount: 0,
    historyBookingCount: 0,
    modelStatus: "insufficient_data",
    modelStatusLabel: "Insufficient Data",
    forecastMethod: null,
    selectedBaselineMethod: null,
    modelParameters: { p: 1, d: 1, q: 1 },
    trainingPeriodCount: 0,
    trainingPeriodStart: null,
    trainingPeriodEnd: null,
    startDate: "",
    endDate: "",
    coverageConfigured: false,
    coverageStartDate: null,
    modelTrainingMethod: "Rolling-origin, one-step-ahead validation",
    modelSelectionChecks: {
        minimumMaeImprovementPercent: 5,
        requiresRmseNoWorseThanBaseline: true,
        requiresSpikeMaeNoWorseThanBaseline: true,
        requiresNonNegativeFinitePredictions: true,
    },
    forecastPolicy: {
        baselineMinimumPeriods: 12,
        arimaInitialTrainingPeriods: 24,
        arimaMinimumValidationFolds: 3,
        arimaMinimumTotalPeriods: 27,
        arimaMinimumMaeImprovementPercent: 5,
        arimaMaximumWapePercent: 100,
        arimaTrainingFloorNote: "",
    },
    reliability: {
        level: "limited",
        label: "Limited historical data",
        description: "",
    },
    analyticsRefreshedAt: null,
    forecastAvailable: false,
    forecastMessage: "",
    accuracyInterpretation: "Accuracy has not been evaluated.",
};

const formatCount = (count) => (
    count == null
        ? "—"
        : Number.isInteger(count)
            ? count.toLocaleString()
            : count.toFixed(1)
);

const toLocalDateInputValue = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getDefaultDateRange = (selectedFrequency, monthlyPeriods = 36) => {
    const end = new Date();
    const start = new Date(end);
    if (selectedFrequency === "daily") {
        end.setDate(end.getDate() - 1);
        start.setDate(end.getDate() - 364);
    } else if (selectedFrequency === "weekly") {
        const daysSinceSunday = end.getDay() || 7;
        end.setDate(end.getDate() - daysSinceSunday);
        start.setDate(end.getDate() - (156 * 7 - 1));
    } else {
        end.setDate(1);
        end.setDate(0);
        start.setFullYear(end.getFullYear(), end.getMonth() - (monthlyPeriods - 1), 1);
    }
    return {
        startDate: toLocalDateInputValue(start),
        endDate: toLocalDateInputValue(end),
    };
};

function ReportsAnalytics() {
    const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [forecastHorizon, setForecastHorizon] = useState(3);
    const [frequency, setFrequency] = useState("monthly");
    const [useSampleData, setUseSampleData] = useState(false);
    const [dateRange, setDateRange] = useState(() => getDefaultDateRange("monthly"));

    useEffect(() => {
        let active = true;

        getAdminBookingAnalytics({
            frequency,
            horizon: String(forecastHorizon),
            sampleData: String(useSampleData),
            ...dateRange,
        })
            .then((data) => {
                if (active) {
                    setAnalytics(data);
                    setError("");
                }
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
    }, [frequency, forecastHorizon, useSampleData, dateRange]);

    const historicalForecastSeries = useMemo(
        () => analytics.trainingHistory,
        [analytics.trainingHistory]
    );
    const selectedForecast = useMemo(
        () => analytics.forecast,
        [analytics.forecast]
    );
    const weeklyActivityGeometry = useMemo(() => {
        const activity = analytics.weeklyBookingActivity || [];
        const chartLeft = 52;
        const chartRight = 785;
        const chartTop = 22;
        const chartBottom = 166;
        const chartMax = Math.max(
            1,
            ...activity.map((week) => week.count ?? 0)
        );
        const ticks = [...new Set([0, Math.ceil(chartMax / 2), chartMax])];
        const step = activity.length
            ? (chartRight - chartLeft) / activity.length
            : 0;
        const yFor = (count) => (
            chartBottom - (count / chartMax) * (chartBottom - chartTop)
        );

        return {
            chartBottom,
            gridLines: ticks.map((count) => ({
                count,
                y: yFor(count),
            })),
            points: activity.map((week, index) => ({
                ...week,
                x: chartLeft + step * (index + 0.5),
                y: week.count == null ? chartBottom : yFor(week.count),
                barWidth: Math.min(46, step * 0.52),
            })),
        };
    }, [analytics.weeklyBookingActivity]);
    const forecastChartGeometry = useMemo(() => {
        const chartItems = [...historicalForecastSeries, ...selectedForecast];
        const chartMax = Math.max(
            1,
            ...historicalForecastSeries.map((item) => item.count),
            ...selectedForecast.map((item) => item.upper ?? item.count)
        );
        const chartTop = 18;
        const chartBottom = 195;
        const chartLeft = 38;
        const chartRight = 785;
        const xFor = (index) => (
            chartItems.length > 1
                ? chartLeft + (index / (chartItems.length - 1)) * (chartRight - chartLeft)
                : chartLeft
        );
        const yFor = (count) => chartBottom - (count / chartMax) * (chartBottom - chartTop);
        const actualPoints = historicalForecastSeries.map((item, index) => ({
            ...item,
            x: xFor(index),
            y: yFor(item.count),
        }));
        const predictedPoints = selectedForecast.map((item, index) => ({
            ...item,
            x: xFor(historicalForecastSeries.length + index),
            y: yFor(item.count),
            upperY: yFor(item.upper ?? item.count),
            lowerY: yFor(item.lower ?? item.count),
        }));
        const actualPath = actualPoints
            .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
            .join(" ");
        const forecastPath = [
            ...actualPoints.slice(-1),
            ...predictedPoints,
        ]
            .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
            .join(" ");
        const confidenceArea = predictedPoints.length
            ? [
                ...predictedPoints.map((point) => `${point.x},${point.upperY}`),
                ...predictedPoints.slice().reverse().map((point) => `${point.x},${point.lowerY}`),
            ].join(" ")
            : "";

        return {
            actualPoints,
            actualPath,
            forecastPath,
            predictedPoints,
            confidenceArea,
            chartBottom,
            xFor,
            chartItems,
        };
    }, [historicalForecastSeries, selectedForecast]);
    const expectedNextMonth = selectedForecast[0]?.count ?? null;
    const expectedPeriodTotal = selectedForecast.reduce(
        (total, item) => total + item.count,
        0
    );
    const periodUnit = {
        daily: "day",
        weekly: "week",
        monthly: "month",
    }[frequency];
    const chartLabelInterval = Math.max(
        1,
        Math.ceil(forecastChartGeometry.chartItems.length / 12)
    );

    const downloadForecastReport = () => {
        const rows = [
            ["Forecast frequency", frequency],
            ["Forecast horizon", forecastHorizon],
            ["Data source", analytics.dataSourceLabel],
            ["Start date", analytics.startDate],
            ["End date", analytics.endDate],
            ["Reliability", analytics.reliability.label],
            ["Accuracy interpretation", analytics.accuracyInterpretation],
            ["Forecast method", analytics.forecastMethod || ""],
            ["Model status", analytics.modelStatusLabel],
            [
                analytics.forecastAvailable ? "Last forecast generated" : "Last analytics refresh",
                analytics.analyticsRefreshedAt || "",
            ],
            ["Training periods", analytics.trainingPeriodCount],
            ["Training range start", analytics.trainingPeriodStart || ""],
            ["Training range end", analytics.trainingPeriodEnd || ""],
            ["ARIMA candidate parameters", `(${analytics.modelParameters.p},${analytics.modelParameters.d},${analytics.modelParameters.q})`],
            ["Baseline method", analytics.selectedBaselineMethod || ""],
            ["Validation method", analytics.modelTrainingMethod],
            ["Coverage start date", analytics.coverageStartDate || "Not configured"],
            ["Baseline minimum verified periods", analytics.forecastPolicy.baselineMinimumPeriods],
            ["ARIMA minimum training periods", analytics.forecastPolicy.arimaInitialTrainingPeriods],
            ["ARIMA minimum successful validation folds", analytics.forecastPolicy.arimaMinimumValidationFolds],
            ["ARIMA minimum total periods", analytics.forecastPolicy.arimaMinimumTotalPeriods],
            ["ARIMA minimum MAE improvement percent", analytics.forecastPolicy.arimaMinimumMaeImprovementPercent],
            ["ARIMA maximum WAPE percent", analytics.forecastPolicy.arimaMaximumWapePercent],
            ["Consecutive verified periods", analytics.validConsecutiveObservationCount],
            ["Rolling-origin backtest periods", analytics.forecastAccuracy.arimaBacktestPeriods],
            ["ARIMA meaningful MAE improvement", analytics.forecastAccuracy.arimaMaeImprovementPercent ?? ""],
            ["ARIMA successful backtest folds", analytics.forecastAccuracy.successfulArimaBacktestFolds],
            ["ARIMA failed backtest folds", analytics.forecastAccuracy.failedArimaBacktestFolds],
            ["ARIMA MAE on booking spikes", analytics.forecastAccuracy.peakSpikeMae ?? ""],
            ["Baseline MAE on booking spikes", analytics.forecastAccuracy.baselinePeakSpikeMae ?? ""],
            ["ARIMA comparison baseline", analytics.forecastAccuracy.comparisonBaselineMethod || ""],
            ["ARIMA comparison baseline RMSE", analytics.forecastAccuracy.comparisonBaseline?.rmse ?? ""],
            ["Historical periods", analytics.historicalPeriodCount],
            [
                "Verified periods",
                `${analytics.verifiedPeriodCount} / ${analytics.historicalPeriodCount}`,
            ],
            ["Verified active periods with bookings", analytics.historyObservationCount],
            ["Total recorded bookings", analytics.historyBookingCount],
            ["Periods with recorded bookings", analytics.periodsWithRecordedBookings],
            ["Status", "Bookings", "Share"],
            ...analytics.bookingStatusDistribution.map((item) => [
                item.status,
                item.bookings,
                `${item.sharePercent}%`,
            ]),
            ["Month", "Bookings", "Share"],
            ...analytics.monthlyBookingDistribution.map((item) => [
                item.month,
                item.bookings,
                `${item.sharePercent}%`,
            ]),
            ["Zero-booking periods", analytics.zeroBookingPeriodCount],
            ["Missing periods", analytics.missingPeriodCount],
            ["Undated bookings", analytics.undatedBookingCount],
            ["Booking demand total", analytics.bookingDemandInsights.totalBookings],
            ["Booking demand peak day", analytics.bookingDemandInsights.peakBookingDay?.name || ""],
            ["Most requested service", analytics.bookingDemandInsights.mostRequestedService?.name || ""],
            ["Cancellation rate percent", analytics.bookingDemandInsights.cancellationRate ?? ""],
            ["Section", "Period", "Actual", "Forecast", "Lower 95%", "Upper 95%"],
            ...analytics.history.map((item) => [
                "Historical",
                item.label,
                item.count,
                "",
                "",
                "",
            ]),
            ...analytics.forecast.map((item) => [
                "Forecast",
                item.label,
                "",
                item.count,
                item.lower,
                item.upper,
            ]),
            [],
            ["Model", "MAE", "RMSE", "WAPE"],
            [
                "ARIMA(1,1,1)",
                analytics.forecastAccuracy.mae ?? "",
                analytics.forecastAccuracy.rmse ?? "",
                analytics.forecastAccuracy.wape ?? "",
            ],
            ...Object.entries(analytics.forecastAccuracy.baselines || {}).map(
                ([method, metrics]) => [
                    method,
                    metrics.mae ?? "",
                    metrics.rmse ?? "",
                    metrics.wape ?? "",
                ]
            ),
        ];
        const csv = rows
            .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
            .join("\r\n");
        const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = `booking-forecast-${frequency}-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const maxSeasonCount = Math.max(1, ...analytics.seasons.map((item) => item.bookings));
    const maxMonthCount = Math.max(
        1,
        ...analytics.monthlyBookingDistribution.map((item) => item.bookings)
    );
    const maxPreferenceCount = Math.max(
        1,
        ...analytics.preferences.map((item) => item.bookings)
    );
    const preferences = analytics.preferences.slice(0, 6);
    const periodName = {
        daily: "day",
        weekly: "week",
        monthly: "month",
    }[frequency];

    return (
        <div className="reports-analytics-page booking-insights-page !space-y-6 [&_.booking-forecast-accuracy]:!text-xs [&_.booking-forecast-validation-table]:!text-xs [&_.booking-forecast-section-title]:!text-base [&_.booking-forecast-model-information]:!text-xs">
            <header className="reports-page-header !rounded-3xl !border !border-slate-200 !bg-white !p-6 !shadow-sm md:!p-8">
                <div>
                    <span className="reports-section-label !font-semibold !tracking-[0.18em] !text-orange-300">BOOKING INSIGHTS</span>
                    <h2 className="!mt-2 !text-2xl !font-bold !tracking-tight !text-white md:!text-3xl">Peak Season &amp; Preferences</h2>
                    <p className="!mt-2 !max-w-3xl !text-sm !leading-6 !text-slate-300 md:!text-base">
                        Discover when homeowners schedule services, what they request,
                        and how booking demand may trend.
                    </p>
                </div>
                <span className="booking-insights-date-note !rounded-full !bg-slate-50 !px-4 !py-2 !text-xs !font-medium !text-slate-600">
                    {analytics.forecastAvailable ? "Last forecast generated" : "Last analytics refresh"}{" "}
                    {analytics.analyticsRefreshedAt
                        ? new Date(analytics.analyticsRefreshedAt).toLocaleString()
                        : "—"}
                </span>
            </header>
            <p className="booking-insights-scope-note !rounded-2xl !border !border-slate-200 !bg-slate-100/70 !px-5 !py-4 !text-xs !leading-6 !text-slate-600">
                Date-based insights use the selected complete-period range ({analytics.startDate || dateRange.startDate} to {analytics.endDate || dateRange.endDate}), include bookings of all statuses, and group bookings by scheduled appointment date. Bookings without a scheduled date are reported separately and excluded.
            </p>

            {(useSampleData || analytics.sampleData) && (
                <div className="booking-coverage-range-warning" role="status">
                    <i className="bi bi-info-circle"></i>
                    <span>
                        Demo mode is on. All displayed booking insights and forecasts use fixed synthetic sample data, not real bookings.
                    </span>
                </div>
            )}

            {error && (
                <div className="booking-insights-error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="booking-insights-state" role="status">
                    <span className="spinner-border text-success" aria-hidden="true"></span>
                    <span>Refreshing booking analytics...</span>
                </div>
            ) : !error ? (
                <>
                    <section className="booking-insights-summary !gap-4">
                        <article className="booking-insights-kpi !min-h-[138px] !rounded-2xl !border-slate-200 !p-5 !shadow-md !shadow-slate-900/5">
                            <span className="booking-insights-kpi-icon green">
                                <i className="bi bi-calendar2-check"></i>
                            </span>
                            <div>
                                <span className="!text-xs">
                                    {analytics.sampleData ? "Sample booking requests" : "Booking requests in selected range"}
                                </span>
                                <strong className="!text-2xl">{analytics.totalBookings.toLocaleString()}</strong>
                                <small>All statuses · scheduled dates</small>
                            </div>
                        </article>
                        <article className="booking-insights-kpi !min-h-[138px] !rounded-2xl !border-slate-200 !p-5 !shadow-md !shadow-slate-900/5">
                            <span className="booking-insights-kpi-icon orange">
                                <i className="bi bi-sun"></i>
                            </span>
                            <div>
                                <span className="!text-xs">Peak season</span>
                                <strong className="!text-2xl">{analytics.peakSeason.name}</strong>
                                <small>{analytics.peakSeason.bookings.toLocaleString()} bookings</small>
                                <small>{analytics.peakSeason.months.join(", ")}</small>
                            </div>
                        </article>
                        <article className="booking-insights-kpi !min-h-[138px] !rounded-2xl !border-slate-200 !p-5 !shadow-md !shadow-slate-900/5">
                            <span className="booking-insights-kpi-icon blue">
                                <i className="bi bi-grid"></i>
                            </span>
                            <div>
                                <span className="!text-xs">Most requested service</span>
                                <strong className="!text-2xl">{preferences[0]?.name || "No data yet"}</strong>
                                {preferences[0] && (
                                    <small>{preferences[0].bookings.toLocaleString()} bookings</small>
                                )}
                            </div>
                        </article>
                        <article className="booking-insights-kpi !min-h-[138px] !rounded-2xl !border-slate-200 !p-5 !shadow-md !shadow-slate-900/5">
                            <span className="booking-insights-kpi-icon blue">
                                <i className="bi bi-database-check"></i>
                            </span>
                            <div>
                                <span className="!text-xs">
                                    {analytics.sampleData ? "Sample bookings" : "Total recorded bookings"}
                                </span>
                                <strong className="!text-2xl">{analytics.historyBookingCount.toLocaleString()}</strong>
                                <small>{analytics.sampleData ? "Synthetic scheduled dates" : "All statuses · scheduled dates"}</small>
                                <small>
                                    {analytics.periodsWithRecordedBookings} {periodName}s with {analytics.sampleData ? "sample" : "recorded"} bookings
                                </small>
                                <small>
                                    {analytics.sampleData ? "Sample" : "Verified"} {periodName}s: {analytics.verifiedPeriodCount} / {analytics.historicalPeriodCount}
                                </small>
                                <small>
                                    {analytics.historyObservationCount} {analytics.sampleData ? "sample" : "verified active"} {periodName}s with bookings
                                </small>
                            </div>
                        </article>
                    </section>

                    <section className="booking-insights-grid !gap-5">
                        <article className="booking-insights-panel !rounded-3xl !border !border-slate-200 !bg-slate-50 !p-0 !shadow-md !shadow-slate-900/5">
                            <div className="booking-insights-panel-heading !mb-0 !border-slate-100 !px-6 !pb-5 !pt-6 md:!px-8 md:!pt-8">
                                <div>
                                    <span className="booking-insights-eyebrow">SEASONAL DEMAND</span>
                                    <h3 className="!text-lg">Peak Season</h3>
                                    <p className="!text-xs">
                                        All booking statuses grouped by scheduled appointment month in the selected range.
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
                                                <span>
                                                    {season.name}
                                                    <small className="booking-season-months">
                                                        {season.months.join(", ")}
                                                    </small>
                                                </span>
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
                                    <small className="booking-season-method-note">
                                        Current mapping: Dry Season is December–May and Rainy Season is June–November. Review these months for your operating region.
                                    </small>
                                    <div className="booking-season-highlights">
                                        <span><i className="bi bi-calendar3"></i> Busiest month: <strong>{analytics.peakMonth.name}</strong></span>
                                        <span><i className="bi bi-bar-chart"></i> Busiest quarter: <strong>{analytics.peakQuarter.name}</strong></span>
                                    </div>
                                    <div className="booking-monthly-distribution">
                                        <div className="booking-monthly-distribution-heading">
                                            <h4>Monthly booking comparison</h4>
                                            <span>Selected date range</span>
                                        </div>
                                        <div className="booking-monthly-distribution-grid">
                                            {analytics.monthlyBookingDistribution.map((item) => (
                                                <div className="booking-monthly-distribution-row" key={item.month}>
                                                    <span>{item.month.slice(0, 3)}</span>
                                                    <div
                                                        className="booking-monthly-distribution-track"
                                                        role="img"
                                                        aria-label={`${item.month}: ${formatCount(item.bookings)} bookings`}
                                                    >
                                                        <span
                                                            style={{
                                                                width: `${(item.bookings / maxMonthCount) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <strong>{formatCount(item.bookings)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="booking-insights-empty">
                                    Booking season insights will appear when bookings have preferred dates.
                                </div>
                            )}
                        </article>

                        <article className="booking-insights-panel !rounded-3xl !border !border-slate-200 !bg-slate-50 !p-0 !shadow-md !shadow-slate-900/5">
                            <div className="booking-insights-panel-heading !mb-0 !border-slate-100 !px-6 !pb-5 !pt-6 md:!px-8 md:!pt-8">
                                <div>
                                    <span className="booking-insights-eyebrow">HOMEOWNER DEMAND</span>
                                    <h3 className="!text-lg">Service Preferences</h3>
                                    <p className="!text-xs">Most requested services in the selected date range.</p>
                                </div>
                                <span className="booking-insights-panel-icon green">
                                    <i className="bi bi-heart"></i>
                                </span>
                            </div>
                            {preferences.length ? (
                                <>
                                    <div className="booking-preference-list">
                                        {preferences.map((preference, index) => (
                                            <div className="booking-preference-row" key={preference.name}>
                                                <span className="booking-preference-rank">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <div className="booking-preference-main">
                                                    <div className="booking-season-label">
                                                        <span>{preference.name}</span>
                                                        <strong>
                                                            {preference.bookings.toLocaleString()}
                                                            <small className="booking-preference-share">
                                                                {preference.sharePercent}% share
                                                            </small>
                                                        </strong>
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
                                    <small className="booking-preference-method-note">
                                        Service categories are grouped by their configured category name (case and spacing normalized). Similar names are not automatically merged.
                                    </small>
                                </>
                            ) : (
                                <div className="booking-insights-empty">
                                    Service preferences will appear when bookings are recorded.
                                </div>
                            )}
                        </article>

                        <article className="booking-insights-panel booking-forecast-panel !rounded-3xl !border !border-slate-200 !bg-slate-50 !p-0 !shadow-md !shadow-slate-900/5">
                            <div className="booking-insights-panel-heading !mb-0 !border-slate-100 !px-6 !pb-5 !pt-6 md:!px-8 md:!pt-8">
                                <div>
                                    <span className="booking-insights-eyebrow">DEMAND FORECAST</span>
                                    <h3 className="!text-lg">Booking Demand Forecast</h3>
                                    <p className="!text-xs">
                                        Actual and projected bookings with an approximate 95% prediction interval.
                                    </p>
                                </div>
                                <span className="booking-insights-panel-icon blue">
                                    <i className="bi bi-graph-up-arrow"></i>
                                </span>
                            </div>
                            <div className="booking-forecast-toolbar">
                                <div className="booking-forecast-controls">
                                    <label htmlFor="booking-forecast-frequency">Period</label>
                                    <select
                                        id="booking-forecast-frequency"
                                        value={frequency}
                                        onChange={(event) => {
                                            setLoading(true);
                                            const selectedFrequency = event.target.value;
                                            setFrequency(selectedFrequency);
                                            setDateRange(getDefaultDateRange(selectedFrequency));
                                        }}
                                    >
                                        <option value="daily" disabled={useSampleData}>Daily</option>
                                        <option value="weekly" disabled={useSampleData}>Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <label className="flex items-center gap-2 !text-xs !font-medium !text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={useSampleData}
                                            onChange={(event) => {
                                                const enabled = event.target.checked;
                                                setLoading(true);
                                                setUseSampleData(enabled);
                                                setFrequency("monthly");
                                                setDateRange(
                                                    getDefaultDateRange("monthly", enabled ? 60 : 36)
                                                );
                                            }}
                                        />
                                        Use demo data
                                    </label>
                                    <label htmlFor="booking-forecast-start-date">From</label>
                                    <input
                                        id="booking-forecast-start-date"
                                        type="date"
                                        value={dateRange.startDate}
                                        max={dateRange.endDate}
                                        onChange={(event) => {
                                            if (!event.target.value) return;
                                            setLoading(true);
                                            setDateRange((current) => ({
                                                ...current,
                                                startDate: event.target.value,
                                            }));
                                        }}
                                    />
                                    <label htmlFor="booking-forecast-end-date">To</label>
                                    <input
                                        id="booking-forecast-end-date"
                                        type="date"
                                        value={dateRange.endDate}
                                        min={dateRange.startDate}
                                        max={toLocalDateInputValue(new Date())}
                                        onChange={(event) => {
                                            if (!event.target.value) return;
                                            setLoading(true);
                                            setDateRange((current) => ({
                                                ...current,
                                                endDate: event.target.value,
                                            }));
                                        }}
                                    />
                                    <label htmlFor="booking-forecast-horizon">Forecast</label>
                                    <select
                                        id="booking-forecast-horizon"
                                        value={forecastHorizon}
                                        onChange={(event) => {
                                            setLoading(true);
                                            setForecastHorizon(Number(event.target.value));
                                        }}
                                    >
                                        <option value={3}>Next 3 periods</option>
                                        <option value={6}>Next 6 periods</option>
                                        <option value={12}>Next 12 periods</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="booking-forecast-download"
                                    onClick={downloadForecastReport}
                                >
                                    <i className="bi bi-download"></i>
                                    Download report
                                </button>
                            </div>
                            <div className="booking-forecast-data-availability">
                                <strong>Data Quality &amp; Availability</strong>
                                <div>
                                    <span>Historical periods <b>{analytics.historicalPeriodCount}</b></span>
                                    <span>{analytics.sampleData ? "Sample periods" : "Verified periods"} <b>{analytics.verifiedPeriodCount} / {analytics.historicalPeriodCount}</b></span>
                                    <span>Periods with {analytics.sampleData ? "sample" : "recorded"} bookings <b>{analytics.periodsWithRecordedBookings}</b></span>
                                    <span>{analytics.sampleData ? "Sample active periods" : "Covered active periods"} <b>{analytics.periodsWithBookings}</b></span>
                                    <span>Consecutive {analytics.sampleData ? "sample" : "verified"} periods <b>{analytics.validConsecutiveObservationCount}</b></span>
                                    <span>Confirmed zero-booking periods <b>{analytics.zeroBookingPeriodCount}</b></span>
                                    <span>Missing / unverified periods <b>{analytics.missingPeriodCount}</b></span>
                                    {analytics.undatedBookingCount > 0 && (
                                        <span>Bookings without a preferred date <b>{analytics.undatedBookingCount}</b></span>
                                    )}
                                </div>
                                <small>
                                    {analytics.sampleData
                                        ? `Sample range: ${analytics.startDate} to ${analytics.endDate}. Periods and counts are synthetic and do not represent verified booking coverage.`
                                        : `Selected range: ${analytics.startDate} to ${analytics.endDate}; only complete periods are counted. Booking totals include all statuses and use scheduled appointment dates; undated bookings are excluded and shown separately. Complete coverage start: ${analytics.coverageStartDate || "not configured"}. Empty periods count as zero only after the configured coverage date; earlier periods remain unverified.`}
                                </small>
                                {analytics.coverageStartDate
                                    && analytics.endDate
                                    && analytics.coverageStartDate > analytics.endDate && (
                                    <div className="booking-coverage-range-warning" role="status">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        <span>
                                            The selected historical range ends before verified coverage begins. No periods in this range can be verified; adjust the date range or confirm the actual coverage start date in System Settings. Do not change the date only to enable forecasting.
                                        </span>
                                    </div>
                                )}
                            </div>
                            <section className="booking-demand-insights" aria-labelledby="booking-demand-insights-title">
                                <div className="booking-demand-insights-header">
                                    <div>
                                        <h4 id="booking-demand-insights-title">Booking Demand Insights</h4>
                                        <p>
                                            Activity scheduled from {analytics.bookingDemandInsights.startDate || analytics.startDate} to {analytics.bookingDemandInsights.endDate || analytics.endDate}.
                                        </p>
                                    </div>
                                    <span>Scheduled date</span>
                                </div>
                                <div className="booking-demand-insights-grid">
                                    <article>
                                        <span>Total bookings</span>
                                        <strong>{formatCount(analytics.bookingDemandInsights.totalBookings)}</strong>
                                        <small>All statuses in selected date range</small>
                                    </article>
                                    <article>
                                        <span>Peak booking day</span>
                                        <strong>{analytics.bookingDemandInsights.peakBookingDay?.name || "No data"}</strong>
                                        <small>
                                            {analytics.bookingDemandInsights.peakBookingDay
                                                ? `${formatCount(analytics.bookingDemandInsights.peakBookingDay.bookings)} bookings scheduled`
                                                : "No dated bookings in this range"}
                                        </small>
                                    </article>
                                    <article>
                                        <span>Most requested service</span>
                                        <strong>{analytics.bookingDemandInsights.mostRequestedService?.name || "No data"}</strong>
                                        <small>
                                            {analytics.bookingDemandInsights.mostRequestedService
                                                ? `${formatCount(analytics.bookingDemandInsights.mostRequestedService.bookings)} bookings`
                                                : "No dated bookings in this range"}
                                        </small>
                                    </article>
                                    <article>
                                        <span>Cancellation rate</span>
                                        <strong>
                                            {analytics.bookingDemandInsights.cancellationRate == null
                                                ? "N/A"
                                                : `${formatCount(analytics.bookingDemandInsights.cancellationRate)}%`}
                                        </strong>
                                        <small>
                                            {formatCount(analytics.bookingDemandInsights.cancelledBookings)} cancelled or rejected bookings
                                        </small>
                                    </article>
                                </div>
                                <div className="booking-status-distribution">
                                    <div className="booking-status-distribution-heading">
                                        <h5>Booking status distribution</h5>
                                        <span>All statuses · selected date range</span>
                                    </div>
                                    {analytics.bookingDemandInsights.totalBookings > 0 ? (
                                        <div className="booking-status-distribution-list">
                                            {analytics.bookingStatusDistribution.map((item) => (
                                                <div className="booking-status-distribution-row" key={item.status}>
                                                    <span>{item.status}</span>
                                                    <div
                                                        className="booking-status-distribution-track"
                                                        role="img"
                                                        aria-label={`${item.status}: ${formatCount(item.bookings)} bookings, ${item.sharePercent}%`}
                                                    >
                                                        <span
                                                            className={`status-${item.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                                            style={{ width: `${item.sharePercent}%` }}
                                                        />
                                                    </div>
                                                    <strong>{formatCount(item.bookings)}</strong>
                                                    <small>{item.sharePercent}%</small>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="booking-status-distribution-empty">No dated bookings in this range.</p>
                                    )}
                                </div>
                                <small className="booking-demand-insights-note">
                                    Based on scheduled appointment dates. Cancellation rate includes Cancelled and Rejected statuses.
                                </small>
                            </section>
                            <section className="booking-weekly-activity" aria-labelledby="booking-weekly-activity-title">
                                <div className="booking-weekly-activity-header">
                                    <div>
                                        <h4 id="booking-weekly-activity-title">Recent Weekly Booking Activity</h4>
                                        <p>Last eight complete weeks, independent of the selected forecast period.</p>
                                    </div>
                                    <span>Weekly</span>
                                </div>
                                <svg
                                    className="booking-weekly-activity-svg !h-[230px]"
                                    viewBox="0 0 800 205"
                                    role="img"
                                    aria-label="Weekly appointment counts for the last eight complete weeks"
                                    preserveAspectRatio="none"
                                >
                                    {weeklyActivityGeometry.gridLines.map((line) => (
                                        <g key={`weekly-grid-${line.count}`}>
                                            <line
                                                x1="52"
                                                y1={line.y}
                                                x2="785"
                                                y2={line.y}
                                                className="booking-weekly-activity-gridline"
                                            />
                                            <text
                                                x="42"
                                                y={line.y + 3}
                                                textAnchor="end"
                                                className="booking-weekly-activity-axis-label"
                                            >
                                                {formatCount(line.count)}
                                            </text>
                                        </g>
                                    ))}
                                    <line
                                        x1="52"
                                        y1={weeklyActivityGeometry.chartBottom}
                                        x2="785"
                                        y2={weeklyActivityGeometry.chartBottom}
                                        className="booking-weekly-activity-axis"
                                    />
                                    {weeklyActivityGeometry.points.map((week) => (
                                        <g key={week.date}>
                                            {week.count == null ? (
                                                <rect
                                                    x={week.x - 12}
                                                    y={weeklyActivityGeometry.chartBottom - 12}
                                                    width="24"
                                                    height="12"
                                                    rx="3"
                                                    className="booking-weekly-activity-unverified"
                                                >
                                                    <title>{`${week.rangeLabel}: period is not verified`}</title>
                                                </rect>
                                            ) : week.count === 0 ? (
                                                <circle
                                                    cx={week.x}
                                                    cy={weeklyActivityGeometry.chartBottom - 2}
                                                    r="3"
                                                    className="booking-weekly-activity-zero"
                                                >
                                                    <title>{`${week.rangeLabel}: 0 confirmed bookings`}</title>
                                                </circle>
                                            ) : (
                                                <rect
                                                    x={week.x - week.barWidth / 2}
                                                    y={week.y}
                                                    width={week.barWidth}
                                                    height={weeklyActivityGeometry.chartBottom - week.y}
                                                    rx="8"
                                                    className={`booking-weekly-activity-bar${week.verified ? "" : " unverified"}`}
                                                >
                                                    <title>{`${week.rangeLabel}: ${formatCount(week.count)} recorded bookings${week.verified ? "" : "; coverage is not verified"}`}</title>
                                                </rect>
                                            )}
                                            <text
                                                x={week.x}
                                                y="187"
                                                textAnchor="middle"
                                                className="booking-weekly-activity-week-label"
                                            >
                                                {week.rangeLabel}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                                <p className="booking-weekly-activity-note">
                                    Recorded bookings are shown even when coverage is unverified. Zero is shown only for verified weeks; unverified counts may be incomplete.
                                </p>
                            </section>
                            <h4 className="booking-forecast-section-title">Forecast Status</h4>
                            <div className={`booking-forecast-model-status ${analytics.modelStatus}`}>
                                <span className="booking-forecast-status-indicator" aria-hidden="true"></span>
                                <strong>{analytics.modelStatusLabel}</strong>
                                {analytics.forecastMethod && (
                                    <span>Method: {analytics.forecastMethod}</span>
                                )}
                            </div>
                            <div className={`booking-forecast-reliability ${analytics.reliability.level}`}>
                                <i className="bi bi-info-circle"></i>
                                <span>
                                    <strong>{analytics.reliability.label}</strong>
                                    <small>{analytics.reliability.description}</small>
                                </span>
                            </div>
                            <div className="booking-forecast-policy">
                                <strong>Current forecast eligibility policy</strong>
                                <span>
                                    Baselines require {analytics.forecastPolicy.baselineMinimumPeriods} consecutive verified periods. ARIMA requires {analytics.forecastPolicy.arimaInitialTrainingPeriods} training periods plus {analytics.forecastPolicy.arimaMinimumValidationFolds} successful validation folds ({analytics.forecastPolicy.arimaMinimumTotalPeriods} total), at least {formatCount(analytics.forecastPolicy.arimaMinimumMaeImprovementPercent)}% lower MAE, and WAPE below {formatCount(analytics.forecastPolicy.arimaMaximumWapePercent)}%, with no worse RMSE or spike-period error.
                                </span>
                                <small>
                                    These are configurable backend policies, not universal ARIMA requirements. {analytics.forecastPolicy.arimaTrainingFloorNote}
                                </small>
                            </div>
                            {analytics.forecastAvailable ? (
                                <>
                                    <div className="booking-forecast-summary">
                                        <article>
                                            <span>Expected next {periodUnit}</span>
                                            <strong className="!text-xl">{formatCount(expectedNextMonth)}</strong>
                                            <small>
                                                {selectedForecast[0]
                                                    ? `Approx. ${formatCount(selectedForecast[0].lower)}–${formatCount(selectedForecast[0].upper)} bookings`
                                                    : "Predicted bookings"}
                                            </small>
                                        </article>
                                        <article>
                                            <span>Forecast period</span>
                                            <strong className="!text-xl">{forecastHorizon} {periodUnit}{forecastHorizon === 1 ? "" : "s"}</strong>
                                            <small>{formatCount(expectedPeriodTotal)} expected bookings in total</small>
                                        </article>
                                        <article>
                                            <span>Model</span>
                                            <strong className="!text-xl">{analytics.forecastMethod}</strong>
                                            <small>Approx. 95% prediction interval</small>
                                        </article>
                                    </div>

                                    <div className="booking-forecast-chart !h-[280px]">
                                        <h4 className="booking-forecast-section-title">
                                            ARIMA Forecast Chart · {analytics.forecastMethod}
                                        </h4>
                                        <svg
                                            className="booking-forecast-svg"
                                            viewBox="0 0 800 240"
                                            role="img"
                                            aria-label={`Historical ${frequency} bookings and ${analytics.forecastMethod} forecast with 95 percent prediction interval`}
                                            preserveAspectRatio="none"
                                        >
                                            <line x1="38" y1="195" x2="785" y2="195" className="booking-forecast-axis" />
                                            <line x1="38" y1="106" x2="785" y2="106" className="booking-forecast-gridline" />
                                            {forecastChartGeometry.confidenceArea && (
                                                <polygon
                                                    points={forecastChartGeometry.confidenceArea}
                                                    className="booking-forecast-confidence-area"
                                                />
                                            )}
                                            <path
                                                d={forecastChartGeometry.actualPath}
                                                className="booking-forecast-line actual"
                                            />
                                            <path
                                                d={forecastChartGeometry.forecastPath}
                                                className="booking-forecast-line forecast"
                                            />
                                            {forecastChartGeometry.actualPoints.map((point) => (
                                                <circle
                                                    key={`actual-${point.date}`}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r="3"
                                                    className="booking-forecast-point actual"
                                                >
                                                    <title>{`${point.label}: ${formatCount(point.count)} historical bookings`}</title>
                                                </circle>
                                            ))}
                                            {forecastChartGeometry.predictedPoints.map((point) => (
                                                <circle
                                                    key={`forecast-${point.date}`}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r="3"
                                                    className="booking-forecast-point forecast"
                                                >
                                                    <title>{`${point.label}: ${formatCount(point.count)} forecast bookings (${formatCount(point.lower)}–${formatCount(point.upper)} interval)`}</title>
                                                </circle>
                                            ))}
                                            {forecastChartGeometry.chartItems.map((item, index) => (
                                                (index % chartLabelInterval === 0
                                                    || index === forecastChartGeometry.chartItems.length - 1) && (
                                                    <text
                                                        key={`label-${item.year}-${item.month}`}
                                                        x={forecastChartGeometry.xFor(index)}
                                                        y="222"
                                                        textAnchor="middle"
                                                        className="booking-forecast-axis-label"
                                                    >
                                                        {item.label}
                                                    </text>
                                                )
                                            ))}
                                        </svg>
                                    </div>
                                    <div className="booking-forecast-legend">
                                        <span><i className="actual"></i> Historical bookings</span>
                                        <span><i className="forecast"></i> Forecast</span>
                                        <span><i className="confidence"></i> Approx. 95% prediction interval</span>
                                    </div>
                                </>
                            ) : (
                                <div className="booking-insights-empty booking-forecast-empty">
                                    <i className="bi bi-hourglass-split"></i>
                                    <strong>{analytics.modelStatusLabel}</strong>
                                    <span>{analytics.forecastMessage}</span>
                                </div>
                            )}
                            <h4 className="booking-forecast-section-title">Forecast Accuracy</h4>
                            <div className="booking-forecast-accuracy">
                                <div>
                                    <strong>
                                        Rolling-origin backtest · {analytics.forecastAccuracy.backtestPeriods} baseline folds
                                        ({analytics.forecastAccuracy.successfulArimaBacktestFolds} successful ARIMA folds, {analytics.forecastAccuracy.failedArimaBacktestFolds} failed)
                                    </strong>
                                    <span>
                                        Comparisons use identical successful holdout folds. The current policy requires at least {formatCount(analytics.forecastPolicy.arimaMinimumMaeImprovementPercent)}% lower MAE, WAPE below {formatCount(analytics.forecastPolicy.arimaMaximumWapePercent)}%, no-worse RMSE, and no-worse error on booking spikes.
                                    </span>
                                </div>
                                <span>ARIMA MAE <strong>{analytics.forecastAccuracy.mae == null ? "—" : formatCount(analytics.forecastAccuracy.mae)}</strong></span>
                                <span>ARIMA RMSE <strong>{analytics.forecastAccuracy.rmse == null ? "—" : formatCount(analytics.forecastAccuracy.rmse)}</strong></span>
                                <span>ARIMA WAPE <strong>{analytics.forecastAccuracy.wape == null ? "N/A" : `${formatCount(analytics.forecastAccuracy.wape)}%`}</strong></span>
                                <span>ARIMA spike MAE <strong>{formatCount(analytics.forecastAccuracy.peakSpikeMae)}</strong></span>
                                <span>{analytics.forecastAccuracy.comparisonBaselineMethod || "Comparison baseline"} RMSE <strong>{formatCount(analytics.forecastAccuracy.comparisonBaseline?.rmse)}</strong></span>
                                <span>Baseline spike MAE <strong>{formatCount(analytics.forecastAccuracy.baselinePeakSpikeMae)}</strong></span>
                                <small className={
                                    analytics.forecastAccuracy.wape >= 100
                                        ? "poor"
                                        : analytics.forecastAccuracy.wape >= 50
                                            ? "caution"
                                            : ""
                                }>
                                    {analytics.accuracyInterpretation}{" "}
                                    WAPE = total absolute error divided by total actual bookings; it is unavailable when all actual values are zero.
                                </small>
                            </div>
                            <div className="booking-forecast-validation">
                                <div className="booking-forecast-validation-heading">
                                    <strong>Comparison on identical ARIMA holdout folds</strong>
                                    <span>{analytics.forecastAccuracy.sameValidationPeriods} shared successful folds</span>
                                </div>
                                <div className="booking-forecast-validation-table-wrapper">
                                    <table className="booking-forecast-validation-table">
                                        <thead>
                                            <tr>
                                                <th>Model</th>
                                                <th>MAE</th>
                                                <th>RMSE</th>
                                                <th>WAPE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>ARIMA(1,1,1)</td>
                                                <td>{formatCount(analytics.forecastAccuracy.mae)}</td>
                                                <td>{formatCount(analytics.forecastAccuracy.rmse)}</td>
                                                <td>{analytics.forecastAccuracy.wape == null ? "N/A" : `${formatCount(analytics.forecastAccuracy.wape)}%`}</td>
                                            </tr>
                                            {Object.entries(analytics.forecastAccuracy.comparisonBaselines || {}).map(([method, metrics]) => (
                                                <tr key={method}>
                                                    <td>{method}{analytics.forecastAccuracy.comparisonBaselineMethod === method ? " (best comparison)" : ""}</td>
                                                    <td>{formatCount(metrics.mae)}</td>
                                                    <td>{formatCount(metrics.rmse)}</td>
                                                    <td>{metrics.wape == null ? "N/A" : `${formatCount(metrics.wape)}%`}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {analytics.forecastAccuracy.validation.length > 0 && (
                                <>
                                    <div className="booking-forecast-validation">
                                        <div className="booking-forecast-validation-heading">
                                            <strong>Rolling-origin validation details</strong>
                                            <span>
                                                {analytics.forecastAccuracy.successfulArimaBacktestFolds
                                                    ? "ARIMA and baselines use the same holdout windows"
                                                    : "Baseline holdouts shown; ARIMA requires 24 training periods per check"}
                                            </span>
                                        </div>
                                        <div className="booking-forecast-validation-table-wrapper">
                                            <table className="booking-forecast-validation-table">
                                                <thead>
                                                    <tr>
                                                        <th>Period</th>
                                                        <th>Actual</th>
                                                        <th>ARIMA</th>
                                                        <th>Best baseline</th>
                                                        <th>Baseline method</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analytics.forecastAccuracy.validation
                                                        .filter((item) => (
                                                            analytics.forecastAccuracy.successfulArimaBacktestFolds === 0
                                                            || item.arimaFitSucceeded
                                                        ))
                                                        .map((item) => (
                                                        <tr key={item.label}>
                                                            <td>{item.label}</td>
                                                            <td>{formatCount(item.actual)}</td>
                                                            <td>{formatCount(item.predicted)}</td>
                                                            <td>{formatCount(item.comparisonBaselinePredicted ?? item.selectedBaselinePredicted)}</td>
                                                            <td>{analytics.forecastAccuracy.comparisonBaselineMethod || analytics.forecastAccuracy.bestBaselineMethod || "—"}</td>
                                                        </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                            <h4 className="booking-forecast-section-title">Model Information</h4>
                            <div className="booking-forecast-model-information">
                                <span>
                                    Selected method
                                    <strong>{analytics.forecastMethod || "No forecast generated"}</strong>
                                </span>
                                <span>
                                    Baseline method
                                    <strong>{analytics.selectedBaselineMethod || "Not evaluated"}</strong>
                                </span>
                                <span>
                                    ARIMA candidate parameters
                                    <strong>({analytics.modelParameters.p},{analytics.modelParameters.d},{analytics.modelParameters.q})</strong>
                                </span>
                                <span>
                                    Model status
                                    <strong>{analytics.modelStatusLabel}</strong>
                                </span>
                                <span>
                                    Training periods
                                    <strong>{analytics.trainingPeriodCount}</strong>
                                </span>
                                <span>
                                    Training range
                                    <strong>
                                        {analytics.trainingPeriodStart && analytics.trainingPeriodEnd
                                            ? `${new Date(`${analytics.trainingPeriodStart}T00:00:00`).toLocaleDateString()} – ${new Date(`${analytics.trainingPeriodEnd}T00:00:00`).toLocaleDateString()}`
                                            : "Not available"}
                                    </strong>
                                </span>
                                <span>
                                    {analytics.forecastAvailable ? "Last forecast generated" : "Last analytics refresh"}
                                    <strong>
                                        {analytics.analyticsRefreshedAt
                                            ? new Date(analytics.analyticsRefreshedAt).toLocaleString()
                                            : "Not available"}
                                    </strong>
                                </span>
                                <span>
                                    Validation method
                                    <strong>{analytics.modelTrainingMethod}</strong>
                                </span>
                                <span>
                                    Backtest periods
                                    <strong>{analytics.forecastAccuracy.arimaBacktestPeriods}</strong>
                                </span>
                            </div>
                        </article>
                    </section>
                </>
            ) : null}
        </div>
    );
}

export default ReportsAnalytics;
