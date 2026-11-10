import re
from datetime import date, datetime, timedelta, timezone
from math import isfinite

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func

from app.common import ApiError, current_user, get_session, require_auth
from app.models import Booking, Category, SystemSetting

admin_analytics_bp = Blueprint("admin_analytics", __name__, url_prefix="/admin/analytics")

MONTH_NAMES = (
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
)
SEASONS = (
    ("Dry Season", (12, 1, 2, 3, 4, 5)),
    ("Rainy Season", (6, 7, 8, 9, 10, 11)),
)
COVERAGE_SETTING_KEY = "analytics_coverage_start_date"
WEEKDAY_NAMES = (
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
)
BOOKING_STATUS_ORDER = (
    "Pending",
    "Matched",
    "Accepted",
    "On the Way",
    "In Progress",
    "Awaiting Confirmation",
    "Completed",
    "Cancelled",
    "Rejected",
)
BOOKING_STATUS_NAMES = {
    **{status.casefold(): status for status in BOOKING_STATUS_ORDER},
    "canceled": "Cancelled",
}
SAMPLE_MONTHLY_BOOKING_COUNTS = (
    42, 47, 53, 52, 48, 47, 50, 57, 64, 68, 65, 63,
    66, 71, 77, 76, 72, 71, 74, 81, 88, 92, 89, 87,
    90, 95, 101, 100, 96, 95, 98, 105, 112, 116, 113, 111,
    114, 119, 125, 124, 120, 119, 122, 129, 136, 140, 137, 135,
    138, 143, 149, 148, 144, 143, 146, 153, 160, 164, 161, 159,
)


def parse_iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Date must use YYYY-MM-DD format.")
    return date.fromisoformat(value)


def add_months(year, month, offset):
    month_index = year * 12 + month - 1 + offset
    return month_index // 12, month_index % 12 + 1


def period_start(day, frequency):
    if frequency == "daily":
        return day
    if frequency == "weekly":
        return day - timedelta(days=day.weekday())
    return day.replace(day=1)


def add_periods(day, frequency, offset):
    if frequency == "daily":
        return day + timedelta(days=offset)
    if frequency == "weekly":
        return day + timedelta(weeks=offset)
    year, month = add_months(day.year, day.month, offset)
    return date(year, month, 1)


def period_end(day, frequency):
    return add_periods(day, frequency, 1) - timedelta(days=1)


def week_range_label(week_start):
    week_end = period_end(week_start, "weekly")
    if week_start.year != week_end.year:
        return (
            f"{week_start.strftime('%b')} {week_start.day}, {week_start.year}-"
            f"{week_end.strftime('%b')} {week_end.day}, {week_end.year}"
        )
    if week_start.month == week_end.month:
        return f"{week_start.strftime('%b')} {week_start.day}-{week_end.day}"
    return (
        f"{week_start.strftime('%b')} {week_start.day}-"
        f"{week_end.strftime('%b')} {week_end.day}"
    )


def period_label(day, frequency):
    if frequency == "daily":
        return day.strftime("%b %d")
    if frequency == "weekly":
        return f"Week of {day.strftime('%b %d')}"
    return f"{MONTH_NAMES[day.month - 1]} {str(day.year)[-2:]}"


