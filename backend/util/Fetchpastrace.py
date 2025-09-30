from .races import get_session
import fastf1
from fastf1.ergast import Ergast
import pandas as pd
from fastf1.plotting import get_compound_mapping

ergast = Ergast(result_type="raw")


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
        fastest_lap_idx = min(out[driver]["LapTime"], key=out[driver]["LapTime"].get) if "LapTime" in out[driver] and out[driver]["LapTime"] else None
        out[driver]["Fastest"] = {
            "lap": int(fastest_lap_idx) if fastest_lap_idx is not None else None,
            "s1": min(out[driver]["Sector1Time"], key=out[driver]["Sector1Time"].get) if "Sector1Time" in out[driver] and out[driver]["Sector1Time"] else None,
            "s2": min(out[driver]["Sector2Time"], key=out[driver]["Sector2Time"].get) if "Sector2Time" in out[driver] and out[driver]["Sector2Time"] else None,
            "s3": min(out[driver]["Sector3Time"], key=out[driver]["Sector3Time"].get) if "Sector3Time" in out[driver] and out[driver]["Sector3Time"] else None
        }
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

def info_process(season: int, gp: int):
    data = ergast.get_race_schedule(season, gp)
    if len(data) == 0 or data is None:
        return {}
    print(data)
    return data[0]

def get_session_data(year: int ,gp: int, session_type: str):
    session = get_session(year, gp, session_type)
    try:
        session.laps
    except Exception:
        return ["Error", "Data not found"]
    drivers = session.drivers
    total_lap = session.total_laps

    out = {"laptime":{},
        "weather" : weather_process(session),
        "results" : results_process(session.results),
        "info" : info_process(year, gp)
    }

    out["laptime"]["Data"] = laptime_process(session.laps, drivers, total_lap, True if session_type == "r" or session_type == "s" else False)

    fastest = {}
    for key in ["lap", "s1", "s2", "s3"]:
        def get_time(driver):
            idx = out["laptime"]["Data"][driver]["Fastest"][key]
            if idx is None:
                return float("inf")
            return out["laptime"]["Data"][driver]["LapTime" if key == "lap" else f"Sector{key[1]}Time"].get(idx, float("inf"))
        fastest_driver = min(drivers, key=get_time, default=None)
        fastest[key] = fastest_driver
    out["laptime"]["Fastest"] = fastest

    compound_colors = get_compound_mapping(session)
    out["laptime"]["Compounds"] = {}
    compound_abv = {
        "SOFT": "S",
        "MEDIUM": "M",
        "HARD": "H",
        "INTERMEDIATE": "I",
        "WET": "W",
        "DRY": "D",
        "SUPERSOFT": "SS",
        "ULTRASOFT": "US",
        "HYPERSOFT": "HS",
        "SUPERHARD": "SH",
    }
    for (key, value) in compound_colors.items():
        out["laptime"]["Compounds"][key] = {
            "color": value,
            "abbreviation": compound_abv[key] if key in compound_abv else key
        }

    return out
