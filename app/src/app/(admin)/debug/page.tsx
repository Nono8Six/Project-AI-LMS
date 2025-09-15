import { redirect } from 'next/navigation';

export default function DebugPage() {
  // Rediriger automatiquement vers le dashboard
  redirect('/debug/dashboard');
}