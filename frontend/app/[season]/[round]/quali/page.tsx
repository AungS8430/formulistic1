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
    fetch(`https://api.jolpi.ca/ergast/f1/${season}/${round}/races`).then((response) => response.json()).then((content) => {
      const row = content.MRData.RaceTable.Races[0]
      let temp: { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number } = {
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
      setRace(temp)
    })
    fetch(`http://100.125.78.96:1234/session/results?year=${season}&gp=${round}&session=q`).then((response) => response.json()).then((content) => {
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