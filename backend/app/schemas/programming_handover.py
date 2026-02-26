from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class PHItemCreate(BaseModel):
    sort_order: int = 0
    item_code: Optional[str] = None
    task_name: str
    description: Optional[str] = None
    device_name: Optional[str] = None
    device_ip: Optional[str] = None
    configuration_notes: Optional[str] = None


class PHItemUpdate(BaseModel):
    sort_order: Optional[int] = None
    item_code: Optional[str] = None
    task_name: Optional[str] = None
    description: Optional[str] = None
    device_name: Optional[str] = None
    device_ip: Optional[str] = None
    configuration_notes: Optional[str] = None
    is_programmed: Optional[bool] = None
    is_tested: Optional[bool] = None
    test_result: Optional[str] = None
    status: Optional[str] = None
    technician_notes: Optional[str] = None


class PHItemRead(BaseModel):
    id: UUID
    programming_handover_module_id: UUID
    sort_order: int
    item_code: Optional[str]
    task_name: str
    description: Optional[str]
    device_name: Optional[str]
    device_ip: Optional[str]
    configuration_notes: Optional[str]
    is_programmed: Optional[bool]
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


class PHModuleCreate(BaseModel):
    title: str = "Programming & Handover"
    description: Optional[str] = None
    software_version: Optional[str] = None
    license_key: Optional[str] = None
    server_ip: Optional[str] = None
    server_port: Optional[int] = None
    training_notes: Optional[str] = None


class PHModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    software_version: Optional[str] = None
    license_key: Optional[str] = None
    server_ip: Optional[str] = None
    server_port: Optional[int] = None
    training_notes: Optional[str] = None
    is_completed: Optional[bool] = None


class PHModuleRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    software_version: Optional[str]
    license_key: Optional[str]
    server_ip: Optional[str]
    server_port: Optional[int]
    training_notes: Optional[str]
    is_completed: bool
    completed_at: Optional[datetime]
    completed_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    items: List[PHItemRead] = []

    class Config:
        from_attributes = True
