import type { Metadata } from 'next';
import { Suspense } from 'react';
import TabsNav from './TabsNav';

export const metadata: Metadata = {
  title: 'Debug Console - Admin',
  description: 'Debug et monitoring oRPC, middlewares et API',
  robots: { index: false, follow: false },
};


export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">🐛 Debug Console</h1>
          <p className="text-muted-foreground">
            Diagnostic complet oRPC, middleware, configuration et monitoring
          </p>
        </div>

        <TabsNav />

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                Chargement...
              </span>
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
