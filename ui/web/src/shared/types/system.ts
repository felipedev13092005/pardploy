export interface SystemRequirement {
  installed: boolean
  version?: string
  ready?: boolean
  running?: boolean
  socket?: string
  available?: boolean
  available_amount?: string
  sufficient?: boolean
  error?: string
}

export interface SystemRequirementsResponse {
  docker: SystemRequirement
  compose: SystemRequirement
  daemon: SystemRequirement
  port_3000: SystemRequirement
  port_5173: SystemRequirement
  memory: SystemRequirement
  disk: SystemRequirement
}