def sample_monthly_booking_rows(periods):
    sample_counts = (
        SAMPLE_MONTHLY_BOOKING_COUNTS[-len(periods):]
        if periods
        else ()
    )
    rows = []
    demand_rows = []
    for period, count in zip(periods, sample_counts):
        weekly_counts = [
            count // 4 + (1 if index < count % 4 else 0)
            for index in range(4)
        ]
        for week_index, weekly_count in enumerate(weekly_counts):
            booking_date = period + timedelta(days=3 + week_index * 7)
            cancelled_count = max(1, weekly_count // 10)
            rows.append((booking_date, "Home Services", weekly_count))
            demand_rows.extend(
                (
                    (
                        booking_date,
                        "Completed",
                        "Home Services",
                        "General repairs",
                        weekly_count - cancelled_count,
                    ),
                    (
                        booking_date,
                        "Cancelled",
                        "Home Services",
                        "General repairs",
                        cancelled_count,
                    ),
                )
            )
    return rows, demand_rows


def arima_111_forecast(values, horizon=12):
    differences = [
        float(values[index] - values[index - 1])
        for index in range(1, len(values))
    ]
    if len(differences) < 23:
        return None

    mean_difference = sum(differences) / len(differences)
    best = None
    coefficients = [step / 10 for step in range(-9, 10)]

    for ar in coefficients:
        drift = mean_difference * (1 - ar)
        for ma in coefficients:
            errors = [0.0] * len(differences)
            squared_error = 0.0
            for index, difference in enumerate(differences):
                previous_difference = differences[index - 1] if index else 0.0
                previous_error = errors[index - 1] if index else 0.0
                errors[index] = (
                    difference - drift - ar * previous_difference - ma * previous_error
                )
                if index:
                    squared_error += errors[index] ** 2

            if best is None or squared_error < best[0]:
                best = (squared_error, ar, ma, drift, errors[-1])

    _, ar, ma, drift, previous_error = best
    residuals = [0.0] * len(differences)
    for index, difference in enumerate(differences):
        previous_difference = differences[index - 1] if index else 0.0
        previous_residual = residuals[index - 1] if index else 0.0
        residuals[index] = (
            difference - drift - ar * previous_difference - ma * previous_residual
        )
    residual_variance = sum(error**2 for error in residuals[1:]) / max(
        len(residuals) - 3,
        1,
    )
    residual_standard_deviation = residual_variance**0.5

    previous_difference = differences[-1]
    level = float(values[-1])
    forecast = []
    for step in range(1, horizon + 1):
        predicted_difference = drift + ar * previous_difference + ma * previous_error
        level += predicted_difference
        if not isfinite(level) or level < 0:
            return None
        impulse_responses = [1.0]
        for lag in range(1, step):
            impulse_responses.append((ar + ma) * (ar ** (lag - 1)))
        cumulative_responses = [
            sum(impulse_responses[: remaining + 1])
            for remaining in range(step)
        ]
        forecast_standard_deviation = residual_standard_deviation * sum(
            response**2 for response in cumulative_responses
        ) ** 0.5
        forecast.append(
            {
                "count": round(level, 2),
                "lower": round(max(0.0, level - 1.96 * forecast_standard_deviation), 2),
                "upper": round(level + 1.96 * forecast_standard_deviation, 2),
            }
        )
        if not all(
            isfinite(forecast[-1][key])
            for key in ("count", "lower", "upper")
        ):
            return None
        previous_difference = predicted_difference
        previous_error = 0.0
    return forecast


def error_metrics(actual_values, predicted_values):
    if not actual_values:
        return {"mae": None, "rmse": None, "mape": None, "wape": None}

    errors = [
        predicted - actual
        for actual, predicted in zip(actual_values, predicted_values)
    ]
    nonzero_percentage_errors = [
        abs(error / actual) * 100
        for actual, error in zip(actual_values, errors)
        if actual != 0
    ]
    total_actual = sum(abs(actual) for actual in actual_values)
    return {
        "mae": round(sum(abs(error) for error in errors) / len(errors), 2),
        "rmse": round((sum(error**2 for error in errors) / len(errors)) ** 0.5, 2),
        "mape": (
            round(sum(nonzero_percentage_errors) / len(nonzero_percentage_errors), 2)
            if nonzero_percentage_errors
            else None
        ),
        "wape": (
            round(sum(abs(error) for error in errors) / total_actual * 100, 2)
            if total_actual
            else None
        ),
    }


def valid_forecast(forecast, horizon):
    if not isinstance(forecast, list) or len(forecast) != horizon:
        return False
    for prediction in forecast:
        if not isinstance(prediction, dict):
            return False
        values = [prediction.get(key) for key in ("count", "lower", "upper")]
        if not all(
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and isfinite(value)
            for value in values
        ):
            return False
        count, lower, upper = values
        if count < 0 or lower < 0 or lower > count or count > upper:
            return False
    return True


def forecast_accuracy(
    values,
    labels,
    backtest_periods=6,
    arima_min_training_periods=24,
    arima_min_validation_folds=3,
):
    arima_actuals = []
    arima_predictions = []
    comparison_naive = []
    comparison_zero = []
    comparison_average = []
    baseline_actuals = []
    baseline_naive = []
    baseline_zero = []
    baseline_average = []
    validation = []
    failed_arima_folds = 0

    has_arima_training_history = len(values) >= (
        arima_min_training_periods + arima_min_validation_folds
    )
    min_training_periods = (
        arima_min_training_periods if has_arima_training_history else 6
    )
    first_test_index = max(min_training_periods, len(values) - backtest_periods)
    for test_index in range(first_test_index, len(values)):
        training_values = values[:test_index]
        actual = float(values[test_index])
        naive_prediction = float(training_values[-1])
        average_prediction = sum(training_values) / len(training_values)
        row = {
            "label": labels[test_index],
            "actual": round(actual, 2),
            "naivePredicted": round(naive_prediction, 2),
            "zeroBookingPredicted": 0.0,
            "historicalAveragePredicted": round(average_prediction, 2),
            "predicted": None,
            "arimaFitSucceeded": None,
        }
        arima_succeeded = False
        if test_index >= arima_min_training_periods:
            predicted = arima_111_forecast(training_values, horizon=1)
            if valid_forecast(predicted, 1):
                arima_prediction = predicted[0]["count"]
                arima_actuals.append(actual)
                arima_predictions.append(arima_prediction)
                row["predicted"] = round(arima_prediction, 2)
                row["arimaFitSucceeded"] = True
                arima_succeeded = True
            else:
                row["arimaFitSucceeded"] = False
                failed_arima_folds += 1

        baseline_actuals.append(actual)
        baseline_naive.append(naive_prediction)
        baseline_zero.append(0.0)
        baseline_average.append(average_prediction)
        if arima_succeeded:
            comparison_naive.append(naive_prediction)
            comparison_zero.append(0.0)
            comparison_average.append(average_prediction)
        validation.append(row)

    arima_metrics = error_metrics(arima_actuals, arima_predictions)
    baseline_predictions = {
        "Last-period naive": baseline_naive,
        "Zero-booking baseline": baseline_zero,
        "Historical average baseline": baseline_average,
    }
    comparison_predictions = {
        "Last-period naive": comparison_naive,
        "Zero-booking baseline": comparison_zero,
        "Historical average baseline": comparison_average,
    }
    baselines = {
        method: error_metrics(baseline_actuals, predictions)
        for method, predictions in baseline_predictions.items()
    }
    comparison_baselines = {
        method: error_metrics(arima_actuals, predictions)
        for method, predictions in comparison_predictions.items()
    }
    baseline_priority = {
        "Zero-booking baseline": 0,
        "Last-period naive": 1,
        "Historical average baseline": 2,
    }
    best_baseline_method = min(
        baselines,
        key=lambda method: (
            float("inf") if baselines[method]["mae"] is None else baselines[method]["mae"],
            baseline_priority[method],
        ),
    )
    if baselines[best_baseline_method]["mae"] is None:
        best_baseline_method = None
    best_baseline_metrics = (
        baselines[best_baseline_method]
        if best_baseline_method
        else {"mae": None, "rmse": None, "mape": None, "wape": None}
    )
    if best_baseline_method:
        best_baseline_prediction_key = {
            "Last-period naive": "naivePredicted",
            "Zero-booking baseline": "zeroBookingPredicted",
            "Historical average baseline": "historicalAveragePredicted",
        }[best_baseline_method]
        for row in validation:
            row["selectedBaselinePredicted"] = row[best_baseline_prediction_key]

    comparison_baseline_method = min(
        comparison_baselines,
        key=lambda method: (
            float("inf") if comparison_baselines[method]["mae"] is None else comparison_baselines[method]["mae"],
            baseline_priority[method],
        ),
    )
    if comparison_baselines[comparison_baseline_method]["mae"] is None:
        comparison_baseline_method = None
    for row in validation:
        row["comparisonBaselinePredicted"] = (
            row.get(
                {
                    "Last-period naive": "naivePredicted",
                    "Zero-booking baseline": "zeroBookingPredicted",
                    "Historical average baseline": "historicalAveragePredicted",
                }.get(comparison_baseline_method, "")
            )
            if row["arimaFitSucceeded"]
            else None
        )

    peak_spike_mae = None
    baseline_peak_spike_mae = None
    if arima_actuals and comparison_baseline_method:
        spike_threshold = sorted(arima_actuals)[max(0, int(len(arima_actuals) * 0.75) - 1)]
        spike_indexes = [
            index for index, actual in enumerate(arima_actuals)
            if actual >= spike_threshold and actual > 0
        ]
        if spike_indexes:
            peak_spike_mae = round(
                sum(
                    abs(arima_actuals[index] - arima_predictions[index])
                    for index in spike_indexes
                ) / len(spike_indexes),
                2,
            )
            comparison_baseline_predictions = comparison_predictions[comparison_baseline_method]
            baseline_peak_spike_mae = round(
                sum(
                    abs(arima_actuals[index] - comparison_baseline_predictions[index])
                    for index in spike_indexes
                ) / len(spike_indexes),
                2,
            )
    improvement = None
    comparison_baseline_metrics = (
        comparison_baselines[comparison_baseline_method]
        if comparison_baseline_method
        else {"mae": None, "rmse": None, "mape": None, "wape": None}
    )
    if comparison_baseline_metrics["mae"] not in (None, 0) and arima_metrics["mae"] is not None:
        improvement = round(
            (comparison_baseline_metrics["mae"] - arima_metrics["mae"])
            / comparison_baseline_metrics["mae"]
            * 100,
            1,
        )
    return {
        **arima_metrics,
        "backtestPeriods": len(baseline_actuals),
        "arimaBacktestPeriods": len(arima_actuals),
        "baseline": baselines["Last-period naive"],
        "baselines": baselines,
        "bestBaselineMethod": best_baseline_method,
        "bestBaseline": best_baseline_metrics,
        "comparisonBaselines": comparison_baselines,
        "comparisonBaselineMethod": comparison_baseline_method,
        "comparisonBaseline": comparison_baseline_metrics,
        "sameValidationPeriods": len(arima_actuals),
        "successfulArimaBacktestFolds": len(arima_actuals),
        "failedArimaBacktestFolds": failed_arima_folds,
        "peakSpikeMae": peak_spike_mae,
        "baselinePeakSpikeMae": baseline_peak_spike_mae,
        "arimaMaeImprovementPercent": improvement,
        "validation": validation,
    }


def historical_average_forecast(values, horizon):
    average = sum(values) / len(values)
    errors = [value - average for value in values]
    standard_deviation = (
        sum(error**2 for error in errors) / max(len(errors) - 1, 1)
    ) ** 0.5
    return [
        {
            "count": round(max(0.0, average), 2),
            "lower": round(max(0.0, average - 1.96 * standard_deviation), 2),
            "upper": round(average + 1.96 * standard_deviation, 2),
        }
        for _ in range(horizon)
    ]


def baseline_forecast(values, horizon, method):
    if method == "Zero-booking baseline":
        standard_deviation = (
            sum(value**2 for value in values) / len(values)
        ) ** 0.5
        return [
            {
                "count": 0.0,
                "lower": 0.0,
                "upper": round(1.96 * standard_deviation, 2),
            }
            for _ in range(horizon)
        ]
    if method == "Last-period naive":
        last_value = float(values[-1])
        differences = [
            values[index] - values[index - 1]
            for index in range(1, len(values))
        ]
        standard_deviation = (
            sum(
                (difference - sum(differences) / len(differences)) ** 2
                for difference in differences
            )
            / max(len(differences) - 1, 1)
        ) ** 0.5
        return [
            {
                "count": round(last_value, 2),
                "lower": round(max(0.0, last_value - 1.96 * standard_deviation * step**0.5), 2),
                "upper": round(last_value + 1.96 * standard_deviation * step**0.5, 2),
            }
            for step in range(1, horizon + 1)
        ]
    return historical_average_forecast(values, horizon)


def admin_user_or_error(session):
    user = current_user(session)
    if user.role != "admin" or not user.is_active:
        raise ApiError("Administrator access required", 403)
    return user


def stored_coverage_start(session):
    setting = session.get(SystemSetting, COVERAGE_SETTING_KEY)
    if setting and setting.value:
        return setting.value
    return current_app.config.get("ANALYTICS_COVERAGE_START_DATE", "")


@admin_analytics_bp.get("/coverage")
@require_auth
def get_analytics_coverage():
    with get_session() as session:
        admin_user_or_error(session)
        coverage_value = stored_coverage_start(session)

    try:
        coverage_date = parse_iso_date(coverage_value) if coverage_value else None
    except ValueError as error:
        raise RuntimeError(
            "The configured analytics coverage start date must use YYYY-MM-DD format."
        ) from error
    if coverage_date and coverage_date > date.today():
        raise RuntimeError("The configured analytics coverage start date cannot be in the future.")

    return jsonify(
        coverageStartDate=coverage_date.isoformat() if coverage_date else None,
        configured=coverage_date is not None,
    )


@admin_analytics_bp.put("/coverage")
@require_auth
def update_analytics_coverage():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or "coverageStartDate" not in payload:
        raise ApiError("coverageStartDate is required.", 422)

    submitted_date = payload["coverageStartDate"]
    if submitted_date is None or submitted_date == "":
        normalized_date = ""
    elif isinstance(submitted_date, str):
        try:
            parsed_date = parse_iso_date(submitted_date)
        except ValueError as error:
            raise ApiError("Coverage start date must use YYYY-MM-DD format.", 422) from error
        if parsed_date > date.today():
            raise ApiError("Coverage start date cannot be in the future.", 422)
        normalized_date = parsed_date.isoformat()
    else:
        raise ApiError("Coverage start date must use YYYY-MM-DD format or be empty.", 422)

    with get_session() as session:
        admin_user_or_error(session)
        setting = session.get(SystemSetting, COVERAGE_SETTING_KEY)
        if setting:
            setting.value = normalized_date
        else:
            session.add(
                SystemSetting(
                    key=COVERAGE_SETTING_KEY,
                    value=normalized_date,
                )
            )
        session.commit()

    return jsonify(
        coverageStartDate=normalized_date or None,
        configured=bool(normalized_date),
        message="Coverage settings saved. Historical data and forecast backtests will be recalculated on the next analytics request.",
    )


@admin_analytics_bp.get("")
@require_auth
def booking_analytics():
    frequency = request.args.get("frequency", "monthly").lower()
    if frequency not in {"daily", "weekly", "monthly"}:
        raise ApiError("Frequency must be daily, weekly, or monthly.", 422)
    sample_data = request.args.get("sampleData", "").lower() == "true"
    if sample_data and frequency != "monthly":
        raise ApiError("Sample data is available for monthly forecasts only.", 422)

    baseline_min_periods = max(
        1,
        int(current_app.config["ANALYTICS_BASELINE_MIN_PERIODS"]),
    )
    arima_min_training_periods = max(
        24,
        int(current_app.config["ANALYTICS_ARIMA_MIN_TRAINING_PERIODS"]),
    )
    arima_min_validation_folds = max(
        1,
        int(current_app.config["ANALYTICS_ARIMA_MIN_VALIDATION_FOLDS"]),
    )
    arima_min_mae_improvement_percent = max(
        0.0,
        float(current_app.config["ANALYTICS_ARIMA_MIN_MAE_IMPROVEMENT_PERCENT"]),
    )
    arima_max_wape_percent = max(
        0.0,
        float(current_app.config["ANALYTICS_ARIMA_MAX_WAPE_PERCENT"]),
    )

    try:
        horizon = int(request.args.get("horizon", "3"))
    except ValueError as error:
        raise ApiError("Forecast horizon must be 3, 6, or 12.", 422) from error
    if horizon not in {3, 6, 12}:
        raise ApiError("Forecast horizon must be 3, 6, or 12.", 422)

    today = date.today()
    period_count_limit = (
        60 if sample_data else {"daily": 365, "weekly": 156, "monthly": 36}[frequency]
    )
    default_end_date = today - timedelta(days=1)
    if frequency in {"weekly", "monthly"}:
        default_end_date = period_start(today, frequency) - timedelta(days=1)
    try:
        end_date = date.fromisoformat(
            request.args.get("endDate") or default_end_date.isoformat()
        )
        default_start_period = add_periods(
            period_start(end_date, frequency),
            frequency,
            -(period_count_limit - 1),
        )
        start_date = date.fromisoformat(
            request.args.get("startDate") or default_start_period.isoformat()
        )
    except ValueError as error:
        raise ApiError("Start and end dates must use YYYY-MM-DD format.", 422) from error

    if start_date > end_date:
        raise ApiError("Start date must be on or before end date.", 422)
    if end_date > today:
        raise ApiError("End date cannot be in the future.", 422)

    first_period = period_start(start_date, frequency)
    last_period = period_start(end_date, frequency)
    selected_periods = []
    period = first_period
    while period <= last_period:
        if (
            period >= start_date
            and period_end(period, frequency) <= end_date
            and period_end(period, frequency) < today
        ):
            selected_periods.append(period)
        period = add_periods(period, frequency, 1)
    selected_period_count = len(selected_periods)
    if selected_period_count > period_count_limit:
        raise ApiError(
            f"Date range cannot exceed {period_count_limit} {frequency} periods.",
            422,
        )

    with get_session() as session:
        admin_user_or_error(session)
        coverage_start_value = (
            "" if sample_data else stored_coverage_start(session)
        )
        try:
            coverage_start_date = (
                parse_iso_date(coverage_start_value)
                if coverage_start_value
                else None
            )
        except ValueError as error:
            raise RuntimeError(
                "The configured analytics coverage start date must use YYYY-MM-DD format."
            ) from error
        if coverage_start_date and coverage_start_date > today:
            raise RuntimeError(
                "The configured analytics coverage start date cannot be in the future."
            )

        rows = (
            session.query(
                Booking.preferred_date,
                Category.name,
                func.count(Booking.id),
            )
            .outerjoin(Category, Booking.category_id == Category.id)
            .group_by(Booking.preferred_date, Category.name)
            .all()
        )
        demand_rows = (
            session.query(
                Booking.preferred_date,
                Booking.status,
                Category.name,
                Booking.service_name,
                func.count(Booking.id),
            )
            .outerjoin(Category, Booking.category_id == Category.id)
            .group_by(
                Booking.preferred_date,
                Booking.status,
                Category.name,
                Booking.service_name,
            )
            .all()
        )

    if sample_data:
        rows, demand_rows = sample_monthly_booking_rows(selected_periods)
        coverage_start_date = selected_periods[0] if selected_periods else None

    latest_complete_week = period_start(today, "weekly") - timedelta(weeks=1)
    weekly_activity_periods = [
        add_periods(latest_complete_week, "weekly", offset)
        for offset in range(-7, 1)
    ]
    weekly_activity_counts = {}
    for preferred_date, _, count in rows:
        if preferred_date is None:
            continue
        booking_week = period_start(preferred_date, "weekly")
        if booking_week in weekly_activity_periods:
            weekly_activity_counts[booking_week] = (
                weekly_activity_counts.get(booking_week, 0) + count
            )

    first_covered_week = None
    if coverage_start_date:
        first_covered_week = period_start(coverage_start_date, "weekly")
        if coverage_start_date > first_covered_week:
            first_covered_week = add_periods(first_covered_week, "weekly", 1)
    weekly_booking_activity = [
        {
            "date": week.isoformat(),
            "rangeLabel": week_range_label(week),
            "verified": (
                first_covered_week is not None and week >= first_covered_week
            ),
            "count": (
                weekly_activity_counts.get(week, 0)
                if (
                    weekly_activity_counts.get(week, 0) > 0
                    or (first_covered_week is not None and week >= first_covered_week)
                )
                else None
            ),
        }
        for week in weekly_activity_periods
    ]

    first_covered_period = None
    if coverage_start_date:
        first_covered_period = period_start(coverage_start_date, frequency)
        if coverage_start_date > first_covered_period:
            first_covered_period = add_periods(first_covered_period, frequency, 1)

    period_counts = {}
    selected_period_counts = {}
    demand_total_bookings = 0
    demand_cancelled_bookings = 0
    demand_weekday_counts = {}
    demand_service_counts = {}
    demand_service_names = {}
    booking_status_counts = {}
    month_totals = [0] * 12
    quarter_totals = [0] * 4
    season_totals = {name: 0 for name, _ in SEASONS}

    for preferred_date, category_name, count in rows:
        if (
            preferred_date is None
            or period_start(preferred_date, frequency) not in selected_periods
        ):
            continue
        month_totals[preferred_date.month - 1] += count
        quarter_totals[(preferred_date.month - 1) // 3] += count
        for season_name, months in SEASONS:
            if preferred_date.month in months:
                season_totals[season_name] += count
                break
        booking_period = period_start(preferred_date, frequency)
        selected_period_counts[booking_period] = (
            selected_period_counts.get(booking_period, 0) + count
        )
        if first_covered_period is not None and booking_period >= first_covered_period:
            period_counts[booking_period] = (
                period_counts.get(booking_period, 0) + count
            )

    for preferred_date, status, category_name, booking_service_name, count in demand_rows:
        if (
            preferred_date is None
            or period_start(preferred_date, frequency) not in selected_periods
        ):
            continue
        demand_total_bookings += count
        raw_status = (status or "").strip()
        normalized_status = (
            BOOKING_STATUS_NAMES.get(raw_status.casefold(), raw_status)
            if raw_status
            else "Unspecified"
        )
        booking_status_counts[normalized_status] = (
            booking_status_counts.get(normalized_status, 0) + count
        )
        if normalized_status.casefold() in {"cancelled", "canceled", "rejected"}:
            demand_cancelled_bookings += count
        weekday = preferred_date.strftime("%A")
        demand_weekday_counts[weekday] = (
            demand_weekday_counts.get(weekday, 0) + count
        )
        service_name = (
            (category_name or "").strip()
            or (booking_service_name or "").strip()
            or "Uncategorized"
        )
        service_key = " ".join(service_name.casefold().split())
        demand_service_counts[service_key] = (
            demand_service_counts.get(service_key, 0) + count
        )
        existing_service_name = demand_service_names.get(service_key)
        if (
            existing_service_name is None
            or service_name < existing_service_name
        ):
            demand_service_names[service_key] = service_name

    peak_booking_day = (
        max(
            demand_weekday_counts.items(),
            key=lambda item: (item[1], -WEEKDAY_NAMES.index(item[0])),
        )
        if demand_weekday_counts
        else None
    )
    most_requested_service = (
        max(
            demand_service_counts.items(),
            key=lambda item: (
                item[1],
                demand_service_names[item[0]].casefold(),
            ),
        )
        if demand_service_counts
        else None
    )
    booking_demand_insights = {
        "totalBookings": demand_total_bookings,
        "peakBookingDay": (
            {"name": peak_booking_day[0], "bookings": peak_booking_day[1]}
            if peak_booking_day
            else None
        ),
        "mostRequestedService": (
            {
                "name": demand_service_names[most_requested_service[0]],
                "bookings": most_requested_service[1],
            }
            if most_requested_service
            else None
        ),
        "cancellationRate": (
            round(demand_cancelled_bookings / demand_total_bookings * 100, 1)
            if demand_total_bookings
            else None
        ),
        "cancelledBookings": demand_cancelled_bookings,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dateBasis": "scheduled_date",
        "includedStatuses": "all",
    }
    booking_status_distribution = [
        {
            "status": status,
            "bookings": booking_status_counts.get(status, 0),
            "sharePercent": round(
                booking_status_counts.get(status, 0) / demand_total_bookings * 100,
                1,
            ) if demand_total_bookings else 0,
        }
        for status in BOOKING_STATUS_ORDER
    ]
    booking_status_distribution.extend(
        {
            "status": status,
            "bookings": count,
            "sharePercent": round(count / demand_total_bookings * 100, 1),
        }
        for status, count in sorted(
            booking_status_counts.items(),
            key=lambda item: item[0].casefold(),
        )
        if status not in BOOKING_STATUS_ORDER
    )
    monthly_booking_distribution = [
        {
            "month": MONTH_NAMES[index],
            "bookings": count,
            "sharePercent": (
                round(count / demand_total_bookings * 100, 1)
                if demand_total_bookings
                else 0
            ),
        }
        for index, count in enumerate(month_totals)
    ]

    booking_period_count = len(selected_period_counts)
    history_booking_count = sum(selected_period_counts.values())
    covered_periods = [
        period
        for period in selected_periods
        if first_covered_period is not None and period >= first_covered_period
    ]
    history = [
        {
            "date": period.isoformat(),
            "year": period.year,
            "month": period.month,
            "label": period_label(period, frequency),
            "count": (
                selected_period_counts[period]
                if period in selected_period_counts
                else (0 if period in covered_periods else None)
            ),
        }
        for period in selected_periods
    ]
    training_history = [
        {
            "date": period.isoformat(),
            "year": period.year,
            "month": period.month,
            "label": period_label(period, frequency),
            "count": period_counts.get(period, 0),
        }
        for period in covered_periods
    ]
    history_values = [item["count"] for item in training_history]
    zero_periods = sum(value == 0 for value in history_values)
    confirmed_period_count = (
        len(covered_periods) if coverage_start_date else booking_period_count
    )
    missing_periods = selected_period_count - confirmed_period_count
    valid_consecutive_observations = len(training_history)
    current_period = covered_periods[-1] if covered_periods else last_period
    forecast_values = None
    forecast_method = None
    model_error = None
    arima_min_observations = (
        arima_min_training_periods + arima_min_validation_folds
    )
    if valid_consecutive_observations >= arima_min_observations:
        try:
            candidate_forecast = arima_111_forecast(
                history_values,
                horizon=horizon,
            )
            if valid_forecast(candidate_forecast, horizon):
                forecast_values = candidate_forecast
            else:
                model_error = "ARIMA returned invalid, negative, or incomplete forecast values."
        except (ArithmeticError, ValueError, OverflowError) as error:
            model_error = str(error)

    accuracy = forecast_accuracy(
        history_values,
        [item["label"] for item in training_history],
        backtest_periods=max(6, arima_min_validation_folds),
        arima_min_training_periods=arima_min_training_periods,
        arima_min_validation_folds=arima_min_validation_folds,
    )
    selected_baseline_method = accuracy["bestBaselineMethod"]
    if forecast_values is not None:
        comparison_baseline_method = accuracy["comparisonBaselineMethod"]
        comparison_baseline = accuracy["comparisonBaseline"]
        baseline_mae = comparison_baseline["mae"]
        arima_mae = accuracy["mae"]
        arima_improvement = (
            (baseline_mae - arima_mae) / baseline_mae
            if baseline_mae not in (None, 0) and arima_mae is not None
            else 0
        )
        arima_is_meaningfully_better = (
            baseline_mae is not None
            and arima_mae is not None
            and arima_improvement
            >= arima_min_mae_improvement_percent / 100
            and comparison_baseline_method is not None
            and comparison_baseline["rmse"] is not None
            and accuracy["rmse"] is not None
            and accuracy["rmse"] <= comparison_baseline["rmse"]
            and (
                accuracy["peakSpikeMae"] is None
                or accuracy["baselinePeakSpikeMae"] is None
                or accuracy["peakSpikeMae"] <= accuracy["baselinePeakSpikeMae"]
            )
        )
        arima_is_reliable = (
            accuracy["successfulArimaBacktestFolds"] >= arima_min_validation_folds
            and arima_is_meaningfully_better
            and accuracy["wape"] is not None
            and accuracy["wape"] < arima_max_wape_percent
        )
        if arima_is_reliable:
            forecast_method = "ARIMA(1,1,1)"
        elif (
            valid_consecutive_observations >= baseline_min_periods
            and selected_baseline_method
        ):
            forecast_method = selected_baseline_method
            forecast_values = baseline_forecast(
                history_values,
                horizon,
                forecast_method,
            )
        else:
            forecast_values = None
    elif (
        valid_consecutive_observations >= baseline_min_periods
        and selected_baseline_method
    ):
        forecast_method = selected_baseline_method
        forecast_values = baseline_forecast(
            history_values,
            horizon,
            forecast_method,
        )

    forecast = []
    if forecast_values is not None:
        for offset, prediction in enumerate(forecast_values, start=1):
            period = add_periods(current_period, frequency, offset)
            forecast.append(
                {
                    "date": period.isoformat(),
                    "year": period.year,
                    "month": period.month,
                    "label": period_label(period, frequency),
                    **prediction,
                }
            )

    if not coverage_start_date:
        reliability = {
            "level": "limited",
            "label": "Historical coverage unverified",
            "description": "Set the system's complete booking-coverage start date before treating empty periods as zero or generating a forecast.",
        }
    elif model_error:
        reliability = {
            "level": "limited",
            "label": "ARIMA model error",
            "description": "ARIMA could not be validated. Any available forecast uses the selected baseline and should be treated cautiously.",
        }
    elif valid_consecutive_observations < baseline_min_periods:
        reliability = {
            "level": "limited",
            "label": "Insufficient consecutive data",
            "description": (
                f"At least {baseline_min_periods} consecutive verified periods are "
                f"required by the current baseline policy. ARIMA requires "
                f"{arima_min_observations} periods: {arima_min_training_periods} "
                f"initial training periods plus {arima_min_validation_folds} "
                "validation folds."
            ),
        }
    elif (
        forecast_method != "ARIMA(1,1,1)"
        or accuracy["wape"] is None
        or accuracy["wape"] >= min(50, arima_max_wape_percent)
    ):
        reliability = {
            "level": "limited",
            "label": "Forecast needs caution",
            "description": "Backtesting has not shown a meaningful, reliable ARIMA improvement. The selected baseline is a planning reference, not a guarantee.",
        }
    else:
        reliability = {
            "level": "sufficient",
            "label": "Sufficient historical data",
            "description": "The series has recurring activity and backtest errors are within a more useful range.",
        }

    if sample_data:
        reliability = {
            "level": "limited",
            "label": "Demo data only",
            "description": "This forecast and the displayed booking insights use fixed synthetic sample data, not real bookings.",
        }

    if not coverage_start_date:
        model_status = "coverage_unconfigured"
        model_status_label = "Historical Coverage Not Configured"
        forecast_message = (
            "Set the verified booking-coverage start date in admin System Settings, "
            "using the first date supported by reliable operational records. The "
            "environment variable ANALYTICS_COVERAGE_START_DATE is available as a "
            "fallback. Empty periods are not treated as zero, and no forecast is "
            "generated while coverage is unknown."
        )
    elif forecast_values is not None:
        model_status = "forecast_generated"
        model_status_label = "Forecast Generated"
        forecast_message = (
            "ARIMA beat the strongest baseline by at least "
            f"{arima_min_mae_improvement_percent:g}% MAE in rolling-origin backtesting."
            if forecast_method == "ARIMA(1,1,1)"
            else (
                (
                    f"ARIMA failed during model fitting ({model_error}). "
                    if model_error
                    else "ARIMA did not demonstrate a meaningful improvement over the best baseline. "
                )
                + f"The {forecast_method.lower()} is shown instead."
            )
        )
    elif model_error:
        model_status = "model_error"
        model_status_label = "Model Error"
        forecast_message = (
            f"ARIMA could not be calculated ({model_error}), and there is not enough "
            "consecutive data for a baseline forecast."
        )
    else:
        model_status = "insufficient_data"
        model_status_label = "Insufficient Data"
        forecast_message = (
            f"At least {baseline_min_periods} consecutive verified periods are "
            "needed for a baseline forecast. "
            f"Only {valid_consecutive_observations} covered periods are available. "
            f"ARIMA requires {arima_min_observations} periods under the current "
            f"policy: {arima_min_training_periods} training periods plus "
            f"{arima_min_validation_folds} rolling-origin validation folds. "
            "The 24-period training floor is set by the current ARIMA implementation."
        )
    if not coverage_start_date:
        accuracy_interpretation = (
            "Accuracy cannot be validated until a complete historical coverage start date is configured."
        )
    elif accuracy["successfulArimaBacktestFolds"] == 0:
        accuracy_interpretation = (
            "ARIMA does not yet have enough consecutive training history for rolling-origin validation. "
            "The available baseline results are shown without claiming ARIMA performance."
        )
    elif accuracy["wape"] is None:
        accuracy_interpretation = (
            "ARIMA WAPE is unavailable because the validation periods contain no actual bookings."
        )
    elif accuracy["wape"] >= arima_max_wape_percent:
        accuracy_interpretation = (
            f"ARIMA WAPE is {accuracy['wape']}%, indicating very poor holdout accuracy. "
            f"The {forecast_method or selected_baseline_method or 'baseline'} should be preferred."
        )
    elif forecast_method == "ARIMA(1,1,1)":
        accuracy_interpretation = (
            f"ARIMA reduced MAE by {accuracy['arimaMaeImprovementPercent']}% against "
            f"{accuracy['comparisonBaselineMethod']} on identical rolling-origin folds, "
            "with RMSE and spike-period error no worse than the baseline."
        )
    else:
        failed_checks = []
        if (
            accuracy["arimaMaeImprovementPercent"] is None
            or accuracy["arimaMaeImprovementPercent"]
            < arima_min_mae_improvement_percent
        ):
            failed_checks.append(
                f"at least {arima_min_mae_improvement_percent:g}% lower MAE"
            )
        if (
            accuracy["rmse"] is not None
            and accuracy["comparisonBaseline"]["rmse"] is not None
            and accuracy["rmse"] > accuracy["comparisonBaseline"]["rmse"]
        ):
            failed_checks.append("RMSE no worse than the baseline")
        if (
            accuracy["peakSpikeMae"] is not None
            and accuracy["baselinePeakSpikeMae"] is not None
            and accuracy["peakSpikeMae"] > accuracy["baselinePeakSpikeMae"]
        ):
            failed_checks.append("spike-period error no worse than the baseline")
        accuracy_interpretation = (
            f"ARIMA did not pass the model-selection checks ({'; '.join(failed_checks) or 'too few successful validation folds'}). "
            f"The {selected_baseline_method or 'available baseline'} is used instead."
        )
    if sample_data:
        model_status_label = f"Demo: {model_status_label}"
        forecast_message = f"Synthetic sample data only. {forecast_message}"
        accuracy_interpretation = (
            f"Synthetic sample data only. {accuracy_interpretation}"
        )
    peak_month_index = max(range(12), key=month_totals.__getitem__)
    peak_quarter_index = max(range(4), key=quarter_totals.__getitem__)
    peak_season = max(season_totals, key=season_totals.__getitem__)

    return jsonify(
        sampleData=sample_data,
        dataSourceLabel=(
            "Synthetic sample data (not real bookings)"
            if sample_data
            else "Recorded bookings"
        ),
        totalBookings=sum(month_totals),
        peakSeason={
            "name": peak_season,
            "bookings": season_totals[peak_season],
            "months": [
                MONTH_NAMES[month - 1]
                for month in next(months for name, months in SEASONS if name == peak_season)
            ],
        },
        peakMonth={
            "name": MONTH_NAMES[peak_month_index],
            "bookings": month_totals[peak_month_index],
        },
        peakQuarter={
            "name": f"Q{peak_quarter_index + 1}",
            "bookings": quarter_totals[peak_quarter_index],
        },
        seasons=[
            {
                "name": name,
                "bookings": count,
                "months": [
                    MONTH_NAMES[month - 1]
                    for month in months
                ],
            }
            for name, months in SEASONS
            for count in (season_totals[name],)
        ],
        monthlyBookingDistribution=monthly_booking_distribution,
        bookingStatusDistribution=booking_status_distribution,
        preferences=[
            {
                "name": demand_service_names[key],
                "bookings": count,
                "sharePercent": (
                    round(count / demand_total_bookings * 100, 1)
                    if demand_total_bookings
                    else 0
                ),
            }
            for key, count in sorted(
                demand_service_counts.items(),
                key=lambda item: (
                    -item[1],
                    demand_service_names[item[0]].casefold(),
                ),
            )
        ],
        history=history,
        trainingHistory=training_history,
        weeklyBookingActivity=weekly_booking_activity,
        forecast=forecast,
        forecastAccuracy=accuracy,
        accuracyInterpretation=accuracy_interpretation,
        modelParameters={"p": 1, "d": 1, "q": 1},
        trainingPeriodCount=len(training_history),
        trainingPeriodStart=training_history[0]["date"] if training_history else None,
        trainingPeriodEnd=training_history[-1]["date"] if training_history else None,
        forecastMethod=forecast_method,
        modelStatus=model_status,
        modelStatusLabel=model_status_label,
        frequency=frequency,
        horizon=horizon,
        historicalPeriodCount=selected_period_count,
        startDate=start_date.isoformat(),
        endDate=end_date.isoformat(),
        historyObservationCount=len(period_counts),
        periodsWithBookings=len(period_counts),
        periodsWithRecordedBookings=booking_period_count,
        verifiedPeriodCount=len(covered_periods),
        zeroBookingPeriodCount=zero_periods,
        missingPeriodCount=missing_periods,
        validConsecutiveObservationCount=valid_consecutive_observations,
        coverageConfigured=coverage_start_date is not None,
        coverageStartDate=(
            coverage_start_date.isoformat() if coverage_start_date else None
        ),
        undatedBookingCount=sum(
            count for preferred_date, _, count in rows if preferred_date is None
        ),
        historyBookingCount=history_booking_count,
        reliability=reliability,
        analyticsRefreshedAt=datetime.now(timezone.utc).isoformat(),
        forecastAvailable=forecast_values is not None,
        forecastMessage=forecast_message,
        selectedBaselineMethod=selected_baseline_method,
        modelTrainingMethod="Rolling-origin, one-step-ahead validation",
        modelSelectionChecks={
            "minimumMaeImprovementPercent": arima_min_mae_improvement_percent,
            "minimumSuccessfulValidationFolds": arima_min_validation_folds,
            "minimumBaselinePeriods": baseline_min_periods,
            "minimumArimaTrainingPeriods": arima_min_training_periods,
            "minimumArimaTotalPeriods": arima_min_observations,
            "maximumWapePercent": arima_max_wape_percent,
            "requiresRmseNoWorseThanBaseline": True,
            "requiresSpikeMaeNoWorseThanBaseline": True,
            "requiresNonNegativeFinitePredictions": True,
        },
        forecastPolicy={
            "baselineMinimumPeriods": baseline_min_periods,
            "arimaInitialTrainingPeriods": arima_min_training_periods,
            "arimaMinimumValidationFolds": arima_min_validation_folds,
            "arimaMinimumTotalPeriods": arima_min_observations,
            "arimaMinimumMaeImprovementPercent": arima_min_mae_improvement_percent,
            "arimaMaximumWapePercent": arima_max_wape_percent,
            "arimaTrainingFloorNote": (
                "The ARIMA implementation requires 24 observations to fit its "
                "current differenced series, even if a lower training setting is configured."
            ),
        },
        bookingDemandInsights=booking_demand_insights,
    )
