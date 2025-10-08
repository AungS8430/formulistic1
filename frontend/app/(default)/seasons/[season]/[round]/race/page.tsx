"use client";

import { useState, useEffect, use } from "react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function QualiStats({ params }: { params: Promise<{ season: string, round: string }>}) {
  const { season, round } = use(params)
  const [race, setRace] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number }>(null)
  const [data, setData] = useState<null | { name: string, dnumber: string, team: string, color: string, position: number, grid: number | null, time: number | null, note: string | null }[]>(null)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/info?year=${season}&gp=${round}`).then((response) => response.json()).then((content) => {
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
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=r`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let temp: { name: string, dnumber: string, team: string, color: string, position: number, grid: number | null, time: number | null, note: string | null }[] = [];
      for (let i in content.DriverNumber) {
        temp.push({
          name: content.FullName[i],
          dnumber: i,
          team: content.TeamName[i],
          color: content.TeamColor[i],
          position: content.Position[i],
          grid: content.GridPosition[i],
          time: content.Time[i] || null,
          note: content.ClassifiedPosition[i] == "R" ? "DNF" : content.ClassifiedPosition[i] == "D" ? "DSQ" : content.ClassifiedPosition[i] == "W" ? "DNS" : null
        })
      }
      temp.sort((a, b) => {
        return a.position < b.position ? -1 : 1;
      })
      setData((temp))
    })
  }, [season, round]);

  return (
    <div className="max-w-full lg:max-w-[80%] xl:max-w-[60%] mx-auto p-2 md:p-8 flex flex-col gap-4">
      <div>
        <div className="flex flex-col sm:flex-row gap-2">
          <h1 className="text-2xl md:text-4xl font-bold">{season} {race?.name}</h1>
          { race?.state == 0 ? <Badge className="bg-red-thm text-sm md:text-md font-bold">Race Weekend</Badge> : <></>}
          <div className="grow"></div>
        </div>
        <h3 className="text-md md:text-lg text-neutral-400 my-auto font-semibold">{race?.startDate} - {race?.endDate} · {race?.circuit}</h3>
      </div>
      <div>
        <div className="gap-2 inline-flex">
          <h2 className="text-lg md:text-xl font-semibold">Race Results</h2>
          <Link href={`/seasons/${season}/${round}/race/stats`}>
            <Button variant="link" className="-m-1 hover:cursor-pointer">View Stats</Button>
          </Link>

        </div>
        <div className="border border-border rounded-lg overflow-x-auto">
          <Table className="text-sm md:text-md min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Constructor</TableHead>
                <TableHead>Grid</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data?.map((row) => (
                  <TableRow key={row.dnumber}>
                    <TableCell>{row.position}</TableCell>
                    <TableCell className="font-semibold">{row.dnumber} {row.name}</TableCell>
                    <TableCell style={{ color: `#${row.color}` }}>{row.team}</TableCell>
                    <TableCell>{row.grid}</TableCell>
                    <TableCell>{row.position == 1 ? "Interval" : row.note ? row.note : row.time !== null ? `+${Math.floor(row.time / 60) > 0 ? Math.floor(row.time / 60) + ":" : ""}${(row.time % 60).toFixed(3)}` : "DNF"}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}