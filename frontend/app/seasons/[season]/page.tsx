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
    fetch(`http://100.125.78.96:1234/season/schedule?year=${season}`).then((response) => response.json()).then((content) => {
      let data: { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[] = [];
      console.log(content)
      content.map((row: any) => {
        const startDateTime = row.FirstPractice
          ? (row.FirstPractice.date.includes("T")
              ? new Date(row.FirstPractice.date + (row.FirstPractice.time ? "" : "T00:00:00Z"))
              : new Date(row.FirstPractice.date + "T" + (row.FirstPractice.time ? row.FirstPractice.time : "00:00:00Z")))
          : (row.date.includes("T")
              ? new Date(row.date + (row.time ? "" : "T00:00:00Z"))
              : new Date(row.date + "T" + (row.time ? row.time : "00:00:00Z")));
        const endDateTime = row.date.includes("T")
          ? new Date(row.date + (row.time ? "" : "T00:00:00Z"))
          : new Date(row.date + "T" + (row.time ? row.time : "00:00:00Z"));
        data.push({
          round: row.round,
          name: row.raceName,
          circuit: row.Circuit.circuitName,
          startDate: startDateTime.toLocaleDateString(),
          endDate: endDateTime.toLocaleDateString(),
          state: (startDateTime <= today && today <= endDateTime ? 0 : (today < startDateTime ? 1 : -1))
        })
      })
      setRaces(data)
      console.log(today)
    })

  }, [season])




  return (
    <div className="lg:max-w-[80%] xl:max-w-[60%] mx-auto p-8 flex flex-col gap-4">
      <div className="flex flex-row gap-2">
        <h1 className="text-4xl font-bold">{season} Season</h1>
        { season == today.getFullYear().toString() ? <Badge className="bg-red-thm text-md font-bold">Current Season</Badge> : <></>}
      </div>
      <div className="border border-border rounded-lg">
        <Table className="text-md">
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
                  <TableCell className={"flex flex-row gap-2 font-semibold" + (race.state == 0 ? " text-red-thm" : (race.state == 1 ? " text-neutral-400" : ""))}>{race.name} {race.state == 0 ? <Badge className="bg-red-thm">Race Weekend</Badge> : <></>}</TableCell>
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
