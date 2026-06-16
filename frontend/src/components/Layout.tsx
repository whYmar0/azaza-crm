import React from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1280px] mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
