"use client";

import {use, useEffect, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {redirect, RedirectType} from "next/navigation";

export default function SeasonPage({ params }: { params: Promise<{ season: string, round: string }> }) {
  const { season, round } = use(params)
  const [race, setRace] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number }>(null)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/races`).then((response) => response.json()).then((content) => {
      const row = content.MRData.RaceTable.Races[0]
      console.log(row)
      let data: { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number } = {
        round: parseInt(row.round),
        name: row.raceName,
        circuit: row.Circuit.circuitName,
        startDate: (new Date(row.FirstPractice ? row.FirstPractice.date : row.date)).toLocaleDateString(),
        endDate: (new Date(row.date)).toLocaleDateString(),
        fp1: row.FirstPractice ? (new Date(row.FirstPractice.date + "T" + (row.FirstPractice.time ? row.FirstPractice.time : "00:00:00Z"))).toLocaleString() : null,
        fp2: row.SecondPractice ? (new Date(row.SecondPractice.date + "T" + (row.SecondPractice.time ? row.SecondPractice.time : "00:00:00Z"))).toLocaleString() : null,
        fp3: row.ThirdPractice ? (new Date(row.ThirdPractice.date + "T" + (row.ThirdPractice.time ? row.ThirdPractice.time : "00:00:00Z"))).toLocaleString() : null,
        sq: season == "2023" ? (row.SprintShootout ? (new Date(row.SprintShootout.date + "T" + (row.SprintShootout.time ? row.SprintShootout.time : "00:00:00Z"))).toLocaleString() : null ) : (row.SprintQualifying ? (new Date(row.SprintQualifying.date + "T" + (row.SprintQualifying.time ? row.SprintQualifying.time : "00:00:00Z"))).toLocaleDateString() : null),
        sprint: row.Sprint ? (new Date(row.Sprint.date + "T" + (row.Sprint.time ? row.Sprint.time : "00:00:00Z"))).toLocaleString() : null,
        quali: row.Qualifying ? (new Date(row.Qualifying.date + "T" + (row.Qualifying.time ? row.Qualifying.time : "00:00:00Z"))).toLocaleString() : null,
        race : (new Date(row.date + "T" + (row.time ? row.time : "00:00:00Z"))).toLocaleString(),
        state: (new Date((new Date(row.FirstPractice ? row.FirstPractice.date : row.date)).getDate()) <= today && today <= new Date((new Date(row.date)).getDate()) ? 0 : (today < new Date((new Date(row.FirstPractice ? row.FirstPractice.date : row.date)).getDate()) ? 1 : -1))
      };
      setRace(data)
    })
  }, [season, round])




  return (
    <div className="lg:max-w-[80%] xl:max-w-[60%] mx-auto p-8 flex flex-col gap-4">
      <div>
        <div className="flex flex-row gap-2">
          <h1 className="text-4xl font-bold">{season} {race?.name}</h1>
          { race?.state == 0 ? <Badge className="bg-red-thm text-md font-bold">Race Weekend</Badge> : <></>}
          <div className="grow"></div>
        </div>
        <h3 className="text-lg text-neutral-400 my-auto font-semibold">{race?.startDate} - {race?.endDate} · {race?.circuit}</h3>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Weekend Schedule</h2>
        <div className="border border-border rounded-lg">
          <Table className="text-md">
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">Event</TableHead>
                <TableHead className="max-w-24">Date/Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="hover:cursor-pointer">
              {
                race?.fp1 ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp1`, RedirectType.push)}>
                    <TableCell className="font-semibold">Free Practice 1</TableCell>
                    <TableCell>{race.fp1}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.fp2 ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp2`, RedirectType.push)}>
                    <TableCell className="font-semibold">Free Practice 2</TableCell>
                    <TableCell>{race.fp2}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.fp3 ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp3`, RedirectType.push)}>
                    <TableCell className="font-semibold">Free Practice 3</TableCell>
                    <TableCell>{race.fp3}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.sq ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/sq`, RedirectType.push)}>
                    <TableCell className="font-semibold">{parseInt(season) === 2023 ? "Sprint Shootout" : "Sprint Qualifying"}</TableCell>
                    <TableCell>{race.sq}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.sprint ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/sprint`, RedirectType.push)}>
                    <TableCell className="font-semibold">Sprint</TableCell>
                    <TableCell>{race.sprint}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.quali ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/quali`, RedirectType.push)}>
                    <TableCell className="font-semibold">Qualifying</TableCell>
                    <TableCell>{race.quali}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.race ? (
                  <TableRow onClick={() => redirect(`/seasons/${season}/${round}/race`, RedirectType.push)}>
                    <TableCell className="font-semibold">Race</TableCell>
                    <TableCell>{race.race}</TableCell>
                  </TableRow>
                ) : <></>
              }
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
