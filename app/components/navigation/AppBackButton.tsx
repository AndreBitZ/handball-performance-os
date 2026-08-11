'use client'

import { useRouter } from 'next/navigation'

export default function AppBackButton() {
  const router = useRouter()
  return <button type="button" onClick={() => router.back()} aria-label="Retroceder" className="backButton">← Retroceder</button>
}
