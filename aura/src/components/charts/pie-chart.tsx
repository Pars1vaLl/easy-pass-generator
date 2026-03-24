"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PieChartProps {
  title?: string
  description?: string
  data: Array<{ name: string; value: number; color?: string }>
}

export function PieChartComponent({ title, description, data }: PieChartProps) {
  const defaultColors = ["#7c5af5", "#6366f1", "#a78bfa", "#c4b5fd", "#8b5cf6"]
  
  return (
    <Card className="bg-[#111118] border-[#1e1e2e]">
      <CardHeader>
        {title && <CardTitle className="text-[#f0f0f0]">{title}</CardTitle>}
        {description && (
          <CardDescription className="text-[#4b5563]">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || defaultColors[index % defaultColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111118",
                  border: "1px solid #1e1e2e",
                  borderRadius: "8px",
                  color: "#f0f0f0",
                }}
              />
              <Legend 
                wrapperStyle={{ color: "#4b5563" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
