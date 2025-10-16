import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
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

export default async function SessionPage({params}: { params: { season: string, round: string, session: string } }) {
  const { season, round, session } = await params;

  const getRace = async () => {
    if (session == "sq") {
      return await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=${Number(season) == 2023 ? "ss" : "sq"}`)
        .then((response) => response.json())
        .then((content) => {
          content = JSON.parse(content.replaceAll("NaN", "null"));
          let res: QualiResults[] = [];
          for (let i in content.DriverNumber) {
            res.push({
              name: content.FullName[i],
              dnumber: i,
              team: content.TeamName[i],
              color: content.TeamColor[i],
              position: content.Position[i],
              q1: content.Q1[i] || null,
              q2: content.Q2[i] || null,
              q3: content.Q3[i] || null,
            });
          }
          res.sort((a, b) => (a.position < b.position ? -1 : 1));
          return res;
        })
    }
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
    if (session == "quali") {
      return await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=q`)
        .then((response) => response.json())
        .then((content) => {
          content = JSON.parse(content.replaceAll("NaN", "null"));
          let res: QualiResults[] = [];
          for (let i in content.DriverNumber) {
            res.push({
              name: content.FullName[i],
              dnumber: i,
              team: content.TeamName[i],
              color: content.TeamColor[i],
              position: content.Position[i],
              q1: content.Q1[i] || null,
              q2: content.Q2[i] || null,
              q3: content.Q3[i] || null,
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

  const sessionResults: QualiResults[] | RaceResults[] | undefined = await getRace()
    .catch((e) => {console.error(e); return undefined;});

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-row">
        <h1 className="text-xl md:text-3xl font-bold">{getSessionFullName(session, Number(season))} Results</h1>
        {
          (session == "race" || session == "sprint") && (
            <Link href={`/seasons/${season}/${round}/${session}/stats`}>
              <Button variant="link" className="text-lg">View Stats</Button>
            </Link>
          )
        }
      </div>
      <div className="max-h-[calc(100dvh-260px)] overflow-auto border rounded-lg">
        {
          sessionResults ? (
            session == "quali" || session == "sq" ? (
              <div className="flex flex-col w-full h-full">
                <div className="sticky top-0 z-10 bg-primary-foreground">
                  <Table className="text-base w-full">
                    <TableHeader>
                      <TableRow className="h-12">
                        <TableHead className="pl-4 w-10">Pos.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead className="w-56">Team</TableHead>
                        <TableHead className="w-24">{session == "sq" && "S"}Q1</TableHead>
                        <TableHead className="w-24">{session == "sq" && "S"}Q2</TableHead>
                        <TableHead className="w-24">{session == "sq" && "S"}Q3</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <div className="h-full overflow-auto">
                  <Table className="text-base w-full h-full">
                    <TableBody>
                      {
                        sessionResults.map((row) => (
                          <TableRow key={row.dnumber} className="h-12">
                            <TableCell className="pl-4 w-10 text-center">{row.position}</TableCell>
                            <TableCell className="font-semibold">
                              <div className="flex flex-row items-center gap-2 text">
                                <div className="w-8 text-right">{row.dnumber}</div>
                                <div>{row.name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="w-56" style={{color: `#${row.color}`}}>{row.team}</TableCell>
                            <TableCell className="w-24">{'q1' in row && row.q1 !== null ? `${Math.floor(row.q1 / 60)}:${(row.q1 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className="w-24">{'q2' in row && row.q2 !== null ? `${Math.floor(row.q2 / 60)}:${(row.q2 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                            <TableCell className="w-24">{'q3' in row && row.q3 !== null ? `${Math.floor(row.q3 / 60)}:${(row.q3 % 60).toFixed(3).padStart(6, "0")}` : ""}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              </div>

            ) : (
              <div className="flex flex-col w-full h-full">
                <div className="sticky top-0 z-10 bg-primary-foreground">
                  <Table className="text-base w-full">
                    <TableHeader>
                      <TableRow className="h-12">
                        <TableHead className="pl-4 w-10">Pos.</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead className="w-56">Team</TableHead>
                        <TableHead className="w-12 text-center">Grid</TableHead>
                        <TableHead className="w-24">Interval</TableHead>
                        <TableHead className="w-20 text-center">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <div className="h-full overflow-auto">
                  <Table className="text-base w-full h-full">
                    <TableBody>
                      {
                        sessionResults.map((row) => (
                          <TableRow key={row.dnumber} className="h-12">
                            <TableCell className="pl-4 w-10 text-center">{row.position}</TableCell>
                            <TableCell className="font-semibold">
                              <div className="flex flex-row items-center gap-2 text">
                                <div className="w-8 text-right">{row.dnumber}</div>
                                <div>{row.name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="w-56" style={{color: `#${row.color}`}}>{row.team}</TableCell>
                            <TableCell className="w-12 text-center">{'grid' in row && row.grid !== null ? row.grid : "PIT"}</TableCell>
                            <TableCell className="w-24">{
                              'time' in row && row.time !== null ? row.position == 1 ? `${Math.floor(row.time / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${(row.time % 60).toFixed(3).padStart(6, "0")}` : `+${Math.floor(row.time / 60) > 0 ? `${Math.floor(row.time / 60)}:` : ""}${(row.time % 60).toFixed(3).padStart(6, "0")}` : 'note' in row && row.note ? row.note : ""
                            }</TableCell>
                            <TableCell className="w-20 text-center">{'points' in row && row.points !== null ? row.points : ""}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <p className="text-xl text-gray-400">No results available for this session.</p>
          )
        }
      </div>

    </div>
  )
}