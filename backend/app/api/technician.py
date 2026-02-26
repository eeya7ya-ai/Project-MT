"""
Technician-specific endpoints:
- My assigned projects
- My schedule (projects with due dates)
- Sync endpoint for offline cache
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project, ProjectAssignment
from app.models.survey import SurveyModule
from app.models.maintenance import MaintenanceModule
from app.models.installation import InstallationModule
from app.models.programming_handover import ProgrammingHandoverModule
from app.models.handover import HandoverModule

router = APIRouter(prefix="/technician", tags=["Technician"])


@router.get("/my-projects")
async def my_projects(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all projects assigned to the current technician."""
    q = (
        select(Project)
        .join(ProjectAssignment, ProjectAssignment.project_id == Project.id)
        .options(
            selectinload(Project.client),
            selectinload(Project.assignments),
        )
        .where(ProjectAssignment.user_id == current_user.id)
    )
    if status:
        q = q.where(Project.status == status)
    q = q.order_by(Project.due_date.asc().nullslast())
    result = await db.execute(q)
    projects = result.scalars().unique().all()

    return [
        {
            "id": str(p.id),
            "project_number": p.project_number,
            "name": p.name,
            "status": p.status,
            "priority": p.priority,
            "client_name": p.client.name if p.client else None,
            "location": p.location,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "due_date": p.due_date.isoformat() if p.due_date else None,
        }
        for p in projects
    ]


@router.get("/my-schedule")
async def my_schedule(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return projects + due dates for calendar view."""
    q = (
        select(Project)
        .join(ProjectAssignment, ProjectAssignment.project_id == Project.id)
        .options(selectinload(Project.client))
        .where(
            ProjectAssignment.user_id == current_user.id,
            Project.due_date.isnot(None),
        )
    )
    if from_date:
        q = q.where(Project.due_date >= from_date)
    if to_date:
        q = q.where(Project.due_date <= to_date)
    q = q.order_by(Project.due_date.asc())

    result = await db.execute(q)
    projects = result.scalars().unique().all()

    return [
        {
            "project_id": str(p.id),
            "project_number": p.project_number,
            "name": p.name,
            "client_name": p.client.name if p.client else None,
            "due_date": p.due_date.isoformat(),
            "status": p.status,
            "priority": p.priority,
        }
        for p in projects
    ]


@router.get("/sync/{project_id}")
async def sync_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Full project data snapshot for offline SQLite sync.
    Returns project + all module data in one response.
    """
    # Verify access
    assign_result = await db.execute(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.user_id == current_user.id,
        )
    )
    if not assign_result.scalar_one_or_none() and current_user.role not in ("admin", "dispatcher"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    project_result = await db.execute(
        select(Project)
        .options(selectinload(Project.client))
        .where(Project.id == project_id)
    )
    p = project_result.scalar_one_or_none()
    if not p:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")

    def _module_base(m):
        return {
            "id": str(m.id),
            "title": m.title,
            "is_completed": m.is_completed,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat(),
        }

    def _item_base(item, id_field: str):
        d = {
            "id": str(item.id),
            id_field: str(getattr(item, id_field)),
            "sort_order": item.sort_order,
            "status": item.status,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }
        return d

    payload: dict = {
        "project": {
            "id": str(p.id),
            "project_number": p.project_number,
            "name": p.name,
            "description": p.description,
            "location": p.location,
            "status": p.status,
            "priority": p.priority,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "client_name": p.client.name if p.client else None,
        },
        "modules": {}
    }

    # Survey
    sr = await db.execute(
        select(SurveyModule).options(selectinload(SurveyModule.items)).where(SurveyModule.project_id == project_id)
    )
    sm = sr.scalar_one_or_none()
    if sm:
        mod = _module_base(sm)
        mod["items"] = [
            {**_item_base(i, "survey_module_id"), "description": i.description,
             "item_code": i.item_code, "quantity": str(i.quantity) if i.quantity else None,
             "unit": i.unit, "condition": i.condition, "remarks": i.remarks}
            for i in sm.items
        ]
        payload["modules"]["survey"] = mod

    # Maintenance
    mr = await db.execute(
        select(MaintenanceModule).options(selectinload(MaintenanceModule.items)).where(MaintenanceModule.project_id == project_id)
    )
    mods = mr.scalars().all()
    payload["modules"]["maintenance"] = []
    for mm in mods:
        mod = _module_base(mm)
        mod["items"] = [
            {**_item_base(i, "maintenance_module_id"), "description": i.description,
             "item_code": i.item_code, "asset_tag": i.asset_tag, "task_description": i.task_description}
            for i in mm.items
        ]
        payload["modules"]["maintenance"].append(mod)

    # Installation
    ir = await db.execute(
        select(InstallationModule).options(selectinload(InstallationModule.items)).where(InstallationModule.project_id == project_id)
    )
    imods = ir.scalars().all()
    payload["modules"]["installation"] = []
    for im in imods:
        mod = _module_base(im)
        mod["items"] = [
            {**_item_base(i, "installation_module_id"), "description": i.description,
             "item_code": i.item_code, "brand": i.brand, "model": i.model,
             "quantity": str(i.quantity), "location_zone": i.location_zone}
            for i in im.items
        ]
        payload["modules"]["installation"].append(mod)

    # Programming & Handover
    pr = await db.execute(
        select(ProgrammingHandoverModule).options(selectinload(ProgrammingHandoverModule.items)).where(ProgrammingHandoverModule.project_id == project_id)
    )
    pmods = pr.scalars().all()
    payload["modules"]["programming_handover"] = []
    for pm in pmods:
        mod = _module_base(pm)
        mod["items"] = [
            {**_item_base(i, "programming_handover_module_id"), "task_name": i.task_name,
             "device_name": i.device_name, "device_ip": i.device_ip, "is_programmed": i.is_programmed}
            for i in pm.items
        ]
        payload["modules"]["programming_handover"].append(mod)

    # Handover
    hr = await db.execute(
        select(HandoverModule).options(selectinload(HandoverModule.required_files)).where(HandoverModule.project_id == project_id)
    )
    hm = hr.scalar_one_or_none()
    if hm:
        mod = _module_base(hm)
        mod["required_files"] = [
            {**_item_base(f, "handover_module_id"), "file_name": f.file_name,
             "is_required": f.is_required, "is_uploaded": f.is_uploaded, "file_url": f.file_url}
            for f in hm.required_files
        ]
        payload["modules"]["handover"] = mod

    return payload
