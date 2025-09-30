"use client";

import { useEffect, useState, useRef } from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";

// --- Interfaces based on your provided data structure ---

export interface RaceData {
  drivers: Record<string, DriverData> | null;
  session: SessionData | null;
  track: TrackData | null;
  race_control_messages: RaceControlMessage[] | null;
  timing_stats: TimingStats | null;
  driver_list: Record<string, unknown> | null;
  top_three: TopThree | null;
  last_updated: string | null;
}

export interface DriverData {
  car_number: string;
  position: string | null;
  line: number | null;
  last_lap_time: string | null;
  best_lap_time: string | null;
  gap_to_leader: string | null;
  interval_to_ahead: string | null;
  number_of_laps: number;
  in_pit: boolean;
  pit_in?: boolean;
  pit_out?: boolean;
  pit_in_time?: number | null; // Epoch seconds, accurate pit entry time
  last_pit_time?: number | null;
  status: number | null;
  sectors: Record<string, SectorData>;
  speeds: Record<string, unknown>;
  personal_fastest: boolean;
  catching: boolean | null;
  stints: Record<string, StintData>;
  current_compound: string;
  new_tires: boolean;
  tire_laps: number;
}

export interface SectorData {
  value: string | null;
  segments: Record<string, { Status: number | null } | null> | null;
}

export interface StintData {
  LapFlags: number;
  Compound: string;
  New: string;
  TyresNotChanged: string;
  TotalLaps: number;
  StartLaps: number;
}

export interface SessionData {
  current_lap: number | null;
  session_status: string | null;
  session_info: SessionInfo | null;
  session_name?: string | null;
  remaining_time?: string | null;
  extrapolating?: boolean;
  clock_utc?: string | null;
}

export interface SessionInfo {
  Meeting: {
    Key: number | null;
    Name: string | null;
    OfficialName: string | null;
    Location: string | null;
    Number: number | null;
    Country: {
      Key: number | null;
      Code: string | null;
      Name: string | null;
    } | null;
    Circuit: {
      Key: number | null;
      ShortName: string | null;
    } | null;
  } | null;
  SessionStatus: string | null;
  ArchiveStatus: {
    Status: string | null;
  } | null;
  Key: number | null;
  Type: string | null;
  Name: string | null;
  StartDate: string | null;
  EndDate: string | null;
  GmtOffset: string | null;
  Path: string | null;
  _kf: boolean | null;
}

export interface TrackData {
  status: string | null;
  status_name?: string | null;
  flags: TrackFlag[] | null;
  weather: {
    air_temp: string | null;
    track_temp: string | null;
    humidity: string | null;
    pressure: string | null;
    wind_speed: string | null;
    wind_direction: string | null;
    rainfall: string | null;
  } | null;
}

export interface TrackFlag {
  type: string | null;
  scope: string | null;
  message: string | null;
  timestamp: string | null;
  lap: number | null;
}

export interface RaceControlMessage {
  Utc: string | null;
  Lap: number | null;
  Category: string | null;
  Flag: string | null;
  Scope: string | null;
  Message: string | null;
  message_id: string | null;
}

export interface TimingStats {
  Lines: Record<
    string,
    {
      BestSpeeds: Record<
        string,
        {
          Position: number | null;
          Value: string | null;
        } | null
      > | null;
    } | null
  > | null;
}

export interface TopThree {
  Lines: Record<
    string,
    {
      DiffToAhead: string | null;
      DiffToLeader: string | null;
    } | null
  > | null;
}

// --- Utility for formatting times ---

function formatPitTime(pitTime: number | null | undefined): string {
  if (pitTime === null || pitTime === undefined) return "";
  const min = Math.floor(pitTime / 60);
  const sec = pitTime % 60;
  let secStr = sec.toFixed(3).padStart(6, "0");
  return (min > 0 ? `${min}:` : "") + secStr;
}

// --- Main Component ---

