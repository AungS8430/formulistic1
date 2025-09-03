from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import bin.Fetchpastrace


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
async def session(year: int=2025, gp: int|str=1, racetype: str="R", data: str="Laptime"):
    return
