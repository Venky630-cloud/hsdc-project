import React from 'react'

export function SecurityLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Outer Hex Shield */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-cyan-500" />
      {/* Inner Vault Core */}
      <circle cx="12" cy="11" r="3" className="text-white" />
      {/* Cryptographic Keyhole */}
      <path d="M12 14v2" className="text-white" />
    </svg>
  )
}
