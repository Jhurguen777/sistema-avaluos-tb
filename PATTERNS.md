# Patrones de Componentes - Documentación de Referencia

## 🔍 Select Dropdown - Patrón de Valor Visible

### ⚠️ Problema Conocido
El componente `SelectValue` de Radix UI tiene problemas de visibilidad en dispositivos móviles. El valor seleccionado no se muestra después de hacer clic en una opción.

### ✅ Solución: Renderizado Manual del Valor

**NO usar** `SelectValue` o `SelectValueCustom`. En su lugar, renderizar manualmente el valor seleccionado con un `<span>`.

### 📋 Patrón Estándar

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

// Ejemplo con estado simple
const [roleFilter, setRoleFilter] = useState<string>("all")

<Select value={roleFilter} onValueChange={setRoleFilter}>
  <SelectTrigger className="w-full sm:w-[160px] h-10 border-2 rounded-md bg-card text-white">
    <span className="text-white text-sm">
      {roleFilter === "all" ? "Todos los roles" : ROLE_LABELS[roleFilter] || roleFilter}
    </span>
  </SelectTrigger>
  <SelectContent className="bg-card">
    <SelectItem value="all">Todos los roles</SelectItem>
    <SelectItem value="ADMIN">Administrador</SelectItem>
    <SelectItem value="ARQUITECTO">Arquitecto</SelectItem>
  </SelectContent>
</Select>
```

### 📋 Patrón con React Hook Form

```tsx
import { Controller } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

