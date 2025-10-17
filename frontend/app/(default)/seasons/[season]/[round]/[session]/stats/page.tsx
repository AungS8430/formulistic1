"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Compound from "@/components/compound";
import StrategyChart from "@/components/strategy";
import PaceChart from "@/components/paceChart";
import Link from "next/link";

interface RaceResults {
  name: string,
  dnumber: string,
  team: string,
  color: string,
  position: number,
  grid: number | null,
  time: number | null,
  note: string | null,
  points: number | null,
}

interface SectorInfo {
  time: number | null,
  personalBest: boolean | null,
  overallFastest: boolean | null,
}

interface LapData {
  lap: number,
  driver: number,
  time: number,
  sectors: {
    [sectors: number]: SectorInfo
  }
  position: number,
  interval: number | null,
  pit: number | null,
  compound: string | null,
  tyreLife: number | null,
  personalBest: boolean,
  overallFastest: boolean,
}

interface DriverData {
  [driver: number]: {
    name: string,
    dnumber: string,
    team: string,
    color: string,
    laps: LapData[],
  }
}

interface LapTimes {
  [lap: number]: {
    [position: number]: LapData
  }
}

interface CompoundInfo {
  [name: string]: {
    color: string,
    abbreviation: string,
  }
}

interface Stint {
  stint: number,
  compound: string,
  length: number,
}

interface Strategy {
  [driver: string]: Stint[]
}

interface Pace {
  team: string,
  min: number,
  q1: number,
  median: number,
  q3: number,
  max: number,
  lower_whisker: number,
  upper_whisker: number,
  color: string,
}

const sessionNames = {
  "fp1": "Free Practice 1",
  "fp2": "Free Practice 2",
  "fp3": "Free Practice 3",
  "sq": "Sprint Qualifying",
  "sprint": "Sprint",
  "quali": "Qualifying",
  "race": "Race"
}

function getSessionFullName(session: string, season: number) {
  if (session == "sq" && season == 2023) {
    return "Sprint Shootout"
  }
  return sessionNames[session as keyof typeof sessionNames] || session
}

