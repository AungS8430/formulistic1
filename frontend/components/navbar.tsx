"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Anton } from "next/font/google"
import {useEffect, useState} from "react";
import Link from "next/link";

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default function Navbar() {
  const currentSeason = new Date().getFullYear()

  const [races, setRaces] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[]>(null)
  const [currentRace, setCurrentRace] = useState<null | { round: number, name: string }>(null)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  useEffect(() => {
    fetch(`http://100.125.78.96:1234/season/schedule?year=${currentSeason}`).then((response) => response.json()).then((content) => {
      let data: { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[] = [];
      content.map((row: any) => {
        const s = new Date(row.FirstPractice ? row.FirstPractice.date : row.date);
        const e = new Date(row.date);
        data.push({
          round: row.round,
          name: row.raceName,
          circuit: row.Circuit.circuitName,
          startDate: row.FirstPractice ? row.FirstPractice.date : row.date,
          endDate: row.date,
          state: (s <= today && today <= e ? 0 : (today < s ? 1 : -1))
        })
        if (s <= today && today <= e) setCurrentRace({ round: row.round, name: row.raceName });
      })
      setRaces(data)
      console.log(today)
    })

  }, [currentSeason])
  const pastSeasons = Array.from(
    { length: currentSeason - 2018 },
    (_, i) => currentSeason - i - 1
  )
  return (
    <div className="p-1 bg-navbar shadow-md relative z-50">
      <div className="max-w-7xl mx-auto flex">
        <Link href="/">
          <Button variant="ghost" className={anton.className + " italic! text-2xl gap-0 cursor-pointer"}><span className="text-red-thm">F</span>ORMULISTIC<span className="text-red-thm">1</span></Button>
        </Link>
        <div className="grow" />
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>This Season</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-60 relative max-h-64 overflow-y-auto">
                  <NavigationMenuLink href={`/${currentSeason}`} className="font-bold">View Season</NavigationMenuLink>
                  {
                    races?.map((race) => (
                      <NavigationMenuLink
                        key={race.name}
                        href={`/seasons/${currentSeason}/${race.round}`}
                      >
                        <span className={race.state == 1 ? "text-neutral-400" : race.state == 0 ? "text-red-thm" : ""}>{race.name}</span>
                        {
                          race.state == 0 ? (
                            <Badge className="bg-red-thm">Live</Badge>
                          ) : <></>
                        }
                      </NavigationMenuLink>
                    ))
                  }
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Past Seasons</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>
                  {
                    pastSeasons.map((year) => (
                      <NavigationMenuLink
                        key={year}
                        href={`/seasons/${year}`}
                      >
                        {year} Season
                      </NavigationMenuLink>
                    ))
                  }
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {
              currentRace ? (
                <NavigationMenuItem>
                  <NavigationMenuLink href={`/seasons/${currentSeason}/${currentRace.round}`}>
                    <Button className="bg-red-thm hover:bg-red-atv">{currentRace.name}</Button>
                  </NavigationMenuLink>

                </NavigationMenuItem>
              ) : (
                <></>
              )
            }

          </NavigationMenuList>
        </NavigationMenu>
      </div>

    </div>

  )
}