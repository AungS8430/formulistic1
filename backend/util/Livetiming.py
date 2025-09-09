import ast
import json
import os
import asyncio

def build_from_entry(entry):
    """Convert a single saved_data entry into dataset-style dicts, with fallback for unknown data."""
    rows = []

    title = entry[0]
    data_dict = entry[1] if isinstance(entry[1], dict) else {}
    time = entry[-1]

    # --- Special case: WeatherData ---
    if title == "WeatherData":
        row = {"Title": title, "Time": time, **data_dict}
        rows.append(row)
        return rows

    # --- Detailed case: Lines ---
    if "Lines" in data_dict:
        lines_dict = data_dict.get("Lines", {})
        for line_id, line_data in lines_dict.items():
            base_row = {
                "Title": title,
                "Lines": line_id,
                "Time": time,
                "GapToLeader": line_data.get("GapToLeader"),
                "IntervalToPositionAhead": line_data.get("IntervalToPositionAhead", {}).get("Value"),
                "PersonalFastest": line_data.get("PersonalFastest"),
                "LapTime": line_data.get("LapTime"),
                "LapNumber": line_data.get("LapNumber"),
                "NumberOfLaps": line_data.get("NumberOfLaps"),
                "Position": line_data.get("Position"),
                "BestSectors": line_data.get("BestSectors"),
                "DiffToAhead": line_data.get("DiffToAhead"),
                "DiffToLeader": line_data.get("DiffToLeader"),
                "FullName": line_data.get("FullName"),
                "FirstName": line_data.get("FirstName"),
                "LastName": line_data.get("LastName"),
                "Team": line_data.get("Team"),
                "TeamColour": line_data.get("TeamColour"),
                # Defaults
                "Status": None,
                "Sectors": None,
                "Segments": None,
                "ValueSectors": None,
                "TypeSpeed": None,
                "SpeedValue": None,
                "PersonalBestLapTime": None,
                "Lab_Personal_Best": None,
                "PositionAtPersonalBest": None,
                "BestLapTime": None,
                "Lap_Best": None,
                "PreviousValue": None,
            }

            # Expand sectors/segments
            if "Sectors" in line_data:
                for sec, sec_data in line_data["Sectors"].items():
                    if isinstance(sec_data, dict) and "Segments" in sec_data:
                        for seg, seg_data in sec_data.get("Segments", {}).items():
                            out = base_row.copy()
                            out["Sectors"] = str(sec)
                            out["Segments"] = str(seg)
                            out["Status"] = seg_data.get("Status")
                            out["ValueSectors"] = sec_data.get("Value")
                            out["PreviousValue"] = sec_data.get("PreviousValue")
                            rows.append(out)
                    else:
                        out = base_row.copy()
                        out["Sectors"] = str(sec)
                        out["Segments"] = None
                        out["Status"] = None
                        out["ValueSectors"] = sec_data.get("Value") if isinstance(sec_data, dict) else None
                        out["PreviousValue"] = sec_data.get("PreviousValue") if isinstance(sec_data, dict) else None
                        rows.append(out)

            # Expand speeds
            if "Speeds" in line_data:
                for speed_type, speed_data in line_data["Speeds"].items():
                    out = base_row.copy()
                    out["TypeSpeed"] = speed_type
                    out["SpeedValue"] = speed_data.get("Value")
                    rows.append(out)

            # Stints
            if "Stints" in line_data:
                for _, stint_data in line_data["Stints"].items():
                    out = base_row.copy()
                    if "LapTime" in stint_data:
                        out["LapTime"] = stint_data["LapTime"]
                    if "LapNumber" in stint_data:
                        out["LapNumber"] = stint_data["LapNumber"]
                    rows.append(out)

            # BestLapTime
            if "BestLapTime" in line_data:
                out = base_row.copy()
                out["BestLapTime"] = line_data["BestLapTime"].get("Value")
                out["Lap_Best"] = line_data["BestLapTime"].get("Lap")
                rows.append(out)

            # PersonalBestLapTime
            if "PersonalBestLapTime" in line_data:
                out = base_row.copy()
                out["PersonalBestLapTime"] = line_data["PersonalBestLapTime"].get("Value")
                out["Lab_Personal_Best"] = line_data["PersonalBestLapTime"].get("Lap")
                out["PositionAtPersonalBest"] = line_data["PersonalBestLapTime"].get("Position")
                rows.append(out)

            # Always include base row
            rows.append(base_row)

        return rows

    # --- Generic fallback for any other message type ---
    if isinstance(data_dict, dict):
        row = {"Title": title, "Time": time}
        for key, value in data_dict.items():
            # flatten everything into one JSON row
            row[key] = value
        rows.append(row)
    else:
        # if it's not a dict, just dump it raw
        row = {"Title": title, "Time": time, "Data": data_dict}
        rows.append(row)

    return rows


def parse_message(msg):
    """Normalize a message into dict form (optional)."""
    if isinstance(msg, (list, tuple)):
        topic = msg[0]
        data = msg[1]
        timestamp = msg[2] if len(msg) > 2 else None
        return {"Title": topic, "Data": data, "TimeStamp": timestamp}
    elif isinstance(msg, dict):
        return msg
    else:
        return {"raw": str(msg)}


async def file_watcher(filepath: str):
    """Async generator to stream dataset-style updates in JSON format."""
    if not os.path.exists(filepath):
        yield json.dumps({'error': f'File {filepath} not found'})
        return

    with open(filepath, "r", encoding="utf-8") as f:
        f.seek(0, os.SEEK_END)

        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(0.1)
                continue
            try:
                entry = ast.literal_eval(line.strip())
                dataset_rows = build_from_entry(entry)

                for row in dataset_rows:
                    yield f"{json.dumps(row, ensure_ascii=False)}\n\n"

            except Exception as e:
                err = {"error": f"Parse failed: {str(e)}", "line": line.strip()}
                yield f"data: {json.dumps(err)}\n\n"