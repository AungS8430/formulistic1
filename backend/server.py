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


@app.get("/session")
async def session(year: int|None=None, gp: int|str|None=None, racetype: str|None=None, data: str|None=None):
    return
