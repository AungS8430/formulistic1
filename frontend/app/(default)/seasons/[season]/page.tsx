import {Badge} from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {Spinner} from "@/components/ui/spinner";
import Link from "next/link";
import {EventItem} from "@/components/eventItem";
import {formatDateLocal, formatDateRangeLocal} from "@/utils/datetime";

interface Race {
  round: number,
  name: string,
  circuit: string,
  startDate: string,
  endDate: string,
  range: string,
}

interface DriverStanding {
  position: number,
  name: string,
  team: string,
  points: number,
  wins: number
}

interface ConstructorStanding {
  position: number,
  name: string,
  points: number,
  wins: number
}

export default async function SeasonPage({params}: { params: { season: string } }) {
  const {season} = await params;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Fetch races
  const racesRes = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/schedule?year=${season}`, {
    cache: "no-store",
  });
  const racesContent = await racesRes.json();

  function getDateTime({date, time}: { date?: string, time?: string }) {
    if (!date) return null;
    const datePart = date.split("T")[0];
    if (time) {
      return new Date(`${datePart}T${time}`);
    }
    return new Date(`${datePart}T00:00:00Z`);
  }

  let races: Race[] = [];
  racesContent.forEach((row: any) => {
    const startDateTime = row.FirstPractice
      ? getDateTime({
      date: row.FirstPractice.date,
      time: row.FirstPractice.time,
    }) ?? getDateTime({date: row.date, time: row.time})
      : getDateTime({date: row.date, time: row.time});

    const endDateTime = getDateTime({date: row.date, time: row.time});

    races.push({
      round: row.round,
      name: row.raceName,
      circuit: row.Circuit?.circuitName ?? "",
      startDate: startDateTime ? startDateTime.toISOString() : "",
      endDate: endDateTime ? endDateTime.toISOString() : "",
      range: startDateTime && endDateTime ? formatDateRangeLocal(startDateTime, endDateTime) : "",
    });
  });

  // Fetch standings
  const standingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/standings?year=${season}`, {
    cache: "no-store",
  });
  const standingsContent = await standingsRes.json();

  const driverStandings: DriverStanding[] =
    standingsContent.drivers[0] ? standingsContent.drivers[0].DriverStandings.map((driver: any) => ({
      position: parseInt(driver.position),
      name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
      team: driver.Constructors[0]?.name ?? "N/A",
      points: parseInt(driver.points),
      wins: parseInt(driver.wins),
    })) : [];

  const constructorStandings: ConstructorStanding[] =
    standingsContent.constructors[0] ? standingsContent.constructors[0].ConstructorStandings.map((constructor: any) => ({
      position: parseInt(constructor.position),
      name: constructor.Constructor.name,
      points: parseInt(constructor.points),
      wins: parseInt(constructor.wins),
    })): [];

  return races && races.length > 0 && Number(season) >= 2018 && driverStandings && constructorStandings ? (
    <div className="xl:w-7xl mx-auto p-2 md:px-8 flex flex-col gap-2 md:gap-8 lg:max-h-[calc(100vh-85px)]">
      <div className="flex flex-col sm:flex-row gap-2">
        <h1 className="text-2xl md:text-4xl font-bold">{season} Season</h1>
        {season == today.getFullYear().toString() ?
          <Badge className="bg-red-thm text-base font-bold">Current Season</Badge> : <></>}
      </div>
      <div className="flex flex-col lg:flex-row overflow-hidden gap-8">
        <div className="flex flex-col basis-2/3 gap-2">
          <h2 className="text-2xl font-semibold">Schedule</h2>
          <div className="flex flex-col lg:overflow-y-auto">
            {
              races.map((race, index) => (
                <EventItem key={index} race={race} index={race.round} season={season}/>
              ))
            }
          </div>
        </div>
        <div className="flex flex-col basis-1/3 gap-4">
          <div className="flex flex-col gap-4 w-full basis-1/2 overflow-hidden">
            <h2 className="text-2xl font-semibold">Driver Standings</h2>
            <div className="bg-primary-foreground flex flex-col px-4 py-2 rounded-lg w-full lg:max-h-[calc(100%-56px)]">
              <div className="flex flex-col w-full h-full">
                <div className="sticky top-0 z-10 bg-primary-foreground">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-none hover:bg-inherit">
                        <TableHead className="w-10 text-gray-300">Pos</TableHead>
                        <TableHead className="text-gray-300">Driver</TableHead>
                        <TableHead className="text-right pr-4 text-gray-300">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <div className="overflow-auto h-full">
                  <Table className="w-full h-full">
                    <TableBody>
                      {
                        driverStandings?.map((driver) => (
                          <TableRow key={driver.position} className="border-none">
                            <TableCell className="w-10 text-center">{driver.position}</TableCell>
                            <TableCell className="flex flex-col">
                              <span className="font-bold">{driver.name}</span>
                              <span className="text-sm text-gray-400">{driver.team}</span>
                            </TableCell>
                            <TableCell className="text-right pr-4">{driver.points}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full basis-1/2 overflow-hidden">
            <h2 className="text-2xl font-semibold">Constructor Standings</h2>
            <div className="bg-primary-foreground flex flex-col px-4 py-2 rounded-lg w-full lg:max-h-[calc(100%-56px)]">
              <div className="flex flex-col w-full h-full">
                <div className="sticky top-0 z-10 bg-primary-foreground">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-none hover:bg-inherit">
                        <TableHead className="w-10 text-gray-300">Pos</TableHead>
                        <TableHead className="text-gray-300">Team</TableHead>
                        <TableHead className="text-right pr-4 text-gray-300">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <div className="overflow-auto h-full">
                  <Table className="w-full h-full">
                    <TableBody>
                      {
                        constructorStandings?.map((team) => (
                          <TableRow key={team.position} className="h-10 border-none">
                            <TableCell className="w-10 text-center">{team.position}</TableCell>
                            <TableCell className="font-bold">{team.name}</TableCell>
                            <TableCell className="text-right pr-4">{team.points}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  ) : (
    <div className="flex h-[calc(100vh-104px)] flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Season Not Found</h1>
      <p className="text-lg md:text-xl text-gray-400">The season you are looking for does not exist or is not supported.<br/>Please select a season between 2018 and the current year.</p>
      <Link href="/" className="mt-6 px-6 py-3 bg-red-thm text-white rounded-lg hover:bg-red-700 transition">Go Back</Link>
    </div>
  )
}
