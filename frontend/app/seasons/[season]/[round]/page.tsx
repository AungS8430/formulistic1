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
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/info?year=${season}&gp=${round}`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content)
      let temp: { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number } = {
        round: parseInt(content.round ?? content.Round ?? content.roundNumber ?? "0"),
        name: content.raceName ?? content.name ?? "",
        circuit: content.Circuit?.circuitName ?? "",
        startDate: content.FirstPractice?.date
          ? new Date(content.FirstPractice.date).toLocaleDateString()
          : (content.date ? new Date(content.date).toLocaleDateString() : ""),
        endDate: content.date
          ? new Date(content.date).toLocaleDateString()
          : "",
        fp1: content.FirstPractice?.date && content.FirstPractice?.time
          ? new Date(`${content.FirstPractice.date.split("T")[0]}T${content.FirstPractice.time}`).toLocaleString()
          : null,
        fp2: content.SecondPractice?.date && content.SecondPractice?.time
          ? new Date(`${content.SecondPractice.date.split("T")[0]}T${content.SecondPractice.time}`).toLocaleString()
          : null,
        fp3: content.ThirdPractice?.date && content.ThirdPractice?.time
          ? new Date(`${content.ThirdPractice.date.split("T")[0]}T${content.ThirdPractice.time}`).toLocaleString()
          : null,
        sq: season == "2023"
          ? (content.SprintShootout?.date && content.SprintShootout?.time
              ? new Date(`${content.SprintShootout.date.split("T")[0]}T${content.SprintShootout.time}`).toLocaleString()
              : null)
          : (content.SprintQualifying?.date && content.SprintQualifying?.time
              ? new Date(`${content.SprintQualifying.date.split("T")[0]}T${content.SprintQualifying.time}`).toLocaleString()
              : null),
        sprint: content.Sprint?.date && content.Sprint?.time
          ? new Date(`${content.Sprint.date.split("T")[0]}T${content.Sprint.time}`).toLocaleString()
          : null,
        quali: content.Qualifying?.date && content.Qualifying?.time
          ? new Date(`${content.Qualifying.date.split("T")[0]}T${content.Qualifying.time}`).toLocaleString()
          : null,
        race: content.date && content.time
          ? new Date(`${content.date.split("T")[0]}T${content.time}`).toLocaleString()
          : (content.date ? new Date(content.date).toLocaleString() : ""),
        state: (() => {
          const start = content.FirstPractice?.date
            ? new Date(content.FirstPractice.date)
            : (content.date ? new Date(content.date) : null);
          const end = content.date ? new Date(content.date) : null;
          if (start && end) {
            if (start <= today && today <= end) return 0;
            if (today < start) return 1;
            return -1;
          }
          return -1;
        })()
      };
      setRace(temp)
    })
  }, [season, round])




  return (
    <div className="max-w-full lg:max-w-[80%] xl:max-w-[60%] mx-auto p-2 md:p-8 flex flex-col gap-4">
      <div>
        <div className="flex flex-col sm:flex-row md:gap-2">
          <h1 className="text-2xl md:text-4xl font-bold">{season} {race?.name}</h1>
          { race?.state == 0 ? <Badge className="bg-red-thm text-sm md:text-md font-bold">Race Weekend</Badge> : <></>}
          <div className="grow"></div>
        </div>
        <h3 className="text-md md:text-lg text-neutral-400 my-auto font-semibold">{race?.startDate} - {race?.endDate} · {race?.circuit}</h3>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-semibold">Weekend Schedule</h2>
        <div className="border border-border rounded-lg overflow-x-auto">
          <Table className="text-sm md:text-md min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">Event</TableHead>
                <TableHead className="max-w-24">Date/Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="hover:cursor-pointer">
              {
                race?.fp1 ? (
                  // <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp1`, RedirectType.push)}>
                  <TableRow>
                    <TableCell className="font-semibold">Free Practice 1</TableCell>
                    <TableCell>{race.fp1}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.fp2 ? (
                  // <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp2`, RedirectType.push)}>
                  <TableRow>
                    <TableCell className="font-semibold">Free Practice 2</TableCell>
                    <TableCell>{race.fp2}</TableCell>
                  </TableRow>
                ) : <></>
              }
              {
                race?.fp3 ? (
                  // <TableRow onClick={() => redirect(`/seasons/${season}/${round}/fp3`, RedirectType.push)}>
                  <TableRow>
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
