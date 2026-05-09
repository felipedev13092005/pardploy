# Pardploy UI 🦁

[**Español**](#español) | [**English**](#english)

---

## Español

### ¿Qué es Pardploy UI?

Pardploy UI es el frontend del proyecto Pardploy, un gestor de despliegue de alto rendimiento diseñado como alternativa ligera y ultrarrápida a herramientas como Coolify o Dockploy. Proporciona una interfaz web reactiva y moderna para gestionar contenedores Docker desde cualquier navegador.

### Características Principales

- **Dashboard reactivo** - Monitoreo en tiempo real del estado de contenedores
- **Autenticación segura** - Sistema de login/registro con tokens JWT y refresh automático
- **Gestión de contenedores** - Visualización y control de contenedores Docker
- **Diseño adaptativo** - Interfaz responsive optimizada para escritorio y móvil
- **Dark/Light mode** - Soporte completo para temas claros y oscuros

### Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React 19 (React Compiler) |
| Build Tool | Vite 8 |
| Runtime | Bun |
| Routing | React Router 7 |
| Estado del servidor | TanStack Query 5 |
| Tablas | TanStack Table 8 |
| Formularios | React Hook Form + @hookform/resolvers |
| Estilos | Tailwind CSS 4 + Tailwind Merge |
| UI Components | shadcn/ui (Radix UI) |
| Iconos | Lucide React |
| Notificaciones | Sonner |
| Temas | next-themes |

### Estructura del Proyecto

```
ui/web/
├── src/
│   ├── app/                    # Rutas y páginas
│   │   ├── router.tsx          # Configuración de rutas
│   │   ├── public/             # Rutas públicas (login, register)
│   │   └── private/            # Rutas protegidas
│   │       └── (MainLayout)/  # Layout principal con sidebar
│   │           ├── components/ # Componentes del layout
│   │           └── dashboard/  # Página del dashboard
│   ├── shared/                 # Componentes y utilidades reutilizables
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   │   └── components/ui/  # Componentes atómicos
│   │   ├── guards/             # Protectores de rutas (AuthGuard)
│   │   ├── providers/          # Context providers
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utilidades (API service, auth helpers)
│   │   ├── config/             # Configuración global
│   │   └── errors/             # Manejo de errores
│   ├── index.css               # Estilos globales
│   └── main.tsx                # Punto de entrada
├── public/                     # Assets estáticos
├── index.html                  # HTML entry
├── package.json                # Dependencias
├── vite.config.ts              # Configuración de Vite
├── tsconfig.json               # Configuración de TypeScript
└── eslint.config.js            # Configuración de ESLint
```

### Requisitos Previos

- **Node.js**: v18+
- **Bun**: v1.0+ (recomendado) o npm/pnpm

### Configuración

1. Instalar dependencias:
   ```bash
   bun install
   ```

2. Crear archivo `.env` basado en `.env.example`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   bun run dev
   ```

4. Construir para producción:
   ```bash
   bun run build
   ```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Inicia el servidor de desarrollo con HMR |
| `bun run build` | Compila TypeScript y genera build de producción |
| `bun run lint` | Ejecuta ESLint |
| `bun run preview` | Pre-visualiza el build de producción |

### Arquitectura de Autenticación

El sistema de autenticación utiliza:

- **AuthGuard** (`src/shared/guards/AuthGuard.tsx`): Protege rutas privadas verificando el estado de sesión
- **ApiService** (`src/shared/utils/api-service.ts`): Cliente HTTP con manejo automático de refresh de tokens
- **useAuth** (`src/shared/hooks/use-auth.ts`): Hook para acceso al estado de autenticación
- **httpOnly cookies**: Los tokens se almacenan en cookies seguras (no localStorage)

### Contribución

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit con mensajes descriptivos
4. Push al branch
5. Crear Pull Request

---

## English

### What is Pardploy UI?

Pardploy UI is the frontend of the Pardploy project, a high-performance deployment manager designed as a lightweight, ultra-fast alternative to tools like Coolify or Dockploy. It provides a modern, reactive web interface to manage Docker containers from any browser.

### Main Features

- **Reactive Dashboard** - Real-time monitoring of container status
- **Secure Authentication** - Login/register system with JWT tokens and automatic refresh
- **Container Management** - View and control Docker containers
- **Adaptive Design** - Responsive interface optimized for desktop and mobile
- **Dark/Light mode** - Full support for light and dark themes

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 (React Compiler) |
| Build Tool | Vite 8 |
| Runtime | Bun |
| Routing | React Router 7 |
| Server State | TanStack Query 5 |
| Tables | TanStack Table 8 |
| Forms | React Hook Form + @hookform/resolvers |
| Styling | Tailwind CSS 4 + Tailwind Merge |
| UI Components | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Notifications | Sonner |
| Theming | next-themes |

### Project Structure

```
ui/web/
├── src/
│   ├── app                    # Routes and pages
│   │   ├── router.tsx         # Route configuration
│   │   ├── public/            # Public routes (login, register)
│   │   └── private/           # Protected routes
│   │       └── (MainLayout)/  # Main layout with sidebar
│   │           ├── components/# Layout components
│   │           └── dashboard/ # Dashboard page
│   ├── shared/                # Reusable components and utilities
│   │   ├── ui/                # shadcn/ui components
│   │   │   └── components/ui/ # Atomic components
│   │   ├── guards/            # Route guards (AuthGuard)
│   │   ├── providers/         # Context providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utilities (API service, auth helpers)
│   │   ├── config/            # Global configuration
│   │   └── errors/            # Error handling
│   ├── index.css              # Global styles
│   └── main.tsx               # Entry point
├── public/                    # Static assets
├── index.html                 # HTML entry
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── eslint.config.js           # ESLint configuration
```

### Prerequisites

- **Node.js**: v18+
- **Bun**: v1.0+ (recommended) or npm/pnpm

### Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Create `.env` file based on `.env.example`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. Start development server:
   ```bash
   bun run dev
   ```

4. Build for production:
   ```bash
   bun run build
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Starts development server with HMR |
| `bun run build` | Compiles TypeScript and generates production build |
| `bun run lint` | Runs ESLint |
| `bun run preview` | Previews the production build |

### Authentication Architecture

The authentication system uses:

- **AuthGuard** (`src/shared/guards/AuthGuard.tsx`): Protects private routes by verifying session state
- **ApiService** (`src/shared/utils/api-service.ts`): HTTP client with automatic token refresh handling
- **useAuth** (`src/shared/hooks/use-auth.ts`): Hook for accessing authentication state
- **httpOnly cookies**: Tokens are stored in secure cookies (not localStorage)

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit with descriptive messages
4. Push to branch
5. Create Pull Request

---

**Pardploy** - High-performance Docker deployment manager