"use client";

import { motion } from "motion/react";
import { VehicleCard } from "@/src/components/inventory/vehicle-card";
import type { InventoryCarRow } from "@/src/lib/supabase/inventory-queries";

interface InventoryGridProps {
  rows: InventoryCarRow[];
  rowSelection: Record<string, boolean>;
  onToggleSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

export function InventoryGrid({
  rows,
  rowSelection,
  onToggleSelect,
  onDuplicate,
  onArchive,
  onRestore,
  onRequestDelete,
}: InventoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((car, index) => (
        <motion.div
          key={car.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
        >
          <VehicleCard
            car={car}
            isSelected={!!rowSelection[car.id]}
            onToggleSelect={() => onToggleSelect(car.id)}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onRequestDelete={onRequestDelete}
          />
        </motion.div>
      ))}
    </div>
  );
}
