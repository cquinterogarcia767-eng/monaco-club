import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase }     from '@/lib/supabase'

export default function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-monaco-black">
      {children}
    </div>
  )
}