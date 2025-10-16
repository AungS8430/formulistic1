import Link from "next/link";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCircleCheck, faHourglass, faCalendar} from "@fortawesome/free-regular-svg-icons";

type Race = {
  round: number;
  name: string;
  circuit: string;
  startDate: string;
  endDate: string;
  range: string;
  state: number;
};

type RaceListItemProps = {
  season: string;
  race: Race;
  index: number;
};

export function EventItem({season, race, index}: RaceListItemProps) {
  return (
    <Link
      key={index}
      href={`/seasons/${season}/${race.round}`}
      className="w-full flex flex-row lg:h-28 gap-6 p-4 rounded-full hover:bg-accent hover:shadow-md cursor-pointer"
    >
      < div
        className={
          "hidden lg:flex rounded-full aspect-square w-20 h-20 text-center place-items-center justify-center " +
          (race.state == -1
            ? "bg-primary-foreground"
            : race.state == 0
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
          {race.range.length > 0 ? race.range : `${race.startDate} - ${race.endDate}`}
        </p>
        <p className="font-bold text-xl">{race.name}</p>
        <p>{race.circuit}</p>
      </div>
      <div className="grow"/>
      <div className="flex my-auto">
        {race.state == -1 ? (
          <div className="flex flex-row text-gray-400">
            <FontAwesomeIcon icon={faCircleCheck} className="my-auto"/>
            <p className="ml-2 font-semibold">Completed</p>
          </div>
        ) : race.state == 0 ? (
          <div className="flex flex-row text-green-500/70">
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