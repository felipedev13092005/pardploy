// ============================================================================
// requirements.rs
// Handler para verificar requisitos e instalar Docker via SSE.
// ============================================================================

use axum::{
    extract::State,
    response::sse::{Event, KeepAlive, Sse},
    Json,
};
use bollard::Docker;
use futures::stream::Stream;
use sysinfo::{Disks, System};
use sqlx::SqlitePool;
use std::net::TcpListener;
use tokio::sync::mpsc;

use crate::models::SystemModel::{InstallStep, SystemRequirement, SystemRequirementsResponse};

// ── Constantes ───────────────────────────────────────────────────────────────

const DOCKER_SOCKET_PATH: &str = "/var/run/docker.sock";
const MIN_MEMORY_GB: u64 = 2;
const MIN_DISK_GB: u64 = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

fn requirement_error(msg: impl Into<String>) -> SystemRequirement {
    SystemRequirement {
        installed: false,
        version: None,
        ready: None,
        running: None,
        socket: None,
        available: None,
        available_amount: None,
        sufficient: None,
        error: Some(msg.into()),
    }
}

// ── Checks de Docker ─────────────────────────────────────────────────────────

async fn check_docker() -> SystemRequirement {
    let docker = match Docker::connect_with_local_defaults() {
        Ok(d) => d,
        Err(e) => {
            return requirement_error(format!(
                "No se pudo conectar al socket de Docker ({}): {}",
                DOCKER_SOCKET_PATH, e
            ));
        }
    };

    match docker.version().await {
        Ok(info) => {
            let version_str = info.version.unwrap_or_else(|| "desconocida".to_string());
            SystemRequirement {
                installed: true,
                version: Some(format!("Docker version {}", version_str)),
                ready: Some(true),
                running: None,
                socket: Some(DOCKER_SOCKET_PATH.to_string()),
                available: None,
                available_amount: None,
                sufficient: None,
                error: None,
            }
        }
        Err(e) => SystemRequirement {
            installed: true,
            version: None,
            ready: Some(false),
            running: None,
            socket: Some(DOCKER_SOCKET_PATH.to_string()),
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some(format!("Docker instalado pero no responde: {}", e)),
        },
    }
}

async fn check_docker_daemon() -> SystemRequirement {
    let docker = match Docker::connect_with_local_defaults() {
        Ok(d) => d,
        Err(e) => {
            return requirement_error(format!("No se pudo acceder al socket: {}", e));
        }
    };

    match docker.info().await {
        Ok(_) => SystemRequirement {
            installed: true,
            version: None,
            ready: None,
            running: Some(true),
            socket: Some(DOCKER_SOCKET_PATH.to_string()),
            available: None,
            available_amount: None,
            sufficient: None,
            error: None,
        },
        Err(e) => SystemRequirement {
            installed: true,
            version: None,
            ready: None,
            running: Some(false),
            socket: Some(DOCKER_SOCKET_PATH.to_string()),
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some(format!("Docker daemon no está corriendo: {}", e)),
        },
    }
}

async fn check_compose() -> SystemRequirement {
    // Intento 1: plugin moderno `docker compose version`
    let modern = tokio::process::Command::new("docker")
        .args(["compose", "version"])
        .output()
        .await;

    if let Ok(out) = modern {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            return SystemRequirement {
                installed: true,
                version: Some(version),
                ready: Some(true),
                running: None,
                socket: None,
                available: None,
                available_amount: None,
                sufficient: None,
                error: None,
            };
        }
    }

    // Intento 2: binario legacy `docker-compose --version`
    let legacy = tokio::process::Command::new("docker-compose")
        .arg("--version")
        .output()
        .await;

    if let Ok(out) = legacy {
        if out.status.success() {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            return SystemRequirement {
                installed: true,
                version: Some(version),
                ready: Some(true),
                running: None,
                socket: None,
                available: None,
                available_amount: None,
                sufficient: None,
                error: Some(
                    "Usando docker-compose legacy (considera actualizar al plugin)".to_string(),
                ),
            };
        }
    }

    requirement_error(
        "Docker Compose no está instalado (ni plugin moderno ni binario legacy)",
    )
}

