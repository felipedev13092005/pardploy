import { ApiService } from './api-service'
import { config } from '../config/config'
import type { SystemRequirementsResponse, InstallStep } from '../types/system'

export const SystemService = {
  getRequirements: () =>
    ApiService.get<SystemRequirementsResponse>('/system/requirements'),

  installDocker: (onStep: (step: InstallStep) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch(`${config.API_URL}/system/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then((response) => {
        if (!response.ok) {
          reject(new Error(`HTTP ${response.status}`))
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          reject(new Error('No response body'))
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        const readStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              resolve()
              return
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = line.slice(6).trim()
                  if (data && data !== 'event: done') {
                    const step = JSON.parse(data) as InstallStep
                    onStep(step)
                  }
                } catch (e) {
                  console.error('Failed to parse SSE:', e)
                }
              }
            }

            readStream()
          })
        }

        readStream()
      }).catch(reject)
    })
  },
}