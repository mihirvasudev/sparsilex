from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import data, analysis, agent, project, report, share, session, files

app = FastAPI(
    title="SparsileX API",
    description="AI-native statistical analysis platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(project.router, prefix="/api/project", tags=["project"])
app.include_router(report.router, prefix="/api/report", tags=["report"])
app.include_router(share.router, prefix="/api/share", tags=["share"])
# session + files routers define their own /api/session prefix
app.include_router(session.router)
app.include_router(files.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
