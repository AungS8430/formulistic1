from util.pastCache import Data
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
import time

FILE_PATH = "saved_data.txt"  # Set this to your real file

def livetiming_recorder_loop():
    """Run the SignalR client in a reconnecting loop and avoid busy-waiting.

    The client is created inside the loop so it can be recreated after errors.
    We poll a small sleep while the client is running to avoid 100% CPU.
    After any failure, we ensure the client is stopped and wait a short backoff
    before attempting to reconnect.
    """
    while True:
        client = None
        try:
            client = SignalRClient(FILE_PATH, filemode='a')
            client.start()
            # Poll the running flag with a small sleep to avoid busy-wait CPU usage
            while getattr(client, "is_running", False):
                time.sleep(0.1)
        except Exception as e:
            print(f"Recorder error: {e}")
        finally:
            try:
                if client is not None:
                    client.stop()
            except Exception:
                pass
        # Small backoff before reconnecting
        time.sleep(1)

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
    threading.Thread(target=livetiming_recorder_loop, daemon=True).start()
    # Start your file reader as before
    asyncio.create_task(background_file_reader(FILE_PATH))
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "https://formulistic1.aungs.eu.org",
    "https://formulistic1-git-development-aungs8430s-projects.vercel.app",
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
    return Data.pass_data(year, gp, session, "laptime")

@app.get("/session/weatherdata")
async def session_weatherdata(year: int=2025, gp: int=1, session: str="r"):
    return Data.pass_data(year, gp, session, "weather")

@app.get("/session/results")
async def session_results(year: int=2025, gp: int=1, session: str="r"):
    return Data.pass_data(year, gp, session, "results")

@app.get("/session/info")
async def session_info(year: int=2025, gp: int=1, session: str="r"):
    return get_race(year, gp)

@app.get("/season/schedule")
async def season_schedule(year: int=2025):
    return get_schedule(year)

@app.get("/season/standings")
async def season_standings(year: int=2025):
    return get_standings(year)
