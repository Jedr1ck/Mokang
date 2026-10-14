
import os
import uuid

from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta, date, time

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy import (
    create_engine,
    Column,
    BigInteger,
    String,
    Text,
    Boolean,
    Date,
    Time,
    DateTime,
    ForeignKey,
    DECIMAL,
    func,
    and_,
    or_,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)

from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT / DATABASE CONFIGURATION
# ============================================================

load_dotenv(
    Path(__file__).resolve().parents[1] / ".env"
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root@localhost:3306/Smarthomes",
)

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "CHANGE_ME",
)

ALGORITHM = "HS256"


# ============================================================
# DATABASE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


# ============================================================
# AUTHENTICATION
# ============================================================

pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)
bearer_scheme = HTTPBearer()


# ============================================================
# DATABASE MODELS
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="homeowner")
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

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

    # ADD THESE TWO FIELDS
    birthday = Column(Date, nullable=True)
    profile_picture = Column(Text, nullable=True)

    user = relationship("User", back_populates="profile")



class Category(Base):
    __tablename__ = "service_categories"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(100), unique=True)
    description = Column(Text)


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(BigInteger, primary_key=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        unique=True,
    )

    business_name = Column(String(150))
    bio = Column(Text)
    location = Column(String(255))
    hourly_rate = Column(DECIMAL(10, 2))
    experience_years = Column(
        BigInteger,
        default=0,
    )

    availability_status = Column(
        String(50),
        default="Available",
    )

    
    # Provider verification status
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_status = Column(
        String(30),
        default="incomplete",
        nullable=False,
    )
    verification_submitted_at = Column(DateTime, nullable=True)
    verification_reviewed_at = Column(DateTime, nullable=True)
    verification_reviewed_by = Column(BigInteger, nullable=True)
    verification_review_notes = Column(Text, nullable=True)

    # Complete address
    region_name = Column(String(120), nullable=True)
    province_name = Column(String(120), nullable=True)
    city_municipality_name = Column(String(120), nullable=True)
    barangay_name = Column(String(120), nullable=True)
    street_address = Column(String(255), nullable=True)
    postal_code = Column(String(10), nullable=True)

    # Verification documents
    id_type = Column(String(80), nullable=True)
    id_front_path = Column(String(500), nullable=True)
    id_back_path = Column(String(500), nullable=True)
    qualifications = Column(Text, nullable=True)
    portfolio_paths = Column(Text, nullable=True)
    service_area = Column(String(255), nullable=True)


    user = relationship("User")


class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(BigInteger, primary_key=True)

    provider_id = Column(
        BigInteger,
        ForeignKey("provider_profiles.id"),
    )

    category_id = Column(
        BigInteger,
        ForeignKey("service_categories.id"),
    )

    title = Column(String(150))
    rate = Column(DECIMAL(10, 2))

    category = relationship("Category")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(BigInteger, primary_key=True)

    booking_code = Column(
        String(30),
        unique=True,
    )

    homeowner_id = Column(
        BigInteger,
        ForeignKey("users.id"),
    )

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

    status = Column(
        String(50),
        default="Pending",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    homeowner = relationship("User")
    provider = relationship("ProviderProfile")
    category = relationship("Category")


class Message(Base):
    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True)

    sender_id = Column(
        BigInteger,
        ForeignKey("users.id"),
    )

    recipient_id = Column(
        BigInteger,
        ForeignKey("users.id"),
    )

    booking_id = Column(
        BigInteger,
        ForeignKey("bookings.id"),
        nullable=True,
    )

    body = Column(Text)

    is_read = Column(
        Boolean,
        default=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def db():
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()



# ============================================================
# CURRENT USER
# ============================================================

def current(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    s: Session = Depends(db),
):
    token = credentials.credentials

    try:
        data = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        uid = int(data["sub"])

    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    user = s.get(User, uid)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user



# ============================================================
# USER RESPONSE
# ============================================================



def user_out(user):
    profile = user.profile

    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email,
        "mobileNumber": profile.mobile_number if profile else None,
        "gender": profile.gender if profile else None,
        "address": profile.address if profile else None,
        "birthday": (
            profile.birthday.isoformat()
            if profile and profile.birthday
            else None
        ),
        "profilePicture": (
            profile.profile_picture
            if profile
            else None
        ),
        "role": user.role,
    }




