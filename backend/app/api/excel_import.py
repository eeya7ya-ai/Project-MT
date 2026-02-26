"""
Excel import endpoints for all 5 module item types.
Flow:
  1. POST /import/preview  -> upload .xlsx, get back headers + sample rows
  2. POST /import/{module_type}/{module_id} -> upload .xlsx + column_map -> create items
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import json

from app.core.database import get_db
from app.core.security import get_current_user, require_admin_or_dispatcher
from app.utils.excel_parser import parse_excel, get_excel_headers
from app.models.survey import SurveyModule, SurveyItem
from app.models.maintenance import MaintenanceModule, MaintenanceItem
from app.models.installation import InstallationModule, InstallationItem
from app.models.programming_handover import ProgrammingHandoverModule, ProgrammingHandoverItem
from app.models.handover import HandoverModule, HandoverRequiredFile

router = APIRouter(prefix="/import", tags=["Excel Import"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def _read_upload(file: UploadFile) -> bytes:
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx / .xls files are accepted")
    return content


@router.post("/preview")
async def preview_excel(
    file: UploadFile = File(...),
    _=Depends(get_current_user),
):
    """Return headers and first 5 sample rows so the client can build a column-map UI."""
    content = await _read_upload(file)
    headers = get_excel_headers(content)
    rows = parse_excel(content)
    return {
        "headers": headers,
        "sample_rows": rows[:5],
        "total_rows": len(rows),
    }


def _safe_str(v) -> Optional[str]:
    return str(v).strip() if v is not None else None


def _safe_decimal(v):
    try:
        return float(v) if v is not None else None
    except (ValueError, TypeError):
        return None


def _safe_bool(v) -> Optional[bool]:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower() in ("yes", "true", "1", "y")
    return None


@router.post("/survey/{module_id}")
async def import_survey_items(
    module_id: str,
    file: UploadFile = File(...),
    column_map: str = Form("{}"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(SurveyModule).where(SurveyModule.id == module_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Survey module not found")

    content = await _read_upload(file)
    col_map = json.loads(column_map)
    rows = parse_excel(content, col_map)

    created = []
    for i, row in enumerate(rows):
        desc = _safe_str(row.get("description"))
        if not desc:
            continue
        item = SurveyItem(
            survey_module_id=module_id,
            sort_order=i,
            item_code=_safe_str(row.get("item_code")),
            description=desc,
            quantity=_safe_decimal(row.get("quantity")),
            unit=_safe_str(row.get("unit")),
            condition=_safe_str(row.get("condition")),
            remarks=_safe_str(row.get("remarks")),
        )
        db.add(item)
        created.append(item)

    await db.flush()
    return {"imported": len(created)}


@router.post("/maintenance/{module_id}")
async def import_maintenance_items(
    module_id: str,
    file: UploadFile = File(...),
    column_map: str = Form("{}"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(MaintenanceModule).where(MaintenanceModule.id == module_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    content = await _read_upload(file)
    col_map = json.loads(column_map)
    rows = parse_excel(content, col_map)

    created = []
    for i, row in enumerate(rows):
        desc = _safe_str(row.get("description"))
        if not desc:
            continue
        item = MaintenanceItem(
            maintenance_module_id=module_id,
            sort_order=i,
            item_code=_safe_str(row.get("item_code")),
            asset_tag=_safe_str(row.get("asset_tag")),
            description=desc,
            task_description=_safe_str(row.get("task_description")),
            quantity=_safe_decimal(row.get("quantity")),
            unit=_safe_str(row.get("unit")),
            parts_required=_safe_str(row.get("parts_required")),
            labor_hours=_safe_decimal(row.get("labor_hours")),
        )
        db.add(item)
        created.append(item)

    await db.flush()
    return {"imported": len(created)}


@router.post("/installation/{module_id}")
async def import_installation_items(
    module_id: str,
    file: UploadFile = File(...),
    column_map: str = Form("{}"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(InstallationModule).where(InstallationModule.id == module_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    content = await _read_upload(file)
    col_map = json.loads(column_map)
    rows = parse_excel(content, col_map)

    created = []
    for i, row in enumerate(rows):
        desc = _safe_str(row.get("description"))
        if not desc:
            continue
        item = InstallationItem(
            installation_module_id=module_id,
            sort_order=i,
            item_code=_safe_str(row.get("item_code")),
            part_number=_safe_str(row.get("part_number")),
            description=desc,
            brand=_safe_str(row.get("brand")),
            model=_safe_str(row.get("model")),
            quantity=_safe_decimal(row.get("quantity")) or 1,
            unit=_safe_str(row.get("unit")),
            location_zone=_safe_str(row.get("location_zone")),
            floor_level=_safe_str(row.get("floor_level")),
        )
        db.add(item)
        created.append(item)

    await db.flush()
    return {"imported": len(created)}


@router.post("/programming-handover/{module_id}")
async def import_ph_items(
    module_id: str,
    file: UploadFile = File(...),
    column_map: str = Form("{}"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(ProgrammingHandoverModule).where(ProgrammingHandoverModule.id == module_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    content = await _read_upload(file)
    col_map = json.loads(column_map)
    rows = parse_excel(content, col_map)

    created = []
    for i, row in enumerate(rows):
        task = _safe_str(row.get("task_name")) or _safe_str(row.get("description"))
        if not task:
            continue
        item = ProgrammingHandoverItem(
            programming_handover_module_id=module_id,
            sort_order=i,
            item_code=_safe_str(row.get("item_code")),
            task_name=task,
            description=_safe_str(row.get("description")),
            device_name=_safe_str(row.get("device_name")),
            device_ip=_safe_str(row.get("device_ip")),
        )
        db.add(item)
        created.append(item)

    await db.flush()
    return {"imported": len(created)}


@router.post("/handover/{module_id}")
async def import_handover_files(
    module_id: str,
    file: UploadFile = File(...),
    column_map: str = Form("{}"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(HandoverModule).where(HandoverModule.id == module_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Module not found")

    content = await _read_upload(file)
    col_map = json.loads(column_map)
    rows = parse_excel(content, col_map)

    created = []
    for i, row in enumerate(rows):
        fname = _safe_str(row.get("file_name")) or _safe_str(row.get("description"))
        if not fname:
            continue
        f = HandoverRequiredFile(
            handover_module_id=module_id,
            sort_order=i,
            file_name=fname,
            description=_safe_str(row.get("description")),
            is_required=_safe_bool(row.get("is_required")) if row.get("is_required") is not None else True,
            notes=_safe_str(row.get("notes")),
        )
        db.add(f)
        created.append(f)

    await db.flush()
    return {"imported": len(created)}
