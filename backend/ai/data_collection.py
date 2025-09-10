import fastf1
import warnings


warnings.filterwarnings("ignore")


def collect_race_data(year, gp, session="r"):
    session = fastf1.get_session(year, gp, session)
    session.load(telemetry=False)
    laps = session.laps
    weather = session.weather_data
    results = session.results
    laps["TrackID"] = session.session_info["Name"]
    race_data = laps.merge(results.loc[:, ["DriverNumber", "TeamName"]], on="DriverNumber", how="left")
    return race_data, weather, session
