'use client'

import { useEffect, useState } from 'react'

type SkyState = 'dawn' | 'morning' | 'day' | 'afternoon' | 'sunset' | 'twilight' | 'night'

const getSkyState = (): SkyState => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 10) return 'morning'  
  if (hour >= 10 && hour < 15) return 'day'
  if (hour >= 15 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 19) return 'sunset'
  if (hour >= 19 && hour < 21) return 'twilight'
  return 'night'
}

const skyGradients = {
  dawn: 'linear-gradient(135deg, #ff9a8b 0%, #a8e6cf 25%, #ffd3a5 50%, #fd9853 100%)',
  morning: 'linear-gradient(135deg, #83a4d4 0%, #b6fbff 50%, #ffffff 100%)',
  day: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #ffffff 100%)',
  afternoon: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #ffffff 100%)', 
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 25%, #ff6b6b 50%, #4ecdc4 100%)',
  twilight: 'linear-gradient(135deg, #667db6 0%, #0082c8 25%, #667db6 50%, #0082c8 100%)',
  night: 'linear-gradient(135deg, #2c3e50 0%, #34495e 25%, #2c3e50 50%, #34495e 100%)'
}

const textOverlays = {
  dawn: 'rgba(247, 249, 247, 0.85)',
  morning: 'rgba(247, 249, 247, 0.8)',
  day: 'rgba(247, 249, 247, 0.75)',
  afternoon: 'rgba(247, 249, 247, 0.8)',
  sunset: 'rgba(247, 249, 247, 0.85)',
  twilight: 'rgba(247, 249, 247, 0.9)',
  night: 'rgba(247, 249, 247, 0.9)'
}

export default function HeroWireframe() {
  const [skyState, setSkyState] = useState<SkyState>('day')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSkyState(getSkyState())
    
    // Update sky every minute
    const interval = setInterval(() => {
      setSkyState(getSkyState())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky Background - Behind everything */}
      <div 
        className="absolute inset-0 transition-all duration-[30s] ease-in-out"
        style={{
          background: skyGradients[skyState]
        }}
      />
      
      {/* Wireframe Mountain Layer - In front of sky */}
      <div 
        className="absolute inset-0 transition-opacity duration-[30s] ease-in-out"
        style={{
          backgroundImage: 'url("/wireframe-timp-transparent.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Text Readability Overlay - Light overlay for content readability */}
      <div 
        className="absolute inset-0 transition-all duration-[30s] ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${textOverlays[skyState]} 0%, ${textOverlays[skyState]} 50%, transparent 100%)`
        }}
      />
    </div>
  )
}