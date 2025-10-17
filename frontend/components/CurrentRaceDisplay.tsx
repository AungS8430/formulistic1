"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CurrentRaceDisplay({ races, currentSeason }: { races: any[], currentSeason: number }) {
  const [currentRace, setCurrentRace] = useState<null | { round: number, name: string, circuit: string, duration: string }>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of races) {
      const s = new Date(row.FirstPractice ? row.FirstPractice.date : row.date);
      const e = new Date(row.date);
      if (s <= today && today <= e) {
        setCurrentRace({
          round: row.round,
          name: row.raceName,
          circuit: row.Circuit.circuitName,
          duration: s.toLocaleDateString() + " - " + e.toLocaleDateString()
        });
        break;
      }
    }
  }, [races]);

  if (!currentRace) {
    return null;
  }

  return (
    <div className="flex flex-col px-4 w-full gap-4">
      <h2 className="text-3xl font-bold">Current Race</h2>
      <Link className="bg-primary-foreground hover:bg-secondary px-10 py-6 rounded-lg flex flex-row w-full"
            href={`/seasons/${currentSeason}/${currentRace.round}`}>
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold">{currentRace.name}</h2>
          <h3 className="text-xl font-semibold text-gray-300">{currentRace.circuit}</h3>
        </div>
        <div className="grow"/>
        <div className="flex flex-col text-right">
          <h3 className="text-lg font-semibold text-gray-300">Round {currentRace.round} of 22</h3>
          <h3 className="text-lg font-semibold text-gray-300">{currentRace.duration}</h3>
        </div>
      </Link>
    </div>
  );
}

