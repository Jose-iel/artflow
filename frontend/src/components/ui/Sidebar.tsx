import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export interface SidebarMenuItem {
  label: string
  href: string
  icon?: string
}

interface SidebarProps {
  menuItems: SidebarMenuItem[]
  isOpen: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ menuItems, isOpen, onClose }) => {
  const location = useLocation()

  const isActiveRoute = (href: string) => {
    return location.pathname === href || 
           (href !== '/dashboard' && location.pathname.startsWith(href))
  }

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative
        inset-y-0 left-0
        z-50 lg:z-40
        w-64
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-blue-900 to-blue-800
        text-white
        h-screen
        overflow-y-auto
      `}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">ArtFlow</h1>
              <p className="text-blue-200 text-sm">Crie. Gerencie. Inspire.</p>
            </div>
          </div>

          {/* Navigation */}
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

      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
