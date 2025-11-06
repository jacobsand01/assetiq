// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Always land on the dashboard as the main app home
  redirect('/dashboard');
}
