from functools import cache
import fastf1


@cache
def get_session(year: int ,gp: str|int, session_type: str):
    if type(gp) is not int and gp.isdigit():  # pyright: ignore
        get_gp = int(gp)
    else:
        get_gp = gp
    session = fastf1.get_session(year, get_gp, session_type)
    session.load(telemetry=False)
    return session
