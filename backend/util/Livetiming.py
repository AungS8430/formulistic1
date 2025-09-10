import ast
import json
import os
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

class RaceData:
    """Structured F1 race data container that organizes live timing information by category."""

    def __init__(self):
        # Driver data indexed by car number
        self.drivers: Dict[str, Dict[str, Any]] = {}

        # Session information
        self.session = {
            "current_lap": 1,
            "session_status": "Unknown",
            "session_info": {}
        }

        # Track conditions and race control
        self.track = {
            "status": "Unknown",
            "flags": [],
            "weather": {
                "air_temp": None,
                "track_temp": None,
                "humidity": None,
                "pressure": None,
                "wind_speed": None,
                "wind_direction": None,
                "rainfall": None
            }
        }

        # Race control messages
        self.race_control_messages: List[Dict[str, Any]] = []

        # Timing statistics and extra data
        self.timing_stats: Dict[str, Any] = {}
        self.driver_list: Dict[str, Any] = {}
        self.top_three: Dict[str, Any] = {}

        # Raw message history for debugging
        self.raw_history: List[Dict[str, Any]] = []

        # Last update timestamp
        self.last_updated = None

    def get_driver_state(self, car_number: str) -> Dict[str, Any]:
        """Get or create driver state for a car number."""
        if car_number not in self.drivers:
            self.drivers[car_number] = {
                "car_number": car_number,
                "position": None,
                "line": None,
                "last_lap_time": None,
                "best_lap_time": None,
                "gap_to_leader": None,
                "interval_to_ahead": None,
                "number_of_laps": 0,
                "in_pit": False,
                "status": None,
                "sectors": {
                    "0": {"value": None, "segments": {}},
                    "1": {"value": None, "segments": {}},
                    "2": {"value": None, "segments": {}}
                },
                "speeds": {},
                "personal_fastest": False,
                "catching": None
            }
        return self.drivers[car_number]

    def update_from_message(self, message_type: str, data: Dict[str, Any], timestamp: str):
        """Update race data from a parsed F1 timing message."""
        self.last_updated = timestamp

        if message_type == "TimingData":
            self._update_timing_data(data)
        elif message_type == "WeatherData":
            self._update_weather_data(data)
        elif message_type == "RaceControlMessages":
            self._update_race_control(data)
        elif message_type == "TrackStatus":
            self._update_track_status(data)
        elif message_type == "SessionData":
            self._update_session_data(data)
        elif message_type == "LapCount":
            self._update_lap_count(data)
        elif message_type == "DriverList":
            self.driver_list = data
        elif message_type == "TopThree":
            self.top_three = data
        elif message_type == "TimingStats":
            self.timing_stats = data
        elif message_type == "SessionInfo":
            self.session["session_info"] = data

    def _update_timing_data(self, data: Dict[str, Any]):
        """Update timing data for drivers."""
        if "Lines" not in data:
            return

        for car_number, driver_data in data["Lines"].items():
            driver_state = self.get_driver_state(car_number)

            # Update position and line
            if "Position" in driver_data:
                driver_state["position"] = driver_data["Position"]
            if "Line" in driver_data:
                driver_state["line"] = driver_data["Line"]

            # Update timing information
            if "LastLapTime" in driver_data:
                if isinstance(driver_data["LastLapTime"], dict):
                    driver_state["last_lap_time"] = driver_data["LastLapTime"]
                else:
                    driver_state["last_lap_time"] = {"Value": driver_data["LastLapTime"]}

            if "BestLapTime" in driver_data:
                driver_state["best_lap_time"] = driver_data["BestLapTime"]

            # Update gaps and intervals
            if "GapToLeader" in driver_data:
                driver_state["gap_to_leader"] = driver_data["GapToLeader"]
            if "IntervalToPositionAhead" in driver_data:
                driver_state["interval_to_ahead"] = driver_data["IntervalToPositionAhead"]

            # Update lap count
            if "NumberOfLaps" in driver_data:
                driver_state["number_of_laps"] = driver_data["NumberOfLaps"]

            # Update pit status
            if "InPit" in driver_data:
                driver_state["in_pit"] = driver_data["InPit"]
            if "Status" in driver_data:
                driver_state["status"] = driver_data["Status"]

            # Update sector data
            if "Sectors" in driver_data:
                for sector_num, sector_data in driver_data["Sectors"].items():
                    if sector_num in driver_state["sectors"]:
                        if "Value" in sector_data:
                            driver_state["sectors"][sector_num]["value"] = sector_data["Value"]
                        if "Segments" in sector_data:
                            driver_state["sectors"][sector_num]["segments"] = sector_data["Segments"]

            # Update speeds
            if "Speeds" in driver_data:
                driver_state["speeds"].update(driver_data["Speeds"])

    def _update_weather_data(self, data: Dict[str, Any]):
        """Update weather information."""
        weather_mapping = {
            "AirTemp": "air_temp",
            "TrackTemp": "track_temp",
            "Humidity": "humidity",
            "Pressure": "pressure",
            "WindSpeed": "wind_speed",
            "WindDirection": "wind_direction",
            "Rainfall": "rainfall"
        }

        for key, value in data.items():
            if key in weather_mapping:
                self.track["weather"][weather_mapping[key]] = value

    def _update_race_control(self, data: Dict[str, Any]):
        """Update race control messages."""
        if "Messages" in data:
            for msg_id, message in data["Messages"].items():
                # Add message ID and store
                message["message_id"] = msg_id
                self.race_control_messages.append(message)

                # Update track flags if it's a flag message
                if message.get("Category") == "Flag" and "Flag" in message:
                    flag_info = {
                        "type": message["Flag"],
                        "scope": message.get("Scope", "Unknown"),
                        "message": message.get("Message", ""),
                        "timestamp": message.get("Utc", ""),
                        "lap": message.get("Lap", 0)
                    }
                    self.track["flags"].append(flag_info)

    def _update_track_status(self, data: Dict[str, Any]):
        """Update track status information."""
        if "Status" in data:
            self.track["status"] = data["Status"]
        if "Message" in data:
            # Map status codes to meaningful names
            status_map = {
                "1": "Green",
                "2": "Yellow",
                "3": "Safety Car",
                "4": "Red Flag",
                "5": "VSC",
                "6": "VSC Ending"
            }
            status_code = data["Status"]
            self.track["status_name"] = status_map.get(status_code, f"Status {status_code}")

    def _update_session_data(self, data: Dict[str, Any]):
        """Update session status information."""
        if "StatusSeries" in data:
            # Get the latest status update
            latest_status = None
            for status_id, status_data in data["StatusSeries"].items():
                if "SessionStatus" in status_data:
                    self.session["session_status"] = status_data["SessionStatus"]
                    latest_status = status_data

    def _update_lap_count(self, data: Dict[str, Any]):
        """Update current lap count."""
        if "CurrentLap" in data:
            self.session["current_lap"] = data["CurrentLap"]

    def to_dict(self) -> Dict[str, Any]:
        """Convert race data to dictionary for JSON serialization."""
        return {
            "drivers": self.drivers,
            "session": self.session,
            "track": self.track,
            "race_control_messages": self.race_control_messages[-10:],  # Last 10 messages
            "timing_stats": self.timing_stats,
            "driver_list": self.driver_list,
            "top_three": self.top_three,
            "last_updated": self.last_updated
        }

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


