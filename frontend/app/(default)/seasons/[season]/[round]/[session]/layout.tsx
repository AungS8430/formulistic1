import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {redirect, RedirectType} from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
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

export default async function SessionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ season: string, round: string, session: string }> }) {
  const { season, round, session } = await params
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
          { race?.state == 0 ? <Badge className="bg-red-thm text-sm md:text-base">Race Weekend</Badge> : <></>}
        </div>
        <h3 className="text-base md:text-lg text-neutral-400 my-auto">{race.range.length > 0 ? race.range : `${race.startDate} - ${race.endDate}`} · {race?.circuit}</h3>
      </div>
      <div className="flex flex-row gap-8">
        <div className="hidden xl:flex flex-col gap-8 w-xs">
          <div className="flex flex-col gap-4 basis-2/3">
            <h2 className="text-2xl font-semibold">Weekend Schedule</h2>
            <div className="flex flex-col overflow-y-auto gap-2">
              {
                race.fp1 && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp1" ? " border bg-red-thm/30" : "")}>
                    <div className="bg-primary-foreground/30 p-4">
                      <h4 className="font-semibold text-base sm:text-lg">Free Practice 1</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{race.fp1}</p>
                    </div>
                  </div>
                )
              }
              {
                race.fp2 && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp2" ? " border bg-red-thm/30" : "")}>
                    <div className="bg-primary-foreground/30 p-4">
                      <h4 className="font-semibold text-base sm:text-lg">Free Practice 2</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{race.fp2}</p>
                    </div>
                  </div>
                )
              }
              {
                race.fp3 && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "fp3" ? " border bg-red-thm/30" : "")}>
                    <div className="bg-primary-foreground/30 p-4">
                      <h4 className="font-semibold text-base sm:text-lg">Free Practice 3</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{race.fp3}</p>
                    </div>
                  </div>
                )
              }
              {
                race.sq && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "sq" ? " border bg-red-thm/30" : "")}>
                    <Link className="bg-primary-foreground/30 p-4" href={race?.results?.sq && (race?.results?.sq?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sq` : "#"}>
                      <h4 className="font-semibold text-base sm:text-lg">{season == "2023" ? "Sprint Shootout" : "Sprint Qualifying"}</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{race.sq}</p>
                    </Link>
                  </div>
                )
              }
              {
                race.sprint && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "sprint" ? " border bg-red-thm/30" : "")}>
                    <Link className="bg-primary-foreground/30 p-4" href={race?.results?.sprint && (race?.results?.sprint?.length ?? 0) > 0 ? `/seasons/${season}/${round}/sprint` : "#"}>
                      <h4 className="font-semibold text-base md:text-lg">Sprint</h4>
                      <p className="text-gray-400 text-sm md:text-base">{race.sprint}</p>
                    </Link>
                  </div>
                )
              }
              {
                race.quali && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "quali" ? " border bg-red-thm/30" : "")}>
                    <Link className="bg-primary-foreground/30 p-4" href={race?.results?.quali && (race?.results?.quali?.length ?? 0) > 0 ? `/seasons/${season}/${round}/quali` : "#"}>
                      <h4 className="font-semibold text-base sm:text-lg">Qualifying</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{race.quali}</p>
                    </Link>
                  </div>
                )
              }
              {
                race.race && (
                  <div className={"flex flex-col w-full rounded-md overflow-hidden" + (session == "race" ? " border bg-red-thm/30" : "")}>
                    <Link className="bg-primary-foreground/30 p-4" href={race?.results?.race && (race?.results?.race?.length ?? 0) > 0 ? `/seasons/${season}/${round}/race` : "#"}>
                      <h4 className="font-semibold text-lg">Race</h4>
                      <p className="text-gray-400">{race.race}</p>
                    </Link>
                  </div>
                )
              }
            </div>
          </div>
        </div>
        <div className="grow">
          {children}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-[calc(100vh-104px)] flex-col items-center justify-center">
      <Spinner className="w-16 h-16"/>
    </div>
  )
}