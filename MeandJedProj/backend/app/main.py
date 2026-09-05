import os, uuid
from pathlib import Path
from datetime import datetime, timedelta, date, time
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, BigInteger, String, Text, Boolean, Date, Time, DateTime, ForeignKey, DECIMAL
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
DATABASE_URL=os.getenv('DATABASE_URL','mysql+pymysql://root@localhost:3306/Smarthome')
SECRET_KEY=os.getenv('SECRET_KEY','CHANGE_ME')
ALGORITHM='HS256'
engine=create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal=sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base=declarative_base(); pwd=CryptContext(schemes=['bcrypt'],deprecated='auto'); oauth2=OAuth2PasswordBearer(tokenUrl='auth/login')
class User(Base):
 __tablename__='users'; id=Column(BigInteger,primary_key=True); full_name=Column(String(150)); email=Column(String(255),unique=True,index=True); mobile_number=Column(String(30)); password_hash=Column(String(255)); role=Column(String(20)); is_active=Column(Boolean,default=True); created_at=Column(DateTime,default=datetime.utcnow)
class Category(Base):
 __tablename__='service_categories'; id=Column(BigInteger,primary_key=True); name=Column(String(100),unique=True); description=Column(Text)
class ProviderProfile(Base):
 __tablename__='provider_profiles'; id=Column(BigInteger,primary_key=True); user_id=Column(BigInteger,ForeignKey('users.id'),unique=True); business_name=Column(String(150)); bio=Column(Text); location=Column(String(255)); hourly_rate=Column(DECIMAL(10,2)); experience_years=Column(BigInteger,default=0); availability_status=Column(String(50),default='Available'); user=relationship('User')
class Booking(Base):
 __tablename__='bookings'; id=Column(BigInteger,primary_key=True); booking_code=Column(String(30),unique=True); homeowner_id=Column(BigInteger,ForeignKey('users.id')); provider_id=Column(BigInteger,ForeignKey('provider_profiles.id'),nullable=True); category_id=Column(BigInteger,ForeignKey('service_categories.id'),nullable=True); preferred_date=Column(Date); preferred_time=Column(Time); address=Column(Text); description=Column(Text); status=Column(String(50),default='Pending'); created_at=Column(DateTime,default=datetime.utcnow); homeowner=relationship('User'); provider=relationship('ProviderProfile'); category=relationship('Category')
def db():
 s=SessionLocal()
 try: yield s
 finally: s.close()
def current(token:str=Depends(oauth2), s:Session=Depends(db)):
 try: data=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM]); uid=int(data['sub'])
 except (JWTError,KeyError,ValueError): raise HTTPException(401,'Invalid token')
 u=s.get(User,uid)
 if not u: raise HTTPException(401,'User not found')
 return u
def user_out(u): return {'id':u.id,'fullName':u.full_name,'email':u.email,'mobileNumber':u.mobile_number,'role':u.role}
PHONE_PATTERN = r'^\+?[0-9]{10,15}$'
BOOKING_STATUSES = {'Pending', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Cancelled'}

class Register(BaseModel):
 full_name: str = Field(min_length=2, max_length=150)
 email: EmailStr
 password: str = Field(min_length=8, max_length=128)
 mobile_number: str | None = Field(default=None, pattern=PHONE_PATTERN)
 role: str = 'homeowner'
 business_name: str | None = Field(default=None, max_length=150)
 location: str | None = Field(default=None, max_length=255)
 @field_validator('full_name', 'business_name', 'location', mode='before')
 @classmethod
 def strip_text(cls, value):
  if value is None: return value
  value = value.strip()
  if not value: raise ValueError('This field cannot be blank')
  return value
 @field_validator('password')
 @classmethod
 def strong_password(cls, value):
  if not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value):
   raise ValueError('Password must include uppercase, lowercase, and a number')
  return value

class Login(BaseModel):
 email: EmailStr
 password: str = Field(min_length=1, max_length=128)

class BookingIn(BaseModel):
 category: str = Field(min_length=2, max_length=100)
 preferred_date: date
 preferred_time: time
 address: str = Field(min_length=10, max_length=500)
 description: str = Field(min_length=10, max_length=2000)
 provider_id: int | None = Field(default=None, gt=0)
 @field_validator('category', 'address', 'description', mode='before')
 @classmethod
 def required_text(cls, value):
  value = value.strip() if isinstance(value, str) else value
  if not value: raise ValueError('This field cannot be blank')
  return value
 @field_validator('preferred_date')
 @classmethod
 def future_date(cls, value):
  if value < date.today(): raise ValueError('Preferred date cannot be in the past')
  return value

