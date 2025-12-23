import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Dashboard } from '@/components/Dashboard'
import { DashboardAdmin } from '@/components/DashboardAdmin'

export const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore()

  // Render admin dashboard for ADMIN_MASTER, FUNCIONARIO or SUPER_USER
  // Client dashboard for CLIENT
  const isAdmin = user?.role === 'ADMIN_MASTER' || user?.role === 'FUNCIONARIO' || user?.role === 'SUPER_USER'
  
  if (isAdmin) {
    return <DashboardAdmin />
  }

  return <Dashboard />
}
