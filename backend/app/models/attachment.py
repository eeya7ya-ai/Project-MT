import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_url = Column(String(1000), nullable=False)
    file_size = Column(BigInteger)
    mime_type = Column(String(100))
    category = Column(SAEnum("photo", "document", "signature", "excel", "other", name="file_category"), nullable=False, default="other")
    entity_type = Column(String(100))
    entity_id = Column(UUID(as_uuid=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    project = relationship("Project", back_populates="attachments")
    uploader = relationship("User", foreign_keys=[uploaded_by])
