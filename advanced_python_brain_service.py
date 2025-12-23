#!/usr/bin/env python3
"""
خدمة Python المتقدمة للتفريغ السينمائي (UI & API)
Advanced Python Brain Service for Three-Read Breakdown System

API Endpoints:
- POST /api/upload: Upload script for processing.
- GET /api/status/{job_id}: Check processing status.
- GET /api/report/{job_id}: Download report.
- GET /: Web Interface.
"""

import os
import uuid
import shutil
import asyncio
import logging
from typing import Dict, Optional, List, Any
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import Revolutionary Breakdown Logic
try:
    from revolutionary_breakdown_system_v4 import (
        RevolutionarySceneParser,
        SystemConfig,
        split_scenes,
        HTMLRenderer,
        DetailedBreakdown,
        LoggerFactory
    )
except ImportError:
    # Fallback or error handling if running in a different context
    import sys
    sys.path.append(str(Path(__file__).parent))
    from revolutionary_breakdown_system_v4 import (
        RevolutionarySceneParser,
        SystemConfig,
        split_scenes,
        HTMLRenderer,
        DetailedBreakdown,
        LoggerFactory
    )

# Setup Logging
logger = logging.getLogger("BrainService")
logging.basicConfig(level=logging.INFO)

# Initialize FastAPI
app = FastAPI(title="Revolutionary Breakdown System API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
TEMPLATES_DIR = Path("templates")

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR.mkdir(exist_ok=True)

# Templates
templates = Jinja2Templates(directory="templates")

# Job Storage (In-Memory)
# Structure: job_id -> {status, progress, total, message, result_path, error, timestamp}
jobs: Dict[str, Dict[str, Any]] = {}

# Pydantic Models
class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    total_scenes: int
    message: str
    result_url: Optional[str] = None
    error: Optional[str] = None

# Background Task
async def process_script_task(job_id: str, file_path: Path, config: SystemConfig):
    """
    Background task to process the script.
    """
    logger.info(f"Starting job {job_id}")
    jobs[job_id]["status"] = "processing"
    jobs[job_id]["message"] = "Reading file..."
    
    try:
        # Read file
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Split scenes
        jobs[job_id]["message"] = "Splitting scenes..."
        scenes_data = split_scenes(content)
        total_scenes = len(scenes_data)
        jobs[job_id]["total_scenes"] = total_scenes

        if total_scenes == 0:
            raise ValueError("No scenes found in the script.")

        # Initialize Parser
        parser = RevolutionarySceneParser(config)

        # Process scenes
        processed_scenes = []
        for i, (scene_num, scene_text) in enumerate(scenes_data):
            jobs[job_id]["message"] = f"Analyzing scene {scene_num}..."
            # Update progress more frequently
            jobs[job_id]["progress"] = int((i / total_scenes) * 90) # up to 90%

            # Analyze
            breakdown = await parser.analyze_scene(scene_text, scene_num)
            processed_scenes.append(breakdown)

        # Generate HTML
        jobs[job_id]["message"] = "Generating report..."
        jobs[job_id]["progress"] = 95

        html_output = HTMLRenderer.render_full_document(processed_scenes)

        # Save Report
        output_filename = f"report_{job_id}.html"
        output_path = OUTPUT_DIR / output_filename

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html_output)

        # Complete
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["message"] = "Completed successfully."
        jobs[job_id]["result_path"] = str(output_path)

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = "Processing failed."
        jobs[job_id]["error"] = str(e)
    finally:
        # Cleanup upload
        if file_path.exists():
            os.remove(file_path)

# Endpoints

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the frontend."""
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/api/upload", response_model=JobResponse)
async def upload_script(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    wardrobe_inference: bool = Form(True),
    legal_alerts: bool = Form(True)
):
    """
    Upload a script file and start processing.
    """
    job_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{job_id}_{file.filename}"

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Configure System
    config = SystemConfig()
    config.enable_wardrobe_inference = wardrobe_inference
    config.enable_legal_alerts = legal_alerts

    # Initialize Job
    jobs[job_id] = {
        "status": "pending",
        "progress": 0,
        "total_scenes": 0,
        "message": "Queued",
        "result_path": None,
        "error": None,
        "timestamp": datetime.now()
    }

    # Start Background Task
    background_tasks.add_task(process_script_task, job_id, file_path, config)

    return JobResponse(job_id=job_id, status="pending", message="Job queued")

@app.get("/api/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    """
    Get the status of a job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    result_url = f"/api/report/{job_id}" if job["status"] == "completed" else None

    return StatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        total_scenes=job["total_scenes"],
        message=job["message"],
        result_url=result_url,
        error=job["error"]
    )

@app.get("/api/report/{job_id}")
async def get_report(job_id: str):
    """
    Download the generated report.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report not ready")

    result_path = Path(job["result_path"])
    if not result_path.exists():
         raise HTTPException(status_code=404, detail="Report file missing")

    return FileResponse(
        path=result_path,
        filename=f"breakdown_report_{job_id}.html",
        media_type='text/html'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
