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

const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  weight: "400"
})

export default function Navbar() {
  const currentSeason = new Date().getFullYear()
  const pastSeasons = Array.from(
    { length: 10 },
    (_, i) => currentSeason - i - 1
  )
  const races = [
    {
      "id": 1,
      "name": "Australian GP",
      "status": -1
    },
    {
      "id": 2,
      "name": "Chinese GP",
      "status": -1
    },
    {
      "id": 3,
      "name": "British GP",
      "status": 0
    },
    {
      "id": 4,
      "name": "Abu Dhabi GP",
      "status": 1
    }
  ]
  const currentRace = "British GP"
  return (
    <div className="flex p-1 bg-navbar shadow-md">
      <Button variant="ghost" className={anton.className + " italic! text-2xl gap-0"}><span className="text-red-thm">F</span>ORMULISTIC<span className="text-red-thm">1</span></Button>
      <div className="grow" />
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
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
                <NavigationMenuLink href="/seasons">All Seasons</NavigationMenuLink>
              </div>

            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>This Season</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div>
                {
                  races.map((race) => (
                    <NavigationMenuLink
                      key={race.name}
                      href={`/seasons/${currentSeason}/${race.id}`}
                    >
                      <span className={race.status == 1 ? "text-neutral-400" : race.status == 0 ? "text-red-thm" : ""}>{race.name}</span>
                      {
                        race.status == 0 ? (
                          <Badge className="bg-red-thm">Live</Badge>
                        ) : <></>
                      }
                    </NavigationMenuLink>
                  ))
                }
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          {
            currentRace ? (
              <NavigationMenuItem>
                <Button className="bg-red-thm hover:bg-red-atv">{currentRace}</Button>
              </NavigationMenuItem>
            ) : (
              <></>
            )
          }

        </NavigationMenuList>
      </NavigationMenu>
    </div>

  )
}