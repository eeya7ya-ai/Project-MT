from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_dispatcher
from app.models.project import Project, ProjectAssignment
from app.models.client import Client
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate, ProjectListItem

router = APIRouter(prefix="/projects", tags=["Projects"])


def _check_project_access(project: Project, user) -> bool:
    """Return True if user can access this project."""
    if user.role in ("admin", "dispatcher"):
        return True
    return any(a.user_id == user.id for a in project.assignments)


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    status: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = select(Project).options(selectinload(Project.client), selectinload(Project.assignments))

    if current_user.role == "technician":
        q = q.join(ProjectAssignment, ProjectAssignment.project_id == Project.id).where(
            ProjectAssignment.user_id == current_user.id
        )

    filters = []
    if status:
        filters.append(Project.status == status)
    if client_id:
        filters.append(Project.client_id == client_id)
    if filters:
        q = q.where(and_(*filters))

    q = q.order_by(Project.created_at.desc())
    result = await db.execute(q)
    projects = result.scalars().unique().all()

    items = []
    for p in projects:
        items.append(ProjectListItem(
            id=p.id,
            project_number=p.project_number,
            name=p.name,
            status=p.status,
            priority=p.priority,
            client_name=p.client.name if p.client else None,
            location=p.location,
            due_date=p.due_date,
            created_at=p.created_at,
        ))
    return items


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    project = Project(**body.model_dump(), created_by=current_user.id)
    db.add(project)
    await db.flush()
    return project


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Project).options(selectinload(Project.assignments)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _check_project_access(project, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    data = body.model_dump(exclude_unset=True)
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc)
    for k, v in data.items():
        setattr(project, k, v)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
