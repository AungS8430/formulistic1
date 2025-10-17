from .races import get_session
import fastf1
from fastf1.ergast import Ergast
import pandas as pd
from fastf1.plotting import get_compound_mapping

ergast = Ergast(result_type="raw")


laptime_var_selections = ["DriverNumber", "LapNumber", "Compound", "TyreLife", "TrackStatus", "Position", "Deleted"]
laptime_time_selections = ["Time", "LapTime", "Sector1Time", "Sector2Time", "Sector3Time", "PitInTime","PitOutTime"]


result_var_selection = ["DriverNumber", "BroadcastName", "Abbreviation", "TeamName", "TeamColor", "FullName", "ClassifiedPosition", "Position", "GridPosition", "Points"]
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
            "s1": min(
                (k for k, v in out[driver].get("Sector1Time", {}).items() if pd.notna(v)),
                key=lambda k: out[driver]["Sector1Time"][k],
                default=None
            ),
            "s2": min(
                (k for k, v in out[driver].get("Sector2Time", {}).items() if pd.notna(v)),
                key=lambda k: out[driver]["Sector2Time"][k],
                default=None
            ),
            "s3": min(
                (k for k, v in out[driver].get("Sector3Time", {}).items() if pd.notna(v)),
                key=lambda k: out[driver]["Sector3Time"][k],
                default=None
            )
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
    try:
        weather_data = data.laps.pick_drivers(data.results.loc[data.results["Position"] == 1, "Abbreviation"]).get_weather_data()
    except Exception:
        return {}
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

def strategy_process(data: fastf1.core.Session): # pyright: ignore
    laps = data.laps
    drivers = data.drivers
    drivers = [data.get_driver(driver)["Abbreviation"] for driver in drivers]
    stints = laps[["Driver", "Stint", "Compound", "LapNumber"]]
    stints = stints.groupby(["Driver", "Stint", "Compound"])
    stints = stints.count().reset_index()
    stints = stints.rename(columns={"LapNumber": "StintLength"})
    out = {}
    for driver in drivers:
        driver_abbr = data.get_driver(driver)["Abbreviation"]
        driver_stints = stints[stints["Driver"] == driver]
        driver_stints = driver_stints.drop(columns=["Driver"])
        out[driver_abbr] = driver_stints.to_dict(orient="records")
    return out

def pace_process(data: fastf1.core.Session): # pyright: ignore
    laps = data.laps.pick_quicklaps()
    transformed_laps = laps.copy()
    transformed_laps.loc[:, "LapTime (s)"] = laps["LapTime"].dt.total_seconds()

    # order the team from the fastest (lowest median lap time) tp slower
    team_order = (
        transformed_laps[["Team", "LapTime (s)"]]
        .groupby("Team")
        .median()["LapTime (s)"]
        .sort_values()
        .index
    )
    print(team_order)

    # make a color palette associating team names to hex codes
    team_palette = {team: fastf1.plotting.get_team_color(team, session=data) for team in team_order}

    boxplot_stats = []
    for team in team_order:
        times = transformed_laps.loc[transformed_laps["Team"] == team, "LapTime (s)"].dropna()
        if len(times) == 0:
            continue

        q1 = times.quantile(0.25)
        median = times.median()
        q3 = times.quantile(0.75)
        iqr = q3 - q1
        lower_whisker = times[times >= q1 - 1.5 * iqr].min()
        upper_whisker = times[times <= q3 + 1.5 * iqr].max()
        min_time = times.min()
        max_time = times.max()

        boxplot_stats.append({
            "team": team,
            "min": float(min_time),
            "q1": float(q1),
            "median": float(median),
            "q3": float(q3),
            "max": float(max_time),
            "lower_whisker": float(lower_whisker),
            "upper_whisker": float(upper_whisker),
            "color": team_palette[team]
        })

    out = {
        "team_order": list(team_order),
        "team_palette": team_palette,
        "boxplot_stats": boxplot_stats
    }

    return out

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
    }

    out["laptime"]["Data"] = laptime_process(session.laps, drivers, total_lap, True if session_type == "r" or session_type == "s" else False)

    fastest = {}
    for key in ["lap", "s1", "s2", "s3"]:
        def get_time(driver):
            idx = out["laptime"]["Data"][driver]["Fastest"][key]
            if idx is None:
                return float("inf")
            return out["laptime"]["Data"][driver]["LapTime" if key == "lap" else f"Sector{key[1]}Time"].get(idx, float("inf"))
        fastest_driver = min(
            (d for d in drivers if isinstance(get_time(d), (int, float)) and not pd.isna(get_time(d)) and get_time(d) not in (0, None) and not isinstance(get_time(d), bool)),
            key=get_time,
            default=None
        )
        fastest[key] = fastest_driver
    out["laptime"]["Fastest"] = fastest

    compound_colors = get_compound_mapping(session)
    out["laptime"]["Compounds"] = {}
    out["laptime"]["Strategy"] = strategy_process(session)
    out["laptime"]["Pace"] = pace_process(session)
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
