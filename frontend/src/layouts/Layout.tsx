import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/auth'
import { Sidebar, SidebarMenuItem } from '@/components/ui'
import { LayoutDashboard, User, Building2, FileText, Users } from 'lucide-react'

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    return <div>Carregando...</div>
  }

  const getClientMenuItems = (): SidebarMenuItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Perfil', href: '/profile', icon: <User className="w-5 h-5" /> }
  ]

  const getAdminMasterMenuItems = (): SidebarMenuItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Admin Master', href: '/admin-master', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Posts', href: '/posts', icon: <FileText className="w-5 h-5" /> },
    { label: 'Perfil', href: '/profile', icon: <User className="w-5 h-5" /> }
  ]

  const getFuncionarioMenuItems = (): SidebarMenuItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Posts', href: '/posts', icon: <FileText className="w-5 h-5" /> },
    { label: 'Usuários', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Perfil', href: '/profile', icon: <User className="w-5 h-5" /> }
  ]

  const getMenuItems = (): SidebarMenuItem[] => {
    const role = user?.role as UserRole
    
    if (role === UserRole.ADMIN_MASTER || role === UserRole.SUPER_USER) {
      return getAdminMasterMenuItems()
    }
    
    if (role === UserRole.FUNCIONARIO) {
      return getFuncionarioMenuItems()
    }
    
    return getClientMenuItems()
  }

  const menuItems = getMenuItems()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar 
        menuItems={menuItems} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="sr-only">Menu</span>
              </button>

              {/* Desktop logo */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">ArtFlow</h1>
                  <p className="text-blue-600 text-xs">Crie. Gerencie. Inspire.</p>
                </div>
              </div>

              {/* User Info & Logout */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.nome || 'Usuário'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
