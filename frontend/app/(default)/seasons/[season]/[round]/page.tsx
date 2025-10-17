import {redirect, RedirectType} from "next/navigation";
import Link from "next/link";
import {RaceDetailsClient} from "@/components/RaceDetailsClient";
import {SessionHeader} from "@/components/SessionHeader";

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

export default async function SeasonPage({params}: { params: Promise<{ season: string, round: string }> }) {
  const {season, round} = await params
  let race: Race | null = null;

  const getRace = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/session/info?year=${season}&gp=${round}`);
    const content = await response.json();

    const getDateTimeString = (date?: string, time?: string): string | null => {
      if (!date) return null;
      const datePart = date.split("T")[0];
      const timePart = time || "00:00:00Z";
      return new Date(`${datePart}T${timePart}`).toISOString();
    };

    let temp: Race = {
      round: parseInt(content.round ?? content.Round ?? content.roundNumber ?? "0"),
      name: content.raceName ?? content.name ?? "",
      circuit: content.Circuit?.circuitName ?? "",
      startDate: getDateTimeString(content.FirstPractice?.date, content.FirstPractice?.time) || getDateTimeString(content.date, content.time)!,
      endDate: getDateTimeString(content.date, content.time)!,
      range: "", // This will be calculated on the client
      fp1: getDateTimeString(content.FirstPractice?.date, content.FirstPractice?.time),
      fp2: getDateTimeString(content.SecondPractice?.date, content.SecondPractice?.time),
      fp3: getDateTimeString(content.ThirdPractice?.date, content.ThirdPractice?.time),
      sq: season == "2023"
        ? getDateTimeString(content.SprintShootout?.date, content.SprintShootout?.time)
        : getDateTimeString(content.SprintQualifying?.date, content.SprintQualifying?.time),
      sprint: getDateTimeString(content.Sprint?.date, content.Sprint?.time),
      quali: getDateTimeString(content.Qualifying?.date, content.Qualifying?.time),
      race: getDateTimeString(content.date, content.time)!,
      results: {
        sq: null,
        sprint: null,
        quali: null,
        race: null
      },
      lat: content.Circuit?.Location?.lat ?? null,
      long: content.Circuit?.Location?.long ?? null,
    };

    const shouldFetchResults = (start: Date = new Date(temp.startDate), time: number = 1) => {
      const today = new Date();
      return new Date(start.setHours(start.getHours() + time)) <= today;
    }

    if (shouldFetchResults()) {
      const fetches: Promise<void>[] = [];

      if (temp.sq && shouldFetchResults(new Date(temp.sq), 1)) {
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
      if (temp.sprint && shouldFetchResults(new Date(temp.sprint), 1)) {
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
      if (temp.quali && shouldFetchResults(new Date(temp.quali), 1)) {
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
      if (shouldFetchResults(new Date(temp.endDate), 2)) {
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
    }
    race = temp;
  }

  try {
    await getRace();
  } catch (e) {
    console.log(e)
    redirect(`/seasons/${season}`, RedirectType.replace)
  }

  return race ? (
    <div className="xl:w-7xl mx-auto p-2 md:px-8 flex flex-col gap-8">
      <SessionHeader race={Object.assign(race, {season: season})}/>
      <RaceDetailsClient initialRace={race} season={season} round={round}/>
    </div>
  ) : (
    <div className="flex h-[calc(100vh-104px)] flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Race Not Found</h1>
      <p className="text-lg md:text-xl text-gray-400">The race you are looking for does not exist or is not supported.<br/>Please select an existing race within seasons between 2018 and the current year.</p>
      <Link href="/" className="mt-6 px-6 py-3 bg-red-thm text-white rounded-lg hover:bg-red-700 transition">Go Back</Link>
    </div>
  )
}