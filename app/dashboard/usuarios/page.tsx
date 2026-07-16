"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { listUsersAction } from "@/modules/users/actions"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { CrearUsuarioModalSimple } from "@/components/usuarios/crear-usuario-modal-simple"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, UserCheck, UserX } from "lucide-react"

export default function UsuariosPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [tableKey, setTableKey] = useState(0) // Para forzar re-render de la tabla

  // Obtener usuarios al montar
  useEffect(() => {
    async function loadData() {
      try {
        // Obtener usuarios
        const result = await listUsersAction({ page: 1, limit: 10 })
        if (result.success && result.data) {
          setUsers(result.data.users)
          setTotal(result.data.pagination.total)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleUserCreated = async () => {
    // Recargar lista de usuarios
    const result = await listUsersAction({ page: 1, limit: 10 })
    if (result.success && result.data) {
      setUsers(result.data.users)
      setTotal(result.data.pagination.total)
    }
    // Forzar re-render de la tabla aumentando el key
    setTableKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const activos = users.filter(u => u.isActive).length
  const inactivos = users.filter(u => !u.isActive).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">
            Gestión de Usuarios
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-300 group hover:shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#233C7A] opacity-10 rounded-full filter blur-3xl group-hover:opacity-20 transition-opacity" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#233C7A]">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold">{total}</p>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-300 group hover:shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600 opacity-10 rounded-full filter blur-3xl group-hover:opacity-20 transition-opacity" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-green-600">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold">{activos}</p>
              <p className="text-sm text-muted-foreground">Usuarios Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/50 hover:border-[#FAB90E] transition-all duration-300 group hover:shadow-2xl relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E0081D] opacity-10 rounded-full filter blur-3xl group-hover:opacity-20 transition-opacity" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#E0081D]">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold">{inactivos}</p>
              <p className="text-sm text-muted-foreground">Usuarios Inactivos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl">Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista completa de usuarios con sus roles y estados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsuariosTable
            key={tableKey}
            initialUsers={users}
            initialTotal={total}
            onUserChange={handleUserCreated}
          />
        </CardContent>
      </Card>

      {/* Modal de crear usuario */}
      <CrearUsuarioModalSimple
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
}
