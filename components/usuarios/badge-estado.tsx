"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EstadoBadgeProps {
  isActive: boolean
  className?: string
}

export function EstadoBadge({ isActive, className }: EstadoBadgeProps) {
  const active = {
    bg: "bg-green-600",
    text: "text-white",
    border: "border-green-600/50"
  }

  const inactive = {
    bg: "bg-[#E0081D]",
    text: "text-white",
    border: "border-[#E0081D]/50"
  }

  const variant = isActive ? active : inactive

  return (
    <Badge
      className={cn(
        "px-3 py-1 rounded-full font-semibold text-xs border-2 shadow-md hover:shadow-lg transition-all duration-200",
        variant.bg,
        variant.text,
        variant.border,
        className
      )}
    >
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  )
}