export default function Live() {
  const [data, setData] = useState<RaceData | null>(null);
  const [driverData, setDriverData] = useState<Record<string, { shortname: string, fullname: string, code: string, team: string, color: string }> | null>(null);

  // Timer for session
  const [liveTimer, setLiveTimer] = useState<string | null>(null);

  // Position change arrows (with disappear by timestamp)
  const prevPositions = useRef<Record<string, number>>({});
  const [positionChange, setPositionChange] = useState<Record<string, {dir: "up" | "down", expiresAt: number} | null>>({});

  // Pit timer states per driver (uses pit_in_time for accuracy)
  const [pitTimers, setPitTimers] = useState<Record<string, { start: number, value: number, paused: boolean, visible: boolean, flash: boolean }>>({});

  // Watch for position changes (arrows disappear after 1s, even if tabbed away)
  useEffect(() => {
    if (!data?.drivers) return;
    const newChange: Record<string, {dir: "up" | "down", expiresAt: number} | null> = { ...positionChange };
    Object.entries(data.drivers).forEach(([carNum, driver]) => {
      const pos = driver.position ? parseInt(driver.position) : null;
      const prevPos = prevPositions.current[carNum];
      if (pos !== null && prevPos !== undefined && pos !== prevPos) {
        if (pos < prevPos) {
          newChange[carNum] = { dir: "up", expiresAt: Date.now() + 1000 };
        } else if (pos > prevPos) {
          newChange[carNum] = { dir: "down", expiresAt: Date.now() + 1000 };
        }
      }
      prevPositions.current[carNum] = pos ?? prevPos;
    });
    setPositionChange(newChange);
    // eslint-disable-next-line
  }, [data?.drivers]);

  // Clear expired arrows (so they never get stuck)
  useEffect(() => {
    const interval = setInterval(() => {
      setPositionChange(prev => {
        const now = Date.now();
        const updated: typeof prev = {};
        let changed = false;
        for (const key in prev) {
          if (prev[key] && prev[key]!.expiresAt > now) {
            updated[key] = prev[key];
          } else if (prev[key]) {
            changed = true;
            updated[key] = null;
          }
        }
        return changed ? { ...updated } : prev;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Track pit timer logic, using pit_in_time for accurate calculation
  useEffect(() => {
    if (!data?.drivers) return;
    setPitTimers(prev => {
      const timers = { ...prev };
      Object.entries(data.drivers || {}).forEach(([carNum, driver]) => {
        // Start pit timer when entering pits (use pit_in_time if available)
        if (driver.in_pit) {
          const now = Math.floor(Date.now() / 1000);
          const pitInTime = driver.pit_in_time ?? now;
          if (!timers[carNum] || !timers[carNum].visible) {
            timers[carNum] = {
              start: pitInTime,
              value: now - pitInTime,
              paused: false,
              visible: true,
              flash: false,
            };
          } else if (timers[carNum].paused) {
            // Resume timer
            timers[carNum].paused = false;
            timers[carNum].start = pitInTime;
          }
        }
        // Pause and flash when exiting pits
        if (!driver.in_pit && timers[carNum]?.visible && !timers[carNum].paused) {
          timers[carNum].paused = true;
          const now = Math.floor(Date.now() / 1000);
          timers[carNum].value = now - timers[carNum].start;
          timers[carNum].flash = true;
          setTimeout(() => {
            setPitTimers(tprev => {
              const tclone = { ...tprev };
              if (tclone[carNum]) {
                tclone[carNum].visible = false;
                tclone[carNum].flash = false;
              }
              return tclone;
            });
          }, 3000);
        }
      });
      return timers;
    });
    // eslint-disable-next-line
  }, [data?.drivers]);

  // Live pit timer ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setPitTimers(prev => {
        const timers = { ...prev };
        const now = Math.floor(Date.now() / 1000);
        Object.entries(timers).forEach(([carNum, timer]) => {
          if (timer.visible && !timer.paused) {
            timers[carNum].value = now - timer.start;
          }
        });
        return timers;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Session timer effect (live ticking)
  useEffect(() => {
    if (
      !data?.session?.remaining_time ||
      !data?.session?.clock_utc
    ) {
      setLiveTimer(null);
      return;
    }

    let [h, m, s] = data.session.remaining_time.split(":").map(Number);
    let remaining = h * 3600 + m * 60 + s;
    let timerPaused = data.session.extrapolating === false;

    if (timerPaused) {
      setLiveTimer(data.session.remaining_time);
      return;
    }

    // Sync timer based on backend clock_utc
    const backendUtc = new Date(data.session.clock_utc + "Z").getTime();
    setLiveTimer(data.session.remaining_time);

    let interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - backendUtc) / 1000);
      let left = Math.max(remaining - elapsed, 0);
      let hh = Math.floor(left / 3600);
      let mm = Math.floor((left % 3600) / 60);
      let ss = left % 60;
      setLiveTimer(
        `${hh > 0 ? hh.toString().padStart(2, "0") + ":" : ""}${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [
    data?.session?.remaining_time,
    data?.session?.clock_utc,
    data?.session?.extrapolating
  ]);

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_ROUTE!}/stream`);
    eventSource.onmessage = (event) => {
      const parsedData: RaceData = JSON.parse(event.data);
      setData(parsedData);
    };
    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    }
  }, []);

  useEffect(() => {
    fetch(`https://api.openf1.org/v1/drivers?meeting_key=${data?.session?.session_info?.Meeting?.Key}`)
      .then((response) => response.json())
      .then((content) => {
        let drivers: any = {};
        if (Array.isArray(content)) {
          content.forEach((driver: any) => {
            drivers[driver.driver_number] = {
              shortname: driver.broadcast_name,
              fullname: driver.full_name,
              code: driver.name_acronym,
              team: driver.team_name,
              color: driver.team_colour
            }
          })
        }
        setDriverData(drivers);
      })
  }, [data?.session?.session_info?.Meeting?.Key]);

  return (
    <div className="w-full max-h-[calc(100vh-60px)] flex flex-col overflow-hidden justify-between">
      <div className="flex flex-row p-4">
        <div className="flex flex-col w-[33%]">
          <h1 className="text-3xl font-bold">
            {data?.session?.session_name ?? data?.session?.session_info?.Name ?? data?.session?.session_info?.Type}
          </h1>
          <h2 className="text-neutral-400 font-semibold">
            {(data?.session?.session_info?.StartDate
              ? (new Date(data.session.session_info.StartDate + "Z")).toLocaleDateString()
              : "")}
            {" - "}
            {(data?.session?.session_info?.EndDate
              ? (new Date(data.session.session_info.EndDate + "Z")).toLocaleDateString()
              : "")}
            {" · "}
            {data?.session?.session_info?.Meeting?.Circuit?.ShortName}
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="font-semibold text-xl">Flag: {data?.track?.status_name ?? data?.track?.status}</h2>
          {liveTimer && (
            <h2 className="text-xl font-semibold mt-2">
              Timer: {liveTimer ?? data?.session?.remaining_time ?? "N/A"}
              {data?.session?.extrapolating === false && <span className="text-red-500 ml-2">Paused</span>}
            </h2>
          )}
        </div>
        <div className="flex flex-col text-right w-[33%]">
          <h1 className="text-3xl font-bold">
            <span className="text-sm font-semibold">Lap </span>
            {data?.session?.current_lap ?? "-"}
          </h1>
          <h2 className="text-neutral-400 font-semibold">
            {data?.session?.session_status ?? "No Session"}
          </h2>
        </div>
      </div>
      <div className="flex flex-row h-[calc(100vh-70px)]">
        <div className="flex flex-row p-4 pt-0 overflow-scroll w-[70%] max-h-[calc(100vh-120px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Best Lap</TableHead>
                <TableHead>Last Lap</TableHead>
                <TableHead>Sector 1</TableHead>
                <TableHead>Sector 2</TableHead>
                <TableHead>Sector 3</TableHead>
                <TableHead>Compound</TableHead>
                <TableHead>Tyre Life</TableHead>
                <TableHead>Pit Timer</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>To Leader</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data?.drivers &&
                Object.entries(data.drivers)
                  .sort(([, a], [, b]) => {
                    const posA = a?.position ? parseInt(a.position) : Number.MAX_SAFE_INTEGER;
                    const posB = b?.position ? parseInt(b.position) : Number.MAX_SAFE_INTEGER;
                    return posA - posB;
                  })
                  .map(([dnumber, driver]) => (
                    <TableRow key={dnumber}>
                      <TableCell>
                        {driver?.position}
                        {positionChange[dnumber]?.dir === "up" && (
                          <span style={{
                            color: "green",
                            marginLeft: 4,
                            fontWeight: "bold",
                            fontSize: "1.15em",
                            transition: "opacity 0.3s",
                            opacity: 1
                          }}>▲</span>
                        )}
                        {positionChange[dnumber]?.dir === "down" && (
                          <span style={{
                            color: "red",
                            marginLeft: 4,
                            fontWeight: "bold",
                            fontSize: "1.15em",
                            transition: "opacity 0.3s",
                            opacity: 1
                          }}>▼</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold" style={{ color: `#${driverData && driverData[parseInt(dnumber)]?.color}` }}>
                        {dnumber} {driverData && driverData[parseInt(dnumber)]?.code}
                      </TableCell>
                      <TableCell>{
                        typeof driver?.best_lap_time === "string"
                          ? driver.best_lap_time
                          : driver?.best_lap_time && typeof driver.best_lap_time === "object"
                            ? (driver.best_lap_time as any)?.Value
                            : ""}
                      </TableCell>
                      <TableCell className={ driver.personal_fastest ? "text-green-400" : "" }>{
                        typeof driver?.last_lap_time === "string"
                          ? driver.last_lap_time
                          : driver?.last_lap_time && typeof driver.last_lap_time === "object"
                            ? (driver.last_lap_time as any)?.Value
                            : ""}
                      </TableCell>
                      <TableCell>{driver?.sectors?.["0"]?.value}</TableCell>
                      <TableCell>{driver?.sectors?.["1"]?.value}</TableCell>
                      <TableCell>{driver?.sectors?.["2"]?.value}</TableCell>
                      <TableCell>{driver?.current_compound}</TableCell>
                      <TableCell>
                        {driver?.stints
                          ? driver.stints[Math.max(...(Object.keys(driver.stints).map(Number)))]?.TotalLaps
                          : ""
                        }
                      </TableCell>
                      {/* Pit Timer cell */}
                      <TableCell>
                        {pitTimers[dnumber]?.visible && (
                          <span
                            style={{
                              fontWeight: "bold",
                              color: pitTimers[dnumber].paused ? "#FFD700" : "#00e676",
                              animation: pitTimers[dnumber].flash ? "pit-flash 0.5s alternate 6" : undefined
                            }}
                            className={pitTimers[dnumber].flash ? "animate-flash" : ""}
                          >
                            {pitTimers[dnumber].value > 0
                              ? `${Math.floor(pitTimers[dnumber].value / 60) > 0
                                ? `${Math.floor(pitTimers[dnumber].value / 60)}:`
                                : ""}${(pitTimers[dnumber].value % 60).toString().padStart(2, "0")}`
                              : "LIVE"}
                            {pitTimers[dnumber].paused && " (Paused)"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{typeof driver?.interval_to_ahead === "string" ? driver.interval_to_ahead : (driver?.interval_to_ahead as any)?.Value}</TableCell>
                      <TableCell>{typeof driver?.gap_to_leader === "string" ? driver.gap_to_leader : (driver?.gap_to_leader as any)?.Value}</TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </div>
        <div className="w-[30%] pr-2">
          <div className="bg-navbar border-border rounded-xl shadow-xl p-4 h-[49%]">
            <h2 className="font-semibold text-lg sticky top-0 bg-navbar">Race Control</h2>
            <div className="flex flex-col-reverse overflow-scroll h-[calc(100%-2rem)]">
              {
                data?.race_control_messages && [...data.race_control_messages].reverse().map((message, index) => (
                  <div key={index} className="border-b border-border last:border-0 py-1">
                    <p className="text-sm text-neutral-400">{message.Message}</p>
                    <p className="text-xs text-neutral-500">{message.Utc ? (new Date(message.Utc + "Z")).toLocaleTimeString() : ""}</p>
                  </div>
                ))
              }
            </div>
          </div>
          <div className="bg-navbar border-border rounded-xl shadow-xl p-2 mt-2 h-[49%] sticky overflow-scroll flex flex-col items-center justify-center ">
            <h2 className="font-semibold text-lg">Weather</h2>
            <div>
              <p className="text-sm text-neutral-400">Air Temperature: {data?.track?.weather?.air_temp ? data.track.weather.air_temp + "°C" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Track Temperature: {data?.track?.weather?.track_temp ? data.track.weather.track_temp + "°C" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Humidity: {data?.track?.weather?.humidity ? data.track.weather.humidity + "%" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Pressure: {data?.track?.weather?.pressure ? data.track.weather.pressure + " hPa" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Wind Speed: {data?.track?.weather?.wind_speed ? data.track.weather.wind_speed + " km/h" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Wind Direction: {data?.track?.weather?.wind_direction ? data.track.weather.wind_direction + "°" : "N/A"}</p>
              <p className="text-sm text-neutral-400">Rainfall: {data?.track?.weather?.rainfall ? data.track.weather.rainfall + " mm" : "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pit-flash {
          0% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        .animate-flash {
          animation: pit-flash 0.5s alternate 6;
        }
      `}</style>
    </div>
  )
}