<Controller
  name="role"
  control={form.control}
  render={({ field }) => (
    <Select
      onValueChange={field.onChange}
      value={field.value}
    >
      <SelectTrigger className="h-10 border-2 rounded-md bg-card text-white">
        <span className="text-white text-sm">
          {field.value ? ROLE_LABELS[field.value] || field.value : "Selecciona un rol"}
        </span>
      </SelectTrigger>
      <SelectContent className="bg-card">
        <SelectItem value="ADMIN">Administrador</SelectItem>
        <SelectItem value="ARQUITECTO">Arquitecto</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

### 🎯 Clases CSS Requeridas

**SelectTrigger:**
- `bg-card` - Fondo oscuro del dashboard
- `text-white` - Color del texto (importante para visibilidad)
- `border-2` - Borde visible
- `h-10` o `h-11` - Altura consistente

**Span del valor:**
- `text-white` - Color blanco forzado
- `text-sm` - Tamaño de texto consistente

### ✅ Archivos Actualizados con este Patrón

1. `components/usuarios/usuarios-table.tsx` - Select de roles y estados
2. `components/usuarios/crear-usuario-modal.tsx` - Select de rol con formulario

### 🔄 Para Futuros Selectores

Al crear un nuevo Select, **siempre**:
1. NO importar `SelectValue` ni `SelectValueCustom`
2. Usar `<span>` manual dentro del `SelectTrigger`
3. Aplicar clases `text-white text-sm` al span
4. Calcular el texto basado en el valor del estado

### 📝 Notas

- El filtrado funciona correctamente con este patrón
- Compatible con React Hook Form
- Funciona perfectamente en móvil y desktop
- Los estilos son consistentes con el diseño del dashboard

---

## 📊 Tablas con CSS Grid - Patrón de Alineación Milimétrica

### ⚠️ Problema Conocido
Las tablas HTML (`<table>`, `<tr>`, `<td>`) y componentes de shadcn/ui (`Table`, `TableRow`) no garantizan alineación perfecta de columnas. Los anchos se calculan dinámicamente según el contenido, causando desalineación.

### ✅ Solución: CSS Grid con Anchos Fr Explícitos

**NO usar** etiquetas de tabla HTML ni componentes `Table` de shadcn. En su lugar, usar **CSS Grid** con anchos `fr` explícitos.

### 📋 Patrón Estándar para Tablas

```tsx
// CABECERA - Estructura Grid
<div className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1.5fr_2fr_1fr] items-center gap-4 w-full bg-muted/50 px-4 py-3 border-b-2 border-slate-800 text-xs font-medium">
  <div className="text-left">Usuario</div>
  <div className="text-left hidden sm:block">Email</div>
  <div className="text-center">Rol</div>
  <div className="text-center">Estado</div>
  <div className="text-center hidden lg:block">Último Login</div>
  <div className="text-right pr-2">Acciones</div>
</div>

// FILAS - Estructura Grid (misma configuración)
{data.map((item) => (
  <div key={item.id} className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1.5fr_2fr_1fr] items-center gap-4 w-full px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
    <div className="text-left">
      <div className="font-medium text-sm truncate" title={item.name}>
        {item.name}
      </div>
    </div>
    <div className="text-left hidden sm:block">
      <div className="text-sm text-slate-300 truncate" title={item.email}>
        {item.email}
      </div>
    </div>
    <div className="text-center">
      <div className="flex justify-center">
        <Badge>{item.role}</Badge>
      </div>
    </div>
    <div className="text-center">
      <div className="flex justify-center">
        <Badge variant={item.status}>{item.status}</Badge>
      </div>
    </div>
    <div className="text-center text-xs hidden lg:block">
      <div className="text-slate-400">{item.lastLogin}</div>
    </div>
    <div className="text-right pr-2">
      <div className="flex justify-end gap-2">
        ...botones de acción...
      </div>
    </div>
  </div>
))}
```

### 🎯 Distribución de Columnas (grid-cols)

| Columna | fr | Equivalencia % | Ancho Aprox. |
|---------|----|----------------|--------------|
| Usuario | 1.5fr | ~15% | ~150px |
| Email | 2.5fr | ~25% | ~250px |
| Rol | 1.5fr | ~15% | ~150px |
| Estado | 1.5fr | ~15% | ~150px |
| Último Login | 2fr | ~20% | ~200px |
| Acciones | 1fr | ~10% | ~100px |

**Total:** 10fr = 100%

### 🎯 Clases CSS Requeridas

**Cabecera:**
```tsx
className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1.5fr_2fr_1fr] items-center gap-4 w-full bg-muted/50 px-4 py-3 border-b-2 border-slate-800 text-xs font-medium"
```

**Filas:**
```tsx
className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1.5fr_2fr_1fr] items-center gap-4 w-full px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
```

**Celdas de texto con truncate:**
```tsx
<div className="text-sm text-slate-300 truncate" title={textoLargo}>
  {textoLargo}
</div>
```

**Responsive (ocultar en móvil):**
- `hidden sm:block` - Oculta en móvil, visible en tablet+
- `hidden lg:block` - Oculta en tablet, visible en desktop+

### 🔧 Customización para Diferentes Tablas

Para tablas con diferentes columnas, ajusta el `grid-cols` manteniendo la suma total de `fr`:

```tsx
// Ejemplo: Tabla con 4 columnas
grid-cols-[2fr_3fr_2fr_1fr]  // Usuario, Email, Rol, Acciones

// Ejemplo: Tabla con 5 columnas
grid-cols-[1fr_2fr_1fr_1fr_1fr]  // ID, Nombre, Estado, Fecha, Acciones

// Ejemplo: Tabla con columnas de ancho fijo
grid-cols-[100px_2fr_150px_1fr]  // Avatar (fijo), Nombre (flex), Rol (fijo), Acciones (flex)
```

### ✅ Archivos Actualizados con este Patrón

1. `components/usuarios/usuarios-table.tsx` - Tabla de usuarios con Grid

### 🔄 Para Futuras Tablas

Al crear una nueva tabla, **siempre**:
1. **NO usar** `<table>`, `<tr>`, `<td>` ni componentes `Table` de shadcn
2. **USAR CSS Grid** con `grid-cols-[...]` explícito
3. **Aplicar la MISMA configuración** a cabecera y filas
4. **Usar `truncate`** en textos largos con `title` para tooltip
5. **Añadir `items-center`** para centrado vertical consistente
6. **Aplicar `hover:bg-slate-800/50`** para feedback visual

### 📝 Notas

- CSS Grid garantiza alineación perfecta columna por columna
- Los anchos `fr` son proporcionales y responsivos
- Compatible con dashboard oscuro (border-slate-800, bg-muted/50)
- Funciona perfectamente en móvil, tablet y desktop
- El `truncate` evita que textos largos rompan el layout

---

**Última actualización:** 2026-07-07
**Problema resuelto:** Tablas desalineadas → Alineación milimétrica con CSS Grid
