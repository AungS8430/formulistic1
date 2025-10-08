import time
import ast
from datetime import datetime

# Scaling factor: 0.01 means "1% of the actual time difference"
SCALE = 1
MIN_WAIT = 0   # seconds
MAX_WAIT = 0.2    # seconds

# File paths
INPUT_FILE = "quali.txt"
OUTPUT_FILE = "fake_saved_data.txt"

def parse_timestamp(entry):
    # Assumes timestamp as last element, format: '2025-10-05T11:08:34.462Z'
    ts_str = entry[-1]
    # Remove 'Z' and parse to datetime
    ts_str = ts_str.rstrip('Z')
    # Support for milliseconds
    try:
        return datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S.%f")
    except ValueError:
        return datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S")

# Read and parse data
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()
    data = []
    for line in lines:
        try:
            data.append(ast.literal_eval(line.strip()))
        except (SyntaxError, ValueError) as e:
            print(f"Invalid line skipped: {line.strip()} - Error: {e}")
            continue

# Parse timestamps
timestamps = []
for entry in data:
    try:
        timestamps.append(parse_timestamp(entry))
    except Exception as e:
        print(f"Error parsing timestamp for entry: {entry} - Error: {e}")

# Write data with simulated delays
with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    for i, entry in enumerate(data):
        f.write(str(entry) + "\n")
        f.flush()
        if i + 1 < len(data) and i + 1 < len(timestamps):
            delta = (timestamps[i+1] - timestamps[i]).total_seconds()
            wait = min(MAX_WAIT, max(MIN_WAIT, delta * SCALE))
            time.sleep(wait)
