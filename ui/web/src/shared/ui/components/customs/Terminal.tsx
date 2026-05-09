/**
 * Terminal — Componente reutilizable de Pardploy
 *
 * Exporta:
 *   <Terminal>              Contenedor visual (la "ventana" de terminal)
 *   <Terminal.Step>         Fila de paso con estado running/success/error
 *   <Terminal.Line>         Línea de log genérica con variantes de color
 *   <Terminal.Command>      Línea de comando estilo $ prompt
 *   <Terminal.Divider>      Separador visual horizontal
 *   useTerminalSteps()      Hook para gestionar pasos de instalación SSE
 *
 * Casos de uso cubiertos:
 *   1. Instalación paso a paso (SSE / streaming)
 *   2. Visor de logs en tiempo real
 *   3. Output de comandos docker / cargo / bun
 *   4. Cualquier contenido libre via children
 */

"use client"

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

export type StepStatus = "running" | "success" | "error"
export type LineVariant = "default" | "info" | "success" | "error" | "warning" | "muted" | "command"

export interface TerminalStepData {
  /** Identificador / nombre del paso */
  name: string
  /** Mensaje descriptivo */
  message: string
  /** Estado actual */
  status: StepStatus
}

export interface TerminalLineData {
  id?: string | number
  text: string
  variant?: LineVariant
  /** Prefijo opcional, p.ej. "$" o "→" */
  prefix?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto interno (para pasar scrollRef a los sub-componentes si se necesita)
// ─────────────────────────────────────────────────────────────────────────────

interface TerminalCtx {
  variant: LineVariant
}

const Ctx = createContext<TerminalCtx>({ variant: "default" })

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useTerminalSteps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gestiona la lista de pasos de instalación. Actualiza en lugar de duplicar
 * si el último paso tiene el mismo nombre y estaba en "running".
 *
 * @example
 * const { steps, push, reset } = useTerminalSteps()
 * await SystemService.installDocker((step) => push(step))
 */
export function useTerminalSteps() {
  const [steps, setSteps] = useState<TerminalStepData[]>([])

  const push = useCallback((step: TerminalStepData) => {
    setSteps((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.name === step.name && last.status === "running") {
        return [...prev.slice(0, -1), step]
      }
      return [...prev, step]
    })
  }, [])

  const reset = useCallback(() => setSteps([]), [])

