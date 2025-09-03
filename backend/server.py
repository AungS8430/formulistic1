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
async def session_laptimes(year: int|None=None, gp: int|str|None=None, session: str|None=None):
    pass


@app.get("/session/weatherdata")
async def session_weatherdata(year: int|None=None, gp: int|str|None=None, session: str|None=None):
    pass


@app.get("/session/results")
async def session_results(year: int|None=None, gp: int|str|None=None, session: str|None=None):
    pass


@app.get("/session/gaptime")
async def session_gaptime(year: int|None=None, gp: int|str|None=None, session: str|None=None):
    pass


@app.get("/session/info")
async def session_info(year: int|None=None, gp: int|str|None=None, session: str|None=None):
    pass
