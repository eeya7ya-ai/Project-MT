from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_dispatcher
from app.models.project import Project, ProjectAssignment
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentUpdate

router = APIRouter(prefix="/projects/{project_id}/assignments", tags=["Assignments"])


async def _get_project_or_404(project_id: str, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=list[AssignmentRead])
async def list_assignments(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _get_project_or_404(project_id, db)
    result = await db.execute(
        select(ProjectAssignment)
        .options(selectinload(ProjectAssignment.user))
        .where(ProjectAssignment.project_id == project_id)
    )
    assignments = result.scalars().all()
    return [
        AssignmentRead(
            id=a.id,
            project_id=a.project_id,
            user_id=a.user_id,
            assigned_by=a.assigned_by,
            status=a.status,
            assigned_at=a.assigned_at,
            responded_at=a.responded_at,
            notes=a.notes,
            user_full_name=a.user.full_name if a.user else None,
            user_email=a.user.email if a.user else None,
        )
        for a in assignments
    ]


@router.post("", response_model=list[AssignmentRead], status_code=201)
async def assign_technicians(
    project_id: str,
    body: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _get_project_or_404(project_id, db)

    created = []
    for uid in body.user_ids:
        # Check user exists and is a technician
        res = await db.execute(select(User).where(User.id == uid))
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail=f"User {uid} not found")

        # Upsert: skip if already assigned
        existing = await db.execute(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.user_id == uid,
            )
        )
        if existing.scalar_one_or_none():
            continue

        a = ProjectAssignment(
            project_id=project_id,
            user_id=uid,
            assigned_by=current_user.id,
            notes=body.notes,
        )
        db.add(a)
        await db.flush()
        created.append(AssignmentRead(
            id=a.id,
            project_id=a.project_id,
            user_id=a.user_id,
            assigned_by=a.assigned_by,
            status=a.status,
            assigned_at=a.assigned_at,
            responded_at=a.responded_at,
            notes=a.notes,
            user_full_name=user.full_name,
            user_email=user.email,
        ))

    return created


@router.patch("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    project_id: str,
    assignment_id: str,
    body: AssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(ProjectAssignment)
        .options(selectinload(ProjectAssignment.user))
        .where(
            ProjectAssignment.id == assignment_id,
            ProjectAssignment.project_id == project_id,
        )
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Technicians can only update their own assignment status
    if current_user.role == "technician" and a.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    a.status = body.status
    if body.notes is not None:
        a.notes = body.notes
    a.responded_at = datetime.now(timezone.utc)

    return AssignmentRead(
        id=a.id,
        project_id=a.project_id,
        user_id=a.user_id,
        assigned_by=a.assigned_by,
        status=a.status,
        assigned_at=a.assigned_at,
        responded_at=a.responded_at,
        notes=a.notes,
        user_full_name=a.user.full_name if a.user else None,
        user_email=a.user.email if a.user else None,
    )


@router.delete("/{assignment_id}", status_code=204)
async def remove_assignment(
    project_id: str,
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(
        select(ProjectAssignment).where(
            ProjectAssignment.id == assignment_id,
            ProjectAssignment.project_id == project_id,
        )
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(a)
