from typing import Literal
from .Fetchpastrace import get_session_data
from dataclasses import dataclass
import json
import os


CACHE_PATH = "./cache"


@dataclass
class Index_format():
    year: int
    gp: str|int
    session_type: str

    def __str__(self):
        return f"{self.year}-{self.gp}-{self.session_type}"


class Data():
    sessions = {}

    @staticmethod
    def _check_type(year: int, gp: int, session_type: str):
        if type(year) != int:
            return True
        if type(gp) != int:
            return True
        if type(session_type) != str:
            return True
        if session_type not in ("r", "q", "ss", "sq", "fp1", "fp2", "fp3"):
            return True
        return False


    @classmethod
    def store_data(cls, year: int ,gp: int, session_type: str):
        if Data._check_type(year, gp, session_type):
            raise TypeError("Invalid Type")
        formated = Index_format(year, gp, session_type)
        os.makedirs(CACHE_PATH, exist_ok=True)
        path = f"{CACHE_PATH}/{formated}.json"
        data = get_session_data(year, gp, session_type)
        if data == ["Error", "Data not found"]:
            return ["Error", "Data not found"]
        with open(path, "w", encoding="utf-8") as file:
            file.write(json.dumps(data, default=lambda o: o.__dict__ if hasattr(o, "__dict__") else o.isoformat() if hasattr(o, "isoformat") else str(o)))
        cls.sessions[str(formated)] = data
        return "success"


    @classmethod
    def get_data(cls, year: int ,gp: int, session_type: str):
        if Data._check_type(year, gp, session_type):
            raise TypeError("Invalid Type")
        formated = Index_format(year, gp, session_type)
        if str(formated) in cls.sessions:
            return cls.sessions[str(formated)]
        path = f"{CACHE_PATH}/{formated}.json"
        if os.path.exists(path):
            with open(path) as file:
                data = json.loads(file.read())
                cls.sessions[str(formated)] = data
                return data
        status = cls.store_data(year, gp, session_type)
        if status == "success":
            return cls.sessions[str(formated)]
        return ["Error", "Data not found"]


    @classmethod
    def pass_data(cls, year: int ,gp: int, session_type: str, data: Literal["laptime", "weather", "results", "strategy"]):
        if Data._check_type(year, gp, session_type):
            raise TypeError("Invalid Type")
        out = cls.get_data(year, gp, session_type)
        if out != ["Error", "Data not found"]:
            out = out[data] # pyright: ignore
        return json.dumps(out, default=lambda o: o.__dict__ if hasattr(o, "__dict__") else o.isoformat() if hasattr(o, "isoformat") else str(o))
