import ast
import json
import time
import os
import asyncio


def parse_message(msg):
    """Ensure consistent JSON-friendly format."""
    if isinstance(msg, (list, tuple)):
        topic = msg[0]
        data = msg[1]
        timestamp = msg[2]
        return {"Title": topic, "Data": data, "TimeStamp": timestamp}
    elif isinstance(msg, dict):
        return msg
    else:
        return {"raw": str(msg)}
    
async def file_watcher(filepath: str):
    """Async generator to stream file updates line by line."""
    if not os.path.exists(filepath):
        yield f"data: {json.dumps({'error': f'File {filepath} not found'})}\n\n"
        return

    with open(filepath, "r") as f:
        f.seek(0, os.SEEK_END)  # start at end of file

        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue

            try:
                msg = ast.literal_eval(line.strip())
                parsed = parse_message(msg)
                yield json.dumps(parsed)
            except Exception as e:
                err = {"error": f"Parse failed: {str(e)}", "line": line.strip()}
                yield json.dumps(err)