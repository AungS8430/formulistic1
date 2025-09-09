from util.Fetchpastrace import get_session_data
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio


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



async def streaming():
    couter = 0
    while True:
        await asyncio.sleep(1)
        yield f"tem {couter}"
        couter += 1


@app.get("/live")
async def live():
    return StreamingResponse(streaming(), media_type="text/event-stream")


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
