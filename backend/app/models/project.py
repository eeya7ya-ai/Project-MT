import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Enum as SAEnum, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    project_number = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    location = Column(String(500))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    status = Column(SAEnum("draft", "active", "in_progress", "completed", "cancelled", name="project_status"), nullable=False, default="draft")
    priority = Column(SAEnum("low", "medium", "high", "critical", name="priority_level"), nullable=False, default="medium")
    start_date = Column(Date)
    due_date = Column(Date)
    completed_at = Column(DateTime(timezone=True))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="projects")
    creator = relationship("User", foreign_keys=[created_by])
    assignments = relationship("ProjectAssignment", back_populates="project", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="project")
    survey_module = relationship("SurveyModule", back_populates="project", uselist=False)
    maintenance_modules = relationship("MaintenanceModule", back_populates="project")
    installation_modules = relationship("InstallationModule", back_populates="project")
    programming_handover_modules = relationship("ProgrammingHandoverModule", back_populates="project")
    handover_module = relationship("HandoverModule", back_populates="project", uselist=False)


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum("assigned", "accepted", "rejected", "completed", name="assignment_status"), nullable=False, default="assigned")
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    responded_at = Column(DateTime(timezone=True))
    notes = Column(Text)

    project = relationship("Project", back_populates="assignments")
    user = relationship("User", foreign_keys=[user_id], back_populates="assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])
