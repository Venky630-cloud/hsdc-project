export type ServiceEnvironment = 'dev' | 'staging' | 'prod-training'

export const servicePorts: Record<ServiceEnvironment, Record<string, number>> = {
  dev: {
    frontend: 3000,
    api: 3100,
    auth: 3200,
    admin: 3300,
    payments: 3400,
    worker: 3500,
    analytics: 3600,
  },
  staging: {
    frontend: 4000,
    api: 4100,
    auth: 4200,
    admin: 4300,
    payments: 4400,
    worker: 4500,
    analytics: 4600,
  },
  'prod-training': {
    frontend: 5000,
    api: 5100,
    auth: 5200,
    admin: 5300,
    payments: 5400,
    worker: 5500,
    analytics: 5600,
  },
}
