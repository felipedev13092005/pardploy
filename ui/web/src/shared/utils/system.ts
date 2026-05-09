import { ApiService } from './api-service'
import type { SystemRequirementsResponse } from '../types/system'

export const SystemService = {
  getRequirements: () =>
    ApiService.get<SystemRequirementsResponse>('/system/requirements'),
}