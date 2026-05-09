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