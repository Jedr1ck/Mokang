from datetime import date

from flask import Blueprint, jsonify
from sqlalchemy import func

from app.common import ApiError, current_user, get_session, require_auth
from app.models import Booking, Category

admin_analytics_bp = Blueprint("admin_analytics", __name__, url_prefix="/admin/analytics")

MONTH_NAMES = (
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
)
SEASONS = (
    ("Dry Season", (12, 1, 2, 3, 4, 5)),
    ("Rainy Season", (6, 7, 8, 9, 10, 11)),
)


def add_months(year, month, offset):
    month_index = year * 12 + month - 1 + offset
    return month_index // 12, month_index % 12 + 1


def arima_111_forecast(values, horizon=3):
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
    previous_difference = differences[-1]
    level = float(values[-1])
    forecast = []
    for _ in range(horizon):
        predicted_difference = drift + ar * previous_difference + ma * previous_error
        level = max(0.0, level + predicted_difference)
        forecast.append(round(level, 2))
        previous_difference = predicted_difference
        previous_error = 0.0
    return forecast


@admin_analytics_bp.get("")
@require_auth
def booking_analytics():
    with get_session() as session:
        user = current_user(session)
        if user.role != "admin" or not user.is_active:
            raise ApiError("Administrator access required", 403)

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

    today = date.today()
    current_month = (today.year, today.month)
    first_month = add_months(today.year, today.month, -35)
    monthly_counts = {}
    month_totals = [0] * 12
    quarter_totals = [0] * 4
    season_totals = {name: 0 for name, _ in SEASONS}
    preference_counts = {}

    for preferred_date, category_name, count in rows:
        if preferred_date is None:
            continue
        month_key = (preferred_date.year, preferred_date.month)
        month_totals[preferred_date.month - 1] += count
        quarter_totals[(preferred_date.month - 1) // 3] += count
        for season_name, months in SEASONS:
            if preferred_date.month in months:
                season_totals[season_name] += count
                break
        preference_name = category_name or "Uncategorized"
        preference_counts[preference_name] = (
            preference_counts.get(preference_name, 0) + count
        )
        if first_month <= month_key <= current_month:
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + count

    history = []
    for offset in range(36):
        year, month = add_months(first_month[0], first_month[1], offset)
        history.append(
            {
                "year": year,
                "month": month,
                "label": f"{MONTH_NAMES[month - 1]} {str(year)[-2:]}",
                "count": monthly_counts.get((year, month), 0),
            }
        )

    forecast_values = arima_111_forecast([item["count"] for item in history])
    forecast = []
    if forecast_values is not None:
        for offset, count in enumerate(forecast_values, start=1):
            year, month = add_months(today.year, today.month, offset)
            forecast.append(
                {
                    "year": year,
                    "month": month,
                    "label": f"{MONTH_NAMES[month - 1]} {str(year)[-2:]}",
                    "count": count,
                }
            )

    peak_month_index = max(range(12), key=month_totals.__getitem__)
    peak_quarter_index = max(range(4), key=quarter_totals.__getitem__)
    peak_season = max(season_totals, key=season_totals.__getitem__)

    return jsonify(
        totalBookings=sum(month_totals),
        peakSeason={
            "name": peak_season,
            "bookings": season_totals[peak_season],
            "months": list(next(months for name, months in SEASONS if name == peak_season)),
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
            {"name": name, "bookings": count}
            for name, count in season_totals.items()
        ],
        preferences=[
            {"name": name, "bookings": count}
            for name, count in sorted(
                preference_counts.items(),
                key=lambda item: (-item[1], item[0].casefold()),
            )
        ],
        history=history,
        forecast=forecast,
        forecastAvailable=forecast_values is not None,
        forecastMessage=(
            None
            if forecast_values is not None
            else "At least 24 months of booking history are needed for an ARIMA(1,1,1) forecast."
        ),
    )
