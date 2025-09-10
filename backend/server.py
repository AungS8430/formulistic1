from util.Fetchpastrace import get_session_data
from util.Livetiming import (
    file_watcher, background_file_reader, get_race_data,
    get_driver_data, get_session_info, get_track_status,
    get_race_control_messages
)
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os


app = FastAPI()


origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_PATH = "fake_saved_data.txt" # change it to saved_data.txt to read actual data

@app.on_event("startup")
async def start_background_reader():
    if os.path.exists(FILE_PATH):
        with open(FILE_PATH, "w") as f:
            f.truncate(0)
    asyncio.create_task(background_file_reader(FILE_PATH))

@app.get("/stream")
async def stream(format: str = Query("structured", description="Stream format: 'structured' for race data, 'raw' for original messages")):
    return StreamingResponse(file_watcher(format), media_type="text/event-stream")

# New structured race data endpoints
@app.get("/race/data")
async def race_data():
    """Get complete structured race data including drivers, session, track status."""
    return get_race_data()

@app.get("/race/drivers")
async def drivers_data(car_number: str = Query(None, description="Specific car number to get data for")):
    """Get driver data for all drivers or a specific car number."""
    return get_driver_data(car_number)

@app.get("/race/session")
async def session_data():
    """Get current session information including lap count and status."""
    return get_session_info()

@app.get("/race/track")
async def track_data():
    """Get track status, weather, and flag information."""
    return get_track_status()

@app.get("/race/messages")
async def race_messages(limit: int = Query(10, ge=1, le=50, description="Number of recent messages to return")):
    """Get recent race control messages."""
    return get_race_control_messages(limit)


@app.get("/session/laptimes")
async def session_laptimes(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, "laptime")


@app.get("/session/weatherdata")
async def session_weatherdata(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, "weather")


@app.get("/session/results")
async def session_results(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, "results")


@app.get("/session/info")
async def session_info(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, "info")