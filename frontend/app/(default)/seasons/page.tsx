import Image from "next/image";
import { motion } from "motion/react"
import { Anton } from "next/font/google";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default function Home() {
  const currentSeason = new Date().getFullYear()

  const seasons = Array.from(
    { length: currentSeason - 2018 + 1 },
    (_, i) => currentSeason - i
  )
  return (
    <div className="flex flex-col gap-10 items-center justify-between my-auto">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold">Select a Season</h2>
        <div className="grid gap-6 grid-cols-4 w-full">
          {
            seasons.map((year) => (
              <Link key={year} href={`/seasons/${year}`} className="text-2xl md:text-4xl font-bold bg-primary-foreground hover:bg-secondary px-10 py-6 rounded-lg">
                {year}
              </Link>
            ))
          }
        </div>
      </div>

    </div>
  );
}
