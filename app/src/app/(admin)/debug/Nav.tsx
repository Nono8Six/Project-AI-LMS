"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DEBUG_DASHBOARD_PATH,
  DEBUG_MIDDLEWARE_PATH,
  DEBUG_ENDPOINTS_PATH,
  DEBUG_CONFIG_PATH,
  DEBUG_MONITORING_PATH,
} from '@/shared/constants/routes'

const items = [
  { href: DEBUG_DASHBOARD_PATH, label: 'Dashboard', icon: '📊' },
  { href: DEBUG_MIDDLEWARE_PATH, label: 'Middleware', icon: '🔧' },
  { href: DEBUG_ENDPOINTS_PATH, label: 'Endpoints', icon: '🔗' },
  { href: DEBUG_CONFIG_PATH, label: 'Config', icon: '⚙️' },
  { href: DEBUG_MONITORING_PATH, label: 'Monitoring', icon: '📈' },
] as const

export default function DebugNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/50 rounded-lg border">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Button key={item.href} asChild variant={active ? 'secondary' : 'outline'} size="sm">
            <Link href={item.href} className="inline-flex items-center gap-2">
              <span className="text-base" aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
