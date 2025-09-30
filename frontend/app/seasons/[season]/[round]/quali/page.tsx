"use client";

import { useState, useEffect, use } from "react";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"


export default function QualiStats({ params }: { params: Promise<{ season: string, round: string }>}) {
  const { season, round } = use(params)
  const [race, setRace] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number }>(null)
  const [data, setData] = useState<null | { name: string, dnumber: string, team: string, color: string, position: number, q1: number | null, q2: number | null, q3: number | null }[]>(null)

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
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=q`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let temp: { name: string, dnumber: string, team: string, color: string, position: number, q1: number | null, q2: number | null, q3: number | null}[] = [];
      for (let i in content.DriverNumber) {
        temp.push({
          name: content.FullName[i],
          dnumber: i,
          team: content.TeamName[i],
          color: content.TeamColor[i],
          position: content.Position[i],
          q1: content.Q1[i] || null,
          q2: content.Q2[i] || null,
          q3: content.Q3[i] || null,
        })
      }
      temp.sort((a, b) => {
        return a.position < b.position ? -1 : 1;
      })
      console.log(content)
      setData((temp))
    })
  }, [season, round]);

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
        <h2 className="text-xl font-semibold">Qualifying Results</h2>
        <div className="border border-border rounded-lg">
          <Table className="text-md">
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Constructor</TableHead>
                <TableHead>Q1</TableHead>
                <TableHead>Q2</TableHead>
                <TableHead>Q3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data?.map((row) => (
                  <TableRow key={row.dnumber}>
                    <TableCell>{row.position}</TableCell>
                    <TableCell className="font-semibold">{row.dnumber} {row.name}</TableCell>
                    <TableCell style={{ color: `#${row.color}` }}>{row.team}</TableCell>
                    <TableCell>{row.q1 !== null ? `${Math.floor(row.q1 / 60)}:${(row.q1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                    <TableCell>{row.q2 !== null ? `${Math.floor(row.q2 / 60)}:${(row.q2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                    <TableCell>{row.q3 !== null ? `${Math.floor(row.q3 / 60)}:${(row.q3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
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