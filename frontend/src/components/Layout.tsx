import React, { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'


interface MenuItem {
  label: string
  href: string
  icon?: string
  requiredRole?: 'SUPER_USER'
}

export const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    console.log('✅ Layout MOUNTED - Component mounted')
    return () => {
      console.log('❌ Layout UNMOUNTED - Component unmounted')
    }
  }, [])

  console.log('Layout render - user.nome:', user?.nome)
  console.log('Layout render - sidebarOpen:', sidebarOpen)

  if (!user) {
    return <div>Carregando...</div>
  }

  const getClientMenuItems = (): MenuItem[] => [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊'
    },
    {
      label: 'Perfil',
      href: '/profile',
      icon: '👤'
    }
  ]

  const getAdminMenuItems = (): MenuItem[] => [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊'
    },
    {
      label: 'Criar Post',
      href: '/posts/create',
      icon: '➕',
      requiredRole: 'SUPER_USER'
    },
        {
      label: 'Usuários',
      href: '/admin/users',
      icon: '👥',
      requiredRole: 'SUPER_USER'
    },
        {
      label: 'Relatórios',
      href: '/admin/reports',
      icon: '📈',
      requiredRole: 'SUPER_USER'
    },
    {
      label: 'Configurações',
      href: '/admin/settings',
      icon: '⚙️',
      requiredRole: 'SUPER_USER'
    },
    {
      label: 'Perfil',
      href: '/profile',
      icon: '👤'
    }
  ]

  const menuItems = hasRole('SUPER_USER') 
    ? getAdminMenuItems().filter(item => !item.requiredRole || hasRole(item.requiredRole))
    : getClientMenuItems()

  const isActiveRoute = (href: string) => {
    return location.pathname === href || 
           (href !== '/dashboard' && location.pathname.startsWith(href))
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative
        inset-y-0 left-0
        z-50 lg:z-40
        w-64
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-blue-900 to-blue-800
        text-white
        h-screen
        overflow-y-auto
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">ArtFlow</h1>
              <p className="text-blue-200 text-sm">Crie. Gerencie. Inspire.</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = isActiveRoute(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                    ${active 
                      ? 'bg-blue-700 text-white shadow-lg' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

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

              {/* Desktop logo (hidden when sidebar is open) */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">ArtFlow</h1>
                  <p className="text-blue-600 text-xs">Crie. Gerencie. Inspire.</p>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.nome || 'Usuário'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
