from fastf1.ergast import Ergast

ergast = Ergast(result_type="raw")

def get_schedule(year: int):
    return ergast.get_race_schedule(year)