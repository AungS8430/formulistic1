import React from "react"
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend} from "recharts"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

interface CompoundInfo {
  [name: string]: {
    color: string,
    abbreviation: string,
  }
}

interface Stint {
  stint: number,
  compound: string,
  length: number,
}

interface Strategy {
  [driver: string]: Stint[]
}

export default function StrategyChart({ strategy, compounds }: { strategy: Strategy, compounds: CompoundInfo }) {
  const drivers = Object.entries(strategy)
  const maxStints = drivers.reduce((max, [, stints]) => Math.max(max, stints.length), 0)

  const data = drivers.map(([driver, stints], index) => {
    const row: Record<string, any> = { driver: `P${index+1} ${driver}` }
    for (let i = 0; i < maxStints; i++) {
      const s = stints[i]
      row[`stint_${i}`] = s ? s.length : 0
      row[`stint_${i}_compound`] = s ? s.compound : undefined
    }
    return row
  })

  // ensure enough vertical space so all driver labels render
  const chartHeight = Math.max(200, data.length * 36)

  const chartConfig: ChartConfig = {}

  return (
    <ChartContainer config={chartConfig}>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="driver" type="category" />
            <Legend align="center" verticalAlign="top" height={36} content={
              () => (
                <ul style={{ textAlign: "center", padding: 0, margin: 0 }}>
                  {Object.entries(compounds).map(([name, info]) => (
                    <li key={name} style={{ display: "inline-block", marginRight: "16px", listStyle: "none" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          backgroundColor: info.color,
                          marginRight: "4px",
                        }}
                      ></span>
                      {name}
                    </li>
                  ))}
                </ul>
              )
            } />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                const payload = props && props.payload
                const compoundKey = name + "_compound"
                const compound = payload && payload[compoundKey]
                const abbr = compound ? compounds[compound]?.abbreviation ?? compound : ""
                return [`${value}`, abbr || name]
              }}
            />
            {
              Array.from({ length: maxStints }).map((_, i) => (
                <Bar key={i} dataKey={`stint_${i}`} stackId="a" isAnimationActive={false}>
                  {
                    data.map((entry, idx) => {
                      const compoundName = entry[`stint_${i}_compound`]
                      const fill = compoundName ? (compounds[compoundName]?.color ?? "#c0c0c0") : "transparent"
                      return <Cell key={idx} fill={fill} />
                    })
                  }
                </Bar>
              ))
            }
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}
