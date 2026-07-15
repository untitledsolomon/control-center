'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectivesPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/goals') }, [router])
  return <div className="p-8 text-[#8b949e] text-sm">Redirecting to Goals...</div>
}
