import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum as SAEnum, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SurveyModule(Base):
    __tablename__ = "survey_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    title = Column(String(500), nullable=False, default="Site Survey")
    description = Column(Text)
    site_name = Column(String(255))
    site_address = Column(Text)
    surveyor_notes = Column(Text)
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="survey_module")
    items = relationship("SurveyItem", back_populates="module", cascade="all, delete-orphan", order_by="SurveyItem.sort_order")
    completer = relationship("User", foreign_keys=[completed_by])


class SurveyItem(Base):
    __tablename__ = "survey_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_module_id = Column(UUID(as_uuid=True), ForeignKey("survey_modules.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    item_code = Column(String(100))
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(10, 3))
    unit = Column(String(50))
    condition = Column(String(100))
    remarks = Column(Text)
    is_existing = Column(Boolean, default=True)
    status = Column(SAEnum("pending", "in_progress", "completed", "failed", "skipped", name="item_status"), nullable=False, default="pending")
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    module = relationship("SurveyModule", back_populates="items")
    completer = relationship("User", foreign_keys=[completed_by])
