"use client"

import * as React from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  remove?: () => void
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

class ToastManager {
  private listeners: Set<(state: ToastState) => void> = new Set()
  private state: ToastState = { toasts: [] }

  subscribe(listener: (state: ToastState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  add(toast: Omit<Toast, "id" | "remove">) {
    const id = `toast-${toastCount++}`
    const newToast: Toast = {
      ...toast,
      id,
      remove: () => this.remove(id)
    }

    this.state.toasts = [...this.state.toasts, newToast]
    this.notify()

    // Auto dismiss
    if (toast.duration !== 0) {
      setTimeout(() => {
        this.remove(id)
      }, toast.duration || 5000)
    }

    return id
  }

  remove(id: string) {
    this.state.toasts = this.state.toasts.filter(t => t.id !== id)
    this.notify()
  }

  success(title: string, description?: string | number, duration?: number) {
    // Si description es un número, lo tratamos como duration
    if (typeof description === "number") {
      return this.add({ type: "success", title, description: undefined, duration: description })
    }
    return this.add({ type: "success", title, description, duration })
  }

  error(title: string, description?: string | number, duration?: number) {
    // Si description es un número, lo tratamos como duration
    if (typeof description === "number") {
      return this.add({ type: "error", title, description: undefined, duration: description })
    }
    return this.add({ type: "error", title, description, duration })
  }

  warning(title: string, description?: string | number, duration?: number) {
    // Si description es un número, lo tratamos como duration
    if (typeof description === "number") {
      return this.add({ type: "warning", title, description: undefined, duration: description })
    }
    return this.add({ type: "warning", title, description, duration })
  }

  info(title: string, description?: string | number, duration?: number) {
    // Si description es un número, lo tratamos como duration
    if (typeof description === "number") {
      return this.add({ type: "info", title, description: undefined, duration: description })
    }
    return this.add({ type: "info", title, description, duration })
  }
}

export const toast = new ToastManager()
