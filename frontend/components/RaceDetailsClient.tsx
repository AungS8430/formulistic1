"use client"

import {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {formatDateLocal} from "@/utils/datetime";
import {Button} from "@/components/ui/button";
import Link from "next/link";

interface Race {
  round: number,
  name: string,
  circuit: string,
  startDate: string,
  endDate: string,
  range: string,
  lat: string | null,
  long: string | null,
  fp1: string | null,
  fp2: string | null,
  fp3: string | null,
  sq: string | null,
  sprint: string | null,
  quali: string | null,
  race: string,
  results: Results | null,
}

interface Results {
  sq: QualiResults[] | null,
  sprint: RaceResults[] | null,
  quali: QualiResults[] | null,
  race: RaceResults[] | null,
}

interface RaceResults {
  name: string,
  dnumber: string,
  team: string,
  color: string,
  position: number,
  grid: number | null,
  time: number | null,
  note: string | null
}

interface QualiResults {
  name: string,
  dnumber: string,
  team: string,
  color: string,
  position: number,
  q1: number | null,
  q2: number | null,
  q3: number | null
}

export function RaceDetailsClient({ initialRace, season, round }: { initialRace: Race, season: string, round: string }) {
  const [race, setRace] = useState<Race>(initialRace);

  useEffect(() => {
    const formatSessionTime = (dateString: string | null) => {
      if (!dateString) return null;
      return formatDateLocal(new Date(dateString));
    };

    setRace({
      ...initialRace,
      fp1: formatSessionTime(initialRace.fp1),
      fp2: formatSessionTime(initialRace.fp2),
      fp3: formatSessionTime(initialRace.fp3),
      sq: formatSessionTime(initialRace.sq),
      sprint: formatSessionTime(initialRace.sprint),
      quali: formatSessionTime(initialRace.quali),
      race: formatSessionTime(initialRace.race)!,
    });
  }, [initialRace]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex flex-col gap-4 basis-2/3">
        <h2 className="text-2xl font-semibold">Weekend Schedule</h2>
        <div className="flex flex-col lg:h-[calc(100vh-249px)] overflow-y-auto gap-4">
          {
            race.fp1 && (
              <div className="flex flex-col w-full rounded-md border order-first">
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 1</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{race.fp1}</p>
                </div>
              </div>
            )
          }
          {
            race.fp2 && (
              <div className={"flex flex-col w-full rounded-md border" + (race.sprint && race.sq ? " order-1" : " order-0")}>
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 2</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{race.fp2}</p>
                </div>
              </div>
            )
          }
          {
            race.fp3 && (
              <div className={"flex flex-col w-full rounded-md border order-1"}>
                <div className="bg-primary-foreground/30 p-4">
                  <h4 className="font-semibold text-base sm:text-lg">Free Practice 3</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{race.fp3}</p>
                </div>
              </div>
            )
          }
          {
            race.sq && (
              <div className={"flex flex-col w-full rounded-md border" + (Number(season) == 2023 ? " order-1" : " order-0")}>
                <Link className="bg-primary-foreground/30 p-4"
                      href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}>
                  <h4
                    className="font-semibold text-base sm:text-lg">{season == "2023" ? "Sprint Shootout" : "Sprint Qualifying"}</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{race.sq}</p>
                </Link>
                {
                  race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 && (
                    <div className="hidden sm:flex flex-col gap-2 p-4">
                      <h5 className="text-lg font-semibold">Sprint Qualifying Results</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>SQ1</TableHead>
                            <TableHead>SQ2</TableHead>
                            <TableHead>SQ3</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {
                            race.results.sq.slice(0, 3).map((row) => (
                              <TableRow key={row.dnumber}>
                                <TableCell>{row.position}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex flex-row items-center gap-2 text">
                                    <div className="w-8 text-right">{row.dnumber}</div>
                                    <div>{row.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell style={{color: `#${row.color}`}}>{row.team}</TableCell>
                                <TableCell>{row.q1 !== null ? `${Math.floor(row.q1 / 60)}:${(row.q1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                                <TableCell>{row.q2 !== null ? `${Math.floor(row.q2 / 60)}:${(row.q2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                                <TableCell>{
                                  row.q3 !== null ? `${Math.floor(row.q3 / 60)}:${(row.q3 % 60).toFixed(3).padStart(6, "0")}` : ""
                                }</TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                      <Link
                        href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}
                        className="flex flex-col">
                        <Button className="cursor-pointer">View</Button>
                      </Link>
                    </div>
                  )
                }
              </div>
            )
          }
          {
            race.sprint && (
              <div className={"flex flex-col w-full rounded-md border" + (Number(season) >= 2024 ? " order-2" : " order-1")}>
                <Link className="bg-primary-foreground/30 p-4"
                      href={race?.results?.sprint && (race?.results?.sprint?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sprint` : "#"}>
                  <h4 className="font-semibold text-base md:text-lg">Sprint</h4>
                  <p className="text-gray-400 text-sm md:text-base">{race.sprint}</p>
                </Link>
                {
                  race?.results?.sprint && (race?.results?.sprint?.length ?? 0) > 0 && (
                    <div className="hidden sm:flex flex-col gap-2 p-4">
                      <h5 className="text-lg font-semibold">Sprint Results</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Interval</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {
                            race.results.sprint.slice(0, 3).map((row) => (
                              <TableRow key={row.dnumber}>
                                <TableCell>{row.position}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex flex-row items-center gap-2 text">
                                    <div className="w-8 text-right">{row.dnumber}</div>
                                    <div>{row.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell style={{color: `#${row.color}`}}>{row.team}</TableCell>
                                <TableCell>{
                                  row.time !== null ? `${Math.floor(row.time / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${Math.floor(row.time / 60) > 0 ? (row.time % 60).toFixed(3).padStart(6, "0") : `+${(row.time % 60).toFixed(3)}`}` : ""
                                }</TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                      <Link
                        href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}
                        className="flex flex-col">
                        <Button className="cursor-pointer">View</Button>
                      </Link>
                    </div>
                  )
                }
              </div>
            )
          }
          {
            race.quali && (
              <div className={"flex flex-col w-full rounded-md border" + (Number(season) <= 2023 && race.sq && race.sprint ? " order-0" : " order-2")}>
                <Link className="bg-primary-foreground/30 p-4"
                      href={race?.results?.quali && (race?.results?.quali?.length ?? 0) > 0 ? `/seasons/${season}/${round}/quali` : "#"}>
                  <h4 className="font-semibold text-base sm:text-lg">Qualifying</h4>
                  <p className="text-gray-400 text-sm sm:text-base">{race.quali}</p>
                </Link>
                {
                  race?.results?.quali && (race?.results?.quali?.length ?? 0) > 0 && (
                    <div className="hidden sm:flex flex-col gap-2 p-4">
                      <h5 className="text-lg font-semibold">Qualifying Results</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Q1</TableHead>
                            <TableHead>Q2</TableHead>
                            <TableHead>Q3</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {
                            race.results.quali.slice(0, 3).map((row) => (
                              <TableRow key={row.dnumber}>
                                <TableCell>{row.position}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex flex-row items-center gap-2 text">
                                    <div className="w-8 text-right">{row.dnumber}</div>
                                    <div>{row.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell style={{color: `#${row.color}`}}>{row.team}</TableCell>
                                <TableCell>{row.q1 !== null ? `${Math.floor(row.q1 / 60)}:${(row.q1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                                <TableCell>{row.q2 !== null ? `${Math.floor(row.q2 / 60)}:${(row.q2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                                <TableCell>{
                                  row.q3 !== null ? `${Math.floor(row.q3 / 60)}:${(row.q3 % 60).toFixed(3).padStart(6, "0")}` : ""
                                }</TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                      <Link
                        href={race?.results?.quali && (race?.results?.quali?.length ?? 0) > 0 ? `/seasons/${season}/${round}/quali` : "#"}
                        className="flex flex-col">
                        <Button className="cursor-pointer">View</Button>
                      </Link>
                    </div>
                  )
                }
              </div>
            )
          }
          {
            race.race && (
              <div className="flex flex-col w-full rounded-md border order-last">
                <Link className="bg-primary-foreground/30 p-4"
                      href={race?.results?.race && (race?.results?.race?.length ?? 0) > 0 ? `/seasons/${season}/${round}/race` : "#"}>
                  <h4 className="font-semibold text-lg">Race</h4>
                  <p className="text-gray-400">{race.race}</p>
                </Link>
                {
                  race?.results?.race && (race?.results?.race?.length ?? 0) > 0 && (
                    <div className="hidden sm:flex flex-col gap-2 p-4">
                      <h5 className="text-lg font-semibold">Race Results</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Interval</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {
                            race.results.race.slice(0, 3).map((row) => (
                              <TableRow key={row.dnumber}>
                                <TableCell>{row.position}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex flex-row items-center gap-2 text">
                                    <div className="w-8 text-right">{row.dnumber}</div>
                                    <div>{row.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell style={{color: `#${row.color}`}}>{row.team}</TableCell>
                                <TableCell>{
                                  row.time !== null ? `${Math.floor(row.time / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${Math.floor(row.time / 60) > 0 ? (row.time % 60).toFixed(3).padStart(6, "0") : `+${(row.time % 60).toFixed(3)}`}` : ""
                                }</TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                      <Link
                        href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}
                        className="flex flex-col">
                        <Button className="cursor-pointer">View</Button>
                      </Link>
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      </div>
      <div className="basis-1/3 flex flex-col gap-4">
        <h3 className="text-2xl font-semibold">Location</h3>
        <iframe src={`https://maps.google.com/maps?q=${race.lat},${race.long}&z=14&output=embed&t=k`} height="300"
                loading="lazy" className=""/>
      </div>
    </div>
  );
}

