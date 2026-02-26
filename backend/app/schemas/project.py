from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal


class ProjectCreate(BaseModel):
    client_id: UUID
    project_number: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    status: str = "draft"
    priority: str = "medium"
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class ProjectListItem(BaseModel):
    id: UUID
    project_number: str
    name: str
    status: str
    priority: str
    client_name: Optional[str] = None
    location: Optional[str] = None
    due_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectRead(BaseModel):
    id: UUID
    client_id: UUID
    project_number: str
    name: str
    description: Optional[str]
    location: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    status: str
    priority: str
    start_date: Optional[date]
    due_date: Optional[date]
    completed_at: Optional[datetime]
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
