from datetime import date, time
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

BOOKING_STATUSES = {
    "Pending",
    "Accepted",
    "On the Way",
    "In Progress",
    "Completed",
    "Cancelled",
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
    fullName: str = Field(min_length=2, max_length=150)
    mobileNumber: str = Field(min_length=7, max_length=30)
    gender: str = Field(min_length=1, max_length=30)
    address: str = Field(min_length=10, max_length=500)
    birthday: date
    profilePicture: str | None = None

    @field_validator("fullName", "mobileNumber", "gender", "address", mode="before")
    @classmethod
    def required_profile_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value


class StatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def allowed_status(cls, value):
        if value not in BOOKING_STATUSES:
            raise ValueError("Invalid status")
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


class ProviderVerificationUpdate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    bio: Optional[str] = None
    service_category: Optional[str] = Field(None, min_length=2, max_length=100)
    service_titles: list[str] = Field(default_factory=list, max_length=20)
    experience_years: int = Field(..., ge=0)
    hourly_rate: float = Field(..., ge=0)
    region_name: str = Field(..., min_length=1, max_length=120)
    province_name: str = Field(..., min_length=1, max_length=120)
    city_municipality_name: str = Field(..., min_length=1, max_length=120)
    barangay_name: str = Field(..., min_length=1, max_length=120)
    street_address: str = Field(..., min_length=1, max_length=255)
    postal_code: Optional[str] = Field(None, max_length=10)
    id_type: str = Field(..., min_length=1, max_length=80)
    service_area: str = Field(..., min_length=1, max_length=255)
