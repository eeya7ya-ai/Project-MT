from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date


class HandoverFileCreate(BaseModel):
    sort_order: int = 0
    file_name: str
    description: Optional[str] = None
    is_required: bool = True
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class HandoverFileUpdate(BaseModel):
    sort_order: Optional[int] = None
    file_name: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    is_uploaded: Optional[bool] = None
    file_url: Optional[str] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class HandoverFileRead(BaseModel):
    id: UUID
    handover_module_id: UUID
    sort_order: int
    file_name: str
    description: Optional[str]
    is_required: bool
    is_uploaded: bool
    file_url: Optional[str]
    uploaded_by: Optional[UUID]
    uploaded_at: Optional[datetime]
    expiry_date: Optional[date]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HandoverModuleCreate(BaseModel):
    title: str = "Handover"
    description: Optional[str] = None
    handover_date: Optional[date] = None
    client_rep_name: Optional[str] = None
    tech_rep_name: Optional[str] = None


class HandoverModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    handover_date: Optional[date] = None
    client_rep_name: Optional[str] = None
    client_rep_sign_url: Optional[str] = None
    tech_rep_name: Optional[str] = None
    tech_rep_sign_url: Optional[str] = None
    is_completed: Optional[bool] = None


class HandoverModuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    handover_date: Optional[date]
    client_rep_name: Optional[str]
    client_rep_sign_url: Optional[str]
    tech_rep_name: Optional[str]
    tech_rep_sign_url: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    required_files: List[HandoverFileRead] = []

    class Config:
        from_attributes = True
