"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {useEffect, useState} from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {NavigationMenuLink} from "@/components/ui/navigation-menu";
import {Badge} from "@/components/ui/badge";
import Link from "next/link";

export default function AppSidebar() {
  const currentSeason = new Date().getFullYear()

  const [races, setRaces] = useState<null | { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[]>(null)
  const [currentRace, setCurrentRace] = useState<null | { round: number, name: string }>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_ROUTE!}/season/schedule?year=${currentSeason}`).then((response) => response.json()).then((content) => {
      const now = new Date();
      const getDateTime = (session: { date: string, time?: string } | undefined, fallbackDate: string, fallbackTime?: string) => {
        const dateStr = session?.date || fallbackDate;
        const timeStr = session?.time || fallbackTime;
        const datePart = dateStr.split("T")[0];
        return new Date(`${datePart}T${timeStr || '00:00:00Z'}`);
      };

      let data: { round: number, name: string, circuit: string, startDate: string, endDate: string, state: number }[] = [];
      content.map((row: any) => {
        const s = getDateTime(row.FirstPractice, row.date, row.time);
        const e = getDateTime({ date: row.date, time: row.time }, row.date, row.time);
        const state = s <= now && now <= e ? 0 : now < s ? 1 : -1;

        data.push({
          round: row.round,
          name: row.raceName,
          circuit: row.Circuit.circuitName,
          startDate: s.toISOString(),
          endDate: e.toISOString(),
          state: state
        })
        if (state === 0) {
          setCurrentRace({ round: row.round, name: row.raceName });
        }
      })
      setRaces(data)
    })

  }, [currentSeason])

  const pastSeasons = Array.from(
    { length: currentSeason - 2018 },
    (_, i) => currentSeason - i - 1
  )
  return (
    <Sidebar className="pt-14 md:hidden!">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-base font-semibold h-10! px-4!">This Season</SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubButton className="h-10! px-4!" href={`/seasons/${currentSeason}`}>View Season</SidebarMenuSubButton>
                      {
                        races?.map((race) => (
                          <SidebarMenuSubButton key={race.name} className="text-base h-10! px-4!" href={`/seasons/${currentSeason}/${race.round}`}>
                            <span className={race.state == 1 ? "text-neutral-400" : race.state == 0 ? "text-red-thm" : ""}>{race.name}</span>
                            {
                              race.state == 0 ? (
                                <Badge className="bg-red-thm">Live</Badge>
                              ) : <></>
                            }
                          </SidebarMenuSubButton>
                        ))
                      }
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
            <SidebarMenu>
              <Collapsible>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="text-base font-semibold h-10! px-4!">Past Seasons</SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {
                        pastSeasons.map((season) => (
                          <SidebarMenuSubButton key={season} className="text-base h-10! px-4!" href={`/seasons/${season}`}>{season} Season</SidebarMenuSubButton>
                        ))
                      }
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
            {
              currentRace ? (
                <SidebarMenu>
                  <SidebarMenuButton asChild className="text-base font-semibold h-10! px-4! bg-red-thm hover:bg-red-atv transition-colors cursor-pointer mt-4 text-background hover:text-background">
                    <Link className="justify-center" href={`/seasons/${currentSeason}/${currentRace.round}`}>{currentRace.name}</Link>
                  </SidebarMenuButton>
                </SidebarMenu>
              ) : (
                <></>
              )
            }
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}