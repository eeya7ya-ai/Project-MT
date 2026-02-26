from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "UAE"
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ClientRead(BaseModel):
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
