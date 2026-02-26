from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class AttachmentRead(BaseModel):
    id: UUID
    project_id: Optional[UUID]
    uploaded_by: UUID
    file_name: str
    file_url: str
    file_size: Optional[int]
    mime_type: Optional[str]
    category: str
    entity_type: Optional[str]
    entity_id: Optional[UUID]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
