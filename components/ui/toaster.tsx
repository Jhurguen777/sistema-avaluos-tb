"use client"

import * as React from "react"
import { toast, Toast } from "./use-toast"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    const unsubscribe = toast.subscribe((state) => {
      setToasts(state.toasts)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastComponent key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastComponent({ toast }: { toast: Toast }) {
  const [isExiting, setIsExiting] = React.useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      // Usar el método remove del toast manager global
      ;(toast as any & { __remove__: () => void }).__remove__ = () => toast.remove?.()
      // Llamar a remove del toast manager
      const remove = (toast as any).remove
      if (typeof remove === 'function') {
        remove()
      }
    }, 300)
  }

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: {
      bg: "bg-green-600",
      border: "border-green-600/50",
      icon: "text-white"
    },
    error: {
      bg: "bg-[#E0081D]",
      border: "border-[#E0081D]/50",
      icon: "text-white"
    },
    warning: {
      bg: "bg-[#FAB90E]",
      border: "border-[#FAB90E]/50",
      icon: "text-white"
    },
    info: {
      bg: "bg-[#233C7A]",
      border: "border-[#233C7A]/50",
      icon: "text-white"
    },
  }

  const style = styles[toast.type]
  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-4 flex items-start gap-3",
        "transform transition-all duration-300 ease-out",
        style.bg,
        style.border,
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      )}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 p-1 rounded-full bg-white/20", style.icon)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-white/90 text-sm mt-1">{toast.description}</p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
