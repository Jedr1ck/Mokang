from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    DECIMAL,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()
ID_TYPE = BigInteger().with_variant(Integer, "sqlite")


class User(Base):
    __tablename__ = "users"

    id = Column(ID_TYPE, primary_key=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="homeowner")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    mobile_number = Column(String(30))
    gender = Column(String(30))
    address = Column(String(500))
    birthday = Column(Date, nullable=True)
    profile_picture = Column(Text, nullable=True)
    user = relationship("User", back_populates="profile")


class Category(Base):
    __tablename__ = "service_categories"

    id = Column(ID_TYPE, primary_key=True)
    name = Column(String(100), unique=True)
    description = Column(Text)


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(ID_TYPE, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), unique=True)
    business_name = Column(String(150))
    bio = Column(Text)
    location = Column(String(255))
    hourly_rate = Column(DECIMAL(10, 2))
    experience_years = Column(BigInteger, default=0)
    availability_status = Column(String(50), default="Available")
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_status = Column(String(30), default="incomplete", nullable=False)
    verification_submitted_at = Column(DateTime, nullable=True)
    verification_reviewed_at = Column(DateTime, nullable=True)
    verification_reviewed_by = Column(BigInteger, nullable=True)
    verification_review_notes = Column(Text, nullable=True)
    region_name = Column(String(120), nullable=True)
    province_name = Column(String(120), nullable=True)
    city_municipality_name = Column(String(120), nullable=True)
    barangay_name = Column(String(120), nullable=True)
    street_address = Column(String(255), nullable=True)
    postal_code = Column(String(10), nullable=True)
    id_type = Column(String(80), nullable=True)
    id_front_path = Column(String(500), nullable=True)
    id_back_path = Column(String(500), nullable=True)
    qualifications = Column(Text, nullable=True)
    portfolio_paths = Column(Text, nullable=True)
    service_area = Column(String(255), nullable=True)
    user = relationship("User")


class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(ID_TYPE, primary_key=True)
    provider_id = Column(BigInteger, ForeignKey("provider_profiles.id"))
    category_id = Column(BigInteger, ForeignKey("service_categories.id"))
    title = Column(String(150))
    rate = Column(DECIMAL(10, 2))
    category = relationship("Category")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(ID_TYPE, primary_key=True)
    booking_code = Column(String(30), unique=True)
    homeowner_id = Column(BigInteger, ForeignKey("users.id"))
    provider_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id"),
        nullable=True,
    )
    category_id = Column(
        BigInteger,
        ForeignKey("service_categories.id"),
        nullable=True,
    )
    preferred_date = Column(Date)
    preferred_time = Column(Time)
    address = Column(Text)
    description = Column(Text)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    homeowner = relationship("User")
    provider = relationship("ProviderProfile")
    category = relationship("Category")


class Message(Base):
    __tablename__ = "messages"

    id = Column(ID_TYPE, primary_key=True)
    sender_id = Column(BigInteger, ForeignKey("users.id"))
    recipient_id = Column(BigInteger, ForeignKey("users.id"))
    booking_id = Column(
        BigInteger,
        ForeignKey("bookings.id"),
        nullable=True,
    )
    body = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
