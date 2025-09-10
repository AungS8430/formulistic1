from typing import Literal
from .races import get_session
import fastf1
import pandas as pd
import json
import datetime


fastf1.ergast.interface.BASE_URL = "https://api.jolpi.ca/ergast/f1"  # pyright: ignore


laptime_var_selections = ["DriverNumber", "LapNumber", "Compound", "TyreLife", "TrackStatus", "Position", "Deleted"]
laptime_time_selections = ["Time", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time", "PitInTime","PitOutTime"]


result_var_selection = ["DriverNumber", "BroadcastName", "Abbreviation", "TeamName", "TeamColor", "FullName", "ClassifiedPosition", "Position", "GridPosition"]
result_time_selection = ["Time" , "Q1", "Q2", "Q3"]


weather_var_selections = ["AirTemp", "Humidity", "Pressure", "Rainfall", "TrackTemp", "WindDirection", "WindSpeed"]
weather_time_selection = ["Time"]


def gap_to_leader_process(laps: fastf1.core.Laps, drivers: list[str], total_lap: int): # pyright: ignore
    lap1 = True
    out = pd.Series()
    for idx in range(total_lap):
        lap = laps.pick_laps(idx)
        if lap1:
            lap1 = False
            laps["GapToLeader"] = pd.Timedelta(0)
            continue
        out = out.combine_first(lap.loc[:, "LapStartTime"] - lap.loc[lap["Position"] == 1, "LapStartTime"].to_list()[0])
    out.name = "GapToLeader"
    return out

def laptime_process(laps: pd.DataFrame, drivers: list[str], total_lap: int, is_race: bool):
    out = {}
    lap_copy = laps.copy()
    lap_out = laps[laptime_var_selections]
    time_copy = lap_copy[laptime_time_selections]
    tem = []
    for time_selection in laptime_time_selections:
        tem.append(time_copy[time_selection].dt.total_seconds()) # pyright: ignore
    time_out = pd.DataFrame(tem).T # pyright: ignore
    if is_race:
        lap_copy = pd.concat([time_out, lap_out, gap_to_leader_process(laps, drivers, total_lap).dt.total_seconds()], axis=1)
    else:
        lap_copy = pd.concat([time_out, lap_out], axis=1)
    for driver in drivers:
        out[driver] = lap_copy.loc[lap_copy["DriverNumber"] == driver]
        out[driver].astype({"LapNumber": "int32"})
        out[driver].set_index("LapNumber", inplace=True)
        out[driver] = out[driver].to_dict()
    return out

def results_process(results: pd.DataFrame):
    results_copy = results.copy()
    results_out = results_copy[result_var_selection]
    time_copy = results_copy[result_time_selection]
    tem = []
    for time_selection in result_time_selection:
        tem.append(time_copy[time_selection].dt.total_seconds()) # pyright: ignore
    time_out = pd.DataFrame(tem).T # pyright: ignore
    out = pd.concat([time_out, results_out], axis=1)
    out = out.to_dict()
    return out

def weather_process(data: fastf1.core.Session): # pyright: ignore
    weather_data = data.laps.pick_drivers(data.results.loc[data.results["Position"] == 1, "Abbreviation"]).get_weather_data()
    weather_out = weather_data[weather_var_selections]
    time_copy = weather_data[weather_time_selection]
    tem = []
    for time_selection in weather_time_selection:
        tem.append(time_copy[time_selection].dt.total_seconds()) # pyright: ignore
    time_out = pd.DataFrame(tem).T # pyright: ignore
    out = pd.concat([time_out, weather_out], axis=1)
    out.reset_index(inplace=True)
    out = out.to_dict()
    return out

def info_process(info: dict):
    raw_info = info.copy()
    for idx, itr in raw_info.items():
        if type(itr) == datetime.timedelta:
            info[idx] = itr.seconds / 3600
        if type(itr) == datetime.datetime:
            info[idx] = itr.strftime("%Y-%m-%d %H:%M:%S")
    return info

def get_session_data(year: int ,gp: str|int, session_type: str, data: Literal["laptime", "weather", "results", "info"]):
    session = get_session(year, gp, session_type)
    try:
        session.laps
    except Exception:
        return json.dumps(["Error", "Data not found"])
    drivers = session.drivers
    total_lap = session.total_laps
    out = ""
    match data:
        case "laptime":
            out = laptime_process(session.laps, drivers, total_lap, True if session_type == "r" or session_type == "s" else False)
        case "weather":
            out = weather_process(session)
        case "results":
            out = results_process(session.results)
        case "info":
            out = info_process(session.session_info)
            out["TotalLaps"] = total_lap
        case _:
            pass
    return json.dumps(out)
