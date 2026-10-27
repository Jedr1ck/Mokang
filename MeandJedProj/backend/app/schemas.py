from datetime import date, time
import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

BOOKING_STATUSES = {
    "Pending",
    "Matched",
    "Accepted",
    "On the Way",
    "In Progress",
    "Completed",
    "Cancelled",
    "Rejected",
}


class Register(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = "homeowner"

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_text(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("password")
    @classmethod
    def strong_password(cls, value):
        if not any(char.isupper() for char in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )
        if not any(char.islower() for char in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )
        if not any(char.isdigit() for char in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )
        return value


class Login(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AdminCredentials(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=128)


class AdminAccountCreate(Register):
    role: str


class BookingIn(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    preferred_date: date
    preferred_time: time
    address: str = Field(min_length=10, max_length=500)
    description: str = Field(min_length=10, max_length=2000)
    provider_id: int | None = Field(default=None, gt=0)

    @field_validator("category", "address", "description", mode="before")
    @classmethod
    def required_text(cls, value):
        value = value.strip() if isinstance(value, str) else value
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("preferred_date")
    @classmethod
    def future_date(cls, value):
        if value < date.today():
            raise ValueError("Preferred date cannot be in the past")
        return value


class ProfileUpdate(BaseModel):
    fullName: str | None = Field(default=None, min_length=2, max_length=150)
    mobileNumber: str | None = Field(default=None, min_length=11, max_length=11)
    gender: str | None = Field(default=None, min_length=1, max_length=30)
    address: str | None = Field(default=None, min_length=10, max_length=500)
    birthday: date | None = None
    profilePicture: str | None = None

    @field_validator("fullName", "mobileNumber", "gender", "address", mode="before")
    @classmethod
    def required_profile_text(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value

    @field_validator("birthday")
    @classmethod
    def valid_birthday(cls, value):
        if value is not None and value > date.today():
            raise ValueError("Birthday cannot be in the future")
        return value

    @field_validator("mobileNumber")
    @classmethod
    def valid_mobile_number(cls, value):
        if value is not None and not re.fullmatch(r"09\d{9}", value):
            raise ValueError("Mobile number must be exactly 11 digits and start with 09")
        return value

    @field_validator("gender")
    @classmethod
    def valid_gender(cls, value):
        if value is not None and value not in {"Female", "Male", "Other", "Prefer not to say"}:
            raise ValueError("Select a valid gender")
        return value


class StatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def allowed_status(cls, value):
        if value not in BOOKING_STATUSES:
            raise ValueError("Invalid status")
        return value


class BookingRescheduleIn(BaseModel):
    preferred_date: date
    preferred_time: time


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)

    @field_validator("comment", mode="before")
    @classmethod
    def clean_comment(cls, value):
        return value.strip() if isinstance(value, str) else value


class ComplaintIn(BaseModel):
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("subject", "message", mode="before")
    @classmethod
    def clean_complaint_text(cls, value):
        value = value.strip() if isinstance(value, str) else value
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class ComplaintStatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, value):
        if value not in {"Pending", "Under Review", "Resolved", "Rejected"}:
            raise ValueError("Invalid complaint status")
        return value


class MessageIn(BaseModel):
    recipient_id: int = Field(gt=0)
    booking_id: int | None = Field(default=None, gt=0)
    body: str = Field(min_length=1, max_length=1000)

    @field_validator("body", mode="before")
    @classmethod
    def clean_body(cls, value):
        value = value.strip() if isinstance(value, str) else value
        if not value:
            raise ValueError("Message cannot be blank")
        return value


class ProviderServiceSelection(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    service_titles: list[str] = Field(default_factory=list, max_length=20)
    service_rates: dict[str, float] = Field(default_factory=dict)

    @field_validator("service_rates")
    @classmethod
    def non_negative_service_rates(cls, value):
        if any(rate < 0 for rate in value.values()):
            raise ValueError("Service prices cannot be negative")
        return value


class ProviderServicesUpdate(BaseModel):
    services: list[ProviderServiceSelection] = Field(default_factory=list, max_length=20)


class ProviderVerificationUpdate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    bio: Optional[str] = None
    service_category: Optional[str] = Field(None, min_length=2, max_length=100)
    service_titles: list[str] = Field(default_factory=list, max_length=20)
    services: list[ProviderServiceSelection] = Field(default_factory=list, max_length=20)
    hourly_rate: Optional[float] = Field(None, ge=0)
    experience_years: int = Field(..., ge=0)
    region_name: str = Field(..., min_length=1, max_length=120)
    province_name: str = Field(..., min_length=1, max_length=120)
    city_municipality_name: str = Field(..., min_length=1, max_length=120)
    barangay_name: str = Field(..., min_length=1, max_length=120)
    street_address: str = Field(..., min_length=1, max_length=255)
    postal_code: Optional[str] = Field(None, max_length=10)
    id_type: str = Field(..., min_length=1, max_length=80)
    service_area: str = Field(..., min_length=1, max_length=255)
