"use client";

import { useEffect, useState, use } from "react";

export default function Live() {
  const [drivers, setDrivers] = useState<null | { position: number, dnumber: string, name: string, team: string, color: string, gap: string, lastLap: number | null, bestLap: number | null, laps: number | null, time: string | null, status: string }[]>(null)
  const [session, setSession] = useState<null | { name: string, type: string, time: string }>(null)
  return (
    <div>

    </div>
  )
}