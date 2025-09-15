import type { ReactNode } from 'react'

export default function MemberLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main id="content">{children}</main>
    </div>
  )
}
