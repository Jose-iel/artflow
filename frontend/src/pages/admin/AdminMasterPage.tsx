// Admin Master Page - Página de gerenciamento de Empresas, Squads, Funcionários e Clientes
import React, { useState } from 'react'
import { EmpresasTab } from './EmpresasTab'
import { SquadsTab } from './SquadsTab'
import { FuncionariosTab } from './FuncionariosTab'
import { ClientesTab } from './ClientesTab'

type ActiveTab = 'empresas' | 'squads' | 'funcionarios' | 'clientes'

interface TabConfig {
  id: ActiveTab
  label: string
  icon: string
}

const tabs: TabConfig[] = [
  { id: 'empresas', label: 'Empresas', icon: '🏢' },
  { id: 'squads', label: 'Squads', icon: '👥' },
  { id: 'funcionarios', label: 'Funcionários', icon: '👔' },
  { id: 'clientes', label: 'Clientes', icon: '👤' }
]

export const AdminMasterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('empresas')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'empresas':
        return <EmpresasTab />
      case 'squads':
        return <SquadsTab />
      case 'funcionarios':
        return <FuncionariosTab />
      case 'clientes':
        return <ClientesTab />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Master</h1>
        <p className="text-gray-600 mt-1">
          Gerencie empresas, squads e usuários do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Navegação Admin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={activeTab}
      >
        {renderTabContent()}
      </div>
    </div>
  )
}
