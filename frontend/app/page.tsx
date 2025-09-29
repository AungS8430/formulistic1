"use client";

import Image from "next/image";
import { motion } from "motion/react"
import { Anton } from "next/font/google";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default function Home() {
  const currentSeason = new Date().getFullYear()
  const [currentRace, setCurrentRace] = useState(null)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  useEffect(() => {
    fetch(`http://100.125.78.96:1234/season/schedule?year=${currentSeason}`).then((response) => response.json()).then((content) => {
      content.MRData.RaceTable.Races.map((row: any) => {
        const s = new Date(row.FirstPractice ? row.FirstPractice.date : row.date);
        const e = new Date(row.date);
        if (s <= today && today <= e) setCurrentRace(row.raceName);
      })
    })

  }, [currentSeason])

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col items-center justify-between">
      <motion.h1
        animate={{ opacity: [0, 1, 1], y: [0, 0, -60], transition: { duration: 2, times: [0, 0.3, 0.9]} }}
        className={anton.className + " italic! text-7xl md:text-9xl mt-12 md:mt-0 gap-0 absolute h-fit top-1/2 bottom-1/2 -translate-y-1/2"}
      >
        <span className="text-red-thm">F</span>
        ORMULISTIC
        <span className="text-red-thm">1</span>
      </motion.h1>
      <motion.h2
        animate={{ opacity: [0, 1, null], y: [30, null, -30], transition: { duration: 2, times: [0, 0.3, 0.9] } }}
        className="text-sm md:text-2xl font-bold text-neutral-300 mt-16 md:mt-12 text-center mx-auto absolute top-1/2 bottom-1/2 h-fit -translate-y-1/2"
      >
        View past and live Formula 1 race data, stats, and more.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 1, delay: 1 }}}
        className="absolute top-1/2 bottom-1/2 -translate-y-1/2 mt-14 flex flex-col sm:flex-row gap-1 sm:gap-2"
      >
        <Button variant="outline" className="text-neutral-300 hover:cursor-pointer">
          {currentSeason} Season
        </Button>
        {
          currentRace && (
            <Button className="bg-red-thm hover:bg-red-atv hover:cursor-pointer">
              {currentRace}
            </Button>
          )
        }

      </motion.div>
    </div>
  );
}
