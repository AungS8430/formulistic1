"use client";

import {use, useEffect, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {redirect, RedirectType} from "next/navigation";

export default function SeasonPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = use(params)
  const [races, setRaces] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[]>(null)

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/schedule?year=${season}`)
      .then((response) => response.json())
      .then((content) => {
        let data: {
          round: number,
          name: string,
          circuit: string,
          startDate: string,
          endDate: string,
          state: number
        }[] = [];
        // Get today's date
        const today = new Date();

        // Helper for combining date and time, returns Date object
        function getDateTime({ date, time }: { date?: string, time?: string }) {
          if (!date) return null;
          const datePart = date.split("T")[0];
          if (time) {
            // Handles time like "15:00:00+00:00"
            return new Date(`${datePart}T${time}`);
          }
          // If no time, fallback to midnight UTC
          return new Date(`${datePart}T00:00:00Z`);
        }

        content.forEach((row: any) => {
          // Start: FP1 if present, else race date+time
          const startDateTime = row.FirstPractice
            ? getDateTime({
            date: row.FirstPractice.date,
            time: row.FirstPractice.time
          }) ?? getDateTime({ date: row.date, time: row.time })
            : getDateTime({ date: row.date, time: row.time });

          // End: race date+time
          const endDateTime = getDateTime({ date: row.date, time: row.time });

          data.push({
            round: row.round,
            name: row.raceName,
            circuit: row.Circuit?.circuitName ?? "",
            startDate: startDateTime ? startDateTime.toLocaleDateString() : "",
            endDate: endDateTime ? endDateTime.toLocaleDateString() : "",
            state: (startDateTime && endDateTime)
              ? (startDateTime <= today && today <= endDateTime ? 0 : (today < startDateTime ? 1 : -1))
              : -1
          });
        });

        setRaces(data);
        console.log(today);
      });

  }, [season])




  return (
    <div className="max-w-full lg:max-w-[80%] xl:max-w-[60%] mx-auto p-2 md:p-8 flex flex-col gap-2 md:gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">{season} Season</h1>
        { season == today.getFullYear().toString() ? <Badge className="bg-red-thm text-md font-bold">Current Season</Badge> : <></>}
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="text-sm md:text-md min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-24">Round</TableHead>
              <TableHead className="w-full">Event</TableHead>
              <TableHead className="max-w-24">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              races?.map((race, index) => (
                <TableRow key={race.round} onClick={() => redirect(`/seasons/${season}/${race.round}`, RedirectType.push)} className={"hover:cursor-pointer"}>
                  <TableCell className={race.state == 0 ? "text-red-thm" : (race.state == 1 ? "text-neutral-400" : "")}>{race.round}</TableCell>
                  <TableCell className={"flex flex-col sm:flex-row gap-2 font-semibold" + (race.state == 0 ? " text-red-thm" : (race.state == 1 ? " text-neutral-400" : ""))}>{race.name} {race.state == 0 ? <Badge className="bg-red-thm">Race Weekend</Badge> : <></>}</TableCell>
                  <TableCell className={race.state == 0 ? "text-red-thm" : (race.state == 1 ? "text-neutral-400" : "")}>{race.startDate} - {race.endDate}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>

        </Table>
      </div>

    </div>
  );
}
