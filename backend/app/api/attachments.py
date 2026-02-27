import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentRead

router = APIRouter(prefix="/attachments", tags=["Attachments"])


@router.post("", response_model=AttachmentRead, status_code=201)
async def upload_attachment(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    category: str = Form("other"),
    entity_type: Optional[str] = Form(None),
    entity_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB} MB limit")

    # Persist to local storage (replace with S3/GCS in production)
    upload_dir = os.path.join(settings.UPLOAD_DIR, project_id or "general")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, stored_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    relative_url = f"/attachments/files/{project_id or 'general'}/{stored_name}"

    attachment = Attachment(
        project_id=project_id,
        uploaded_by=current_user.id,
        file_name=file.filename or stored_name,
        file_url=relative_url,
        file_size=file_size,
        mime_type=file.content_type,
        category=category,
        entity_type=entity_type,
        entity_id=entity_id,
        notes=notes,
    )
    db.add(attachment)
    await db.flush()
    return attachment


@router.get("/files/{project_id}/{filename}")
async def serve_file(project_id: str, filename: str, _=Depends(get_current_user)):
    file_path = os.path.join(settings.UPLOAD_DIR, project_id, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.get("", response_model=list[AttachmentRead])
async def list_attachments(
    project_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Attachment)
    if project_id:
        q = q.where(Attachment.project_id == project_id)
    if entity_type:
        q = q.where(Attachment.entity_type == entity_type)
    if entity_id:
        q = q.where(Attachment.entity_id == entity_id)
    q = q.order_by(Attachment.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.delete("/{attachment_id}", status_code=204)
async def delete_attachment(attachment_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Attachment).where(Attachment.id == attachment_id))
    att = result.scalar_one_or_none()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if att.uploaded_by != current_user.id and current_user.role not in ("admin", "dispatcher"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Remove from disk
    if att.file_url.startswith("/attachments/files/"):
        rel_path = att.file_url.replace("/attachments/files/", "", 1)
        disk_path = os.path.join(settings.UPLOAD_DIR, rel_path)
        if os.path.isfile(disk_path):
            os.remove(disk_path)

    await db.delete(att)