// ── Check de puertos ─────────────────────────────────────────────────────────

fn check_port(port: u16) -> SystemRequirement {
    let available = TcpListener::bind(("0.0.0.0", port)).is_ok();

    SystemRequirement {
        installed: true,
        version: None,
        ready: None,
        running: None,
        socket: None,
        available: Some(available),
        available_amount: None,
        sufficient: None,
        error: if available {
            None
        } else {
            Some(format!("Puerto {} ya está en uso", port))
        },
    }
}

// ── Checks de recursos ───────────────────────────────────────────────────────

fn check_memory() -> SystemRequirement {
    let mut sys = System::new();
    sys.refresh_memory();

    let total_bytes = sys.total_memory();

    if total_bytes == 0 {
        return requirement_error("No se pudo leer la memoria del sistema");
    }

    let mem_gb = total_bytes / 1_073_741_824;
    let sufficient = mem_gb >= MIN_MEMORY_GB;

    SystemRequirement {
        installed: true,
        version: None,
        ready: None,
        running: None,
        socket: None,
        available: None,
        available_amount: Some(format!("{}GB", mem_gb)),
        sufficient: Some(sufficient),
        error: if sufficient {
            None
        } else {
            Some(format!(
                "Memoria insuficiente: {}GB disponibles, mínimo {}GB requeridos",
                mem_gb, MIN_MEMORY_GB
            ))
        },
    }
}

fn check_disk() -> SystemRequirement {
    let disks = Disks::new_with_refreshed_list();
    let docker_path = std::path::Path::new("/var/lib/docker");

    let best_disk = disks
        .iter()
        .filter(|d| docker_path.starts_with(d.mount_point()))
        .max_by_key(|d| d.mount_point().as_os_str().len());

    let disk = best_disk.or_else(|| {
        disks
            .iter()
            .find(|d| d.mount_point() == std::path::Path::new("/"))
    });

    match disk {
        Some(d) => {
            let free_gb = d.available_space() / 1_073_741_824;
            let sufficient = free_gb >= MIN_DISK_GB;

            SystemRequirement {
                installed: true,
                version: None,
                ready: None,
                running: None,
                socket: None,
                available: None,
                available_amount: Some(format!("{}GB libres", free_gb)),
                sufficient: Some(sufficient),
                error: if sufficient {
                    None
                } else {
                    Some(format!(
                        "Espacio insuficiente: {}GB libres, mínimo {}GB requeridos en {}",
                        free_gb,
                        MIN_DISK_GB,
                        d.mount_point().display()
                    ))
                },
            }
        }
        None => requirement_error("No se encontró ningún disco montado en el sistema"),
    }
}

// ── Handler GET /requirements ─────────────────────────────────────────────────

pub async fn get_requirements(
    State(_pool): State<SqlitePool>,
) -> Json<SystemRequirementsResponse> {
    let (docker, compose, daemon) = tokio::join!(
        check_docker(),
        check_compose(),
        check_docker_daemon(),
    );

    let response = SystemRequirementsResponse {
        docker,
        compose,
        daemon,
        port_3000: check_port(3000),
        port_5173: check_port(5173),
        memory: check_memory(),
        disk: check_disk(),
    };

    Json(response)
}

// ── Instalación via SSE ───────────────────────────────────────────────────────