# Global race data container and raw history
race_data = RaceData()
history = []  # Keep original history for backward compatibility

def add_to_history(msg):
    """Add message to both structured race data and raw history."""
    parsed = parse_message(msg)
    history.append(parsed)
    race_data.raw_history.append(parsed)

    # Update structured race data
    if "Title" in parsed and "Data" in parsed:
        race_data.update_from_message(
            parsed["Title"],
            parsed["Data"],
            parsed.get("Timestamp")
        )

async def background_file_reader(filepath: str):
    """Background task that keeps reading file and updating history."""
    if not os.path.exists(filepath):
        return

    with open(filepath, "r") as f:
        # read all old lines once
        for line in f:
            try:
                msg = ast.literal_eval(line.strip())
                add_to_history(msg)
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
                add_to_history(msg)
            except:
                continue

async def file_watcher(stream_type: str = "structured"):
    """Async generator: send race data - 'structured' for race data, 'raw' for original format."""
    last_index = 0
    while True:
        if stream_type == "structured":
            # Send structured race data
            yield f"data: {json.dumps(race_data.to_dict())}\n\n"
        else:
            # Send unseen raw history entries (original behavior)
            while last_index < len(history):
                yield f"data: {json.dumps(history[last_index])}\n\n"
                last_index += 1
        await asyncio.sleep(0.1)

def get_race_data():
    """Get current structured race data."""
    return race_data.to_dict()

def get_driver_data(car_number: str = None):
    """Get driver data for specific car number or all drivers."""
    if car_number:
        return race_data.drivers.get(car_number, {})
    return race_data.drivers

def get_session_info():
    """Get current session information."""
    return race_data.session

def get_track_status():
    """Get current track status and conditions."""
    return race_data.track

def get_race_control_messages(limit: int = 10):
    """Get recent race control messages."""
    return race_data.race_control_messages[-limit:] if limit > 0 else race_data.race_control_messages