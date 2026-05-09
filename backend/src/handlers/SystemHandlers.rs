// ============================================================================
// requirements.rs
// Handler para verificar los requisitos del sistema antes de ejecutar Pardploy.
//
// Dependencias necesarias en Cargo.toml:
//
//   [dependencies]
//   axum       = "0.7"
//   tokio      = { version = "1", features = ["full"] }
//   sqlx       = { version = "0.7", features = ["sqlite", "runtime-tokio"] }
//   bollard    = "0.17"   # Cliente nativo del socket de Docker (sin shell)
//   sysinfo    = "0.30"   # Memoria y disco sin comandos externos
//   futures    = "0.3"    # Para join! y ejecutar checks en paralelo
// ============================================================================

use axum::{extract::State, Json};
use bollard::Docker;
// use futures::future::join_all;
use sysinfo::{Disks, System};
use sqlx::SqlitePool;
use std::net::TcpListener;

use crate::models::SystemModel::{SystemRequirement, SystemRequirementsResponse};

// ── Constantes ───────────────────────────────────────────────────────────────

/// Ruta estándar del socket Unix de Docker en Linux.
const DOCKER_SOCKET_PATH: &str = "/var/run/docker.sock";

/// Memoria RAM mínima recomendada en GB.
const MIN_MEMORY_GB: u64 = 2;

/// Espacio libre en disco mínimo recomendado en GB (medido en /var/lib/docker).
const MIN_DISK_GB: u64 = 10;

// ── Helpers internos ─────────────────────────────────────────────────────────

/// Devuelve un `SystemRequirement` de error genérico.
/// Útil para reducir la repetición de structs con todos los campos en `None`.
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

/// Verifica si Docker está instalado y si el socket está disponible.
///
/// Usa `bollard` para conectarse directamente al socket Unix en lugar de
/// llamar a `docker --version` como proceso externo. Esto es más eficiente
/// y no depende de que `docker` esté en el PATH del proceso servidor.
async fn check_docker() -> SystemRequirement {
    // Intentamos conectarnos al socket local de Docker.
    let docker = match Docker::connect_with_local_defaults() {
        Ok(d) => d,
        Err(e) => {
            return requirement_error(format!(
                "No se pudo conectar al socket de Docker ({}): {}",
                DOCKER_SOCKET_PATH, e
            ));
        }
    };

    // Pedimos la versión del daemon a través de la API REST del socket.
    match docker.version().await {
        Ok(info) => {
            // `info.version` es Option<String> según el esquema de la API de Docker.
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
        Err(e) => {
            // El socket existe pero el daemon no responde correctamente.
            SystemRequirement {
                installed: true,
                version: None,
                ready: Some(false),
                running: None,
                socket: Some(DOCKER_SOCKET_PATH.to_string()),
                available: None,
                available_amount: None,
                sufficient: None,
                error: Some(format!("Docker instalado pero no responde: {}", e)),
            }
        }
    }
}

/// Verifica si el daemon de Docker está corriendo activamente.
///
/// Reutiliza la conexión de bollard para llamar a `docker info`, equivalente
/// a `docker info` en CLI pero sin lanzar un proceso hijo.
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

/// Verifica si Docker Compose está disponible.
///
/// Prueba primero el plugin moderno (`docker compose`) y luego el binario
/// legacy (`docker-compose`) como fallback.
///
/// NOTA: usamos `tokio::process::Command` (async) en lugar de
/// `std::process::Command` (bloqueante) para no bloquear el hilo de Tokio.
async fn check_compose() -> SystemRequirement {
    // ── Intento 1: plugin moderno `docker compose version` ──────────────────
    let modern = tokio::process::Command::new("docker")
        .args(["compose", "version"]) // args() separa correctamente los argumentos
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

    // ── Intento 2: binario legacy `docker-compose --version` ────────────────
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
                error: Some("Usando docker-compose legacy (considera actualizar al plugin)".to_string()),
            };
        }
    }

    // Ninguno disponible.
    requirement_error("Docker Compose no está instalado (ni plugin moderno ni binario legacy)")
}

// ── Check de puertos ─────────────────────────────────────────────────────────

/// Verifica si un puerto TCP está disponible intentando hacer bind en él.
///
/// Este método es más portable y preciso que parsear la salida de `ss` o
/// `netstat`, y no requiere ninguna dependencia extra ni llamada al shell.
///
/// ⚠️ Limitación: el bind libera el puerto inmediatamente después del check,
/// por lo que hay una pequeña ventana de tiempo (TOCTOU). Es suficiente para
/// una verificación de prerequisitos de instalación.
fn check_port(port: u16) -> SystemRequirement {
    // TcpListener::bind falla si el puerto ya está en uso.
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

// ── Checks de recursos del sistema ───────────────────────────────────────────

/// Verifica la memoria RAM total disponible usando `sysinfo`.
///
/// `sysinfo` lee directamente `/proc/meminfo` en Linux (sin shell),
/// y funciona también en macOS y Windows, lo que hace el código portable.
fn check_memory() -> SystemRequirement {
    let mut sys = System::new();
    sys.refresh_memory(); // Solo carga datos de memoria, más eficiente que new_all()

    // total_memory() devuelve bytes; convertimos a GB.
    let total_bytes = sys.total_memory();

    if total_bytes == 0 {
        // sysinfo no pudo leer la memoria (raro, pero posible en entornos restrictivos).
        return requirement_error("No se pudo leer la memoria del sistema");
    }

    let mem_gb = total_bytes / 1_073_741_824; // 1 GiB = 1024^3 bytes
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

/// Verifica el espacio libre en disco donde Docker almacena sus datos.
///
/// En lugar de parsear `df`, usa `sysinfo::Disks` que lee los puntos de
/// montaje del sistema de archivos directamente.
///
/// Busca el disco que contenga `/var/lib/docker`; si no existe ese mountpoint
/// específico, cae en `/` como fallback razonable.
fn check_disk() -> SystemRequirement {
    let disks = Disks::new_with_refreshed_list();

    // Buscamos el mountpoint más específico que contenga el path de Docker.
    // Ordenamos por longitud de ruta descendente para preferir el más específico.
    let docker_path = std::path::Path::new("/var/lib/docker");

    let best_disk = disks
        .iter()
        .filter(|d| docker_path.starts_with(d.mount_point()))
        .max_by_key(|d| d.mount_point().as_os_str().len());

    // Fallback: si no existe /var/lib/docker como mountpoint propio, usamos /
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

// ── Handler principal ─────────────────────────────────────────────────────────

/// Handler Axum que ejecuta todos los checks en paralelo y devuelve el estado
/// del sistema como JSON.
///
/// Todos los checks async se lanzan concurrentemente con `tokio::join!` para
/// reducir la latencia total (antes eran secuenciales, ahora el tiempo total
/// es el del check más lento, no la suma de todos).
///
/// Los checks síncronos (puerto, memoria, disco) son rápidos y se ejecutan
/// directamente sin necesidad de `spawn_blocking` para este caso de uso.
pub async fn get_requirements(
    State(_pool): State<SqlitePool>,
) -> Json<SystemRequirementsResponse> {

    // Ejecutamos los 3 checks async de Docker en paralelo.
    let (docker, compose, daemon) = tokio::join!(
        check_docker(),
        check_compose(),
        check_docker_daemon(),
    );

    // Los checks de puerto, memoria y disco son síncronos pero muy rápidos
    // (solo leen /proc o intentan un bind), así que no necesitan spawn_blocking.
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
