'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QueuePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/tasks') }, [router])
  return <div className="p-8 text-[#8b949e] text-sm">Redirecting to Tasks...</div>
}
