"use client";

import React, {use, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import {redirect, RedirectType} from "next/navigation";
import Compound from "@/components/compound";
import Weather from "@/components/weather";
import { Spinner } from "@/components/ui/spinner";

export default function PastStats({ params }: { params: Promise<{ season: string, round: string }>}) {
  const { season, round } = use(params);
  const [mode, setMode] = useState<string>("Lap-by-Lap")
  const [driver, setDriver] = useState<number | null>(null)
  const [lap, setLap] = useState<number>(1)
  const [compounds, setCompounds] = useState<null | { [key: string]: { abbreviation: string, color: string } }>(null)
  const [race, setRace] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number }>(null)
  const [data, setData] = useState<null | { name: string, dnumber: string, code: string, team: string, color: string, position: number, grid: number | null, time: number | null }[]>(null)
  const [driverData, setDriverData] = useState<null | { name: string, dnumber: number, code: string, fastest: { lap: number, s1: number, s2: number, s3: number }, laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] }[]>(null)
  const [lapData, setLapData] = useState<null | { lap: string, drivers: { name: string, dnumber: number, code: string, position: number | null, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, interval: number }[] }[]>(null)
  const [weather, setWeather] = useState<null | { lap: string, airTemp: number, trackTemp: number, humidity: number, pressure: number, rain: boolean, windSpeed: number, windDir: number }[]>(null)
  const [fastest, setFastest] = useState<null | { lap: string, s1: string, s2: string, s3: string }>(null)

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
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=s`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let temp: { name: string, dnumber: string, code: string, team: string, color: string, position: number, grid: number | null, time: number | null }[] = [];
      for (let i in content.DriverNumber) {
        temp.push({
          name: content.FullName[i],
          dnumber: i,
          code: content.Abbreviation[i],
          team: content.TeamName[i],
          color: content.TeamColor[i],
          position: content.Position[i],
          grid: content.GridPosition[i],
          time: content.Time[i] || null,
        })
      }
      temp.sort((a, b) => {
        return a.position < b.position ? -1 : 1;
      })
      setData(temp)
      setDriver(parseInt(temp[0].dnumber))
    })
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/laptimes?year=${season}&gp=${round}&session=s`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let dtemp: { name: string, dnumber: number, code: string, fastest: { lap: number, s1: number, s2: number, s3: number }, laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] }[] = [];
      Object.keys(content["Data"]).forEach(function (key, index) {
        const dx = (data?.filter((d) => d.dnumber == key)[0]) ?? { name: "", code: "" }
        let laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] = [];
        Object.keys(content["Data"][key].Time).forEach(function (lkey, lindex) {
          laps.push({
            lap: lkey,
            laptime: content["Data"][key].LapTime[lkey],
            s1: content["Data"][key].Sector1Time[lkey],
            s2: content["Data"][key].Sector2Time[lkey],
            s3: content["Data"][key].Sector3Time[lkey],
            pitTime: content["Data"][key].PitInTime[lkey] ? content["Data"][key].PitOutTime[(parseInt(lkey) + 1).toFixed(1)] - content["Data"][key].PitInTime[lkey] : null,
            compound: content["Data"][key].Compound[lkey],
            tyreLife: content["Data"][key].TyreLife[lkey],
            status: content["Data"][key].TrackStatus[lkey],
            position: content["Data"][key].Position[lkey],
            interval: content["Data"][key].GapToLeader[lkey],
          })
        })
        dtemp.push({
          name: dx.name,
          dnumber: parseInt(key),
          code: dx.code,
          fastest: content["Data"][key]["Fastest"] ?? { lap: 0, s1: 0, s2: 0, s3: 0 },
          laps: laps
        })
      })
      setDriverData(dtemp)
      setFastest(content["Fastest"])
      setCompounds(content["Compounds"])

      console.log(dtemp)
    })
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/weatherdata?year=${season}&gp=${round}&session=s`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      const tmp = Object.keys(content.index).map((key) => ({
        lap: key,
        airTemp: Math.round(content.AirTemp[key]),
        trackTemp: Math.round(content.TrackTemp[key]),
        humidity: Math.round(content.Humidity[key]),
        pressure: Math.round(content.Pressure[key]),
        rain: content.Rainfall[key],
        windSpeed: Math.round(content.WindSpeed[key]),
        windDir: Math.round(content.WindDirection[key]),
      }));

      setWeather(tmp)
    })
  }, [season, round]);

  useEffect(() => {
    let ltemp: { lap: string, drivers: { name: string, dnumber: number, code: string, position: number | null, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, interval: number }[] }[] = [];

    if (driverData && driverData.length > 0) {

      const lapMap: { [lap: string]: { name: string, dnumber: number, code: string, position: number | null, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, interval: number }[] } = {};

      driverData.forEach(driver => {
        driver.laps.forEach(lap => {
          if (!lapMap[lap.lap]) {
            lapMap[lap.lap] = [];
          }
          lapMap[lap.lap].push({
            name: driver.name,
            dnumber: driver.dnumber,
            position: lap.position,
            code: driver.code,
            laptime: lap.laptime,
            s1: lap.s1,
            s2: lap.s2,
            s3: lap.s3,
            pitTime: lap.pitTime,
            compound: lap.compound,
            tyreLife: lap.tyreLife,
            interval: lap.interval
          });
        });
      });

      ltemp = Object.keys(lapMap).map(lap => ({
        lap,
        drivers: lapMap[lap].sort((a, b) => {
          if (a.position === null) return 1;
          if (b.position === null) return -1;
          return a.position - b.position;
        })
      }));
      setLapData(ltemp);
    }
  }, [driverData]);
  return race && data ? (
    <div className="w-full max-h-[calc(100vh-44px)] flex flex-col">
      <div className="flex flex-col sm:flex-row w-full px-3 pb-3 pt-2">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl">{race?.name}<span className="text-lg"> · Sprint</span></h1>
          <h2 className="text-xs md:text-lg text-neutral-400">{race?.startDate} - {race?.endDate} · {race?.circuit}</h2>
        </div>
        <div className="grow" />
        <div className="hidden md:flex flex-col sm:flex-row my-auto text-xs md:text-sm">
          <Button variant="link" className="hover:cursor-pointer" onClick={() => redirect(`/seasons/${season}/${round}/race`, RedirectType.push)}>View Results</Button>
          <Select onValueChange={(value) => setMode(value)} defaultValue={mode}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Driver">Driver</SelectItem>
              <SelectItem value="Lap-by-Lap">Lap-by-Lap</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {
        mode == "Driver" && (
          <div className="hidden md:flex flex-col sm:flex-row w-full overflow-y-hidden">
            <div className="flex flex-col w-3xs bg-navbar shadow-xl p-4 rounded-r-xl border-t border-b border-r">
              <h3 className="font-semibold text-md text-center">Drivers</h3>
              <div className="flex flex-col overflow-y-auto shrink h-[calc(100vh-200px)]">
                { data?.map((d) => (
                  <Button key={d.dnumber} variant="ghost" style={{ color: `#${d.color}` }} onClick={(e) => setDriver(parseInt(d.dnumber))}>{d.name}</Button>
                ))}
              </div>
            </div>
            <div className="w-full overflow-y-scroll max-h-[calc(100vh-132px)] p-2 xl:max-w-5xl mx-auto">
              <h3 className="font-semibold text-lg">{ data?.filter((d) => parseInt(d.dnumber) == driver)[0].name }'s data</h3>
              <div className="overflow-x-auto border rounded-lg w-3xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lap</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Laptime</TableHead>
                      <TableHead>Sector 1</TableHead>
                      <TableHead>Sector 2</TableHead>
                      <TableHead>Sector 3</TableHead>
                      <TableHead>Compound</TableHead>
                      <TableHead>Pit</TableHead>
                      <TableHead>Interval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      driverData?.filter(d => d.dnumber == driver)[0]?.laps.map((row) => (
                        <TableRow key={row.lap}>
                          <TableCell>{parseInt(row.lap)}</TableCell>
                          <TableCell>{row.position}</TableCell>
                          <TableCell className={driverData?.filter(d => d.dnumber == driver)[0]?.fastest.lap == parseInt(row.lap) ? (parseInt(fastest?.lap || "0") == driver ? "text-purple-500" : "text-green-500") : ""}>{row.laptime !== null ? `${Math.floor(row.laptime / 60)}:${(row.laptime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          <TableCell className={driverData?.filter(d => d.dnumber == driver)[0]?.fastest.s1 == parseInt(row.lap) ? parseInt(fastest?.s1 || "0") == driver ? "text-purple-500" : "text-green-500" : ""}>{row.s1 !== null ? `${Math.floor(row.s1 / 60) > 0 ? `${Math.floor(row.s1 / 60)}:` : ""}${(row.s1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          <TableCell className={driverData?.filter(d => d.dnumber == driver)[0]?.fastest.s2 == parseInt(row.lap) ? parseInt(fastest?.s2 || "0") == driver ? "text-purple-500" : "text-green-500" : ""}>{row.s2 !== null ? `${Math.floor(row.s2 / 60) > 0 ? `${Math.floor(row.s2 / 60)}:` : ""}${(row.s2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          <TableCell className={driverData?.filter(d => d.dnumber == driver)[0]?.fastest.s3 == parseInt(row.lap) ? parseInt(fastest?.s3 || "0") == driver ? "text-purple-500" : "text-green-500" : ""}>{row.s3 !== null ? `${Math.floor(row.s3 / 60) > 0 ? `${Math.floor(row.s3 / 60)}:` : ""}${(row.s3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          <TableCell className="flex flex-row">
                            {compounds && compounds[row.compound] && (
                              <Compound
                                abbreviation={compounds[row.compound].abbreviation}
                                color={compounds[row.compound].color}
                              />
                            )}
                            <span className="mt-0.5"> - {row.tyreLife} L</span>
                          </TableCell>
                          <TableCell>{row.pitTime !== null ? `${Math.floor(row.pitTime / 60) > 0 ? `${Math.floor(row.pitTime / 60)}:` : ""}${(row.pitTime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          <TableCell>{row.interval && row.interval !== 0 ? (row.interval > 0 ? `+${(row.interval).toFixed(3)}` : (row.interval).toFixed(3)) : ""}</TableCell>
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
      {
        mode == "Lap-by-Lap" && (
          <div className="overflow-y-hidden flex flex-col sm:flex-row">
            <div className="flex flex-col sm:flex-row w-5xl gap-2">
              <div className="w-full">
                <div className="w-full overflow-y-scroll max-h-[calc(100vh-180px)] flex overflow-x-auto border rounded-lg">
                  <Table className="min-w-[600px] text-xs md:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pos.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Laptime</TableHead>
                        <TableHead>Sector 1</TableHead>
                        <TableHead>Sector 2</TableHead>
                        <TableHead>Sector 3</TableHead>
                        <TableHead>Compound</TableHead>
                        <TableHead>Pit Time</TableHead>
                        <TableHead>Interval</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {
                        lapData?.filter(l => parseInt(l.lap) == lap)[0]?.drivers.map((row) => (
                          <TableRow key={row.dnumber}>
                            <TableCell>{row.position}</TableCell>
                            <TableCell>
                              <div className="flex flex-row items-center gap-2 text" style={{ color: `#${(data?.filter((d) => parseInt(d.dnumber) == row.dnumber)[0])?.color}`}}>
                                <div className="w-8 text-right">{row.dnumber}</div>
                                <div className="font-bold">{(data?.filter((d) => parseInt(d.dnumber) == row.dnumber)[0].code)}</div>
                              </div>
                            </TableCell>
                            <TableCell className={driverData?.filter(d => d.dnumber == row.dnumber)[0]?.fastest.lap == lap ? (parseInt(fastest?.lap || "0") == row.dnumber ? "text-purple-500" : "text-green-500") : ""}>{row.laptime !== null ? `${Math.floor(row.laptime / 60)}:${(row.laptime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className={driverData?.filter(d => d.dnumber == row.dnumber)[0]?.fastest.s1 == lap ? (parseInt(fastest?.s1 || "0") == row.dnumber ? "text-purple-500" : "text-green-500") : ""}>{row.s1 !== null ? `${Math.floor(row.s1 / 60) > 0 ? `${Math.floor(row.s1 / 60)}:` : ""}${(row.s1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className={driverData?.filter(d => d.dnumber == row.dnumber)[0]?.fastest.s2 == lap ? (parseInt(fastest?.s2 || "0") == row.dnumber ? "text-purple-500" : "text-green-500") : ""}>{row.s2 !== null ? `${Math.floor(row.s2 / 60) > 0 ? `${Math.floor(row.s2 / 60)}:` : ""}${(row.s2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className={driverData?.filter(d => d.dnumber == row.dnumber)[0]?.fastest.s3 == lap ? (parseInt(fastest?.s3 || "0") == row.dnumber ? "text-purple-500" : "text-green-500") : ""}>{row.s3 !== null ? `${Math.floor(row.s3 / 60) > 0 ? `${Math.floor(row.s3 / 60)}:` : ""}${(row.s3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className="flex flex-row">
                              {compounds && compounds[row.compound] && (
                                <Compound
                                  abbreviation={compounds[row.compound].abbreviation}
                                  color={compounds[row.compound].color}
                                />
                              )}
                              <span className="mt-0.5"> - {row.tyreLife} L</span>
                            </TableCell>
                            <TableCell>{row.tyreLife}</TableCell>
                            <TableCell>{row.pitTime !== null ? `${Math.floor(row.pitTime / 60) > 0 ? `${Math.floor(row.pitTime / 60)}:` : ""}${(row.pitTime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell>{row.interval && row.interval !== 0 ? (row.interval > 0 ? `+${(row.interval).toFixed(3)}` : (row.interval).toFixed(3)) : ""}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>

              </div>
              <div className="bg-navbar shadow-xl rounded-full border h-fit p-2 pb-6 my-auto hidden md:block scale-80">
                { weather &&
                  ( weather[lap] ? <Weather airTemp={weather[lap].airTemp} trackTemp={weather[lap].trackTemp}
                                            humidity={weather[lap].humidity} pressure={weather[lap].pressure}
                                            rain={weather[lap].rain} windSpeed={weather[lap].windSpeed} windDir={weather[lap].windDir}/>
                      : <Weather airTemp={weather[weather.length - 1].airTemp} trackTemp={weather[weather.length - 1].trackTemp}
                                 humidity={weather[weather.length - 1].humidity} pressure={weather[weather.length - 1].pressure}
                                 rain={weather[weather.length - 1].rain} windSpeed={weather[weather.length - 1].windSpeed} windDir={weather[weather.length - 1].windDir}/>
                  )
                }
              </div>
            </div>
            <div className="absolute left-0 right-0 bottom-0 flex items-center gap-2 bg-navbar border-t shadow-lg p-1">
              <Pagination>
                <PaginationContent className="flex-row!">
                  {lapData && (
                    <>
                      {/* First Lap */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setLap(1)}
                          isActive={lap === 1}
                          style={{ cursor: lap === 1 ? "default" : "pointer" }}
                        >
                          &#171;
                        </PaginationLink>
                      </PaginationItem>
                      {/* Previous Lap */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setLap(Math.max(1, lap - 1))}
                          isActive={false}
                          style={{ cursor: lap === 1 ? "default" : "pointer" }}
                        >
                          &#8249;
                        </PaginationLink>
                      </PaginationItem>
                      {/* Previous 5 laps */}
                      {lap > 6 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      {lapData
                        .filter((d) => {
                          const l = parseInt(d.lap);
                          return l >= Math.max(1, lap - 5) && l < lap;
                        })
                        .map((d) => (
                          <PaginationItem key={d.lap} onClick={() => setLap(parseInt(d.lap))} className="hidden md:inline">
                            <PaginationLink isActive={parseInt(d.lap) == lap}>
                              {parseInt(d.lap)}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      {/* Current lap */}
                      <input
                        type="number"
                        min={1}
                        max={lapData?.length || 1}
                        value={lap}
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= (lapData?.length || 1)) setLap(val);
                        }}
                        className="w-15 border rounded px-2 py-1 text-center"
                        style={{ MozAppearance: "textfield" }}
                      />
                      {/* Next 5 laps */}
                      {lapData
                        .filter((d) => {
                          const l = parseInt(d.lap);
                          return l > lap && l <= lap + 5;
                        })
                        .map((d) => (
                          <PaginationItem key={d.lap} onClick={() => setLap(parseInt(d.lap))} className="hidden md:inline">
                            <PaginationLink isActive={parseInt(d.lap) == lap}>
                              {parseInt(d.lap)}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      {lap < (lapData?.length || 0) - 5 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      {/* Next Lap */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setLap(Math.min(lap + 1, lapData?.length || 1))}
                          isActive={false}
                          style={{ cursor: lap === (lapData?.length || 1) ? "default" : "pointer" }}
                        >
                          &#8250;
                        </PaginationLink>
                      </PaginationItem>
                      {/* Last Lap */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setLap(lapData?.length || 1)}
                          isActive={lap === (lapData?.length || 1)}
                          style={{ cursor: lap === (lapData?.length || 1) ? "default" : "pointer" }}
                        >
                          &#187;
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          </div>

        )
      }
    </div>
  ) : (
    <div className="w-full h-[calc(100vh-44px)] flex items-center justify-center">
      <Spinner className="w-16 h-16" />
    </div>
  )
}