class StatusIn(BaseModel):
 status: str
 @field_validator('status')
 @classmethod
 def allowed_status(cls, value):
  if value not in BOOKING_STATUSES: raise ValueError('Invalid booking status')
  return value
app=FastAPI(title='Me and Jed API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:5173,http://localhost:5174').split(','),allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
@app.get('/health')
def health(): return {'status':'ok'}
@app.post('/auth/register')
def register(x:Register,s:Session=Depends(db)):
 if x.role not in ('homeowner','provider'): raise HTTPException(400,'Invalid role')
 if s.query(User).filter(User.email==x.email).first(): raise HTTPException(409,'Email already registered')
 u=User(full_name=x.full_name,email=x.email,mobile_number=x.mobile_number,password_hash=pwd.hash(x.password),role=x.role); s.add(u); s.flush()
 if x.role=='provider': s.add(ProviderProfile(user_id=u.id,business_name=x.business_name or x.full_name,location=x.location))
 s.commit(); return {'message':'Registration successful','user':user_out(u)}
@app.post('/auth/login')
def login(x:Login,s:Session=Depends(db)):
 u=s.query(User).filter(User.email==x.email).first()
 if not u or not pwd.verify(x.password,u.password_hash): raise HTTPException(status.HTTP_401_UNAUTHORIZED,'Invalid email or password')
 token=jwt.encode({'sub':str(u.id),'exp':datetime.utcnow()+timedelta(days=1)},SECRET_KEY,algorithm=ALGORITHM); return {'access_token':token,'token_type':'bearer','user':user_out(u)}
@app.get('/auth/me')
def me(u:User=Depends(current)): return user_out(u)
@app.get('/categories')
def categories(s:Session=Depends(db)): return [{'id':c.id,'name':c.name} for c in s.query(Category).all()]
@app.get('/providers')
def providers(q:str|None=None,location:str|None=None,category:str|None=None,s:Session=Depends(db)):
 rows=s.query(ProviderProfile).join(User).all(); out=[]
 for p in rows:
  if q and q.lower() not in (p.user.full_name+' '+(p.business_name or '')).lower(): continue
  if location and location.lower() not in (p.location or '').lower(): continue
  out.append({'id':p.id,'name':p.business_name or p.user.full_name,'location':p.location,'rate':float(p.hourly_rate or 0),'experience':p.experience_years or 0,'availability':p.availability_status})
 return out
@app.post('/bookings')
def create_booking(x:BookingIn,u:User=Depends(current),s:Session=Depends(db)):
 if u.role!='homeowner': raise HTTPException(403,'Homeowners only')
 c=s.query(Category).filter(Category.name.ilike(x.category)).first()
 b=Booking(booking_code='REQ-'+uuid.uuid4().hex[:8].upper(),homeowner_id=u.id,provider_id=x.provider_id,category_id=c.id if c else None,preferred_date=x.preferred_date,preferred_time=x.preferred_time,address=x.address,description=x.description,status='Pending'); s.add(b); s.commit(); s.refresh(b); return booking_out(b)
def booking_out(b): return {'id':b.id,'bookingCode':b.booking_code,'category':b.category.name if b.category else None,'preferredDate':str(b.preferred_date),'preferredTime':str(b.preferred_time),'address':b.address,'description':b.description,'status':b.status,'providerId':b.provider_id}
@app.get('/bookings/my')
def my_bookings(u:User=Depends(current),s:Session=Depends(db)):
 q=s.query(Booking)
 if u.role=='homeowner': q=q.filter(Booking.homeowner_id==u.id)
 elif u.role=='provider':
  p=s.query(ProviderProfile).filter_by(user_id=u.id).first(); q=q.filter(Booking.provider_id==p.id) if p else q.filter(False)
 return [booking_out(b) for b in q.order_by(Booking.created_at.desc()).all()]
@app.patch('/bookings/{booking_id}/status')
def change_status(booking_id:int,x:StatusIn,u:User=Depends(current),s:Session=Depends(db)):
 b=s.get(Booking,booking_id)
 if not b: raise HTTPException(404,'Booking not found')
 if u.role!='provider': raise HTTPException(403,'Providers only')
 p=s.query(ProviderProfile).filter_by(user_id=u.id).first()
 if not p or b.provider_id!=p.id: raise HTTPException(403,'Not your booking')
 b.status=x.status; s.commit(); return booking_out(b)