export default function StatsPage({params}: { params: Promise<{ season: string, round: string, session: string }> }) {
  const { season, round, session } = React.use(params);
  const [sessionResults, setSessionResults] = useState<RaceResults[] | undefined>(undefined);
  const [lapTimes, setLapTimes] = useState<LapTimes>({});
  const [drivers, setDrivers] = useState<DriverData>({});
  const [compounds, setCompounds] = useState<CompoundInfo>({});
  const [fastests, setFastests] = useState<{ lap: number, s1: number, s2: number, s3: number }>({ lap: 0, s1: 0, s2: 0, s3: 0 });
  const [strategy, setStrategy] = useState<Strategy>({});
  const [pace, setPace] = useState<Pace[]>([]);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [currentDriver, setCurrentDriver] = useState<number | null>(null);

  useEffect(() => {
    const getRace = async () => {
      if (session == "sprint") {
        return await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=s`)
          .then((response) => response.json())
          .then((content) => {
            content = JSON.parse(content.replaceAll("NaN", "null"));
            let res: RaceResults[] = [];
            for (let i in content.DriverNumber) {
              res.push({
                name: content.FullName[i],
                dnumber: i,
                team: content.TeamName[i],
                color: content.TeamColor[i],
                position: content.Position[i],
                grid: content.GridPosition[i],
                time: content.Time[i] || null,
                note:
                  content.ClassifiedPosition[i] == "R"
                    ? "DNF"
                    : content.ClassifiedPosition[i] == "D"
                      ? "DSQ"
                      : content.ClassifiedPosition[i] == "W"
                        ? "DNS"
                        : null,
                points: content.Points[i] || null,
              });
            }
            res.sort((a, b) => (a.position < b.position ? -1 : 1));
            return res;
          })
      }
      if (session == "race") {
        return await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=r`)
          .then((response) => response.json())
          .then((content) => {
            content = JSON.parse(content.replaceAll("NaN", "null"));
            let res: RaceResults[] = [];
            for (let i in content.DriverNumber) {
              res.push({
                name: content.FullName[i],
                dnumber: i,
                team: content.TeamName[i],
                color: content.TeamColor[i],
                position: content.Position[i],
                grid: content.GridPosition[i],
                time: content.Time[i] || null,
                note:
                  content.ClassifiedPosition[i] == "R"
                    ? "DNF"
                    : content.ClassifiedPosition[i] == "D"
                      ? "DSQ"
                      : content.ClassifiedPosition[i] == "W"
                        ? "DNS"
                        : null,
                points: content.Points[i] || null,
              });
            }
            res.sort((a, b) => (a.position < b.position ? -1 : 1));
            return res;
          })
      }
    };

    const getStats = async (sessionResults: RaceResults[] | undefined) => {
      return await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/laptimes?year=${season}&gp=${round}&session=${session[0]}`)
        .then((response) => response.json())
        .then((content) => {
          content = JSON.parse(content.replaceAll("NaN", "null"));
          console.log(content)
          let lapTimes: LapTimes = {};
          let drivers: DriverData = {};
          for (let driver in content["Data"]) {
            drivers[Number(driver)] = {
              name: sessionResults?.filter(r => r.dnumber === content["Data"][driver]["DriverNumber"]["1.0"])[0]?.name ?? "",
              dnumber: content["Data"][driver]["DriverNumber"]["1.0"],
              color: sessionResults?.filter(r => r.dnumber === content["Data"][driver]["DriverNumber"]["1.0"])[0]?.color ?? "",
              team: sessionResults?.filter(r => r.dnumber === content["Data"][driver]["DriverNumber"]["1.0"])[0]?.team ?? "",
              laps: [],
            }
            for (let lap in content["Data"][driver]["LapTime"]) {
              const lapData: LapData = {
                lap: Number(lap),
                driver: Number(driver),
                time: content["Data"][driver]["LapTime"][lap] ?? null,
                sectors: {
                  1: { time: content["Data"][driver]["Sector1Time"] ? content["Data"][driver]["Sector1Time"][lap] ?? null : null, personalBest: content["Data"][driver]["Fastest"]["s1"] == Number(lap), overallFastest: content["Fastest"]["s1"] == driver && content["Data"][driver]["Fastest"]["s1"] == Number(lap) },
                  2: { time: content["Data"][driver]["Sector2Time"] ? content["Data"][driver]["Sector2Time"][lap] ?? null : null, personalBest: content["Data"][driver]["Fastest"]["s2"] == Number(lap), overallFastest: content["Fastest"]["s2"] == driver && content["Data"][driver]["Fastest"]["s2"] == Number(lap) },
                  3: { time: content["Data"][driver]["Sector3Time"] ? content["Data"][driver]["Sector3Time"][lap] ?? null : null, personalBest: content["Data"][driver]["Fastest"]["s3"] == Number(lap), overallFastest: content["Fastest"]["s3"] == driver && content["Data"][driver]["Fastest"]["s3"] == Number(lap) },
                },
                position: content["Data"][driver]["Position"] ? content["Data"][driver]["Position"][lap] ?? 0 : 0,
                interval: content["Data"][driver]["GapToLeader"] ? content["Data"][driver]["GapToLeader"][lap] ?? null : null,
                pit: content["Data"][driver]["PitInTime"] ? content["Data"][driver]["PitInTime"][lap] ?? null : null,
                compound: content["Data"][driver]["Compound"] ? content["Data"][driver]["Compound"][lap] ?? null : null,
                tyreLife: content["Data"][driver]["TyreLife"] ? content["Data"][driver]["TyreLife"][lap] ?? null : null,
                personalBest: content["Data"][driver]["Fastest"]["lap"] == Number(lap),
                overallFastest: content["Fastest"]["lap"] == driver && content["Data"][driver]["Fastest"]["lap"] == Number(lap),
              };
              drivers[Number(driver)].laps.push(lapData);
              if (!lapTimes[Number(lap)]) lapTimes[Number(lap)] = {};
              lapTimes[Number(lap)][lapData.position] = lapData;
            }
          }
          let compounds: CompoundInfo = content["Compounds"] ? content["Compounds"] : {};
          let fastests = content["Fastest"] ? content["Fastest"] : { lap: 0, s1: 0, s2: 0, s3: 0 };
          let strategy: Strategy = {};
          Object.keys(content["Strategy"])?.forEach((driver) => {
            strategy[driver] = content["Strategy"][driver].map((stint: any) => ({
              stint: stint["Stint"],
              compound: stint["Compound"],
              length: stint["StintLength"],
            }));
          });
          let pace: Pace[] = content["Pace"] ? content["Pace"]["boxplot_stats"] : [];
          console.log(lapTimes);
          console.log(drivers);
          console.log(strategy);
          console.log(pace);
          return { lapTimes, drivers, compounds, fastests, strategy, pace };
        })
    }

    let ignore = false;
    (async () => {
      try {
        const results = await getRace();
        if (!ignore) setSessionResults(results);
        const stats = await getStats(results);
        if (!ignore) {
          setLapTimes(stats.lapTimes);
          setDrivers(stats.drivers);
          setCompounds(stats.compounds);
          setFastests(stats.fastests);
          setStrategy(stats.strategy);
          setPace(stats.pace)
          setCurrentDriver(stats.drivers ? Number(Object.keys(stats.drivers)[0]) : null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
    return () => { ignore = true; };
  }, [season, round, session]);

  return session == "race" || session == "sprint" ? (
    <Tabs defaultValue="lap-by-lap" className="flex flex-col w-full gap-4">
      <div className="flex flex-row">
        <div className="flex flex-row">
          <h1 className="text-xl md:text-3xl font-bold">{getSessionFullName(session, Number(season))} Stats</h1>
          {
            session == "race" || session == "sprint" && (
              <Link href={`/seasons/${season}/${round}/${session}`}>
                <Button variant="link" className="text-lg">View Results</Button>
              </Link>
            )
          }
        </div>
        <div className="grow" />
        <TabsList>
          <TabsTrigger value="lap-by-lap">Lap-by-Lap</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="strats">Strategy</TabsTrigger>
          <TabsTrigger value="pace">Team Pace</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="lap-by-lap" className="max-h-[calc(100dvh-260px)] overflow-auto border rounded-lg">
        {
          sessionResults ? (
            <div className="flex flex-col w-full h-full">
              <div className="sticky top-0 z-10 bg-primary-foreground">
                <Table className="text-base w-full">
                  <TableHeader>
                    <TableRow className="h-12 border-none flex flex-row hover:bg-primary-foreground">
                      <TableHead className="pl-4 text-2xl font-black flex items-center pt-2">
                        Lap {currentLap}
                        <span className="text-base text-gray-400 pl-2 pt-1.5">/ {Object.keys(lapTimes).length > 0 ? Math.max(...Object.keys(lapTimes).map(Number)) : ""}</span>
                      </TableHead>
                      <TableHead className="grow"></TableHead>
                      <TableHead className="flex pt-2">
                        <div className="flex items-center my-auto">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setCurrentLap((prev) => Math.max(1, prev - 1))}
                                  aria-disabled={currentLap === 1}
                                  className={currentLap === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                              {(() => {
                                const totalLaps = Object.keys(lapTimes).length > 0 ? Math.max(...Object.keys(lapTimes).map(Number)) : 1;
                                const lapWindow = 2;
                                const start = Math.max(1, currentLap - lapWindow);
                                const end = Math.min(totalLaps, currentLap + lapWindow);
                                const items = [];
                                if (start > 1) {
                                  items.push(
                                    <PaginationItem key={1}>
                                      <PaginationLink onClick={() => setCurrentLap(1)} isActive={currentLap === 1}>1</PaginationLink>
                                    </PaginationItem>
                                  );
                                  if (start > 2) {
                                    items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
                                  }
                                }
                                for (let i = start; i <= end; i++) {
                                  items.push(
                                    <PaginationItem key={i}>
                                      <PaginationLink onClick={() => setCurrentLap(i)} isActive={currentLap === i}>{i}</PaginationLink>
                                    </PaginationItem>
                                  );
                                }
                                if (end < totalLaps) {
                                  if (end < totalLaps - 1) {
                                    items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
                                  }
                                  items.push(
                                    <PaginationItem key={totalLaps}>
                                      <PaginationLink onClick={() => setCurrentLap(totalLaps)} isActive={currentLap === totalLaps}>{totalLaps}</PaginationLink>
                                    </PaginationItem>
                                  );
                                }
                                return items;
                              })()}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => setCurrentLap((prev) => {
                                    const totalLaps = Object.keys(lapTimes).length > 0 ? Math.max(...Object.keys(lapTimes).map(Number)) : 1;
                                    return Math.min(totalLaps, prev + 1);
                                  })}
                                  aria-disabled={currentLap === (Object.keys(lapTimes).length > 0 ? Math.max(...Object.keys(lapTimes).map(Number)) : 1)}
                                  className={currentLap === (Object.keys(lapTimes).length > 0 ? Math.max(...Object.keys(lapTimes).map(Number)) : 1) ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <Table className="text-base w-full">
                  <TableHeader>
                    <TableRow className="h-12">
                      <TableHead className="pl-4 w-10">Pos.</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="w-28">Compound</TableHead>
                      <TableHead className="w-24">Lap Time</TableHead>
                      <TableHead className="w-20">S1</TableHead>
                      <TableHead className="w-20">S2</TableHead>
                      <TableHead className="w-20">S3</TableHead>
                      <TableHead className="w-20">Interval</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div className="overflow-auto max-h-[calc(100dvh-360px)]">
                <Table className="text-base w-full h-full">
                  <TableBody>
                    {
                      Object.values(lapTimes[currentLap] ?? {}).map((row) => (
                        <TableRow key={`${row.driver}-${row.lap}`} className="h-12">
                          <TableCell className="pl-4 w-10 text-center">{row.position}</TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex flex-row items-center gap-2 text" style={{color: `#${drivers[row.driver]?.color}`}}>
                              <div className="w-8 text-right">{row.driver}</div>
                              <div>{drivers[row.driver]?.name ?? ""}</div>
                            </div>
                          </TableCell>
                          <TableCell className="w-28">
                            <div className="flex gap-1">
                              {row.compound && compounds[row.compound] ? <Compound abbreviation={compounds[row.compound].abbreviation} color={compounds[row.compound].color}/> : ""}
                              <span>{row.tyreLife} Laps</span>
                            </div>
                          </TableCell>
                          <TableCell className={"w-24" + (row.overallFastest ? " text-purple-400" : row.personalBest ? " text-green-400" : "")}>{
                            row.time ? `${Math.floor(row.time / 60)}:${(row.time % 60).toFixed(3).padStart(6, "0")}` : ""
                          }</TableCell>
                          <TableCell className={"w-20" + (row.sectors[1].overallFastest ? " text-purple-400" : row.sectors[1].personalBest ? " text-green-400" : "")}>{row.sectors[1].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className={"w-20" + (row.sectors[2].overallFastest ? " text-purple-400" : row.sectors[2].personalBest ? " text-green-400" : "")}>{row.sectors[2].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className={"w-20" + (row.sectors[3].overallFastest ? " text-purple-400" : row.sectors[3].personalBest ? " text-green-400" : "")}>{row.sectors[3].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className="w-20">{
                            row.interval ? `+${row.interval?.toFixed(3)}` : row.interval == 0 ? "Leader" : ""
                          }</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-xl text-gray-400">No results available for this session.</p>
          )
        }
      </TabsContent>

      <TabsContent value="drivers" className="max-h-[calc(100dvh-260px)] overflow-auto border rounded-lg">
        {
          sessionResults ? (
            <div className="flex flex-col w-full h-full">
              <div className="sticky top-0 z-10 bg-primary-foreground">
                <Table className="text-base w-full">
                  <TableHeader>
                    <TableRow className="h-20 border-none flex flex-row hover:bg-primary-foreground">
                      <TableHead className="flex flex-col items-center p-3 w-full items-start gap-2">
                        <p>Select driver</p>
                        <Select defaultValue={sessionResults[0].dnumber} onValueChange={(value) => setCurrentDriver(Number(value))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {
                              sessionResults && sessionResults.map((driver) => (
                                <SelectItem key={driver.dnumber} value={driver.dnumber} className="flex flex-row"><span>{driver.dnumber}</span><span className="font-bold">{driver.name}</span><span style={{ color: `#${driver.color}`}}>{driver.team}</span></SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <div className="sticky top-0 z-10 bg-primary-foreground">
                  <Table className="text-base w-full">
                    <TableHeader>
                      <TableRow className="h-12">
                        <TableHead className="pl-4 w-[12.5%]">Lap</TableHead>
                        <TableHead className="w-[12.5%]">Pos.</TableHead>
                        <TableHead className="w-[12.5%]">Compound</TableHead>
                        <TableHead className="w-[12.5%]">Lap Time</TableHead>
                        <TableHead className="w-[12.5%]">S1</TableHead>
                        <TableHead className="w-[12.5%]">S2</TableHead>
                        <TableHead className="w-[12.5%]">S3</TableHead>
                        <TableHead className="w-[12.5%]">Interval</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
              </div>
              <div className="h-full overflow-auto">
                <Table className="text-base w-full h-full">
                  <TableBody>
                    {
                      drivers[currentDriver ?? 0]?.laps?.map((row) => (
                        <TableRow key={row.lap} className="h-12">
                          <TableCell className="pl-4 w-[12.5%]">{row.lap}</TableCell>
                          <TableCell className="w-[12.5%]">{row.position}</TableCell>
                          <TableCell className="w-[12.5%]">
                            <div className="flex gap-1">
                              {row.compound ? <Compound abbreviation={compounds[row.compound ?? ""].abbreviation} color={compounds[row.compound ?? ""].color}/> : ""}
                              <span>{row.tyreLife} Laps</span>
                            </div>

                          </TableCell>
                          <TableCell className={"w-[12.5%]" + (row.overallFastest ? " text-purple-400" : row.personalBest ? " text-green-400" : "")}>{
                            row.time ? `${Math.floor(row.time / 60)}:${(row.time % 60).toFixed(3).padStart(6, "0")}` : ""
                            // 'time' in row && row.interval !== null ? row.position == 1 ? `${Math.floor(row.interval / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${(row.interval % 60).toFixed(3).padStart(6, "0")}` : `+${Math.floor(row.interval / 60) > 0 ? `${Math.floor(row.interval / 60)}:` : ""}${(row.interval % 60).toFixed(3).padStart(6, "0")}` : ""
                          }</TableCell>
                          <TableCell className={"w-[12.5%]" + (row.sectors[1].overallFastest ? " text-purple-400" : row.sectors[1].personalBest ? " text-green-400" : "")}>{row.sectors[1].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className={"w-[12.5%]" + (row.sectors[2].overallFastest ? " text-purple-400" : row.sectors[2].personalBest ? " text-green-400" : "")}>{row.sectors[2].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className={"w-[12.5%]" + (row.sectors[3].overallFastest ? " text-purple-400" : row.sectors[3].personalBest ? " text-green-400" : "")}>{row.sectors[3].time?.toFixed(3) ?? ""}</TableCell>
                          <TableCell className="w-[12.5%]">{
                            row.interval ? `+${row.interval?.toFixed(3)}` : row.interval == 0 ? "Leader" : ""
                            // 'time' in row && row.interval !== null ? row.position == 1 ? `${Math.floor(row.interval / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${(row.interval % 60).toFixed(3).padStart(6, "0")}` : `+${Math.floor(row.interval / 60) > 0 ? `${Math.floor(row.interval / 60)}:` : ""}${(row.interval % 60).toFixed(3).padStart(6, "0")}` : ""
                          }</TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-xl text-gray-400">No results available for this session.</p>
          )
        }
      </TabsContent>
      <TabsContent value="strats" className="min-h-[calc(100dvh-260px)] p-4 overflow-auto flex flex-col border rounded-lg">
        <StrategyChart strategy={strategy} compounds={compounds} />
      </TabsContent>
      <TabsContent value="pace" className="min-h-[calc(100dvh-260px)] p-4 pt-8 overflow-auto flex flex-col border rounded-lg">
        <PaceChart paceData={pace} />
      </TabsContent>
    </Tabs>
  ) : (
    <div>
      <h1 className="text-xl md:text-3xl font-bold">Stats Unavailable</h1>
      <p className="text-lg text-gray-400">Stats are only available for Race and Sprint sessions.</p>
    </div>
  )
}