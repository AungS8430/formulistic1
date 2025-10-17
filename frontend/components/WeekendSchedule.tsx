"use client";

import Link from "next/link";
import { formatDateLocal } from "@/utils/datetime";

export function WeekendSchedule({ race, season, round, session }: { race: any, season: string, round: string, session: string }) {

  const formatSessionTime = (dateString: string | null) => {
    if (!dateString) return "TBC";
    return formatDateLocal(new Date(dateString));
  };

  return (
    <div className="hidden xl:flex flex-col gap-8 w-xs">
      <div className="flex flex-col gap-4 basis-2/3">
        <h2 className="text-2xl font-semibold">Weekend Schedule</h2>
        <div className="flex flex-col overflow-y-auto gap-2">
          {
            race.fp1 && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp1" ? " border bg-red-thm/30" : "")}>
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 1</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{formatSessionTime(race.fp1)}</p>
                </div>
              </div>
            )
          }
          {
            race.fp2 && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp2" ? " border bg-red-thm/30" : "")}>
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 2</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{formatSessionTime(race.fp2)}</p>
                </div>
              </div>
            )
          }
          {
            race.fp3 && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp3" ? " border bg-red-thm/30" : "")}>
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 3</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{formatSessionTime(race.fp3)}</p>
                </div>
              </div>
            )
          }
          {
            race.sq && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "sq" ? " border bg-red-thm/30" : "")}>
                <Link className="bg-primary-foreground/30 p-4" href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}>
                  <h4 className="font-semibold text-base sm:text-lg">{season == "2023" ? "Sprint Shootout" : "Sprint Qualifying"}</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{formatSessionTime(race.sq)}</p>
                </Link>
              </div>
            )
          }
          {
            race.sprint && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "sprint" ? " border bg-red-thm/30" : "")}>
                <Link className="bg-primary-foreground/30 p-4" href={race?.results?.sprint && (race?.results?.sprint?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sprint` : "#"}>
                  <h4 className="font-semibold text-base md:text-lg">Sprint</h4>
                  <p className="text-gray-400 text-sm md:text-base">{formatSessionTime(race.sprint)}</p>
                </Link>
              </div>
            )
          }
          {
            race.quali && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "quali" ? " border bg-red-thm/30" : "")}>
                <Link className="bg-primary-foreground/30 p-4" href={race?.results?.quali && (race?.results?.quali?.length ?? 0) > 0 ? `/seasons/${season}/${round}/quali` : "#"}>
                  <h4 className="font-semibold text-base sm:text-lg">Qualifying</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{formatSessionTime(race.quali)}</p>
                </Link>
              </div>
            )
          }
          {
            race.race && (
              <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "race" ? " border bg-red-thm/30" : "")}>
                <Link className="bg-primary-foreground/30 p-4" href={race?.results?.race && (race?.results?.race?.length ?? 0) > 0 ? `/seasons/${season}/${round}/race` : "#"}>
                  <h4 className="font-semibold text-lg">Race</h4>
                  <p className="text-gray-400">{formatSessionTime(race.race)}</p>
                </Link>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

