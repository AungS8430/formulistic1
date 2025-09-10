import ast
import json
import os
import asyncio

def parse_message(msg):
    """Normalize a message into dict form (optional)."""
    if isinstance(msg, (list, tuple)):
        topic = msg[0]
        data = msg[1]
        time = msg[2]
        
        return {"Title": topic, "Data": data, "Timestamp": time}
    elif isinstance(msg, dict):
        return msg
    else:
        return {"raw": str(msg)}


history = []  # global buffer

def add_to_history(msg):
    history.append(msg)

async def background_file_reader(filepath: str):
    """Background task that keeps reading file and updating history."""
    if not os.path.exists(filepath):
        return

    with open(filepath, "r") as f:
        # read all old lines once
        for line in f:
            try:
                msg = ast.literal_eval(line.strip())
                add_to_history(parse_message(msg))
            except:
                continue

        # then keep watching for new lines forever
        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue
            try:
                msg = ast.literal_eval(line.strip())
                add_to_history(parse_message(msg))
            except:
                continue

async def file_watcher():
    """Async generator: send all history first, then wait for new ones."""
    last_index = 0
    while True:
        # Send unseen history entries
        while last_index < len(history):
            yield f"{json.dumps(history[last_index])}\n\n"
            last_index += 1
        await asyncio.sleep(0.1)