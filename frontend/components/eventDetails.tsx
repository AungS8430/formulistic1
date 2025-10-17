"use client"

import {useEffect, useState} from "react";
import {formatDateLocal, formatDateRangeLocal} from "@/utils/datetime";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Spinner} from "@/components/ui/spinner";

// Define interfaces for Race, Results, RaceResults, and QualiResults
// These should match the structures used in the server component
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


export function EventDetails({race, season}: { race: Race, season: string }) {
  const [state, setState] = useState(-1);
  const [localRange, setLocalRange] = useState("");

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateTime = new Date(race.startDate);
    const endDateTime = new Date(race.endDate);

    if (startDateTime <= today && today <= endDateTime) {
      setState(0); // ongoing
    } else if (today < startDateTime) {
      setState(1); // upcoming
    } else {
      setState(-1); // completed
    }

    setLocalRange(formatDateRangeLocal(startDateTime, endDateTime));
  }, [race.startDate, race.endDate]);

  const formatSessionTime = (dateString: string | null) => {
    if (!dateString) return null;
    return formatDateLocal(new Date(dateString));
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="flex flex-col">
          <p className="text-gray-400 font-semibold">{localRange}</p>
          <h1 className="text-3xl md:text-5xl font-bold">{race.name}</h1>
          <p className="text-lg md:text-xl text-gray-400">{race.circuit}</p>
        </div>
        <div className="grow"/>
        <div className="flex my-auto gap-2">
          {state === 0 && <Badge className="bg-green-500/70 text-base font-bold">Ongoing</Badge>}
          {state === 1 && <Badge className="bg-red-thm/70 text-base font-bold">Upcoming</Badge>}
          {state === -1 && <Badge className="bg-primary-foreground text-base font-bold">Completed</Badge>}
          <Button asChild>
            <Link href={`/seasons/${season}/${race.round}/stats`}>View Stats</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Session Information */}
        {race.fp1 && <SessionCard title="Practice 1" time={formatSessionTime(race.fp1)}/>}
        {race.fp2 && <SessionCard title="Practice 2" time={formatSessionTime(race.fp2)}/>}
        {race.fp3 && <SessionCard title="Practice 3" time={formatSessionTime(race.fp3)}/>}
        {race.sq && <SessionCard title="Sprint Quali" time={formatSessionTime(race.sq)}/>}
        {race.sprint && <SessionCard title="Sprint" time={formatSessionTime(race.sprint)}/>}
        {race.quali && <SessionCard title="Qualifying" time={formatSessionTime(race.quali)}/>}
        <SessionCard title="Race" time={formatSessionTime(race.race)}/>
      </div>
      {/* Results Tables */}
      {race.results && (
        <div className="flex flex-col gap-4">
          {race.results.race && <ResultsTable title="Race Results" data={race.results.race}/>}
          {race.results.sprint && <ResultsTable title="Sprint Results" data={race.results.sprint}/>}
          {race.results.quali && <QualiTable title="Qualifying Results" data={race.results.quali}/>}
          {race.results.sq && <QualiTable title="Sprint Quali Results" data={race.results.sq}/>}
        </div>
      )}
    </>
  );
}

function SessionCard({title, time}: { title: string, time: string | null }) {
  return (
    <div className="bg-primary-foreground p-4 rounded-lg">
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-gray-400">{time || "TBC"}</p>
    </div>
  );
}

function ResultsTable({title, data}: { title: string, data: RaceResults[] | null }) {
  if (!data) return <div className="bg-primary-foreground p-4 rounded-lg"><h2 className="text-xl font-bold mb-2">{title}</h2><Spinner/></div>;
  return (
    <div className="bg-primary-foreground p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pos</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.position}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>{row.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function QualiTable({title, data}: { title: string, data: QualiResults[] | null }) {
  if (!data) return <div className="bg-primary-foreground p-4 rounded-lg"><h2 className="text-xl font-bold mb-2">{title}</h2><Spinner/></div>;
  return (
    <div className="bg-primary-foreground p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
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
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.position}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.q1}</TableCell>
              <TableCell>{row.q2}</TableCell>
              <TableCell>{row.q3}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

