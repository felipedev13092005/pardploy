"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { SystemService } from "@/shared/utils/system"
import type { SystemRequirementsResponse, InstallStep } from "@/shared/types/system"
import { Button } from "@/shared/ui/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/components/ui/card"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
  HardDrive,
  Cpu,
  Network,
  Database,
  Loader2,
  Settings,
  X,
} from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type StatusType = "success" | "error" | "warning"

interface RequirementItemProps {
  icon: React.ReactNode
  title: string
  description: string
  status: StatusType
  details?: string
}

// ── Componente de ítem de requisito ───────────────────────────────────────────

const RequirementItem = ({
  icon,
  title,
  description,
  status,
  details,
}: RequirementItemProps) => {
  const statusIcon: Record<StatusType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-600   dark:text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mt-0.5 text-zinc-500 dark:text-zinc-400">{icon}</div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
          {statusIcon[status]}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        {details && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded mt-2 break-all">
            {details}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Componente de paso de instalación en el terminal ──────────────────────────

const InstallStepRow = ({ step }: { step: InstallStep }) => {
  const icon: Record<InstallStep["status"], React.ReactNode> = {
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-400  shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-400   shrink-0" />,
  }

  const color: Record<InstallStep["status"], string> = {
    running: "text-blue-400",
    success: "text-green-400",
    error: "text-red-400",
  }

  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon[step.status]}</div>
      <div className="flex-1 min-w-0">
        <span className={`${color[step.status]} font-semibold`}>{step.name}</span>
        <span className="text-zinc-400">: </span>
        <span className="text-zinc-300 break-words">{step.message}</span>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const PageRequirements = () => {
  const navigate = useNavigate()

  // Evitar que la redirección automática se dispare más de una vez.
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false)

  // Estado del terminal de instalación.
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([])
  const [isInstalling, setIsInstalling] = useState(false)
  const [installComplete, setInstallComplete] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [installError, setInstallError] = useState<string | null>(null)

  // Ref para el scroll automático del terminal.
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Query de requisitos ────────────────────────────────────────────────────

  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    SystemRequirementsResponse,
    Error
  >({
    queryKey: ["system-requirements"],
    queryFn: () => SystemService.getRequirements(),
    retry: false,
    // No refetch automático: el usuario lo controla con el botón "Verificar".
    refetchOnWindowFocus: false,
  })

  // ── Redirección automática si todo está OK ─────────────────────────────────

  useEffect(() => {
    if (!data || hasCheckedOnce) return

    setHasCheckedOnce(true)

    const allReady =
      data.docker.installed &&
      data.docker.ready &&
      data.compose.installed &&
      data.daemon.running &&
      data.port_3000.available

    if (allReady) {
      navigate("/login")
    }
  }, [data, hasCheckedOnce, navigate])

  // ── Auto-scroll del terminal ───────────────────────────────────────────────

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [installSteps])

  // ── Handler de instalación ────────────────────────────────────────────────

  const handleInstall = async () => {
    setIsInstalling(true)
    setInstallComplete(false)
    setShowTerminal(true)
    setInstallError(null)
    setInstallSteps([])

    try {
      // SystemService.installDocker lee el stream SSE del backend y llama
      // al callback por cada InstallStep recibido en tiempo real.
      await SystemService.installDocker((step) => {
        setInstallSteps((prev) => {
          // Si el último paso tiene el mismo nombre y estaba en "running",
          // lo reemplazamos por el paso actualizado (success/error) en vez
          // de agregar una línea duplicada.
          const last = prev[prev.length - 1]
          if (last && last.name === step.name && last.status === "running") {
            return [...prev.slice(0, -1), step]
          }
          return [...prev, step]
        })
      })
    } catch (error) {
      setInstallError(
        error instanceof Error ? error.message : "Error desconocido durante la instalación"
      )
    } finally {
      setIsInstalling(false)
      setInstallComplete(true)
    }
  }

  // ── Helper de status para cada requisito ──────────────────────────────────

  const getStatus = (req: {
    running?: boolean | null
    ready?: boolean | null
    available?: boolean | null
    sufficient?: boolean | null
    installed?: boolean
  }): StatusType => {
    if (req.running === true) return "success"
    if (req.running === false) return "error"
    if (req.ready === true) return "success"
    if (req.ready === false) return "error"
    if (req.available === true) return "success"
    if (req.available === false) return "error"
    if (req.sufficient === true) return "success"
    if (req.sufficient === false) return "warning"
    if (req.installed === true) return "success"
    if (req.installed === false) return "error"
    return "warning"
  }

  // ── Lista de requisitos mapeada desde la respuesta del backend ────────────

  const requirements: RequirementItemProps[] = data
    ? [
      {
        icon: <Terminal className="h-5 w-5" />,
        title: "Docker",
        description: "Motor de contenedores",
        status: getStatus(data.docker),
        details: data.docker.version
          ? `Versión: ${data.docker.version}`
          : data.docker.error ?? undefined,
      },
      {
        icon: <Database className="h-5 w-5" />,
        title: "Docker Compose",
        description: "Orquestación de servicios",
        status: getStatus(data.compose),
        details: data.compose.version
          ? `Versión: ${data.compose.version}`
          : data.compose.error ?? undefined,
      },
      {
        icon: <HardDrive className="h-5 w-5" />,
        title: "Docker Daemon",
        description: "Demonio de Docker corriendo",
        status: getStatus(data.daemon),
        details: data.daemon.running
          ? `Socket: ${data.daemon.socket ?? "/var/run/docker.sock"}`
          : data.daemon.error ?? undefined,
      },
      {
        icon: <Network className="h-5 w-5" />,
        title: "Puerto 3000",
        description: "Puerto para el backend",
        status: getStatus(data.port_3000),
        details: data.port_3000.available
          ? "Disponible"
          : data.port_3000.error ?? undefined,
      },
      {
        icon: <Network className="h-5 w-5" />,
        title: "Puerto 5173",
        description: "Puerto del frontend de Pardploy",
        // Puerto 5173 en uso es NORMAL cuando el frontend está corriendo.
        status: data.port_5173.available ? "success" : "warning",
        details: data.port_5173.available
          ? "Disponible"
          : "En uso por el frontend (esto es normal)",
      },
      {
        icon: <Cpu className="h-5 w-5" />,
        title: "Memoria RAM",
        description: "Memoria total del sistema",
        status: getStatus(data.memory),
        details: data.memory.available_amount
          ? `Total: ${data.memory.available_amount}`
          : data.memory.error ?? undefined,
      },
      {
        icon: <HardDrive className="h-5 w-5" />,
        title: "Espacio en Disco",
        description: "Espacio libre en /var/lib/docker",
        status: getStatus(data.disk),
        details: data.disk.available_amount
          ? `Libre: ${data.disk.available_amount}`
          : data.disk.error ?? undefined,
      },
    ]
    : []

  const failedCount = requirements.filter((r) => r.status === "error").length
  const warningCount = requirements.filter((r) => r.status === "warning").length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-2xl shadow-lg">

        {/* ── Cabecera ─────────────────────────────────────────────────────── */}
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Requisitos del Sistema
          </CardTitle>
          <CardDescription>
            Verificando los componentes necesarios para ejecutar Pardploy
          </CardDescription>
        </CardHeader>

        {/* ── Lista de requisitos ───────────────────────────────────────────── */}
        <CardContent className="space-y-4">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
              <span className="ml-3 text-zinc-500">Verificando requisitos...</span>
            </div>

          ) : isError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">
                No se pudo conectar con el servidor backend
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Asegúrate de que el backend esté corriendo en el puerto 8080
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>

          ) : (
            <>
              {/* Resumen de estado */}
              <div className="flex items-center gap-2">
                {failedCount > 0 ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {failedCount} requisito{failedCount !== 1 ? "s" : ""} fallido{failedCount !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : warningCount > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {warningCount} advertencia{warningCount !== 1 ? "s" : ""} (no bloquean el inicio)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Todos los requisitos están completos
                    </span>
                  </>
                )}
              </div>

              {/* Ítems */}
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <RequirementItem key={index} {...req} />
                ))}
              </div>
            </>
          )}
        </CardContent>

        {/* ── Footer: terminal + botones ────────────────────────────────────── */}
        <div className="p-6 pt-0 space-y-4">

          {/* Terminal de instalación */}
          {(showTerminal || installSteps.length > 0) && (
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm border border-zinc-800">

              {/* Barra del terminal */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-zinc-500 text-xs ml-2 select-none">
                  Terminal de instalación
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {isInstalling && (
                    <span className="text-xs text-blue-400 animate-pulse">
                      Ejecutando...
                    </span>
                  )}
                  {installComplete && !isInstalling && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTerminal(false)}
                      className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-6 px-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cerrar
                    </Button>
                  )}
                </div>
              </div>

              {/* Pasos */}
              <div
                ref={scrollRef}
                className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              >
                {installSteps.length === 0 && isInstalling && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Iniciando instalación...</span>
                  </div>
                )}
                {installSteps.map((step, index) => (
                  <InstallStepRow key={index} step={step} />
                ))}
              </div>
            </div>
          )}

          {/* Banner de error de instalación */}
          {installError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Error en la instalación
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {installError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isFetching || isInstalling}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Verificando..." : "Verificar"}
            </Button>

            {/* Solo mostrar el botón de instalación si hay fallos y no se está instalando */}
            {failedCount > 0 && !isInstalling && (
              <Button
                className="flex-1"
                onClick={handleInstall}
                disabled={isLoading || isFetching}
              >
                <Settings className="mr-2 h-4 w-4" />
                Instalar / Configurar
              </Button>
            )}
          </div>

          {/* Ayuda manual cuando hay fallos y no se está instalando */}
          {failedCount > 0 && !isInstalling && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                ¿Prefieres instalarlo manualmente?
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1.5 list-disc list-inside">
                <li>
                  Docker:{" "}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-xs">
                    curl -fsSL https://get.docker.com | sh
                  </code>
                </li>
                <li>
                  Docker Compose:{" "}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-xs">
                    apt-get install docker-compose-plugin
                  </code>
                </li>
                <li>
                  Iniciar daemon:{" "}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-xs">
                    systemctl enable --now docker
                  </code>
                </li>
              </ul>
            </div>
          )}

        </div>
      </Card>
    </div>
  )
}

export default PageRequirements
