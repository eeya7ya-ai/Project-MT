"""
Module CRUD endpoints for all 5 module types.
All module endpoints enforce project access control.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_dispatcher
from app.models.project import Project, ProjectAssignment
from app.models.survey import SurveyModule, SurveyItem
from app.models.maintenance import MaintenanceModule, MaintenanceItem
from app.models.installation import InstallationModule, InstallationItem
from app.models.programming_handover import ProgrammingHandoverModule, ProgrammingHandoverItem
from app.models.handover import HandoverModule, HandoverRequiredFile

from app.schemas.survey import SurveyModuleCreate, SurveyModuleRead, SurveyModuleUpdate, SurveyItemCreate, SurveyItemRead, SurveyItemUpdate
from app.schemas.maintenance import MaintenanceModuleCreate, MaintenanceModuleRead, MaintenanceModuleUpdate, MaintenanceItemCreate, MaintenanceItemRead, MaintenanceItemUpdate
from app.schemas.installation import InstallationModuleCreate, InstallationModuleRead, InstallationModuleUpdate, InstallationItemCreate, InstallationItemRead, InstallationItemUpdate
from app.schemas.programming_handover import PHModuleCreate, PHModuleRead, PHModuleUpdate, PHItemCreate, PHItemRead, PHItemUpdate
from app.schemas.handover import HandoverModuleCreate, HandoverModuleRead, HandoverModuleUpdate, HandoverFileCreate, HandoverFileRead, HandoverFileUpdate

router = APIRouter(tags=["Modules"])


async def _assert_project_access(project_id: str, user, db: AsyncSession):
    result = await db.execute(
        select(Project).options(selectinload(Project.assignments)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role not in ("admin", "dispatcher"):
        assigned = any(a.user_id == user.id for a in project.assignments)
        if not assigned:
            raise HTTPException(status_code=403, detail="Access denied")
    return project


# ──────────────────────────────────────────────────────────
# SURVEY MODULE
# ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/survey", response_model=SurveyModuleRead, status_code=201)
async def create_survey_module(
    project_id: str, body: SurveyModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    existing = await db.execute(select(SurveyModule).where(SurveyModule.project_id == project_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Survey module already exists for this project")
    m = SurveyModule(**body.model_dump(), project_id=project_id)
    db.add(m)
    await db.flush()
    await db.refresh(m, ["items"])
    return m


@router.get("/projects/{project_id}/survey", response_model=SurveyModuleRead)
async def get_survey_module(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(SurveyModule).options(selectinload(SurveyModule.items)).where(SurveyModule.project_id == project_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Survey module not found")
    return m


@router.patch("/projects/{project_id}/survey/{module_id}", response_model=SurveyModuleRead)
async def update_survey_module(
    project_id: str, module_id: str, body: SurveyModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(SurveyModule).options(selectinload(SurveyModule.items)).where(SurveyModule.id == module_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Survey module not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_completed"):
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(m, k, v)
    return m


# Survey Items
@router.post("/survey/{module_id}/items", response_model=SurveyItemRead, status_code=201)
async def create_survey_item(module_id: str, body: SurveyItemCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(SurveyModule).where(SurveyModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Survey module not found")
    await _assert_project_access(str(m.project_id), current_user, db)
    item = SurveyItem(**body.model_dump(), survey_module_id=module_id)
    db.add(item)
    await db.flush()
    return item


@router.patch("/survey/items/{item_id}", response_model=SurveyItemRead)
async def update_survey_item(item_id: str, body: SurveyItemUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(SurveyItem).where(SurveyItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(item, k, v)
    return item


@router.delete("/survey/items/{item_id}", status_code=204)
async def delete_survey_item(item_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin_or_dispatcher)):
    result = await db.execute(select(SurveyItem).where(SurveyItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


# ──────────────────────────────────────────────────────────
# MAINTENANCE MODULE
# ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/maintenance", response_model=MaintenanceModuleRead, status_code=201)
async def create_maintenance_module(
    project_id: str, body: MaintenanceModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    m = MaintenanceModule(**body.model_dump(), project_id=project_id)
    db.add(m)
    await db.flush()
    await db.refresh(m, ["items"])
    return m


@router.get("/projects/{project_id}/maintenance", response_model=list[MaintenanceModuleRead])
async def list_maintenance_modules(project_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(MaintenanceModule).options(selectinload(MaintenanceModule.items)).where(MaintenanceModule.project_id == project_id)
    )
    return result.scalars().all()


@router.patch("/maintenance/{module_id}", response_model=MaintenanceModuleRead)
async def update_maintenance_module(
    module_id: str, body: MaintenanceModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(
        select(MaintenanceModule).options(selectinload(MaintenanceModule.items)).where(MaintenanceModule.id == module_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance module not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_completed"):
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(m, k, v)
    return m


@router.post("/maintenance/{module_id}/items", response_model=MaintenanceItemRead, status_code=201)
async def create_maintenance_item(module_id: str, body: MaintenanceItemCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(MaintenanceModule).where(MaintenanceModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    await _assert_project_access(str(m.project_id), current_user, db)
    item = MaintenanceItem(**body.model_dump(), maintenance_module_id=module_id)
    db.add(item)
    await db.flush()
    return item


@router.patch("/maintenance/items/{item_id}", response_model=MaintenanceItemRead)
async def update_maintenance_item(item_id: str, body: MaintenanceItemUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(MaintenanceItem).where(MaintenanceItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(item, k, v)
    return item


@router.delete("/maintenance/items/{item_id}", status_code=204)
async def delete_maintenance_item(item_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin_or_dispatcher)):
    result = await db.execute(select(MaintenanceItem).where(MaintenanceItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


# ──────────────────────────────────────────────────────────
# INSTALLATION MODULE
# ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/installation", response_model=InstallationModuleRead, status_code=201)
async def create_installation_module(
    project_id: str, body: InstallationModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    m = InstallationModule(**body.model_dump(), project_id=project_id)
    db.add(m)
    await db.flush()
    await db.refresh(m, ["items"])
    return m


@router.get("/projects/{project_id}/installation", response_model=list[InstallationModuleRead])
async def list_installation_modules(project_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(InstallationModule).options(selectinload(InstallationModule.items)).where(InstallationModule.project_id == project_id)
    )
    return result.scalars().all()


@router.patch("/installation/{module_id}", response_model=InstallationModuleRead)
async def update_installation_module(
    module_id: str, body: InstallationModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(
        select(InstallationModule).options(selectinload(InstallationModule.items)).where(InstallationModule.id == module_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Installation module not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_completed"):
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(m, k, v)
    return m


@router.post("/installation/{module_id}/items", response_model=InstallationItemRead, status_code=201)
async def create_installation_item(module_id: str, body: InstallationItemCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(InstallationModule).where(InstallationModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    await _assert_project_access(str(m.project_id), current_user, db)
    item = InstallationItem(**body.model_dump(), installation_module_id=module_id)
    db.add(item)
    await db.flush()
    return item


@router.patch("/installation/items/{item_id}", response_model=InstallationItemRead)
async def update_installation_item(item_id: str, body: InstallationItemUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(InstallationItem).where(InstallationItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(item, k, v)
    return item


@router.delete("/installation/items/{item_id}", status_code=204)
async def delete_installation_item(item_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin_or_dispatcher)):
    result = await db.execute(select(InstallationItem).where(InstallationItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


# ──────────────────────────────────────────────────────────
# PROGRAMMING & HANDOVER MODULE
# ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/programming-handover", response_model=PHModuleRead, status_code=201)
async def create_ph_module(
    project_id: str, body: PHModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    m = ProgrammingHandoverModule(**body.model_dump(), project_id=project_id)
    db.add(m)
    await db.flush()
    await db.refresh(m, ["items"])
    return m


@router.get("/projects/{project_id}/programming-handover", response_model=list[PHModuleRead])
async def list_ph_modules(project_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(ProgrammingHandoverModule).options(selectinload(ProgrammingHandoverModule.items)).where(ProgrammingHandoverModule.project_id == project_id)
    )
    return result.scalars().all()


@router.patch("/programming-handover/{module_id}", response_model=PHModuleRead)
async def update_ph_module(
    module_id: str, body: PHModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(
        select(ProgrammingHandoverModule).options(selectinload(ProgrammingHandoverModule.items)).where(ProgrammingHandoverModule.id == module_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_completed"):
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(m, k, v)
    return m


@router.post("/programming-handover/{module_id}/items", response_model=PHItemRead, status_code=201)
async def create_ph_item(module_id: str, body: PHItemCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ProgrammingHandoverModule).where(ProgrammingHandoverModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    await _assert_project_access(str(m.project_id), current_user, db)
    item = ProgrammingHandoverItem(**body.model_dump(), programming_handover_module_id=module_id)
    db.add(item)
    await db.flush()
    return item


@router.patch("/programming-handover/items/{item_id}", response_model=PHItemRead)
async def update_ph_item(item_id: str, body: PHItemUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ProgrammingHandoverItem).where(ProgrammingHandoverItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("status") == "completed":
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(item, k, v)
    return item


@router.delete("/programming-handover/items/{item_id}", status_code=204)
async def delete_ph_item(item_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin_or_dispatcher)):
    result = await db.execute(select(ProgrammingHandoverItem).where(ProgrammingHandoverItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


# ──────────────────────────────────────────────────────────
# HANDOVER MODULE
# ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/handover", response_model=HandoverModuleRead, status_code=201)
async def create_handover_module(
    project_id: str, body: HandoverModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    await _assert_project_access(project_id, current_user, db)
    existing = await db.execute(select(HandoverModule).where(HandoverModule.project_id == project_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Handover module already exists for this project")
    m = HandoverModule(**body.model_dump(), project_id=project_id)
    db.add(m)
    await db.flush()
    await db.refresh(m, ["required_files"])
    return m


@router.get("/projects/{project_id}/handover", response_model=HandoverModuleRead)
async def get_handover_module(project_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await _assert_project_access(project_id, current_user, db)
    result = await db.execute(
        select(HandoverModule).options(selectinload(HandoverModule.required_files)).where(HandoverModule.project_id == project_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Handover module not found")
    return m


@router.patch("/handover/{module_id}", response_model=HandoverModuleRead)
async def update_handover_module(
    module_id: str, body: HandoverModuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin_or_dispatcher),
):
    result = await db.execute(
        select(HandoverModule).options(selectinload(HandoverModule.required_files)).where(HandoverModule.id == module_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_completed"):
        data["completed_at"] = datetime.now(timezone.utc)
        data["completed_by"] = current_user.id
    for k, v in data.items():
        setattr(m, k, v)
    return m


@router.post("/handover/{module_id}/files", response_model=HandoverFileRead, status_code=201)
async def create_handover_file(module_id: str, body: HandoverFileCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(HandoverModule).where(HandoverModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    await _assert_project_access(str(m.project_id), current_user, db)
    f = HandoverRequiredFile(**body.model_dump(), handover_module_id=module_id)
    db.add(f)
    await db.flush()
    return f


@router.patch("/handover/files/{file_id}", response_model=HandoverFileRead)
async def update_handover_file(file_id: str, body: HandoverFileUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(HandoverRequiredFile).where(HandoverRequiredFile.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_uploaded"):
        data["uploaded_by"] = current_user.id
        data["uploaded_at"] = datetime.now(timezone.utc)
    for k, v in data.items():
        setattr(f, k, v)
    return f


@router.delete("/handover/files/{file_id}", status_code=204)
async def delete_handover_file(file_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin_or_dispatcher)):
    result = await db.execute(select(HandoverRequiredFile).where(HandoverRequiredFile.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    await db.delete(f)
