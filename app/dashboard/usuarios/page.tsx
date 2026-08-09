"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { listUsersAction } from "@/modules/users/actions"
import { toast } from "@/components/ui/use-toast"
import { UsuariosTable } from "@/components/usuarios/usuarios-table"
import { CrearUsuarioModalSimple } from "@/components/usuarios/crear-usuario-modal-simple"
import { GestionUsuarioDrawer } from "@/components/usuarios/gestion-usuario-drawer"
import { RoleBadge } from "@/components/usuarios/badge-rol"
import { EstadoBadge } from "@/components/usuarios/badge-estado"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Settings, Search, X, Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

export default function UsuariosPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [tableKey, setTableKey] = useState(0)

  // Modal crear usuario
  const [modalOpen, setModalOpen] = useState(false)

  // Selector de usuario para gestionar
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorSearch, setSelectorSearch] = useState("")

  // Drawer de gestión
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Cargar usuarios al montar
  useEffect(() => {
    async function loadData() {
      try {
        const result = await listUsersAction({ page: 1, limit: 100 })
        if (result.success && result.data) {
          setUsers(result.data.users)
          setTotal(result.data.pagination.total)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Error al cargar los usuarios")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleUserCreated = async () => {
    const result = await listUsersAction({ page: 1, limit: 100 })
    if (result.success && result.data) {
      setUsers(result.data.users)
      setTotal(result.data.pagination.total)
    }
    setTableKey((prev) => prev + 1)
  }

  /** Seleccionar un usuario del selector y abrir el drawer */
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSelectorOpen(false)
    setSelectorSearch("")
    setDrawerOpen(true)
  }

  /** Filtrar usuarios en el selector por búsqueda */
  const filteredUsers = selectorSearch
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(selectorSearch.toLowerCase()),
      )
    : users

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header con botones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FAB90E]">
            Gestión de Usuarios
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>

        {/* Botones: Nuevo Usuario + Gestionar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#233C7A] hover:bg-[#1e3566] shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Usuario
          </Button>
          <Button
            onClick={() => setSelectorOpen(true)}
            className="bg-[#FAB90E] hover:bg-[#e5a705] text-black shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none"
          >
            <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Gestionar
          </Button>
        </div>
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
            initialUsers={users.slice(0, 10)}
            initialTotal={total}
            onUserChange={handleUserCreated}
          />
        </CardContent>
      </Card>

      {/* === MODAL SELECTOR DE USUARIO === */}
      {selectorOpen && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectorOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-card border-2 border-border/50 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header del selector */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#FAB90E]" />
                  Seleccionar Usuario
                </h3>
                <button
                  onClick={() => setSelectorOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border-2 border-border/50 rounded-md focus:border-[#FAB90E] focus:outline-none text-sm bg-background"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de usuarios scrollable */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No se encontraron usuarios
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-left group"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <EstadoBadge isActive={user.isActive} />
                      <RoleBadge role={user.role as any} />
                    </div>

                    {/* Flecha */}
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:text-[#FAB90E] group-hover:rotate-45 transition-all duration-300 shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-3 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length} usuario(s) — Selecciona uno para gestionar sus permisos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear usuario */}
      <CrearUsuarioModalSimple
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUserCreated={handleUserCreated}
      />

      {/* Drawer de gestión */}
      <GestionUsuarioDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUserUpdated={handleUserCreated}
      />
    </div>
  )
}
