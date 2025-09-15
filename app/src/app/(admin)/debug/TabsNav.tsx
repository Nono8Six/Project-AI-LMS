"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEBUG_DASHBOARD_PATH,
  DEBUG_MIDDLEWARE_PATH,
  DEBUG_ENDPOINTS_PATH,
  DEBUG_CONFIG_PATH,
  DEBUG_MONITORING_PATH,
} from '@/shared/constants/routes'

const routes = {
  dashboard: DEBUG_DASHBOARD_PATH,
  middleware: DEBUG_MIDDLEWARE_PATH,
  endpoints: DEBUG_ENDPOINTS_PATH,
  config: DEBUG_CONFIG_PATH,
  monitoring: DEBUG_MONITORING_PATH,
} as const

function currentKey(pathname: string): keyof typeof routes {
  if (pathname.startsWith(DEBUG_MIDDLEWARE_PATH)) return 'middleware'
  if (pathname.startsWith(DEBUG_ENDPOINTS_PATH)) return 'endpoints'
  if (pathname.startsWith(DEBUG_CONFIG_PATH)) return 'config'
  if (pathname.startsWith(DEBUG_MONITORING_PATH)) return 'monitoring'
  return 'dashboard'
}

export default function TabsNav() {
  const pathname = usePathname()
  const router = useRouter()
  const value = currentKey(pathname)
  return (
    <Tabs value={value} onValueChange={(v) => router.push(routes[v as keyof typeof routes])}>
      <TabsList className="mb-6">
        <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
        <TabsTrigger value="middleware">🔧 Middleware</TabsTrigger>
        <TabsTrigger value="endpoints">🔗 Endpoints</TabsTrigger>
        <TabsTrigger value="config">⚙️ Config</TabsTrigger>
        <TabsTrigger value="monitoring">📈 Monitoring</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

