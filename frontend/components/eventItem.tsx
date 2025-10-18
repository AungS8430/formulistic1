"use client"

import Link from "next/link";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleCheck, faHourglass, faCalendar} from "@fortawesome/free-regular-svg-icons";
import {useEffect, useState} from "react";
import {formatDateLocal, formatDateRangeLocal} from "@/utils/datetime";

type Race = {
  round: number;
  name: string;
  circuit: string;
  startDate: string;
  endDate: string;
  range: string;
};

type RaceListItemProps = {
  season: string;
  race: Race;
  index: number;
};

export function EventItem({season, race, index}: RaceListItemProps) {
  const [state, setState] = useState(-1);
  const [localRange, setLocalRange] = useState("");
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  console.log(race)

  useEffect(() => {
    const today = new Date();

    const startDateTime = new Date(race.startDate);
    const endDateTime = new Date(race.endDate);

    if (startDateTime && endDateTime) {
      if (startDateTime <= today && today <= endDateTime) {
        setState(0); // ongoing
      } else if (today < startDateTime) {
        setState(1); // upcoming
      } else {
        setState(-1); // completed
      }
    } else {
      setState(-1);
    }

    setLocalRange(formatDateRangeLocal(startDateTime, endDateTime));
    setLocalStartDate(formatDateLocal(startDateTime));
    setLocalEndDate(formatDateLocal(endDateTime));
  }, [race.startDate, race.endDate]);

  return (
    <Link
      key={index}
      href={`/seasons/${season}/${race.round}`}
      className="w-full flex flex-row lg:h-28 gap-6 p-4 rounded-full hover:bg-accent hover:shadow-md cursor-pointer"
    >
      < div
        className={
          "hidden lg:flex rounded-full aspect-square w-20 h-20 text-center place-items-center justify-center " +
          (state == -1
            ? "bg-primary-foreground"
            : state == 0
              ? "bg-red-thm"
              : "bg-red-thm/50")
        }
      >
        < h3
          className="text-primary text-2xl font-bold">
          {race.round.toString().padStart(2, "0")}
        </h3>
      </div>
      <div className="flex flex-col">
        <p className="text-gray-400 font-semibold">
          {localRange.length > 0 ? localRange : `${localStartDate} - ${localEndDate}`}
        </p>
        <p className="font-bold text-xl">{race.name}</p>
        <p>{race.circuit}</p>
      </div>
      <div className="grow"/>
      <div className="flex my-auto">
        {state == -1 ? (
          <div className="flex flex-row text-gray-400">
            <FontAwesomeIcon icon={faCircleCheck} className="my-auto"/>
            <p className="ml-2 font-semibold">Completed</p>
          </div>
        ) : state == 0 ? (
          <div className="flex flex-row text-green-500">
            <FontAwesomeIcon icon={faHourglass} className="my-auto"/>
            <p className="ml-2 font-semibold">Ongoing</p>
          </div>
        ) : (
          <div className="flex flex-row text-red-thm/70">
            <FontAwesomeIcon icon={faCalendar} className="my-auto"/>
            <p className="ml-2 font-semibold">Upcoming</p>
          </div>
        )}
      </div>
    </Link>
  );
}