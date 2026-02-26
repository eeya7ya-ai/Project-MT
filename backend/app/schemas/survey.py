from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class SurveyItemCreate(BaseModel):
    sort_order: int = 0
    item_code: Optional[str] = None
    description: str
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    condition: Optional[str] = None
    remarks: Optional[str] = None
    is_existing: bool = True


class SurveyItemUpdate(BaseModel):
    sort_order: Optional[int] = None
    item_code: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    condition: Optional[str] = None
    remarks: Optional[str] = None
    is_existing: Optional[bool] = None
    status: Optional[str] = None
    technician_notes: Optional[str] = None


class SurveyItemRead(BaseModel):
    id: UUID
    survey_module_id: UUID
    sort_order: int
    item_code: Optional[str]
    description: str
    quantity: Optional[Decimal]
    unit: Optional[str]
    condition: Optional[str]
    remarks: Optional[str]
    is_existing: Optional[bool]
    status: str
    completed_by: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SurveyModuleCreate(BaseModel):
    title: str = "Site Survey"
    description: Optional[str] = None
    site_name: Optional[str] = None
    site_address: Optional[str] = None
    surveyor_notes: Optional[str] = None


class SurveyModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    site_name: Optional[str] = None
    site_address: Optional[str] = None
    surveyor_notes: Optional[str] = None
    is_completed: Optional[bool] = None


class SurveyModuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    site_name: Optional[str]
    site_address: Optional[str]
    surveyor_notes: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    items: List[SurveyItemRead] = []

    class Config:
        from_attributes = True
