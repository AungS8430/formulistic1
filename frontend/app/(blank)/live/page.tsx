"use client";

import React, {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {redirect, RedirectType} from "next/navigation";
import Weather from "@/components/weather";
import Compound from "@/components/compound";
import {Table, TableRow, TableHead, TableHeader, TableBody, TableCell} from "@/components/ui/table";
import {Toaster} from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner";

export interface RaceData {
  drivers: Record<string, DriverData>;
  session: SessionData;
  track: TrackData;
  race_control_messages: RaceControlMessage[];
  timing_stats: TimingStats;
  driver_list: Record<string, DriverStaticInfo>;
  top_three: TopThree;
  last_updated: string;
}

export interface DriverData {
  car_number: string;
  position: string;
  racing_number: string;
  last_lap_time: { Value: string; OverallFastest: boolean };
  best_lap_time: { Value: string; Lap: number };
  gap_to_leader: string;
  interval_to_ahead: { Value: string };
  in_pit: boolean;
  pit_out: boolean;
  retired: boolean;
  stopped: boolean;
  sectors: Record<string, SectorData>;
  speeds: Record<string, { Value: string }>;
  current_compound: string;
  tire_laps: number;
  pit_in_time?: number;
  stints?: Record<string, { TotalLaps: number }>;
  personal_fastest?: boolean;
}

export interface SectorData {
  value: string;
  segments: Record<string, { Status: number }>;
  overall_fastest: boolean;
  personal_fastest: boolean;
}

export interface SessionData {
  current_lap: number;
  session_status: string;
  session_name: string;
  remaining_time: string;
  session_info: {
    Meeting: { Name: string; Location: string; Key?: string; Circuit?: { ShortName?: string } };
    StartDate: string;
    EndDate?: string;
    Name?: string;
    Type?: string;
  };
  clock_utc?: string;
  extrapolating?: boolean;
}

export interface TrackData {
  status_name: string;
  flags: TrackFlag[];
  weather: {
    air_temp: string;
    track_temp: string;
    humidity: string;
    rainfall: string;
    pressure?: string;
    wind_speed?: string;
    wind_direction?: string;
  };
  status?: string;
}

export interface TrackFlag {
  type: string;
  scope: string;
  lap: number;
  message?: string;
  timestamp?: string;
}

export interface RaceControlMessage {
  Utc: string;
  Lap: number;
  Category: string;
  Message: string;
  Flag?: string;
  Scope?: string;
  message_id?: string;
}

export interface DriverStaticInfo {
  RacingNumber: string;
  FullName: string;
  Tla: string;
  TeamName: string;
  TeamColour: string;
}

export interface TimingStats {
  Lines: Record<
    string,
    {
      PersonalBestLapTime?: { Value: string };
      BestSpeeds?: Record<string, { Value: string; Position: number }>;
    }
  >;
}

export interface TopThree {
  Lines: Record<
    string,
    {
      Position: string;
      RacingNumber: string;
      FullName: string;
      DiffToLeader: string;
    }
  >;
}

// --- Utility for formatting times ---
function formatPitTime(pitTime: number | null | undefined): string {
  if (pitTime === null || pitTime === undefined) return "";
  const min = Math.floor(pitTime / 60);
  const sec = pitTime % 60;
  let secStr = sec.toFixed(3).padStart(6, "0");
  return (min > 0 ? `${min}:` : "") + secStr;
}

// Helper function for segment color
function segmentColor(status: number) {
  switch (status) {
    case 2048: return "bg-yellow-400";
    case 2049: return "bg-green-500";
    case 2051: return "bg-purple-500";
    case 2064: return "bg-red-500";
    case 0:    return "bg-gray-400";
    default:   return "bg-neutral-300";
  }
}

// Segment bar component
function SectorSegmentsBar({ segments }: { segments: Record<string, { Status: number }> }) {
  const segs = Array.from({ length: 8 }, (_, i) => segments?.[i.toString()]?.Status ?? 0);
  return (
    <div className="flex w-full h-1 rounded overflow-hidden">
      {segs.map((status, idx) => (
        <div key={idx} className={`${segmentColor(status)} flex-1`} />
      ))}
    </div>
  );
}

// --- Main Component ---
export default function Live() {
  const [data, setData] = useState<RaceData | null>(null);
  const [compounds, setCompounds] = useState<null | { [key: string]: { abbreviation: string, color: string } }>(null)
  const [driverData, setDriverData] = useState<Record<string, {
    shortname: string,
    fullname: string,
    code: string,
    team: string,
    color: string
  }> | null>(null);

  // Timer for session
  const [liveTimer, setLiveTimer] = useState<string | null>(null);

  // Position change arrows (with disappear by timestamp)
  const prevPositions = useRef<Record<string, number>>({});
  const [positionChange, setPositionChange] = useState<Record<string, {
    dir: "up" | "down";
    expiresAt: number
  } | null>>({});

  // Watch for position changes (arrows disappear after 1s, even if tabbed away)
  useEffect(() => {
    if (!data?.drivers) return;
    const newChange: Record<string, { dir: "up" | "down"; expiresAt: number } | null> = {...positionChange};
    Object.entries(data.drivers).forEach(([carNum, driver]) => {
      const pos = typeof (driver as DriverData).position === "string" ? parseInt((driver as DriverData).position) : null;
      const prevPos = prevPositions.current[carNum];
      if (pos !== null && prevPos !== undefined && pos !== prevPos) {
        if (pos < prevPos) {
          newChange[carNum] = {dir: "up", expiresAt: Date.now() + 1000};
        } else if (pos > prevPos) {
          newChange[carNum] = {dir: "down", expiresAt: Date.now() + 1000};
        }
      }
      prevPositions.current[carNum] = pos ?? prevPos;
    });
    setPositionChange(newChange);
  }, [data?.drivers]);

  // Clear expired arrows (so they never get stuck)
  useEffect(() => {
    const interval = setInterval(() => {
      setPositionChange((prev: typeof positionChange) => {
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
        return changed ? {...updated} : prev;
      });
    }, 150);
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
    const backendUtc = new Date(data.session.clock_utc).getTime();
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
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/stream/compounds`).then((response) => response.json()).then((content) => {
      setCompounds(content)
    })
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
  }, [data?.session.session_info.Meeting]);

  useEffect(() => {
    if (!data?.race_control_messages || !data.race_control_messages.length) return;
    let msg = data.race_control_messages[data.race_control_messages.length - 1]
    if (msg.Message.includes("NOTED") || msg.Message.includes("DELETED")) {
      toast.error(msg.Message, {
        duration: 8000,
        description: (msg.Lap ? `Lap: ${msg.Lap}` : null),
      });
    } else if (msg.Message.includes("INVESTIGATION") || msg.Message.includes("INVESTIGATED")) {
      toast.success(msg.Message, {
        duration: 8000,
        description: (msg.Lap ? `Lap: ${msg.Lap}` : null),
      })
    } else {
      toast(msg.Message, {
        duration: 8000,
        description: (msg.Lap ? `Lap: ${msg.Lap}` : null),
      });
    }
  }, [data?.race_control_messages.length]);
  return data?.session.session_info.Meeting ? (
    <div className="w-full flex flex-col max-h-screen overflow-hidden">
      <Toaster />
      <div className="bg-navbar border-b pb-2">
        <Button variant="link" onClick={() => redirect("/", RedirectType.push)}>↶ Go back</Button>
        <div className="px-4 flex flex-row">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold">{data?.session.session_info.Meeting.Name} <span className="text-lg text-neutral-300">• {data?.session.session_name}</span></h1>
            <h2 className="text-md text-neutral-300">{data?.session.session_info.Meeting.Circuit?.ShortName} • {data?.session.session_info.Meeting.Location}</h2>
          </div>
          <div className="flex-grow-1" />
          <div className="flex pr-4">
            <div className={"my-auto rounded-md py-2 px-3 shadow-lg text-xl text-navbar font-bold " + (
              Number(data?.track.status) === 1
                ? "bg-green-500"
                : Number(data?.track.status) === 2
                ? "bg-yellow-500"
                : [3, 5, 6].includes(Number(data?.track.status))
                ? "bg-yellow-500 animate-flash"
                : Number(data?.track.status) === 4
                ? "bg-red-500"
                : "bg-gray-500"
            )}>
              {data?.track.status_name}
            </div>
          </div>
          <div className="flex flex-col pr-2">
            <h1 className="text-3xl font-semibold my-auto">{data?.session.current_lap ? `Lap ${data.session.current_lap}` : liveTimer ? `Time Left: ${liveTimer}` : ""}</h1>
          </div>
        </div>
      </div>
      <div className="p-2 pr-24 w-full">
        <div className="border rounded-lg w-4xl mx-auto">
          <div className="max-h-[calc(100vh-125px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pos.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Fastest</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Sector 1</TableHead>
                  <TableHead>Sector 2</TableHead>
                  <TableHead>Sector 3</TableHead>
                  <TableHead>Compound</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  data ? Object.entries(data.drivers).sort((a, b) => {
                    const posA = parseInt(a[1].position);
                    const posB = parseInt(b[1].position);
                    return posA - posB;
                  }).map(([carNum, driver]) => {
                    const staticInfo = data.driver_list[carNum];
                    return (
                      <TableRow key={carNum} className={driver.retired ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex flex-row items-center gap-1">
                            {driver.position}
                            {
                              positionChange[carNum] ? (
                                positionChange[carNum]!.dir === "up" ? (
                                  <span className="text-green-500">▲</span>
                                ) : (
                                  <span className="text-red-500">▼</span>
                                )
                              ) : null
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row items-center gap-2 text" style={{ color: `#${staticInfo.TeamColour}` }}>
                            <div className="w-8 text-right">{carNum}</div>
                            <div className="font-bold">{staticInfo.FullName.split(" ")[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell>{driver.best_lap_time && driver.best_lap_time.Lap ? `${driver.best_lap_time.Lap} (${driver.best_lap_time.Value})` : ""}</TableCell>
                        <TableCell className={driver.last_lap_time && driver.best_lap_time && driver.best_lap_time ? driver.last_lap_time.OverallFastest ? "text-purple-500" : (driver.best_lap_time.Value == driver.last_lap_time.Value ? "text-green-500" : "") : ""}>{driver.last_lap_time ? driver.last_lap_time.Value : ""}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={driver.sectors["0"]?.overall_fastest ? "text-purple-500" : (driver.sectors["0"]?.personal_fastest ? "text-green-500" : "")}>{driver.sectors["0"]?.value ?? "\b"}</span>
                            <SectorSegmentsBar segments={driver.sectors["0"]?.segments ?? {}} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={driver.sectors["1"]?.overall_fastest ? "text-purple-500" : (driver.sectors["1"]?.personal_fastest ? "text-green-500" : "")}>{driver.sectors["1"]?.value ?? "\b"}</span>
                            <SectorSegmentsBar segments={driver.sectors["1"]?.segments ?? {}} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={driver.sectors["2"]?.overall_fastest ? "text-purple-500" : (driver.sectors["2"]?.personal_fastest ? "text-green-500" : "")}>{driver.sectors["2"]?.value ?? "\b"}</span>
                            <SectorSegmentsBar segments={driver.sectors["2"]?.segments ?? {}} />
                          </div>
                        </TableCell>
                        <TableCell className="flex flex-row gap-1 items-center my-auto h-full">
                          {
                            compounds && driver.current_compound in compounds ? (
                              <Compound abbreviation={compounds[driver.current_compound].abbreviation} color={compounds[driver.current_compound].color} />
                            ) : driver.current_compound
                          }
                          <span className="mt-0.5">- {driver.tire_laps} L</span>
                        </TableCell>
                        <TableCell>{driver.gap_to_leader}</TableCell>
                        <TableCell>{driver.interval_to_ahead ? driver.interval_to_ahead.Value : ""}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {driver.in_pit ? (
                              <div className="text-yellow-400 font-bold">
                                In Pit
                              </div>
                            ) : driver.pit_out ? (
                              <div className="text-green-400 font-bold">
                                Out Pit
                              </div>
                            ) : driver.pit_in_time ? (
                              <div className="text-red-400 font-bold">
                                Pit Stop: {formatPitTime(Math.floor((Date.now() - driver.pit_in_time * 1000) / 1000))}
                              </div>
                            ) : driver.retired ? (
                              <div className="text-neutral-400 font-bold">
                                Retired
                              </div>
                            ) : driver.stopped ? (
                              <div className="text-neutral-400 font-bold">
                                Stopped
                              </div>
                            ) : (
                              <div className="text-green-400 font-bold">
                                Racing
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }) : null
                }
              </TableBody>
            </Table>
          </div>
        </div>

      </div>

      <div className="w-28 bg-navbar shadow-xl rounded-full border h-fit p-2 pb-5 my-auto flex justify-center absolute right-0 -mr-2 top-1/2 bottom-1/2 scale-80">
        <Weather
          airTemp={Number(data?.track.weather.air_temp) || 0}
          trackTemp={Number(data?.track.weather.track_temp) || 0}
          humidity={Number(data?.track.weather.humidity) || 0}
          rain={Number(data?.track.weather.rainfall || "0") > 0}
          windSpeed={Number(data?.track.weather.wind_speed) || 0}
          windDir={Number(data?.track.weather.wind_direction) || 0}
          pressure={Number(data?.track.weather.pressure) || 0}
        />
      </div>

    </div>
  ) : (
    !data ? (
      <div className="w-full flex flex-col items-center justify-center h-[calc(100vh-60px)]">
        <Spinner className="w-16 h-16" />
      </div>
    ) : (
      <div className="w-full flex flex-col items-center justify-center h-[calc(100vh-60px)]">
        <p className="text-2xl font-bold">No live session currently.</p>
        <Button variant="link" onClick={() => redirect("/", RedirectType.push)}>↶ Go back</Button>
      </div>
    )
  )
}
