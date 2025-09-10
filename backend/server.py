from util.Fetchpastrace import get_session_data
from util.Livetiming import file_watcher, background_file_reader
from fastapi import FastAPI
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
async def stream():
    return StreamingResponse(file_watcher(), media_type="text/event-stream")


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
