import { Outlet } from 'react-router-dom'
import BottomNav  from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-monaco-black flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}