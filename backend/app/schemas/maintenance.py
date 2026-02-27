from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal


class MaintenanceItemCreate(BaseModel):
    sort_order: int = 0
    item_code: Optional[str] = None
    asset_tag: Optional[str] = None
    description: str
    task_description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    parts_required: Optional[str] = None
    parts_available: Optional[bool] = None
    labor_hours: Optional[Decimal] = None


class MaintenanceItemUpdate(BaseModel):
    sort_order: Optional[int] = None
    item_code: Optional[str] = None
    asset_tag: Optional[str] = None
    description: Optional[str] = None
    task_description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    parts_required: Optional[str] = None
    parts_available: Optional[bool] = None
    labor_hours: Optional[Decimal] = None
    status: Optional[str] = None
    technician_notes: Optional[str] = None


class MaintenanceItemRead(BaseModel):
    id: UUID
    maintenance_module_id: UUID
    sort_order: int
    item_code: Optional[str]
    asset_tag: Optional[str]
    description: str
    task_description: Optional[str]
    quantity: Optional[Decimal]
    unit: Optional[str]
    parts_required: Optional[str]
    parts_available: Optional[bool]
    labor_hours: Optional[Decimal]
    status: str
    technician_notes: Optional[str]
    completed_by: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MaintenanceModuleCreate(BaseModel):
    title: str = "Maintenance"
    description: Optional[str] = None
    maintenance_type: Optional[str] = None
    scheduled_date: Optional[date] = None
    frequency: Optional[str] = None
    contract_ref: Optional[str] = None


class MaintenanceModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    maintenance_type: Optional[str] = None
    scheduled_date: Optional[date] = None
    frequency: Optional[str] = None
    contract_ref: Optional[str] = None
    is_completed: Optional[bool] = None


class MaintenanceModuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    maintenance_type: Optional[str]
    scheduled_date: Optional[date]
    frequency: Optional[str]
    contract_ref: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    items: List[MaintenanceItemRead] = []

    class Config:
        from_attributes = True
