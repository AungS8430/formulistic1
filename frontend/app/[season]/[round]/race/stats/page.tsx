"use client";

import {use, useEffect, useState} from "react";
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

export default function PastStats({ params }: { params: Promise<{ season: string, round: string }>}) {
  const { season, round } = use(params);
  const [mode, setMode] = useState<string>("Driver")
  const [driver, setDriver] = useState<number | null>(null)
  const [lap, setLap] = useState<number>(1)
  const [race, setRace] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, fp1: string | null, fp2: string | null, fp3: string | null, sq: string | null, sprint: string | null, quali: string | null, race: string, state: number }>(null)
  const [data, setData] = useState<null | { name: string, dnumber: string, code: string, team: string, color: string, position: number, grid: number | null, time: number | null }[]>(null)
  const [driverData, setDriverData] = useState<null | { name: string, dnumber: number, code: string, laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] }[]>(null)
  const [lapData, setLapData] = useState<null | { lap: string, drivers: { name: string, dnumber: number, code: string, position: number | null, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, interval: number }[] }[]>(null)
  const [weather, setWeather] = useState<null | { lap: string, airTemp: number, trackTemp: number, humidity: number, pressure: number, rain: boolean, windSpeed: number, windDir: number }[]>(null)

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
    fetch(`http://100.125.78.96:1234/session/results?year=${season}&gp=${round}&session=r`).then((response) => response.json()).then((content) => {
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
    fetch(`http://100.125.78.96:1234/session/laptimes?year=${season}&gp=${round}&session=r`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let dtemp: { name: string, dnumber: number, code: string, laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] }[] = [];
      Object.keys(content).forEach(function (key, index) {
        const dx = (data?.filter((d) => d.dnumber == key)[0]) ?? { name: "", code: "" }
        let laps: { lap: string, laptime: number | null, s1: number | null, s2: number | null, s3: number | null, pitTime: number | null, compound: string, tyreLife: number, status: number, position: number | null, interval: number }[] = [];
        Object.keys(content[key].Time).forEach(function (lkey, lindex) {
          laps.push({
            lap: lkey,
            laptime: content[key].LapTime[lkey],
            s1: content[key].Sector1Time[lkey],
            s2: content[key].Sector2Time[lkey],
            s3: content[key].Sector3Time[lkey],
            pitTime: content[key].PitInTime[lkey] ? content[key].PitOutTime[(parseInt(lkey) + 1).toFixed(1)] - content[key].PitInTime[lkey] : null,
            compound: content[key].Compound[lkey],
            tyreLife: content[key].TyreLife[lkey],
            status: content[key].TrackStatus[lkey],
            position: content[key].Position[lkey],
            interval: content[key].GapToLeader[lkey],
          })
        })
        dtemp.push({
          name: dx.name,
          dnumber: parseInt(key),
          code: dx.code,
          laps: laps
        })
      })
      setDriverData(dtemp)
    })
    fetch(`http://100.125.78.96:1234/session/weatherdata?year=${season}&gp=${round}&session=r`).then((response) => response.json()).then((content) => {
      content = JSON.parse(content.replaceAll("NaN", "null"))

      let tmp: { lap: string, airTemp: number, trackTemp: number, humidity: number, pressure: number, rain: boolean, windSpeed: number, windDir: number }[] = [];

      Object.keys(content).forEach(function (key, index)  {
        tmp.push({
          lap: key,
          airTemp: content.AirTemp[key],
          trackTemp: content.TrackTemp[key],
          humidity: content.Humidity[key],
          pressure: content.Pressure[key],
          rain: content.Rainfall[key],
          windSpeed: content.WindSpeed[key],
          windDir: content.WindDirection[key],
        })
      })

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
  return (
    <div className="w-full max-h-[calc(100vh-60px)] flex flex-col">
      <div className="flex flex-row w-full p-3">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{race?.name}</h1>
          <h2 className="text-neutral-400">{race?.startDate} - {race?.endDate} · {race?.circuit}</h2>
        </div>
        <div className="grow" />
        <div className="flex flex-row my-auto">
          <Button variant="link" onClick={() => redirect(`/${season}/${round}/race`, RedirectType.push)}>View Results</Button>
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
          <div className="flex flex-row w-full">
            <div className="flex flex-col w-3xs bg-navbar shadow-xl p-4">
              <h3 className="font-semibold text-md text-center">Drivers</h3>
              <div className="flex flex-col overflow-y-auto shrink h-[calc(100vh-200px)]">
                { data?.map((d) => (
                  <Button key={d.dnumber} variant="ghost" style={{ color: `#${d.color}` }} onClick={(e) => setDriver(parseInt(d.dnumber))}>{d.name}</Button>
                ))}
              </div>
            </div>
            <div className="w-full overflow-y-scroll max-h-[calc(100vh-180px)] p-2 py-4">
              <h3 className="font-semibold text-lg">{ data?.filter((d) => parseInt(d.dnumber) == driver)[0].name }'s data</h3>
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
                    <TableHead>Tyre Life</TableHead>
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
                        <TableCell>{row.laptime !== null ? `${Math.floor(row.laptime / 60)}:${(row.laptime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s1 !== null ? `${Math.floor(row.s1 / 60) > 0 ? `${Math.floor(row.s1 / 60)}:` : ""}${(row.s1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s2 !== null ? `${Math.floor(row.s2 / 60) > 0 ? `${Math.floor(row.s2 / 60)}:` : ""}${(row.s2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s3 !== null ? `${Math.floor(row.s3 / 60) > 0 ? `${Math.floor(row.s3 / 60)}:` : ""}${(row.s3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.compound}</TableCell>
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
        )
      }
      {
        mode == "Lap-by-Lap" && (
          <div className="w-full overflow-y-scroll max-h-[calc(100vh-120px)] p-2 py-4">
            <div className="flex flex-row">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos.</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Laptime</TableHead>
                    <TableHead>Sector 1</TableHead>
                    <TableHead>Sector 2</TableHead>
                    <TableHead>Sector 3</TableHead>
                    <TableHead>Compound</TableHead>
                    <TableHead>Tyre Life</TableHead>
                    <TableHead>Pit Time</TableHead>
                    <TableHead>Interval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {
                    lapData?.filter(l => parseInt(l.lap) == lap)[0]?.drivers.map((row) => (
                      <TableRow key={row.dnumber}>
                        <TableCell>{row.position}</TableCell>
                        <TableCell className="font-semibold" style={{ color: `#${(data?.filter((d) => parseInt(d.dnumber) == row.dnumber)[0])?.color}`}}>{row.dnumber} {(data?.filter((d) => parseInt(d.dnumber) == row.dnumber)[0].code)}</TableCell>
                        <TableCell>{row.laptime !== null ? `${Math.floor(row.laptime / 60)}:${(row.laptime % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s1 !== null ? `${Math.floor(row.s1 / 60) > 0 ? `${Math.floor(row.s1 / 60)}:` : ""}${(row.s1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s2 !== null ? `${Math.floor(row.s2 / 60) > 0 ? `${Math.floor(row.s2 / 60)}:` : ""}${(row.s2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.s3 !== null ? `${Math.floor(row.s3 / 60) > 0 ? `${Math.floor(row.s3 / 60)}:` : ""}${(row.s3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                        <TableCell>{row.compound}</TableCell>
                        <TableCell>{row.tyreLife}</TableCell>
                        <TableCell>{row.pitTime}</TableCell>
                        <TableCell>{row.interval && row.interval !== 0 ? (row.interval > 0 ? `+${(row.interval).toFixed(3)}` : (row.interval).toFixed(3)) : ""}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
            <div className="sticky bottom-0 flex items-center gap-2 bg-navbar rounded-xl shadow-lg p-2">
              <Pagination>
                <PaginationContent>
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
                          <PaginationItem key={d.lap} onClick={() => setLap(parseInt(d.lap))}>
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
                        className="w-10 font-semibold border rounded px-2 py-1 text-center"
                        style={{ MozAppearance: "textfield" }}
                      />
                      {/* Next 5 laps */}
                      {lapData
                        .filter((d) => {
                          const l = parseInt(d.lap);
                          return l > lap && l <= lap + 5;
                        })
                        .map((d) => (
                          <PaginationItem key={d.lap} onClick={() => setLap(parseInt(d.lap))}>
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
  )
}