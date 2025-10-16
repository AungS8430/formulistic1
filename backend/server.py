from util.pastCache import data
from util.Livetiming import (
    file_watcher, background_file_reader, get_race_data,
    get_session_info, get_track_status,
    get_race_control_messages, get_compounds
)
from util.FetchSeason import get_schedule, get_race, get_standings
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastf1.livetiming.client import SignalRClient
from contextlib import asynccontextmanager
import asyncio
import os
import threading

FILE_PATH = "fake_saved_data.txt"  # Set this to your real file

# def livetiming_recorder_loop():
#     client = SignalRClient(FILE_PATH, filemode='a')
#     while True:
#         try:
#             client.start()
#             while client.is_running:
#                 pass  # Busy wait, fast reconnect
#         except Exception as e:
#             print(f"Recorder error: {e}")
#         finally:
#             client.stop()

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.path.exists(FILE_PATH):
        with open(FILE_PATH, "w") as f:
            f.truncate(0)
        while True:
            try:
                with open(FILE_PATH, "r") as f:
                    f.read(1)
                break
            except Exception:
                await asyncio.sleep(0.001)
    # Start the FastF1 recorder in a background thread
    # threading.Thread(target=livetiming_recorder_loop, daemon=True).start()
    # Start your file reader as before
    asyncio.create_task(background_file_reader(FILE_PATH))
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "https://formulistic1.aungs.eu.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stream")
async def stream(format: str = Query("structured", description="Stream format: 'structured' for race data, 'raw' for original messages")):
    return StreamingResponse(file_watcher(format), media_type="text/event-stream")

@app.get("/stream/compounds")
async def stream_compounds():
    return get_compounds()

@app.get("/session/laptimes")
async def session_laptimes(year: int=2025, gp: int=1, session: str="r"):
    return data.pass_data(year, gp, session, "laptime")

@app.get("/session/weatherdata")
async def session_weatherdata(year: int=2025, gp: int=1, session: str="r"):
    return data.pass_data(year, gp, session, "weather")

@app.get("/session/results")
async def session_results(year: int=2025, gp: int=1, session: str="r"):
    return data.pass_data(year, gp, session, "results")

@app.get("/session/info")
async def session_info(year: int=2025, gp: int=1, session: str="r"):
    return get_race(year, gp)

@app.get("/season/schedule")
async def season_schedule(year: int=2025):
    return get_schedule(year)

@app.get("/season/standings")
async def season_standings(year: int=2025):
    return get_standings(year)