/// Ejecuta un comando con `std::process::Command` (bloqueante, correcto dentro
/// de `spawn_blocking`) y envía el resultado por el canal SSE.
///
/// IMPORTANTE: usamos `std::process::Command` y NO `tokio::process::Command`
/// porque ya estamos dentro de `spawn_blocking`. Mezclar `tokio::process` con
/// `Handle::block_on` desde un hilo externo puede causar deadlocks silenciosos.
fn run_step(
    name: &str,
    cmd: &str,
    args: &[&str],
    tx: &mpsc::Sender<InstallStep>,
) -> bool {
    // Notificamos que el paso está en marcha.
    let _ = tx.blocking_send(InstallStep::running(
        name,
        format!("Ejecutando: {} {}", cmd, args.join(" ")),
    ));

    let result = std::process::Command::new(cmd)
        .args(args)
        .output();

    match result {
        Ok(out) => {
            // Combinamos stdout + stderr para tener contexto completo.
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
            let detail = if !stdout.is_empty() { stdout } else { stderr };

            if out.status.success() {
                let _ = tx.blocking_send(InstallStep::success(
                    name,
                    if detail.is_empty() {
                        "Completado".to_string()
                    } else {
                        // Truncamos a 200 chars para no saturar el terminal.
                        detail.chars().take(200).collect()
                    },
                ));
                true
            } else {
                let _ = tx.blocking_send(InstallStep::error(
                    name,
                    if detail.is_empty() {
                        format!("Falló con código: {:?}", out.status.code())
                    } else {
                        detail.chars().take(200).collect()
                    },
                ));
                false
            }
        }
        Err(e) => {
            let _ = tx.blocking_send(InstallStep::error(
                name,
                format!("No se pudo ejecutar '{}': {}", cmd, e),
            ));
            false
        }
    }
}

