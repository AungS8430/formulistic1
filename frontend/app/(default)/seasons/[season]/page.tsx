"use client";

import {use, useEffect, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {redirect, RedirectType} from "next/navigation";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

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
      });
  }, [season])
  return races ? (
    <div className="max-w-full lg:max-w-[80%] xl:max-w-[60%] mx-auto p-2 md:p-8 flex flex-col gap-2 md:gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <h1 className="text-2xl md:text-3xl">{season} Season</h1>
        { season == today.getFullYear().toString() ? <Badge className="bg-red-thm text-md font-bold">Current Season</Badge> : <></>}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {
          races.map((race, index) => (
            <Item key={race.round} variant={race.state == 1 ? "muted" : "outline"} className="hover:bg-accent/30 hover:cursor-pointer" onClick={() => redirect(`/seasons/${season}/${race.round}`, RedirectType.push)}>
              <ItemContent>
                <ItemTitle>{race.name} {race.state == 0 ? <Badge className="bg-red-thm">Race Weekend</Badge> : ""}</ItemTitle>
                <ItemDescription>{race.circuit}<br />{race.startDate} - {race.endDate}</ItemDescription>
              </ItemContent>
            </Item>
          ))
        }
      </div>
    </div>
  ) : (
    <div className="flex h-[calc(100vh-104px)] w-full items-center justify-center">
      <Spinner className="w-16 h-16" />
    </div>
  )
}
