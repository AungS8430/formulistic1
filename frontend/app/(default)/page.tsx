import Image from "next/image";
import {motion} from "motion/react"
import {Anton} from "next/font/google";

import {Button} from "@/components/ui/button";
import Link from "next/link";

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default async function Home() {
  const currentSeason = new Date().getFullYear();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let currentRace: null | { round: number, name: string, circuit: string, duration: string } = null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/schedule?year=${currentSeason}`, {cache: "no-store"});
  const content = await res.json();
  for (const row of content) {
    const s = new Date(row.FirstPractice ? row.FirstPractice.date : row.date);
    const e = new Date(row.date);
    if (s <= today && today <= e) {
      currentRace = {
        round: row.round,
        name: row.raceName,
        circuit: row.Circuit.circuitName,
        duration: s.toLocaleDateString() + " - " + e.toLocaleDateString()
      };
      break;
    }
  }

  const seasons = Array.from(
    {length: currentSeason - 2018 + 1},
    (_, i) => currentSeason - i
  );
  return (
    <div className="flex flex-col gap-10 items-center justify-between my-auto">
      <h1 className={anton.className + " italic! text-7xl md:text-9xl mt-12 md:mt-0 gap-0 "}>
        <span className="text-red-thm">F</span>
        ORMULISTIC
        <span className="text-red-thm">1</span>
      </h1>
      {
        currentRace && (
          <div className="flex flex-col px-4 w-full gap-4">
            <h2 className="text-3xl font-bold">Current Race</h2>
            <Link className="bg-primary-foreground hover:bg-secondary px-10 py-6 rounded-lg flex flex-row w-full"
                  href={`/seasons/${currentSeason}/${currentRace.round}`}>
              <div className="flex flex-col">
                <h2 className="text-3xl font-bold">{currentRace.name}</h2>
                <h3 className="text-xl font-semibold text-gray-300">{currentRace.circuit}</h3>
              </div>
              <div className="grow"/>
              <div className="flex flex-col text-right">
                <h3 className="text-lg font-semibold text-gray-300">Round {currentRace.round} of 22</h3>
                <h3 className="text-lg font-semibold text-gray-300">{currentRace.duration}</h3>
              </div>
            </Link>
          </div>
        )
      }
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold">Select a Season</h2>
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 w-full">
          {
            seasons.map((year) => (
              <Link key={year} href={`/seasons/${year}`}
                    className="text-2xl md:text-4xl font-bold bg-primary-foreground hover:bg-secondary px-10 py-6 rounded-lg">
                {year}
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}
