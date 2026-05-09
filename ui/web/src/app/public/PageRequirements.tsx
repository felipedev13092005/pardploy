"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { SystemService } from "@/shared/utils/system"
import type { SystemRequirementsResponse } from "@/shared/types/system"
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
} from "lucide-react"

interface RequirementItemProps {
  icon: React.ReactNode
  title: string
  description: string
  status: "success" | "error" | "warning"
  details?: string
}

const RequirementItem = ({
  icon,
  title,
  description,
  status,
  details,
}: RequirementItemProps) => {
  const statusStyles = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
  }

  const statusIcon = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
          {statusIcon[status]}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        {details && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800 p-2 rounded mt-2">
            {details}
          </p>
        )}
      </div>
    </div>
  )
}

const PageRequirements = () => {
  const navigate = useNavigate()
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false)

  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    SystemRequirementsResponse,
    Error
  >({
    queryKey: ["system-requirements"],
    queryFn: () => SystemService.getRequirements(),
    retry: false,
  })

  useEffect(() => {
    if (data && !hasCheckedOnce) {
      setHasCheckedOnce(true)
      const allReady =
        data.docker.installed &&
        data.docker.ready &&
        data.compose.installed &&
        data.daemon.running &&
        data.port_3000.available &&
        data.port_5173.available

      if (allReady) {
        navigate("/login")
      }
    }
  }, [data, hasCheckedOnce, navigate])

  const getStatus = (req: {
    installed?: boolean
    ready?: boolean
    running?: boolean
    available?: boolean
    sufficient?: boolean
  }): "success" | "error" | "warning" => {
    if (req.running !== undefined) return req.running ? "success" : "error"
    if (req.ready !== undefined) return req.ready ? "success" : "error"
    if (req.available !== undefined) return req.available ? "success" : "error"
    if (req.sufficient !== undefined) return req.sufficient ? "success" : "warning"
    if (req.installed !== undefined) return req.installed ? "success" : "error"
    return "warning"
  }

  const requirements = data
    ? [
        {
          icon: <Terminal className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Docker",
          description: "Motor de contenedores",
          status: getStatus(data.docker),
          details: data.docker.version
            ? `Versión: ${data.docker.version}`
            : data.docker.error || undefined,
        },
        {
          icon: <Database className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Docker Compose",
          description: "Orquestación de servicios",
          status: getStatus(data.compose),
          details: data.compose.version
            ? `Versión: ${data.compose.version}`
            : data.compose.error || undefined,
        },
        {
          icon: <HardDrive className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Docker Daemon",
          description: "Demonio de Docker corriendo",
          status: getStatus(data.daemon),
          details: data.daemon.socket
            ? `Socket: ${data.daemon.socket}`
            : data.daemon.error || undefined,
        },
        {
          icon: <Network className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Puerto 3000",
          description: "Puerto para el backend",
          status: getStatus(data.port_3000),
          details: data.port_3000.error || undefined,
        },
        {
          icon: <Network className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Puerto 5173",
          description: "Puerto para el frontend",
          status: getStatus(data.port_5173),
          details: data.port_5173.error || undefined,
        },
        {
          icon: <Cpu className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Memoria RAM",
          description: "Memoria disponible",
          status: getStatus(data.memory),
          details: data.memory.available_amount
            ? `Disponible: ${data.memory.available_amount}`
            : data.memory.error || undefined,
        },
        {
          icon: <HardDrive className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />,
          title: "Espacio en Disco",
          description: "Espacio disponible en /var/lib/docker",
          status: getStatus(data.disk),
          details: data.disk.available_amount
            ? `Disponible: ${data.disk.available_amount}`
            : data.disk.error || undefined,
        },
      ]
    : []

  const failedCount = data
    ? requirements.filter((r) => r.status === "error").length
    : 0

  const warningCount = data
    ? requirements.filter((r) => r.status === "warning").length
    : 0

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Requisitos del Sistema
          </CardTitle>
          <CardDescription>
            Verificando los componentes necesarios para ejecutar Pardploy
          </CardDescription>
        </CardHeader>

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
                Error al conectar con el servidor
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
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
                      {warningCount} requisito{warningCount !== 1 ? "s" : ""} con advertencia{warningCount !== 1 ? "s" : ""}
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

              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <RequirementItem
                    key={index}
                    icon={req.icon}
                    title={req.title}
                    description={req.description}
                    status={req.status}
                    details={req.details}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>

        <div className="p-6 pt-0">
          <Button
            className="w-full"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Verificando..." : "Verificar de nuevo"}
          </Button>

          {failedCount > 0 && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ¿Necesitas ayuda para instalar los requisitos?
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 list-disc list-inside space-y-1">
                <li>Docker: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">apt install docker.io</code> o <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">curl -fsSL https://get.docker.com | sh</code></li>
                <li>Docker Compose: Ya incluido en Docker reciente</li>
                <li>Iniciar daemon: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">sudo systemctl start docker</code></li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default PageRequirements