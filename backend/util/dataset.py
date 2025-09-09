import pandas as pd
import ast

with open("saved_data.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

data = [ast.literal_eval(line.strip()) for line in lines]



rows = []
rows_1 = []
for entry in data:
    title = entry[0]
    lines_dict = entry[1].get("Lines", {})
    time = entry[-1]

    for line_id, line_data in lines_dict.items():
        row = {
            "Title": title,
            "Lines": line_id,
            "GapToLeader": line_data.get("GapToLeader"),
            "IntervalToPositionAhead": line_data.get("IntervalToPositionAhead", {}).get("Value"),
            "Status": None,
            "Sectors": None,
            "Segments": None,
            "ValueSectors": None,
            "TypeSpeed": None,
            "SpeedValue": None,
            "Time": time,
            "PersonalFastest": line_data.get("PersonalFastest"),
            "LapTime": line_data.get("LapTime"),
            "LapNumber": line_data.get("LapNumber"),
            "NumberOfLaps": line_data.get("NumberOfLaps"),
            "PersonalBestLapTime": None,
            "Lab_Personal_Best": None,
            "Position" :line_data.get("Position"),
            "PositionAtPersonalBest": None,
            "BestLapTime": None,
            "Lap_Best": None,
            "BestSectors": line_data.get("BestSectors"),
            "PreviousValue": None,
            "DiffToAhead": line_data.get("DiffToAhead"),
            "DiffToLeader": line_data.get("DiffToLeader"),
            "FullName": line_data.get("FullName"),
            "FirstName": line_data.get("FirstName"),
            "LastName": line_data.get("LastName"),
            "Team": line_data.get("Team"),
            "TeamColour": line_data.get("TeamColour")
        }
        if "Sectors" in line_data:
            for sec, sec_data in line_data["Sectors"].items():
                if isinstance(sec_data, dict) and "Segments" in sec_data:
                    for seg, seg_data in sec_data.get("Segments", {}).items():
                        out = row.copy()
                        out["Sectors"] = str(sec)
                        out["Segments"] = str(seg)
                        out["Status"] = seg_data.get("Status")
                        out["ValueSectors"] = sec_data.get("Value")
                        out["PreviousValue"] = sec_data.get("PreviousValue")
                        rows.append(out)
                else:
                    out = row.copy()
                    out["Sectors"] = str(sec)
                    out["Segments"] = None
                    out["Status"] = None
                    out["ValueSectors"] = sec_data.get("Value") if isinstance(sec_data, dict) else None
                    out["PreviousValue"] = sec_data.get("PreviousValue") if isinstance(sec_data, dict) else None
                    rows.append(out)

        if "Speeds" in line_data:
            for speed_type, speed_data in line_data["Speeds"].items():
                row = row.copy()
                row["TypeSpeed"] = speed_type
                row["SpeedValue"] = speed_data.get("Value")
                rows.append(row)

        if "LabTime" in line_data:
            if "LapTime" in line_data:
                row["LapTime"] = line_data["LapTime"]

        if "Stints" in line_data:
            for stint_id, stint_data in line_data["Stints"].items():
                if "LapTime" in stint_data:
                    row["LapTime"] = stint_data["LapTime"]
                if "LapNumber" in stint_data:
                    row["LapNumber"] = stint_data["LapNumber"]

        if "BestLapTime" in line_data:
            row["LapTime"] = line_data["BestLapTime"].get("Value")
            row["LapNumber"] = line_data["BestLapTime"].get("Lap")

        if "PersonalBestLapTime" in line_data:
            for lap, lab_data in line_data["PersonalBestLapTime"].items():
                row["PersonalBestLapTime"] = line_data["PersonalBestLapTime"].get("Value")
                row["Lab_Personal_Best"] = line_data["PersonalBestLapTime"].get("Lap")
                row["PositionAtPersonalBest"] = line_data["PersonalBestLapTime"].get("Position")

        if "BestLapTime" in line_data:
            for time, time_data in line_data["BestLapTime"].items():
                row["BestLapTime"] = line_data["BestLapTime"].get("Value")
                row["Lap_Best"] = line_data["BestLapTime"].get("Lap")

        rows.append(row)


        

df = pd.DataFrame(rows)

for entry in data:
    if entry[0] == "WeatherData":
        title = entry[0]
        line_data = entry[1]
        time = entry[-1]
        row = {
            "Title": "WeatherData",
            "AirTemp": line_data.get("AirTemp"),
            "Humidity": line_data.get("Humidity"),
            "Pressure": line_data.get("Pressure"),
            "Rainfall": line_data.get("Rainfall"),
            "TrackTemp": line_data.get("TrackTemp"),
            "WindDirection": line_data.get("WindDirection"),
            "WindSpeed": line_data.get("WindSpeed"),
            "TrackTemp": line_data.get("TrackTemp")
        }
        rows_1.append(row)

df_weather = pd.DataFrame(rows_1)
print(df_weather)



#Iaddmorehere
# dataframe loopers suiters sigma😭🙏
df['Lines'] = pd.to_numeric(df['Lines'], errors='coerce')
df = df.sort_values(by=['Title', 'Lines']).reset_index(drop=True)



line_to_sepdata = {}
for linenumber in df['Lines'].unique():
    line_to_sepdata[linenumber] = df[df['Lines'] == linenumber].reset_index(drop=True)

for line_number in sorted(line_to_sepdata.keys()):
    print("\n Dataframe Line:",line_number)
    print(line_to_sepdata[line_number])
