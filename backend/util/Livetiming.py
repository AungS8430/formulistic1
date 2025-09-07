import fastf1
import pandas as pd
import json
import datetime
from fastf1.livetiming.data import LiveTimingData
import time
import os

def tail_file(filepath):
    try:
        with open(filepath, 'r') as file:
            file.seek(0, os.SEEK_END)
            while True:
                line = file.readline()
                if not line:
                    time.sleep(0.01)
                    continue
                print(f"New line found: {line.strip()}")

    except FileNotFoundError:
        print(f"Error: The file '{filepath}' was not found. Please ensure the fastf1 command is running.")
        time.sleep(5)
    except Exception as e:
        print(f"An error occurred: {e}")



tail_file("fake_saved_data.txt")