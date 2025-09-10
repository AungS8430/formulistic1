"use client";

import { useEffect, useState, use } from "react";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {redirect, RedirectType} from "next/navigation";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";

interface RaceData {
  drivers: Record<string, DriverData> | null;
  session: SessionData | null;
  track: TrackData | null;
  race_control_messages: RaceControlMessage[] | null;
  timing_stats: TimingStats | null;
  driver_list: Record<string, unknown> | null;
  top_three: TopThree | null;
  last_updated: string | null;
}

interface DriverData {
  car_number: string;
  position: string | null;
  line: number | null;
  last_lap_time: string | null;
  best_lap_time: string | null;
  gap_to_leader: string | null;
  interval_to_ahead: string | null;
  number_of_laps: number;
  in_pit: boolean;
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

interface SectorData {
  value: string | null;
  segments: Record<string, { Status: number | null } | null> | null;
}

interface SpeedData {
  Value: string | null;
  PersonalFastest: boolean | null;
  OverallFastest: boolean | null;
}

interface StintData {
  LapFlags: number;
  Compound: string;
  New: string;
  TyresNotChanged: string;
  TotalLaps: number;
  StartLaps: number;
}

interface SessionData {
  current_lap: number | null;
  session_status: string | null;
  session_info: SessionInfo | null;
}

interface SessionInfo {
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

interface TrackData {
  status: string | null;
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

interface TrackFlag {
  type: string | null;
  scope: string | null;
  message: string | null;
  timestamp: string | null;
  lap: number | null;
}

interface RaceControlMessage {
  Utc: string | null;
  Lap: number | null;
  Category: string | null;
  Flag: string | null;
  Scope: string | null;
  Message: string | null;
  message_id: string | null;
}

interface TimingStats {
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

interface TopThree {
  Lines: Record<
    string,
    {
      DiffToAhead: string | null;
      DiffToLeader: string | null;
    } | null
  > | null;
}

export default function Live() {
  const [data, setData] = useState<RaceData | null>(null);
  const [driverData, setDriverData] = useState<Record<string, { shortname: string, fullname: string, code: string, team: string, color: string }> | null>(null);
  useEffect(() => {
    const eventSource = new EventSource("http://100.125.78.96:1234/stream");
    eventSource.onmessage = (event) => {
      const parsedData: RaceData = JSON.parse(event.data);
      setData(parsedData);
      console.log(data)
    };
    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    }
  })

  useEffect(() => {
    fetch(`https://api.openf1.org/v1/drivers?meeting_key=${data?.session?.session_info?.Meeting?.Key}`).then((response) => response.json()).then((content) => {
      let drivers: any = {};
      content.forEach((driver: any) => {
        drivers[driver.driver_number] = {
          shortname: driver.broadcast_name,
          fullname: driver.full_name,
          code: driver.name_acronym,
          team: driver.team_name,
          color: driver.team_colour
        }
      })
      setDriverData(drivers);
    })
  }, [data?.session?.session_info?.Meeting?.Key]);
  return (
    <div className="w-full max-h-[calc(100vh-60px)] flex flex-col overflow-hidden justify-between">
      <div className="flex flex-row p-4">
        <div className="flex flex-col w-[33%]">
          <h1 className="text-3xl font-bold">{data?.session?.session_info?.Meeting?.Name}</h1>
          <h2 className="text-neutral-400 font-semibold">{(new Date(data?.session?.session_info?.StartDate + "Z")).toLocaleDateString()} - {(new Date(data?.session?.session_info?.EndDate + "Z")).toLocaleDateString()} · {data?.session?.session_info?.Meeting?.Circuit?.ShortName}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="font-semibold text-xl">Flag: {data?.track?.flags?.reverse()[0]?.type}</h2>
        </div>
        <div className="flex flex-col text-right w-[33%]">
          <h1 className="text-3xl font-bold"><span className="text-sm font-semibold">Lap </span>{data?.session?.current_lap ? data.session.current_lap : "-"}</h1>
          <h2 className="text-neutral-400 font-semibold">{data?.session?.session_status ? data.session.session_status : "No Session"}</h2>
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
                <TableHead>Pit</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>To Leader</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data?.drivers &&
                Object.entries(data.drivers)
                  .sort(([, a], [, b]) => {
                    // Sort by position (as number), fallback to car_number
                    const posA = a?.position ? parseInt(a.position) : Number.MAX_SAFE_INTEGER;
                    const posB = b?.position ? parseInt(b.position) : Number.MAX_SAFE_INTEGER;
                    return posA - posB;
                  })
                  .map(([dnumber, driver]) => (
                    <TableRow key={dnumber}>
                      <TableCell>{driver?.position}</TableCell>
                      <TableCell className="font-semibold" style={{ color: `#${driverData && driverData[parseInt(dnumber)]?.color}` }}>{dnumber} {driverData && driverData[parseInt(dnumber)]?.code}</TableCell>
                      <TableCell>{
                        typeof driver?.best_lap_time === "string"
                          ? driver.best_lap_time
                          : driver?.best_lap_time && typeof driver.best_lap_time === "object"
                            ? driver.best_lap_time.Value
                            : ""}
                      </TableCell>
                      <TableCell className={ driver.personal_fastest && "text-green-400" }>{
                        typeof driver?.last_lap_time === "string"
                          ? driver.last_lap_time
                          : driver?.last_lap_time && typeof driver.last_lap_time === "object"
                            ? driver.last_lap_time.Value
                            : ""}
                      </TableCell>
                      <TableCell>{driver?.sectors?.[0]?.value}</TableCell>
                      <TableCell>{driver?.sectors?.[1]?.value}</TableCell>
                      <TableCell>{driver?.sectors?.[2]?.value}</TableCell>
                      <TableCell>{driver?.current_compound}</TableCell>
                      <TableCell>{driver.stints[Math.max(...(Object.keys(driver.stints).map(Number)))].TotalLaps}</TableCell>
                      <TableCell>{driver?.in_pit ? "In Pit" : ""}</TableCell>
                      <TableCell>{typeof driver?.interval_to_ahead === "string" ? driver.interval_to_ahead : driver?.interval_to_ahead?.Value}</TableCell>
                      <TableCell>{typeof driver?.gap_to_leader === "string" ? driver.gap_to_leader : driver?.gap_to_leader?.Value}</TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </div>
        <div className="w-[30%] pr-2">
          <div className="bg-navbar border-border rounded-xl shadow-xl p-2 h-[49%]">
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
    </div>
  )
}