/// Ejecuta todos los pasos de instalación de forma secuencial dentro de
/// `spawn_blocking`, enviando cada paso por `tx` para que el SSE lo retransmita.
fn install_docker_steps(tx: mpsc::Sender<InstallStep>) {
    // ── 1. Detectar SO ────────────────────────────────────────────────────────
    let _ = tx.blocking_send(InstallStep::running(
        "detection",
        "Detectando sistema operativo...",
    ));

    let os_info = std::fs::read_to_string("/etc/os-release")
        .unwrap_or_default()
        .to_lowercase();
    let is_debian = os_info.contains("ubuntu") || os_info.contains("debian");

    let _ = tx.blocking_send(InstallStep::success(
        "detection",
        format!(
            "Sistema: {}",
            if is_debian { "Ubuntu/Debian" } else { "Otro (se usará el script oficial)" }
        ),
    ));

    // ── 2. Verificar si Docker ya está instalado ──────────────────────────────
    let docker_already = std::process::Command::new("docker")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if docker_already {
        let _ = tx.blocking_send(InstallStep::success(
            "check-docker",
            "Docker ya está instalado",
        ));
    } else {
        // ── 3a. Instalar Docker con el script oficial ─────────────────────────
        // Este script funciona en Ubuntu, Debian, Fedora, CentOS, Raspberry Pi OS, etc.
        let _ = tx.blocking_send(InstallStep::running(
            "install-docker",
            "Descargando e instalando Docker (puede tardar varios minutos)...",
        ));

        let script_ok = std::process::Command::new("sh")
            .args(["-c", "curl -fsSL https://get.docker.com | sh"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        if script_ok {
            let _ = tx.blocking_send(InstallStep::success(
                "install-docker",
                "Docker instalado correctamente via script oficial",
            ));
        } else {
            // ── 3b. Fallback: apt-get ─────────────────────────────────────────
            run_step("apt-update", "apt-get", &["update", "-y"], &tx);
            run_step("apt-install-docker", "apt-get", &["install", "-y", "docker.io"], &tx);
        }
    }

    // ── 4. Habilitar e iniciar el daemon ──────────────────────────────────────
    // `--now` equivale a enable + start en un solo comando.
    run_step("enable-docker", "systemctl", &["enable", "--now", "docker"], &tx);

    // Esperamos 2 segundos para que el daemon arranque completamente.
    std::thread::sleep(std::time::Duration::from_secs(2));

    // ── 5. Verificar que Docker responde ──────────────────────────────────────
    let docker_ok = run_step("verify-docker", "docker", &["version"], &tx);

    if !docker_ok {
        let _ = tx.blocking_send(InstallStep::error(
            "verify-docker",
            "Docker no responde. Puede que necesites reiniciar el sistema.",
        ));
    }

    // ── 6. Instalar Docker Compose ────────────────────────────────────────────

    // Verificar si el plugin moderno ya está disponible (exit code = criterio, no stdout).
    let compose_already = std::process::Command::new("docker")
        .args(["compose", "version"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if compose_already {
        let _ = tx.blocking_send(InstallStep::success(
            "check-compose",
            "Docker Compose plugin ya está disponible",
        ));
    } else {
        // ── 6a. Intentar con apt (Debian/Ubuntu) ──────────────────────────────
        // Verificamos el exit code del proceso, no el contenido de stdout/stderr.
        let apt_ok = if is_debian {
            run_step(
                "install-compose-apt",
                "apt-get",
                &["install", "-y", "docker-compose-plugin"],
                &tx,
            )
        } else {
            false
        };

        if !apt_ok {
            // ── 6b. Fallback: descarga binaria oficial ────────────────────────
            let _ = tx.blocking_send(InstallStep::running(
                "install-compose-binary",
                "Instalando Docker Compose via binario oficial (GitHub releases)...",
            ));

            // Detectamos arquitectura para elegir el binario correcto.
            let arch = std::process::Command::new("uname")
                .arg("-m")
                .output()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_else(|_| "x86_64".to_string());

            // Mapeamos nombres de uname a los del release de GitHub.
            let arch_name = match arch.as_str() {
                "x86_64"         => "x86_64",
                "aarch64"|"arm64" => "aarch64",
                "armv7l"         => "armv7",
                other            => other,
            };

            // Creamos el directorio del plugin si no existe.
            let _ = std::fs::create_dir_all("/usr/local/lib/docker/cli-plugins");

            let url = format!(
                "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-{}",
                arch_name
            );
            let dest = "/usr/local/lib/docker/cli-plugins/docker-compose";

            // Descargamos con curl y seguimos redirects (-L).
            let curl_ok = run_step(
                "download-compose",
                "curl",
                &["-fsSL", &url, "-o", dest],
                &tx,
            );

            if curl_ok {
                // Damos permisos de ejecución.
                run_step("chmod-compose", "chmod", &["+x", dest], &tx);

                // Verificamos que el plugin funciona correctamente.
                let verify_ok = run_step(
                    "verify-compose",
                    "docker",
                    &["compose", "version"],
                    &tx,
                );

                if !verify_ok {
                    let _ = tx.blocking_send(InstallStep::error(
                        "verify-compose",
                        "Docker Compose no responde tras la instalación",
                    ));
                }
            } else {
                let _ = tx.blocking_send(InstallStep::error(
                    "install-compose-binary",
                    "No se pudo descargar Docker Compose. Verifica la conexión a internet.",
                ));
            }
        }
    }

    // ── 7. Mensaje final ──────────────────────────────────────────────────────
    let _ = tx.blocking_send(InstallStep::success(
        "complete",
        "Proceso finalizado. Pulsa 'Verificar' para comprobar el estado.",
    ));

    // `tx` se dropea aquí automáticamente, cerrando el canal y el stream SSE.
}

/// Handler POST /system/install
///
/// Devuelve un stream SSE (text/event-stream) donde cada evento es un
/// `InstallStep` serializado como JSON en el campo `data:`.
///
/// El cliente debe leer el stream línea a línea y parsear cada `data: {...}`.
pub async fn install_docker(
    State(_pool): State<SqlitePool>,
) -> Sse<impl Stream<Item = Result<Event, std::convert::Infallible>>> {
    // Canal con buffer para 200 pasos; la instalación raramente supera 30.
    let (tx, mut rx) = mpsc::channel::<InstallStep>(200);

    // Lanzamos la instalación en el thread pool de Tokio para tareas bloqueantes,
    // evitando bloquear el executor async principal.
    tokio::task::spawn_blocking(move || {
        install_docker_steps(tx);
    });

    // Convertimos el receptor del canal en un Stream SSE.
    let stream = async_stream::stream! {
        while let Some(step) = rx.recv().await {
            // Serializamos el InstallStep a JSON.
            // Si falla la serialización enviamos un mensaje de error legible.
            let json = serde_json::to_string(&step)
                .unwrap_or_else(|e| format!(r#"{{"error":"{}"}}"#, e));

            yield Ok(Event::default().data(json));
        }

        // Evento especial "done" que indica que el stream terminó.
        // El frontend puede usarlo para marcar la instalación como completada.
        yield Ok(Event::default().event("done").data("{}"));
    };

    // keep_alive envía comentarios `: ping` cada 15s para evitar timeouts de proxy.
    Sse::new(stream).keep_alive(KeepAlive::default())
}
