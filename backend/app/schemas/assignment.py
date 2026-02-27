from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AssignmentCreate(BaseModel):
    user_ids: List[UUID]
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class AssignmentRead(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    assigned_by: UUID
    status: str
    assigned_at: datetime
    responded_at: Optional[datetime]
    notes: Optional[str]
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
