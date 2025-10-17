import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Customized,
} from 'recharts';

interface Pace {
  team: string,
  min: number,
  q1: number,
  median: number,
  q3: number,
  max: number,
  lower_whisker: number,
  upper_whisker: number,
  color: string,
}

const BOX_WIDTH = 48;
const PAD_LEFT = 32;
const PAD_RIGHT = 32;

const BoxPlotOverlay = (props: any) => {
  const { xAxisMap, yAxisMap, data } = props;
  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
  if (!xAxis || !yAxis) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;

  return (
    <g>
      {data.map((team: Pace) => {
        // Center each box within its band, no manual padding
        const x = xScale(team.team) + xScale.bandwidth() / 2 - BOX_WIDTH / 2;
        const q1Y = yScale(team.q1);
        const q3Y = yScale(team.q3);
        const medianY = yScale(team.median);
        const lwY = yScale(team.lower_whisker);
        const uwY = yScale(team.upper_whisker);

        return (
          <g key={team.team}>
            {/* Whiskers */}
            <line x1={x + BOX_WIDTH/2} x2={x + BOX_WIDTH/2} y1={uwY} y2={q3Y} stroke="#eee" strokeWidth={2} />
            <line x1={x + BOX_WIDTH/2} x2={x + BOX_WIDTH/2} y1={q1Y} y2={lwY} stroke="#eee" strokeWidth={2} />
            {/* Whisker caps */}
            <line x1={x + BOX_WIDTH*0.25} x2={x + BOX_WIDTH*0.75} y1={uwY} y2={uwY} stroke="#eee" strokeWidth={2} />
            <line x1={x + BOX_WIDTH*0.25} x2={x + BOX_WIDTH*0.75} y1={lwY} y2={lwY} stroke="#eee" strokeWidth={2} />
            {/* Box */}
            <rect
              x={x}
              y={q3Y}
              width={BOX_WIDTH}
              height={q1Y - q3Y}
              fill={team.color}
              stroke="#111"
              strokeWidth={2}
              rx={4}
              opacity={0.95}
            />
            {/* Median */}
            <line x1={x} x2={x + BOX_WIDTH} y1={medianY} y2={medianY} stroke="#fff" strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

export default function PaceChart({ paceData }: { paceData: Pace[] }) {
  const minLap = Math.min(...paceData.map(p => p.min));
  const maxLap = Math.max(...paceData.map(p => p.max));

  return (
    <ResponsiveContainer width={'100%'} minHeight={'500px'}>
      <ComposedChart
        data={paceData}
        margin={{ bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <XAxis
          dataKey="team"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#ccc", fontWeight: 600, fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          type="category"
          interval={0}
          padding={{ left: PAD_LEFT, right: PAD_RIGHT }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#ccc", fontWeight: 600, fontSize: 14 }}
          width={60}
          domain={[
            Math.floor(minLap - 1),
            Math.ceil(maxLap + 1),
          ]}
        />
        <Customized component={BoxPlotOverlay} data={paceData} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}