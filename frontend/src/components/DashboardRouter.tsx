import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Dashboard } from '@/components/Dashboard'
import { DashboardAdmin } from '@/components/DashboardAdmin'

export const DashboardRouter: React.FC = () => {
  const { hasRole } = useAuthStore()

  // Render admin dashboard for SUPER_USER, client dashboard for CLIENT
  // Note: Authentication is already handled by ProtectedRoute wrapper
  if (hasRole('SUPER_USER')) {
    return <DashboardAdmin />
  }

  return <Dashboard />
}
