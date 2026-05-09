use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemRequirement {
    pub installed: bool,
    pub version: Option<String>,
    pub ready: Option<bool>,
    pub running: Option<bool>,
    pub socket: Option<String>,
    pub available: Option<bool>,
    pub available_amount: Option<String>,
    pub sufficient: Option<bool>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemRequirementsResponse {
    pub docker: SystemRequirement,
    pub compose: SystemRequirement,
    pub daemon: SystemRequirement,
    pub port_3000: SystemRequirement,
    pub port_5173: SystemRequirement,
    pub memory: SystemRequirement,
    pub disk: SystemRequirement,
}

impl SystemRequirementsResponse {
    pub fn all_ready(&self) -> bool {
        self.docker.installed
            && self.docker.ready.unwrap_or(false)
            && self.compose.installed
            && self.daemon.running.unwrap_or(false)
            && self.port_3000.available.unwrap_or(false)
            && self.port_5173.available.unwrap_or(false)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstallStep {
    pub name: String,
    pub status: String,
    pub message: String,
}

impl InstallStep {
    pub fn running(name: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            status: "running".to_string(),
            message: message.into(),
        }
    }

    pub fn success(name: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            status: "success".to_string(),
            message: message.into(),
        }
    }

    pub fn error(name: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            status: "error".to_string(),
            message: message.into(),
        }
    }

    pub fn to_sse(&self) -> String {
        format!(
            "data: {}\n\n",
            serde_json::to_string(self).unwrap_or_default()
        )
    }
}