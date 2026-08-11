'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button type="button" className="backButton" onClick={() => router.back()} aria-label="Retroceder">
      ← Retroceder
    </button>
  )
}
