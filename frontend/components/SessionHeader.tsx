"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateRangeLocal } from "@/utils/datetime";

export function SessionHeader({ race }: { race: any }) {
  const [state, setState] = useState(-1);
  const [range, setRange] = useState("");

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(race.startDate);
    const end = new Date(race.endDate);

    if (start <= today && today <= end) {
      setState(0); // Race Weekend
    } else if (today < start) {
      setState(1); // Upcoming
    } else {
      setState(-1); // Completed
    }

    setRange(formatDateRangeLocal(start, end));
  }, [race.startDate, race.endDate]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row md:gap-2">
        <h1 className="text-2xl md:text-4xl font-bold">{race.season} {race.name}</h1>
        {state === 0 && <Badge className="bg-red-thm text-sm md:text-base">Race Weekend</Badge>}
      </div>
      <h3 className="text-base md:text-lg text-neutral-400 my-auto">{range} · {race.circuit}</h3>
    </div>
  );
}

