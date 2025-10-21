"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateRangeLocal } from "@/utils/datetime";

export function CurrentRaceDisplay({ races, currentSeason }: { races: any[], currentSeason: number }) {
  const [currentRace, setCurrentRace] = useState<null | { round: number, name: string, circuit: string, duration: string }>(null);

  useEffect(() => {
    const now = new Date();

    const getDateTime = (session: { date: string, time?: string } | undefined, fallbackDate: string, fallbackTime?: string) => {
      const dateStr = session?.date || fallbackDate;
      const timeStr = session?.time || fallbackTime;
      const datePart = dateStr.split("T")[0];
      return new Date(`${datePart}T${timeStr || '00:00:00Z'}`);
    };

    for (const row of races) {
      const s = getDateTime(row.FirstPractice, row.date, row.time);
      const e = getDateTime({ date: row.date, time: row.time }, row.date, row.time);

      if (s <= now && now <= e) {
        setCurrentRace({
          round: row.round,
          name: row.raceName,
          circuit: row.Circuit.circuitName,
          duration: formatDateRangeLocal(s, e)
        });
        break;
      }
    }
  }, [races]);

  if (!currentRace) {
    return null;
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <h2 className="text-3xl font-bold">Current Race</h2>
      <Link className="bg-primary-foreground hover:bg-secondary py-4 px-2 md:px-10 md:py-6 rounded-lg flex flex-col md:flex-row w-full gap-2 md:gap-0"
            href={`/seasons/${currentSeason}/${currentRace.round}`}>
        <div className="flex flex-col text-center md:text-left justify-center">
          <h2 className="text-xl md:text-2xl font-bold">{currentRace.name}</h2>
          <h3 className="text-lg md:text-xl font-semibold text-gray-300">{currentRace.circuit}</h3>
        </div>
        <div className="grow"/>
        <div className="flex flex-col text-center md:text-right justify-center">
          <h3 className="text-md md:text-lg font-semibold text-gray-300">Round {currentRace.round} of 22</h3>
          <h3 className="text-md md:text-lg font-semibold text-gray-300">{currentRace.duration}</h3>
        </div>
      </Link>
    </div>
  );
}
