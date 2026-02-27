import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Enum as SAEnum, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MaintenanceModule(Base):
    __tablename__ = "maintenance_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False, default="Maintenance")
    description = Column(Text)
    maintenance_type = Column(String(100))
    scheduled_date = Column(Date)
    frequency = Column(String(100))
    contract_ref = Column(String(255))
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="maintenance_modules")
    items = relationship("MaintenanceItem", back_populates="module", cascade="all, delete-orphan", order_by="MaintenanceItem.sort_order")
    completer = relationship("User", foreign_keys=[completed_by])


class MaintenanceItem(Base):
    __tablename__ = "maintenance_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    maintenance_module_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_modules.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    item_code = Column(String(100))
    asset_tag = Column(String(100))
    description = Column(Text, nullable=False)
    task_description = Column(Text)
    quantity = Column(Numeric(10, 3))
    unit = Column(String(50))
    parts_required = Column(Text)
    parts_available = Column(Boolean)
    labor_hours = Column(Numeric(6, 2))
    status = Column(SAEnum("pending", "in_progress", "completed", "failed", "skipped", name="item_status"), nullable=False, default="pending")
    technician_notes = Column(Text)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    module = relationship("MaintenanceModule", back_populates="items")
    completer = relationship("User", foreign_keys=[completed_by])
