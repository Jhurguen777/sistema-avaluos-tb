"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  FileText,
  Users,
  ArrowUpRight,
  LucideIcon
} from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickAction {
  title: string
  description: string
  iconName: string
  href: string
  color: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

const iconMap: Record<string, LucideIcon> = {
  Building2,
  FileText,
  Users,
}

export function QuickActions({ actions }: QuickActionsProps) {
  const router = useRouter()

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {actions.map((action, index) => {
        const Icon = iconMap[action.iconName] || Building2
        return (
          <Card
            key={index}
            className="group border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden relative"
          >
            <CardHeader className="relative pb-4 sm:pb-6">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#233C7A] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl">{action.title}</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-0">
              <Button
                className="w-full bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 text-white group-hover:scale-105"
                onClick={() => handleActionClick(action.href)}
              >
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  {action.title}
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
