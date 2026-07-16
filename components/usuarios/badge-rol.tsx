"use client"

import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS, ROLES } from "@/src/constants/roles"
import { cn } from "@/lib/utils"

interface RoleBadgeProps {
  role: keyof typeof ROLES
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const variants: Record<keyof typeof ROLES, { bg: string; text: string; border: string }> = {
    ADMIN: {
      bg: "bg-[#233C7A]",
      text: "text-white",
      border: "border-[#233C7A]/50"
    },
    ARQUITECTO: {
      bg: "bg-[#233C7A]",
      text: "text-white",
      border: "border-[#233C7A]/50"
    },
    INGENIERO_CIVIL: {
      bg: "bg-[#FAB90E]",
      text: "text-white",
      border: "border-[#FAB90E]/50"
    },
    VALUADOR: {
      bg: "bg-[#E0081D]",
      text: "text-white",
      border: "border-[#E0081D]/50"
    },
  }

  const variant = variants[role]

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
      {ROLE_LABELS[role]}
    </Badge>
  )
}
