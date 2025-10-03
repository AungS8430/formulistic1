from fastf1.ergast import Ergast

ergast = Ergast(result_type="raw")

def get_schedule(year: int):
    return ergast.get_race_schedule(year)

def get_race(season: int, gp: int):
    data = ergast.get_race_schedule(season, gp)
    if len(data) == 0 or data is None:
        return {}
    print(data)
    return data[0]