from bin.Fetchpastrace import get_session_data, laptime_key, weather_key, results_key, info_key
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio


app = FastAPI()


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
    return get_session_data(year, gp, session, laptime_key)


@app.get("/session/weatherdata")
async def session_weatherdata(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, weather_key)


@app.get("/session/results")
async def session_results(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, results_key)


@app.get("/session/info")
async def session_info(year: int=2025, gp: int|str=1, session: str="r"):
    return get_session_data(year, gp, session, info_key)
