import ast
import json
import os
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from util.Livetiming import parse_message, file_watcher

app = FastAPI()

FILE_PATH = "fake_saved_data.txt" # change it to saved_data.txt to read actual data

@app.get("/stream")
async def stream():
    return StreamingResponse(file_watcher(FILE_PATH), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("realtime_server:app", host="0.0.0.0", port=8000, reload=True)
