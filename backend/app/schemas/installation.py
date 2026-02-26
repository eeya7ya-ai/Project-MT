from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class InstallationItemCreate(BaseModel):
    sort_order: int = 0
    item_code: Optional[str] = None
    part_number: Optional[str] = None
    description: str
    brand: Optional[str] = None
    model: Optional[str] = None
    quantity: Decimal = Decimal("1")
    unit: Optional[str] = None
    location_zone: Optional[str] = None
    floor_level: Optional[str] = None
    installation_notes: Optional[str] = None


class InstallationItemUpdate(BaseModel):
    sort_order: Optional[int] = None
    item_code: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    location_zone: Optional[str] = None
    floor_level: Optional[str] = None
    installation_notes: Optional[str] = None
    is_tested: Optional[bool] = None
    test_result: Optional[str] = None
    status: Optional[str] = None
    technician_notes: Optional[str] = None


class InstallationItemRead(BaseModel):
    id: UUID
    installation_module_id: UUID
    sort_order: int
    item_code: Optional[str]
    part_number: Optional[str]
    description: str
    brand: Optional[str]
    model: Optional[str]
    quantity: Decimal
    unit: Optional[str]
    location_zone: Optional[str]
    floor_level: Optional[str]
    installation_notes: Optional[str]
    is_tested: Optional[bool]
    test_result: Optional[str]
    status: str
    technician_notes: Optional[str]
    completed_by: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InstallationModuleCreate(BaseModel):
    title: str = "Installation"
    description: Optional[str] = None
    system_type: Optional[str] = None
    floor_plan_url: Optional[str] = None


class InstallationModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    system_type: Optional[str] = None
    floor_plan_url: Optional[str] = None
    is_completed: Optional[bool] = None


class InstallationModuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    system_type: Optional[str]
    floor_plan_url: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    items: List[InstallationItemRead] = []

    class Config:
        from_attributes = True
