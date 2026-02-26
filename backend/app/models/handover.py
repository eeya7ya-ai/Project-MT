import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Enum as SAEnum, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class HandoverModule(Base):
    __tablename__ = "handover_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    title = Column(String(500), nullable=False, default="Handover")
    description = Column(Text)
    handover_date = Column(Date)
    client_rep_name = Column(String(255))
    client_rep_sign_url = Column(String(1000))
    tech_rep_name = Column(String(255))
    tech_rep_sign_url = Column(String(1000))
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="handover_module")
    required_files = relationship("HandoverRequiredFile", back_populates="module", cascade="all, delete-orphan", order_by="HandoverRequiredFile.sort_order")
    completer = relationship("User", foreign_keys=[completed_by])


class HandoverRequiredFile(Base):
    __tablename__ = "handover_required_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    handover_module_id = Column(UUID(as_uuid=True), ForeignKey("handover_modules.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    file_name = Column(String(500), nullable=False)
    description = Column(Text)
    is_required = Column(Boolean, nullable=False, default=True)
    is_uploaded = Column(Boolean, nullable=False, default=False)
    file_url = Column(String(1000))
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True))
    expiry_date = Column(Date)
    status = Column(SAEnum("pending", "in_progress", "completed", "failed", "skipped", name="item_status"), nullable=False, default="pending")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    module = relationship("HandoverModule", back_populates="required_files")
    uploader = relationship("User", foreign_keys=[uploaded_by])
