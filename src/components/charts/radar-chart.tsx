"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

interface RadarDatum {
  skill: string;
  value: number;
}

interface SkillRadarChartProps {
  data: RadarDatum[];
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  return (
    <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#d9dde3" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#1f2937", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 6]} tickCount={7} axisLine={false} tick={false} />
          <Radar
            dataKey="value"
            stroke="#0f766e"
            fill="#14b8a6"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
