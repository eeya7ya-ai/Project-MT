import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum as SAEnum, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ProgrammingHandoverModule(Base):
    __tablename__ = "programming_handover_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False, default="Programming & Handover")
    description = Column(Text)
    software_version = Column(String(100))
    license_key = Column(String(500))
    server_ip = Column(String(100))
    server_port = Column(Integer)
    training_notes = Column(Text)
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="programming_handover_modules")
    items = relationship("ProgrammingHandoverItem", back_populates="module", cascade="all, delete-orphan", order_by="ProgrammingHandoverItem.sort_order")
    completer = relationship("User", foreign_keys=[completed_by])


class ProgrammingHandoverItem(Base):
    __tablename__ = "programming_handover_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programming_handover_module_id = Column(UUID(as_uuid=True), ForeignKey("programming_handover_modules.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    item_code = Column(String(100))
    task_name = Column(String(500), nullable=False)
    description = Column(Text)
    device_name = Column(String(255))
    device_ip = Column(String(100))
    configuration_notes = Column(Text)
    is_programmed = Column(Boolean, default=False)
    is_tested = Column(Boolean, default=False)
    test_result = Column(String(100))
    status = Column(SAEnum("pending", "in_progress", "completed", "failed", "skipped", name="item_status"), nullable=False, default="pending")
    technician_notes = Column(Text)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    module = relationship("ProgrammingHandoverModule", back_populates="items")
    completer = relationship("User", foreign_keys=[completed_by])