  return { steps, push, reset }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Terminal.Step
// ─────────────────────────────────────────────────────────────────────────────

function TerminalStep({ name, message, status }: TerminalStepData) {
  const icon: Record<StepStatus, ReactNode> = {
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
  }

  const nameColor: Record<StepStatus, string> = {
    running: "text-blue-400",
    success: "text-green-400",
    error: "text-red-400",
  }

  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon[status]}</div>
      <div className="flex-1 min-w-0">
        <span className={cn("font-semibold", nameColor[status])}>{name}</span>
        <span className="text-zinc-500">: </span>
        <span className="text-zinc-300 break-words">{message}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Terminal.Line
// ─────────────────────────────────────────────────────────────────────────────

const lineVariantClass: Record<LineVariant, string> = {
  default: "text-zinc-300",
  info: "text-blue-400",
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-amber-400",
  muted: "text-zinc-500",
  command: "text-zinc-100",
}

function TerminalLine({ text, variant = "default", prefix }: TerminalLineData) {
  return (
    <div className="flex items-start gap-1.5 leading-relaxed">
      {prefix && (
        <span className="text-zinc-500 shrink-0 select-none">{prefix}</span>
      )}
      <span className={cn("break-words", lineVariantClass[variant])}>{text}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Terminal.Command
// ─────────────────────────────────────────────────────────────────────────────

function TerminalCommand({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-green-500 shrink-0 select-none font-bold">$</span>
      <span className="text-zinc-100">{children}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Terminal.Divider
// ─────────────────────────────────────────────────────────────────────────────

function TerminalDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-zinc-800" />
      {label && <span className="text-zinc-600 text-xs shrink-0">{label}</span>}
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Props del componente principal
// ─────────────────────────────────────────────────────────────────────────────

export interface TerminalProps {
  /** Texto que aparece en la barra de título */
  title?: string
  /** Contenido libre (Terminal.Step, Terminal.Line, Terminal.Command, etc.) */
  children?: ReactNode
  /** Atajos de datos: array de pasos con estado */
  steps?: TerminalStepData[]
  /** Atajos de datos: array de líneas de log */
  lines?: TerminalLineData[]
  /** Muestra el badge "Ejecutando..." y deshabilita el botón de copiar */
  isRunning?: boolean
  /** Callback al cerrar. Si no se pasa, no se muestra el botón de cerrar */
  onClose?: () => void
  /** Altura máxima del área de scroll (clase Tailwind). Default: "max-h-56" */
  maxHeight?: string
  /** Clases extra para el contenedor raíz */
  className?: string
  /** Si true, oculta el componente completamente */
  hidden?: boolean
  /** Muestra botón de copiar todo el texto del output */
  copyable?: boolean
  /** Permite expandir el terminal a pantalla completa */
  expandable?: boolean
  /** Mensaje cuando no hay contenido todavía */
  emptyMessage?: string
  /** Auto-scroll al último elemento cuando cambia el contenido */
  autoScroll?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal: Terminal
// ─────────────────────────────────────────────────────────────────────────────

function Terminal({
  title = "Terminal",
  children,
  steps,
  lines,
  isRunning = false,
  onClose,
  maxHeight = "max-h-56",
  className,
  hidden = false,
  copyable = false,
  expandable = false,
  emptyMessage = "Esperando output...",
  autoScroll = true,
}: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Auto-scroll cuando cambia el contenido
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [children, steps, lines, autoScroll])

  // Copiar todo el texto del terminal
  const handleCopy = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const text = el.innerText ?? el.textContent ?? ""
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  if (hidden) return null

  const hasContent =
    !!children ||
    (steps && steps.length > 0) ||
    (lines && lines.length > 0)

  return (
    <Ctx.Provider value={{ variant: "default" }}>
      <div
        className={cn(
          "bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-sm overflow-hidden",
          expanded && "fixed inset-4 z-50 flex flex-col",
          className
        )}
      >
        {/* ── Barra de título ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          {/* Semáforo */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>

          {/* Título */}
          <span className="text-zinc-500 text-xs ml-1 select-none truncate">
            {title}
          </span>

          {/* Acciones */}
          <div className="ml-auto flex items-center gap-1.5">
            {isRunning && (
              <span className="text-xs text-blue-400 animate-pulse select-none">
                Ejecutando...
              </span>
            )}

            {copyable && !isRunning && hasContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                title="Copiar output"
              >
                {copied
                  ? <Check className="h-3 w-3 text-green-400" />
                  : <Copy className="h-3 w-3" />
                }
              </Button>
            )}

            {expandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
                className="h-6 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                title={expanded ? "Minimizar" : "Expandir"}
              >
                {expanded
                  ? <Minimize2 className="h-3 w-3" />
                  : <Maximize2 className="h-3 w-3" />
                }
              </Button>
            )}

            {onClose && !isRunning && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                title="Cerrar terminal"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Área de contenido scrollable ─────────────────────────────────── */}
        <div
          ref={scrollRef}
          className={cn(
            "overflow-y-auto p-4 space-y-2",
            "scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent",
            expanded ? "flex-1" : maxHeight
          )}
        >
          {/* Estado vacío */}
          {!hasContent && (
            <div className="flex items-center gap-2 text-zinc-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{emptyMessage}</span>
            </div>
          )}

          {/* Atajos: steps[] */}
          {steps?.map((step, i) => (
            <TerminalStep key={`${step.name}-${i}`} {...step} />
          ))}

          {/* Atajos: lines[] */}
          {lines?.map((line, i) => (
            <TerminalLine key={line.id ?? i} {...line} />
          ))}

          {/* Children libres */}
          {children}
        </div>
      </div>
    </Ctx.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Adjuntar sub-componentes al namespace
// ─────────────────────────────────────────────────────────────────────────────

Terminal.Step = TerminalStep
Terminal.Line = TerminalLine
Terminal.Command = TerminalCommand
Terminal.Divider = TerminalDivider

export default Terminal
