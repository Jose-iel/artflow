import React from 'react'

interface ErrorStateProps {
  message?: string
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Erro ao carregar dados',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <div className="text-red-500">{message}</div>
    </div>
  )
}
