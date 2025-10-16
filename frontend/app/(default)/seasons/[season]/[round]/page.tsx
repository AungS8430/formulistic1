import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {redirect, RedirectType} from "next/navigation";
import {Spinner} from "@/components/ui/spinner";
import {Badge} from "@/components/ui/badge";
import {formatDateLocal, formatDateRangeLocal} from "@/utils/datetime";
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
  state: number,
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

export default async function SeasonPage({params}: { params: Promise<{ season: string, round: string }> }) {
  const {season, round} = await params
  let race: Race | null = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getRace = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/info?year=${season}&gp=${round}`);
    const content = await response.json();
    let temp: Race = {
      round: parseInt(content.round ?? content.Round ?? content.roundNumber ?? "0"),
      name: content.raceName ?? content.name ?? "",
      circuit: content.Circuit?.circuitName ?? "",
      startDate: content.FirstPractice?.date ? formatDateLocal(new Date(content.FirstPractice.date)) : formatDateLocal(new Date(content.date)),
      endDate: formatDateLocal(new Date(content.date)),
      range: formatDateRangeLocal(content.FirstPractice?.date ? new Date(content.FirstPractice.date) : new Date(content.date), new Date(content.date)),
      fp1: content.FirstPractice?.date
        ? formatDateLocal(new Date(`${content.FirstPractice.date.split("T")[0]}T${content.FirstPractice?.time ? content.FirstPractice.time : "00:00:00Z"}`))
        : null,
      fp2: content.SecondPractice?.date
        ? formatDateLocal(new Date(`${content.SecondPractice.date.split("T")[0]}T${content.SecondPractice?.time ? content.SecondPractice.time : "00:00:00Z"}`))
        : null,
      fp3: content.ThirdPractice?.date
        ? formatDateLocal(new Date(`${content.ThirdPractice.date.split("T")[0]}T${content.ThirdPractice?.time ? content.ThirdPractice.time : "00:00:00Z"}`))
        : null,
      sq: season == "2023"
        ? (content.SprintShootout?.date
          ? formatDateLocal(new Date(`${content.SprintShootout.date.split("T")[0]}T${content.SprintShootout?.time ? content.SprintShootout.time : "00:00:00Z"}`))
          : null)
        : (content.SprintQualifying?.date
          ? formatDateLocal(new Date(`${content.SprintQualifying.date.split("T")[0]}T${content.SprintQualifying?.time ? content.SprintQualifying.time : "00:00:00Z"}`))
          : null),
      sprint: content.Sprint?.date
        ? formatDateLocal(new Date(`${content.Sprint.date.split("T")[0]}T${content.Sprint?.time ? content.Sprint.time : "00:00:00Z"}`))
        : null,
      quali: content.Qualifying?.date
        ? formatDateLocal(new Date(`${content.Qualifying.date.split("T")[0]}T${content.Qualifying.time ? content.Qualifying?.time : "00:00:00Z"}`))
        : null,
      race: content.date
        ? formatDateLocal(new Date(`${content.date.split("T")[0]}T${content.time ? content.time : "00:00:00Z"}`))
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
      })(),
      results: {
        sq: null,
        sprint: null,
        quali: null,
        race: null
      },
      lat: content.Circuit?.Location?.lat ?? null,
      long: content.Circuit?.Location?.long ?? null,
    };

    if (temp.state != 1) {
      const fetches: Promise<void>[] = [];

      if (temp.sq) {
        fetches.push(
          fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=${Number(season) == 2023 ? "ss" : "sq"}`)
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
              if (temp.results) temp.results.sq = res;
            })
        );
      }
      if (temp.sprint) {
        fetches.push(
          fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=s`)
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
                });
              }
              res.sort((a, b) => (a.position < b.position ? -1 : 1));
              if (temp.results) temp.results.sprint = res;
            })
        );
      }
      if (temp.quali) {
        fetches.push(
          fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=q`)
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
              if (temp.results) temp.results.quali = res;
            })
        );
      }
      if (temp.race) {
        fetches.push(
          fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/results?year=${season}&gp=${round}&session=r`)
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
                });
              }
              res.sort((a, b) => (a.position < b.position ? -1 : 1));
              if (temp.results) temp.results.race = res;
            })
        );
      }

      await Promise.all(fetches);
      race = {...temp};
    } else {
      race = temp;
    }
    return race;
  };

  race = await getRace()
  return race && race.round ? (
    <div className="xl:w-7xl mx-auto p-2 md:px-8 flex flex-col gap-8">
      <div>
        <div className="flex flex-col sm:flex-row md:gap-2">
          <h1 className="text-2xl md:text-4xl font-bold">{season} {race?.name}</h1>
          {race?.state == 0 ? <Badge className="bg-red-thm text-sm md:text-base">Race Weekend</Badge> : <></>}
        </div>
        <h3
          className="text-base md:text-lg text-neutral-400 my-auto">{race.range.length > 0 ? race.range : `${race.startDate} - ${race.endDate}`} · {race?.circuit}</h3>
      </div>
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
    </div>
  ) : (
    <div className="flex h-[calc(100vh-104px)] flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Race Not Found</h1>
      <p className="text-lg md:text-xl text-gray-400">The race you are looking for does not exist or is not supported.<br/>Please select an existing race within seasons between 2018 and the current year.</p>
      <Link href="/" className="mt-6 px-6 py-3 bg-red-thm text-white rounded-lg hover:bg-red-700 transition">Go Back</Link>
    </div>
  )
}