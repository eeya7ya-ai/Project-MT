import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum as SAEnum, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class InstallationModule(Base):
    __tablename__ = "installation_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False, default="Installation")
    description = Column(Text)
    system_type = Column(String(255))
    floor_plan_url = Column(String(1000))
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="installation_modules")
    items = relationship("InstallationItem", back_populates="module", cascade="all, delete-orphan", order_by="InstallationItem.sort_order")
    completer = relationship("User", foreign_keys=[completed_by])


class InstallationItem(Base):
    __tablename__ = "installation_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    installation_module_id = Column(UUID(as_uuid=True), ForeignKey("installation_modules.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    item_code = Column(String(100))
    part_number = Column(String(100))
    description = Column(Text, nullable=False)
    brand = Column(String(100))
    model = Column(String(100))
    quantity = Column(Numeric(10, 3), nullable=False, default=1)
    unit = Column(String(50))
    location_zone = Column(String(255))
    floor_level = Column(String(100))
    installation_notes = Column(Text)
    is_tested = Column(Boolean, default=False)
    test_result = Column(String(100))
    status = Column(SAEnum("pending", "in_progress", "completed", "failed", "skipped", name="item_status"), nullable=False, default="pending")
    technician_notes = Column(Text)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    module = relationship("InstallationModule", back_populates="items")
    completer = relationship("User", foreign_keys=[completed_by])
