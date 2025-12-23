import React from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default'

interface StatusBadgeProps {
  active?: boolean
  label?: string
  activeLabel?: string
  inactiveLabel?: string
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, { active: string; inactive: string }> = {
  success: {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800'
  },
  danger: {
    active: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800'
  },
  warning: {
    active: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800'
  },
  info: {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800'
  },
  default: {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800'
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  active = true,
  label,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
  variant = 'default',
  className = ''
}) => {
  const styles = variantStyles[variant]
  const displayLabel = label ?? (active ? activeLabel : inactiveLabel)

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${
        active ? styles.active : styles.inactive
      } ${className}`}
    >
      {displayLabel}
    </span>
  )
}
