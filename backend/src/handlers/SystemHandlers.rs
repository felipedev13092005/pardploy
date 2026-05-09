use axum::{extract::State, Json};
use std::process::Command;
use crate::models::SystemModel::{
    SystemRequirement, SystemRequirementsResponse,
};
use sqlx::SqlitePool;

const DOCKER_SOCKET_PATH: &str = "/var/run/docker.sock";
const MIN_MEMORY_GB: u64 = 2;
const MIN_DISK_GB: u64 = 10;

fn get_command_output(cmd: &str, arg: &str) -> (bool, Option<String>) {
    let output = Command::new(cmd)
        .arg(arg)
        .output();

    match output {
        Ok(o) => {
            if o.status.success() {
                let version = String::from_utf8_lossy(&o.stdout).trim().to_string();
                (true, Some(version))
            } else {
                (false, None)
            }
        }
        Err(_) => (false, None),
    }
}

fn check_docker() -> SystemRequirement {
    let (installed, version) = get_command_output("docker", "--version");

    if !installed {
        return SystemRequirement {
            installed: false,
            version: None,
            ready: None,
            running: None,
            socket: None,
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some("Docker no está instalado".to_string()),
        };
    }

    let version_str = version.unwrap_or_default();
    let (ready, error) = check_docker_socket();

    SystemRequirement {
        installed: true,
        version: Some(version_str),
        ready: Some(ready),
        running: None,
        socket: Some(DOCKER_SOCKET_PATH.to_string()),
        available: None,
        available_amount: None,
        sufficient: None,
        error: if ready { None } else { error },
    }
}

fn check_docker_socket() -> (bool, Option<String>) {
    let socket = std::path::Path::new(DOCKER_SOCKET_PATH);
    if socket.exists() {
        (true, None)
    } else {
        (false, Some(format!("Socket {} no encontrado", DOCKER_SOCKET_PATH)))
    }
}

fn check_docker_daemon() -> SystemRequirement {
    let output = Command::new("docker")
        .arg("info")
        .output();

    match output {
        Ok(o) => {
            if o.status.success() {
                SystemRequirement {
                    installed: true,
                    version: None,
                    ready: None,
                    running: Some(true),
                    socket: Some(DOCKER_SOCKET_PATH.to_string()),
                    available: None,
                    available_amount: None,
                    sufficient: None,
                    error: None,
                }
            } else {
                let err = String::from_utf8_lossy(&o.stderr).trim().to_string();
                SystemRequirement {
                    installed: true,
                    version: None,
                    ready: None,
                    running: Some(false),
                    socket: Some(DOCKER_SOCKET_PATH.to_string()),
                    available: None,
                    available_amount: None,
                    sufficient: None,
                    error: Some(format!("Docker daemon no está corriendo: {}", err)),
                }
            }
        }
        Err(e) => SystemRequirement {
            installed: false,
            version: None,
            ready: None,
            running: Some(false),
            socket: Some(DOCKER_SOCKET_PATH.to_string()),
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some(format!("No se puede ejecutar docker: {}", e)),
        },
    }
}

fn check_compose() -> SystemRequirement {
    let (installed, version) = get_command_output("docker", "compose version");

    if !installed {
        let (alt_installed, alt_version) = get_command_output("docker-compose", "--version");
        if alt_installed {
            return SystemRequirement {
                installed: true,
                version: alt_version,
                ready: Some(true),
                running: None,
                socket: None,
                available: None,
                available_amount: None,
                sufficient: None,
                error: None,
            };
        }
        return SystemRequirement {
            installed: false,
            version: None,
            ready: None,
            running: None,
            socket: None,
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some("Docker Compose no está instalado".to_string()),
        };
    }

    SystemRequirement {
        installed: true,
        version,
        ready: Some(true),
        running: None,
        socket: None,
        available: None,
        available_amount: None,
        sufficient: None,
        error: None,
    }
}

fn check_port(port: u16) -> SystemRequirement {
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!("ss -tuln | grep -q ':{} '", port))
        .output();

    let is_available = match output {
        Ok(o) => !o.status.success(),
        Err(_) => true,
    };

    SystemRequirement {
        installed: true,
        version: None,
        ready: None,
        running: None,
        socket: None,
        available: Some(is_available),
        available_amount: None,
        sufficient: None,
        error: if is_available { None } else { Some(format!("Puerto {} está en uso", port)) },
    }
}

fn check_memory() -> SystemRequirement {
    let output = Command::new("sh")
        .arg("-c")
        .arg("free -g | awk '/^Mem:/ {print $2}'")
        .output();

    match output {
        Ok(o) => {
            if o.status.success() {
                let mem_str = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if let Ok(mem_gb) = mem_str.parse::<u64>() {
                    let sufficient = mem_gb >= MIN_MEMORY_GB;
                    return SystemRequirement {
                        installed: true,
                        version: None,
                        ready: None,
                        running: None,
                        socket: None,
                        available: None,
                        available_amount: Some(format!("{}GB", mem_gb)),
                        sufficient: Some(sufficient),
                        error: if sufficient { None } else { Some(format!("Memoria mínima recomendada: {}GB", MIN_MEMORY_GB)) },
                    };
                }
            }
            SystemRequirement {
                installed: false,
                version: None,
                ready: None,
                running: None,
                socket: None,
                available: None,
                available_amount: None,
                sufficient: None,
                error: Some("No se pudo determinar la memoria disponible".to_string()),
            }
        }
        Err(e) => SystemRequirement {
            installed: false,
            version: None,
            ready: None,
            running: None,
            socket: None,
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some(format!("Error al verificar memoria: {}", e)),
        },
    }
}

fn check_disk() -> SystemRequirement {
    let output = Command::new("sh")
        .arg("-c")
        .arg("df -BG /var/lib/docker | awk 'NR==2 {print $4}' | tr -d 'G'")
        .output();

    match output {
        Ok(o) => {
            if o.status.success() {
                let disk_str = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if let Ok(disk_gb) = disk_str.parse::<u64>() {
                    let sufficient = disk_gb >= MIN_DISK_GB;
                    return SystemRequirement {
                        installed: true,
                        version: None,
                        ready: None,
                        running: None,
                        socket: None,
                        available: None,
                        available_amount: Some(format!("{}GB", disk_gb)),
                        sufficient: Some(sufficient),
                        error: if sufficient { None } else { Some(format!("Espacio mínimo recomendado: {}GB", MIN_DISK_GB)) },
                    };
                }
            }
            SystemRequirement {
                installed: false,
                version: None,
                ready: None,
                running: None,
                socket: None,
                available: None,
                available_amount: None,
                sufficient: None,
                error: Some("No se pudo determinar el espacio en disco".to_string()),
            }
        }
        Err(e) => SystemRequirement {
            installed: false,
            version: None,
            ready: None,
            running: None,
            socket: None,
            available: None,
            available_amount: None,
            sufficient: None,
            error: Some(format!("Error al verificar disco: {}", e)),
        },
    }
}

pub async fn get_requirements(
    State(_pool): State<SqlitePool>,
) -> Json<SystemRequirementsResponse> {
    let response = SystemRequirementsResponse {
        docker: check_docker(),
        compose: check_compose(),
        daemon: check_docker_daemon(),
        port_3000: check_port(3000),
        port_5173: check_port(5173),
        memory: check_memory(),
        disk: check_disk(),
    };

    Json(response)
}