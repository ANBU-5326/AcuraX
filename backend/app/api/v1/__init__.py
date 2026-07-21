from fastapi import APIRouter
from app.api.v1 import (
    auth,
    users,
    documents,
    knowledge_articles,
    knowledge_bases,
    agents,
    chat,
    analytics,
    search,
    workflows,
    workspaces,
    settings,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Team"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(knowledge_articles.router, prefix="/knowledge-articles", tags=["Knowledge Articles"])
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["Knowledge Bases"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
api_router.include_router(chat.router, prefix="/chats", tags=["Chat"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflows"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
