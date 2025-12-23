import React from 'react'

interface EmptyStateProps {
  message?: string
  filteredMessage?: string
  hasFilters?: boolean
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Nenhum item cadastrado',
  filteredMessage = 'Nenhum item encontrado com esses filtros',
  hasFilters = false,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 text-gray-500 ${className}`}>
      {hasFilters ? filteredMessage : message}
    </div>
  )
}
