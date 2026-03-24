"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface BarChartProps {
  title?: string
  description?: string
  data: Array<Record<string, string | number>>
  config: ChartConfig
  nameKey: string
  trend?: {
    value: string
    direction: "up" | "down"
  }
  footer?: string
}

export function BarChartComponent({
  title,
  description,
  data,
  config,
  nameKey,
  trend,
  footer,
}: BarChartProps) {
  return (
    <Card className="bg-[#111118] border-[#1e1e2e]">
      <CardHeader>
        {title && (
          <CardTitle className="text-[#f0f0f0]">{title}</CardTitle>
        )}
        {description && (
          <CardDescription className="text-[#4b5563]">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} stroke="#1e1e2e" />
            <XAxis
              dataKey={nameKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="#4b5563"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {Object.keys(config).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(trend || footer) && (
        <CardFooter className="border-t border-[#1e1e2e] pt-4">
          <div className="flex w-full items-start gap-2 text-sm">
            {trend && (
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none text-[#f0f0f0]">
                  {trend.direction === "up" ? "Trending up" : "Trending down"} by {trend.value}
                  <TrendingUp
                    className={`h-4 w-4 ${
                      trend.direction === "up" ? "text-green-500" : "text-red-500 rotate-180"
                    }`}
                  />
                </div>
                {footer && (
                  <div className="flex items-center gap-2 leading-none text-[#4b5563]">
                    {footer}
                  </div>
                )}
              </div>
            )}
            {!trend && footer && (
              <div className="leading-none text-[#4b5563]">{footer}</div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
