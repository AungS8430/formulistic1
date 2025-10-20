import Image from "next/image";
import {motion} from "motion/react"
import {Anton} from "next/font/google";
import Link from "next/link";
import {CurrentRaceDisplay} from "@/components/CurrentRaceDisplay";

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default async function Home() {
  const currentSeason = new Date().getFullYear();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/schedule?year=${currentSeason}`, {cache: "no-store"});
  const content = await res.json();

  const seasons = Array.from(
    {length: currentSeason - 2018 + 1},
    (_, i) => currentSeason - i
  );
  return (
    <div className="flex flex-col gap-10 items-center justify-between my-auto">
      <h1 className={anton.className + " italic! text-7xl sm:text-8xl md:text-9xl mt-12 md:mt-0 gap-0 "}>
        <span className="text-red-thm">F</span>
        ORMULISTIC
        <span className="text-red-thm">1</span>
      </h1>
      <CurrentRaceDisplay races={content} currentSeason={currentSeason} />
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold">Select a Season</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 w-full">
          {
            seasons.map((year) => (
              <Link key={year} href={`/seasons/${year}`}
                    className="text-4xl font-bold bg-primary-foreground hover:bg-secondary px-10 py-6 rounded-lg">
                {year}
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}
