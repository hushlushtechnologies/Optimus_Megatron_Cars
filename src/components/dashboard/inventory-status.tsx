"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/src/components/ui/card";
import { inventoryStatus } from "@/src/lib/mock-data/dashboard";

export function InventoryStatus() {
  const total = inventoryStatus.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card variant="elevated" padding="lg" className="flex h-full flex-col">
      <h3 className="text-h3">Inventory Health</h3>
      <p className="mb-2 text-body-sm text-text-muted">
        {total} vehicles tracked
      </p>

      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={inventoryStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={3}
              animationDuration={800}
            >
              {inventoryStatus.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--omc-card)",
                border: "1px solid var(--omc-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h2 tabular-nums">
            {inventoryStatus[0].value}
          </span>
          <span className="text-caption">Available</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {inventoryStatus.map((status) => (
          <li
            key={status.name}
            className="flex items-center justify-between text-body-sm"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.name}
            </span>
            <span className="tabular-nums text-text-muted">{status.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