# ============================================================
# CONSTANTS
# ============================================================

BOOKING_STATUSES = {
    "Pending",
    "Accepted",
    "On the Way",
    "In Progress",
    "Completed",
    "Cancelled",
}


CATEGORY_ALIASES = {
    "electrical": {
        "electrical",
        "electrical repair",
        "wiring",
        "lighting",
        "circuit",
        "outlet",
        "fan",
    },
    "plumbing": {
        "plumbing",
        "pipe",
        "leak",
        "drain",
        "water",
        "sink",
    },
    "carpentry": {
        "carpentry",
        "woodwork",
        "cabinet",
        "door",
        "furniture",
    },
    "cleaning": {
        "cleaning",
        "house cleaning",
        "ac cleaning",
        "aircon cleaning",
        "maintenance",
        "general service",
    },
    "painting": {
        "painting",
        "paint",
        "repaint",
        "wall paint",
    },
    "appliance repair": {
        "appliance repair",
        "appliance",
        "aircon",
        "ac repair",
        "refrigerator",
        "washing machine",
    },
    "gardening": {
        "gardening",
        "garden",
        "landscaping",
        "lawn",
    },
}


# ============================================================
# CATEGORY NORMALIZATION
# ============================================================

def normalize_category_name(
    category_name: str | None,
) -> str | None:

    if not category_name:
        return None

    raw = category_name.strip()

    if not raw:
        return None

    lowered = raw.lower()

    for canonical, aliases in CATEGORY_ALIASES.items():

        if (
            lowered == canonical
            or lowered in aliases
            or any(
                alias in lowered
                for alias in aliases
            )
        ):
            if canonical == "appliance repair":
                return "Appliance Repair"

            return canonical.title()

    return raw


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class Register(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: str = "homeowner"

    @field_validator(
        "full_name",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):

        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError(
                "This field cannot be blank"
            )

        return value

    @field_validator("password")
    @classmethod
    def strong_password(cls, value):

        if not any(c.isupper() for c in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )

        if not any(c.islower() for c in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )

        if not any(c.isdigit() for c in value):
            raise ValueError(
                "Password must include uppercase, lowercase, and a number"
            )

        return value


class Login(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )


class AdminCredentials(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=150,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class BookingIn(BaseModel):
    category: str = Field(
        min_length=2,
        max_length=100,
    )

    preferred_date: date
    preferred_time: time

    address: str = Field(
        min_length=10,
        max_length=500,
    )

    description: str = Field(
        min_length=10,
        max_length=2000,
    )

    provider_id: int | None = Field(
        default=None,
        gt=0,
    )

    @field_validator(
        "category",
        "address",
        "description",
        mode="before",
    )
    @classmethod
    def required_text(cls, value):

        value = (
            value.strip()
            if isinstance(value, str)
            else value
        )

        if not value:
            raise ValueError(
                "This field cannot be blank"
            )

        return value

    @field_validator("preferred_date")
    @classmethod
    def future_date(cls, value):

        if value < date.today():
            raise ValueError(
                "Preferred date cannot be in the past"
            )

        return value

    
class ProfileUpdate(BaseModel):
    fullName: str = Field(min_length=2, max_length=150)
    mobileNumber: str = Field(min_length=7, max_length=30)
    gender: str = Field(min_length=1, max_length=30)
    address: str = Field(min_length=10, max_length=500)
    birthday: date
    profilePicture: str | None = None

    @field_validator(
        "fullName",
        "mobileNumber",
        "gender",
        "address",
        mode="before",
    )
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
            raise ValueError(
                "Invalid booking status"
            )

        return value


class MessageIn(BaseModel):
    recipient_id: int = Field(gt=0)

    booking_id: int | None = Field(
        default=None,
        gt=0,
    )

    body: str = Field(
        min_length=1,
        max_length=1000,
    )

    @field_validator("body", mode="before")
    @classmethod
    def clean_body(cls, value):

        value = (
            value.strip()
            if isinstance(value, str)
            else value
        )

        if not value:
            raise ValueError(
                "Message cannot be blank"
            )

        return value


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Me and Jed API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174",
    ).split(","),

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# ============================================================
# PUBLIC STATISTICS
# ============================================================

@app.get("/public/stats")
def public_stats(
    s: Session = Depends(db),
):
    return {
        "userCount": (
            s.query(func.count(User.id))
            .filter(User.is_active.is_(True))
            .scalar()
            or 0
        )
    }


# ============================================================
# MESSAGES
# ============================================================

@app.post("/messages")
def send_message(
    x: MessageIn,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    recipient = s.get(
        User,
        x.recipient_id,
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Recipient not found",
        )

    if x.booking_id:

        booking = s.get(
            Booking,
            x.booking_id,
        )

        provider_user_id = (
            booking.provider.user_id
            if booking and booking.provider
            else None
        )

        if (
            not booking
            or u.id
            not in (
                booking.homeowner_id,
                provider_user_id,
            )
            or x.recipient_id
            not in (
                booking.homeowner_id,
                provider_user_id,
            )
        ):
            raise HTTPException(
                status_code=403,
                detail="Message is not linked to your booking",
            )

    message = Message(
        sender_id=u.id,
        recipient_id=x.recipient_id,
        booking_id=x.booking_id,
        body=x.body,
    )

    s.add(message)
    s.commit()
    s.refresh(message)

    return {
        "id": message.id,
        "recipientId": message.recipient_id,
        "bookingId": message.booking_id,
        "body": message.body,
        "createdAt": message.created_at.isoformat(),
    }


@app.get("/messages")
def get_messages(
    u: User = Depends(current),
    s: Session = Depends(db),
):
    rows = (
        s.query(Message)
        .filter(
            (Message.sender_id == u.id)
            | (Message.recipient_id == u.id)
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    user_ids = {
        value
        for row in rows
        for value in (
            row.sender_id,
            row.recipient_id,
        )
    }

    users = {
        user.id: user
        for user in (
            s.query(User)
            .filter(User.id.in_(user_ids))
            .all()
        )
    }

    return [
        {
            "id": row.id,
            "senderId": row.sender_id,
            "recipientId": row.recipient_id,
            "bookingId": row.booking_id,
            "body": row.body,
            "createdAt": row.created_at.isoformat(),

            "senderName": (
                users[row.sender_id].full_name
                if row.sender_id in users
                else "User"
            ),

            "recipientName": (
                users[row.recipient_id].full_name
                if row.recipient_id in users
                else "User"
            ),
        }
        for row in rows
    ]


# ============================================================
# USER REGISTRATION
# ============================================================

@app.post("/auth/register")
def register(
    x: Register,
    s: Session = Depends(db),
):
    if x.role not in (
        "homeowner",
        "provider",
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    if (
        s.query(User)
        .filter(User.email == x.email)
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = User(
        full_name=x.full_name,
        email=x.email,
        password_hash=pwd.hash(x.password),
        role=x.role,
    )

    s.add(user)
    s.flush()

    if x.role == "provider":

        profile = ProviderProfile(
            user_id=user.id,
        )

        s.add(profile)

    s.commit()

    token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.utcnow()
            + timedelta(days=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "user": user_out(user),
    }


# ============================================================
# USER LOGIN
# ============================================================

@app.post("/auth/login")
def login(
    x: Login,
    s: Session = Depends(db),
):
    user = (
        s.query(User)
        .filter(User.email == x.email)
        .first()
    )

    if (
        not user
        or not pwd.verify(
            x.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.utcnow()
            + timedelta(days=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_out(user),
    }


# ============================================================
# ADMIN
# ============================================================

@app.get("/auth/admin/exists")
def admin_exists(
    s: Session = Depends(db),
):
    exists = (
        s.query(User)
        .filter(
            User.role == "admin",
            User.is_active.is_(True),
        )
        .first()
        is not None
    )

    return {
        "exists": exists
    }


@app.post("/auth/admin/register")
def register_admin(
    x: AdminCredentials,
    s: Session = Depends(db),
):
    if (
        s.query(User)
        .filter(
            User.role == "admin",
            User.is_active.is_(True),
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="An admin account already exists",
        )

    username = x.username.strip()

    if not username:
        raise HTTPException(
            status_code=422,
            detail="Username cannot be blank",
        )

    admin_email = (
        f"{username.lower()}@admin.smarthome.local"
    )

    if (
        s.query(User)
        .filter(User.email == admin_email)
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Admin username is already in use",
        )

    admin = User(
        full_name=username,
        email=admin_email,
        address="SmartHome Administration",
        password_hash=pwd.hash(x.password),
        role="admin",
    )

    s.add(admin)
    s.commit()
    s.refresh(admin)

    return {
        "message": "Admin account created successfully",
        "user": user_out(admin),
    }


@app.post("/auth/admin/login")
def login_admin(
    x: AdminCredentials,
    s: Session = Depends(db),
):
    username = x.username.strip()

    user = (
        s.query(User)
        .filter(
            User.role == "admin",
            User.full_name == username,
            User.is_active.is_(True),
        )
        .first()
    )

    if (
        not user
        or not pwd.verify(
            x.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin username or password",
        )

    token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.utcnow()
            + timedelta(days=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_out(user),
    }



# ============================================================
# CURRENT USER
# ============================================================

# ==============================
# AUTH / CURRENT USER PROFILE
# ==============================

@app.get("/auth/me")
def me(
    u: User = Depends(current),
):
    return user_out(u)


@app.get("/profile/me")
def get_my_profile(
    u: User = Depends(current),
):
    return user_out(u)


# ==============================
# PROVIDER VERIFICATION SCHEMAS
# ==============================

class ProviderVerificationUpdate(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    bio: Optional[str] = None
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


# ==============================
# PROVIDER VERIFICATION HELPERS
# ==============================

def get_current_provider(u: User, s: Session):
    provider = (
        s.query(ProviderProfile)
        .filter(ProviderProfile.user_id == u.id)
        .first()
    )

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Provider profile not found.",
        )

    return provider


# ==============================
# SECURE PROVIDER ID UPLOAD
# ==============================

MAX_ID_SIZE = 5 * 1024 * 1024  # 5 MB

ID_UPLOAD_DIR = (
    Path(__file__).resolve().parent
    / "private_uploads"
    / "provider_ids"
)


@app.post("/provider-verification/upload-id")
async def upload_provider_id(
    id_side: str,
    file: UploadFile = File(...),
    u: User = Depends(current),
    s: Session = Depends(db),
):
    if u.role != "provider":
        raise HTTPException(
            status_code=403,
            detail="Providers only.",
        )

    if id_side not in ("front", "back"):
        raise HTTPException(
            status_code=400,
            detail="id_side must be 'front' or 'back'.",
        )

    provider = get_current_provider(u, s)

    if provider.verification_status == "verified":
        raise HTTPException(
            status_code=400,
            detail="Your provider profile is already verified.",
        )

    if file.content_type not in (
        "image/jpeg",
        "image/png",
        "image/webp",
    ):
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed.",
        )

    content = await file.read(MAX_ID_SIZE + 1)
    await file.close()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_ID_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum ID image size is 5 MB.",
        )

    # Verify the actual image signature, not just its filename.
    if content.startswith(b"\xff\xd8\xff"):
        extension = ".jpg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        extension = ".png"
    elif (
        len(content) >= 12
        and content[:4] == b"RIFF"
        and content[8:12] == b"WEBP"
    ):
        extension = ".webp"
    else:
        raise HTTPException(
            status_code=400,
            detail="The file is not a valid supported image.",
        )

    provider_dir = ID_UPLOAD_DIR / str(u.id)
    provider_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{id_side}_{uuid.uuid4().hex}{extension}"
    destination = provider_dir / filename

    old_path_value = (
        provider.id_front_path
        if id_side == "front"
        else provider.id_back_path
    )

    try:
        destination.write_bytes(content)

        # Store a relative path; do not expose the ID as a public URL.
        saved_path = destination.relative_to(
            Path(__file__).resolve().parent
        ).as_posix()

        if id_side == "front":
            provider.id_front_path = saved_path
        else:
            provider.id_back_path = saved_path

        # A new document requires a fresh review submission.
        provider.verification_status = "incomplete"
        provider.verification_submitted_at = None

        s.commit()

    except Exception:
        s.rollback()

        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=500,
            detail="Unable to save the ID image.",
        )

    # Remove the previous file only if it belongs to this
    # provider's private ID folder.
    if old_path_value:
        old_path = (
            Path(__file__).resolve().parent / old_path_value
        ).resolve()

        allowed_dir = provider_dir.resolve()

        if (
            old_path.is_relative_to(allowed_dir)
            and old_path != destination.resolve()
            and old_path.is_file()
        ):
            old_path.unlink(missing_ok=True)

    return {
        "message": f"ID {id_side} uploaded successfully.",
        "id_side": id_side,
    }


# ==============================
# GET PROVIDER VERIFICATION
# ==============================

@app.get("/provider-verification/me")
def get_provider_verification(
    u: User = Depends(current),
    s: Session = Depends(db),
):
    provider = get_current_provider(u, s)

    return {
        "id": provider.id,
        "business_name": provider.business_name,
        "bio": provider.bio,
        "experience_years": provider.experience_years,
        "hourly_rate": provider.hourly_rate,
        "availability_status": provider.availability_status,

        "verification_status": provider.verification_status,
        "verification_submitted_at": provider.verification_submitted_at,
        "verification_reviewed_at": provider.verification_reviewed_at,
        "verification_review_notes": provider.verification_review_notes,

        "region_name": provider.region_name,
        "province_name": provider.province_name,
        "city_municipality_name": provider.city_municipality_name,
        "barangay_name": provider.barangay_name,
        "street_address": provider.street_address,
        "postal_code": provider.postal_code,

        "id_type": provider.id_type,
        "id_front_path": provider.id_front_path,
        "id_back_path": provider.id_back_path,
        "qualifications": provider.qualifications,
        "portfolio_paths": provider.portfolio_paths,
        "service_area": provider.service_area,
    }


# ==============================
# UPDATE PROVIDER VERIFICATION
# ==============================

@app.put("/provider-verification/me")
def update_provider_verification(
    data: ProviderVerificationUpdate,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    provider = get_current_provider(u, s)

    if provider.verification_status == "verified":
        raise HTTPException(
            status_code=400,
            detail="Your provider profile is already verified.",
        )

    provider.business_name = data.business_name
    provider.bio = data.bio
    provider.experience_years = data.experience_years
    provider.hourly_rate = data.hourly_rate

    provider.region_name = data.region_name
    provider.province_name = data.province_name
    provider.city_municipality_name = data.city_municipality_name
    provider.barangay_name = data.barangay_name
    provider.street_address = data.street_address
    provider.postal_code = data.postal_code

    provider.id_type = data.id_type
    provider.service_area = data.service_area

    # Save the profile as incomplete until it is submitted for review.
    provider.verification_status = "incomplete"

    s.commit()
    s.refresh(provider)

    return {
        "message": "Provider verification information saved successfully.",
        "verification_status": provider.verification_status,
    }


# ==============================
# SUBMIT PROVIDER VERIFICATION
# ==============================

@app.post("/provider-verification/submit")
def submit_provider_verification(
    u: User = Depends(current),
    s: Session = Depends(db),
):
    provider = get_current_provider(u, s)

    if provider.verification_status == "verified":
        raise HTTPException(
            status_code=400,
            detail="Your provider profile is already verified.",
        )

    required_fields = {
        "business_name": provider.business_name,
        "region_name": provider.region_name,
        "province_name": provider.province_name,
        "city_municipality_name": provider.city_municipality_name,
        "barangay_name": provider.barangay_name,
        "street_address": provider.street_address,
        "id_type": provider.id_type,
        "service_area": provider.service_area,
    }

    missing_fields = [
        field_name
        for field_name, value in required_fields.items()
        if not value or not str(value).strip()
    ]

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Please complete all required verification information.",
                "missing_fields": missing_fields,
            },
        )

    # These document paths must be populated through a secure upload
    # endpoint before submission can succeed.
    if not provider.id_front_path or not provider.id_back_path:
        raise HTTPException(
            status_code=400,
            detail="Please upload both the front and back of your valid ID first.",
        )

    provider.verification_status = "pending"
    provider.verification_submitted_at = datetime.utcnow()
    provider.verification_reviewed_at = None
    provider.verification_reviewed_by = None
    provider.verification_review_notes = None

    s.commit()
    s.refresh(provider)

    return {
        "message": "Provider verification submitted successfully.",
        "verification_status": provider.verification_status,
        "verification_submitted_at": provider.verification_submitted_at,
    }


# ADD THIS NEW ENDPOINT BELOW
@app.put("/profile/me")
def update_my_profile(
    x: ProfileUpdate,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    profile = (
        s.query(UserProfile)
        .filter_by(user_id=u.id)
        .first()
    )

    if profile is None:
        profile = UserProfile(user_id=u.id)
        s.add(profile)

    u.full_name = x.fullName.strip()

    profile.mobile_number = x.mobileNumber.strip()
    profile.gender = x.gender.strip()
    profile.address = x.address.strip()
    profile.birthday = x.birthday
    profile.profile_picture = x.profilePicture

    try:
        s.commit()
        s.refresh(u)
    except Exception:
        s.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save profile changes",
        )

    return user_out(u)



# ============================================================
# CATEGORIES
# ============================================================

@app.get("/categories")
def categories(
    s: Session = Depends(db),
):
    return [
        {
            "id": category.id,
            "name": category.name,
        }
        for category in (
            s.query(Category).all()
        )
    ]


# ============================================================
# PROVIDERS
# ============================================================

@app.get("/providers")
def providers(
    q: str | None = None,
    location: str | None = None,
    category: str | None = None,
    s: Session = Depends(db),
):
    rows = (
        s.query(ProviderProfile)
        .join(User)
        .all()
    )

    output = []

    for provider in rows:

        service = (
            s.query(ProviderService)
            .filter_by(
                provider_id=provider.id
            )
            .first()
        )

        category_name = (
            service.category.name
            if service and service.category
            else ""
        )

        searchable = " ".join(
            filter(
                None,
                (
                    provider.user.full_name,
                    provider.business_name,
                    category_name,
                ),
            )
        ).lower()

        if (
            q
            and q.lower() not in searchable
        ):
            continue

        if (
            location
            and location.lower()
            not in (provider.location or "").lower()
        ):
            continue

        if (
            category
            and category.lower()
            not in category_name.lower()
        ):
            continue

        output.append(
            {
                "id": provider.id,

                "name": (
                    provider.business_name
                    or provider.user.full_name
                ),

                "category": (
                    category_name
                    or "Service Provider"
                ),

                "location": (
                    provider.location
                    or ""
                ),

                "rate": float(
                    provider.hourly_rate
                    or 0
                ),

                "experience": (
                    f"{provider.experience_years or 0} years exp"
                ),

                "availability": (
                    provider.availability_status
                    or "Available"
                ),

                "availabilityType": "today",

                "rating": 0,
                "reviews": 0,

                "image": (
                    "https://images.unsplash.com/"
                    "photo-1540569014015-19a7be504e3a"
                    "?w=150&auto=format&fit=crop&q=80"
                ),
            }
        )

    return output


# ============================================================
# BOOKING RESPONSE
# ============================================================

def booking_out(booking):

    return {
        "id": booking.id,

        "bookingCode": (
            booking.booking_code
        ),

        "category": (
            booking.category.name
            if booking.category
            else None
        ),

        "preferredDate": str(
            booking.preferred_date
        ),

        "preferredTime": str(
            booking.preferred_time
        ),

        "address": booking.address,

        "description": booking.description,

        "status": booking.status,

        "providerId": booking.provider_id,

        "homeownerId": booking.homeowner_id,

        "customerName": (
            booking.homeowner.full_name
            if booking.homeowner
            else None
        ),

        "customerPhone": (
            booking.homeowner.profile.mobile_number
            if booking.homeowner and booking.homeowner.profile
            else None
        ),

        "customerEmail": (
            booking.homeowner.email
            if booking.homeowner
            else None
        ),
    }


# ============================================================
# CREATE BOOKING
# ============================================================

@app.post("/bookings")
def create_booking(
    x: BookingIn,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    if u.role != "homeowner":
        raise HTTPException(
            status_code=403,
            detail="Homeowners only",
        )

    category_name = normalize_category_name(
        x.category
    )

    category = None

    if category_name:

        category = (
            s.query(Category)
            .filter(
                Category.name.ilike(
                    category_name
                )
            )
            .first()
        )

        if not category:

            category = Category(
                name=category_name,
                description=(
                    f"Auto-created category for "
                    f"{category_name}"
                ),
            )

            s.add(category)
            s.flush()

    booking = Booking(
        booking_code=(
            "REQ-"
            + uuid.uuid4().hex[:8].upper()
        ),

        homeowner_id=u.id,

        provider_id=x.provider_id,

        category_id=(
            category.id
            if category
            else None
        ),

        preferred_date=x.preferred_date,

        preferred_time=x.preferred_time,

        address=x.address,

        description=x.description,

        status="Pending",
    )

    s.add(booking)
    s.commit()
    s.refresh(booking)

    return booking_out(booking)


# ============================================================
# MY BOOKINGS
# ============================================================

@app.get("/bookings/my")
def my_bookings(
    u: User = Depends(current),
    s: Session = Depends(db),
):
    query = s.query(Booking)

    # ------------------------------
    # HOMEOWNER
    # ------------------------------

    if u.role == "homeowner":

        query = query.filter(
            Booking.homeowner_id == u.id
        )

    # ------------------------------
    # PROVIDER
    # ------------------------------

    elif u.role == "provider":

        provider = (
            s.query(ProviderProfile)
            .filter_by(user_id=u.id)
            .first()
        )

        if not provider:
            return []

        provider_category_ids = [
            row.category_id
            for row in (
                s.query(
                    ProviderService.category_id
                )
                .filter_by(
                    provider_id=provider.id
                )
                .all()
            )
        ]

        if provider_category_ids:

            query = query.filter(
                or_(
                    Booking.provider_id
                    == provider.id,

                    and_(
                        Booking.provider_id.is_(None),
                        Booking.category_id.in_(
                            provider_category_ids
                        ),
                    ),
                )
            )

        else:

            query = query.filter(
                or_(
                    Booking.provider_id
                    == provider.id,

                    Booking.provider_id.is_(None),
                )
            )

    return [
        booking_out(booking)
        for booking in (
            query
            .order_by(
                Booking.created_at.desc()
            )
            .all()
        )
    ]


# ============================================================
# CHANGE BOOKING STATUS
# ============================================================

@app.patch(
    "/bookings/{booking_id}/status"
)
def change_status(
    booking_id: int,
    x: StatusIn,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    booking = s.get(
        Booking,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    if u.role != "provider":
        raise HTTPException(
            status_code=403,
            detail="Providers only",
        )

    provider = (
        s.query(ProviderProfile)
        .filter_by(user_id=u.id)
        .first()
    )

    if (
        not provider
        or booking.provider_id != provider.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not your booking",
        )

    booking.status = x.status

    s.commit()

    return booking_out(booking)
