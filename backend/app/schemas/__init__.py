from app.schemas.auth import TokenResponse, LoginRequest, RefreshRequest, UserCreate, UserRead, UserUpdate
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate, ProjectListItem
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentUpdate
from app.schemas.attachment import AttachmentRead
from app.schemas.survey import SurveyModuleCreate, SurveyModuleRead, SurveyModuleUpdate, SurveyItemCreate, SurveyItemRead, SurveyItemUpdate
from app.schemas.maintenance import MaintenanceModuleCreate, MaintenanceModuleRead, MaintenanceModuleUpdate, MaintenanceItemCreate, MaintenanceItemRead, MaintenanceItemUpdate
from app.schemas.installation import InstallationModuleCreate, InstallationModuleRead, InstallationModuleUpdate, InstallationItemCreate, InstallationItemRead, InstallationItemUpdate
from app.schemas.programming_handover import PHModuleCreate, PHModuleRead, PHModuleUpdate, PHItemCreate, PHItemRead, PHItemUpdate
from app.schemas.handover import HandoverModuleCreate, HandoverModuleRead, HandoverModuleUpdate, HandoverFileCreate, HandoverFileRead, HandoverFileUpdate
