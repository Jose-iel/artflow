import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { DashboardContent } from '@/features/dashboard'
import { DashboardFuncionario } from '@/pages/funcionarios'

export const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore()

  // Funcionário tem dashboard próprio
  if (user?.role === 'FUNCIONARIO') {
    return <DashboardFuncionario />
  }

  // Admin Master e Super User usam dashboard do cliente (por enquanto)
  // TODO: Criar dashboard específico para Admin Master se necessário
  return <DashboardContent />
}
