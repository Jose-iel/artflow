import React from 'react'

interface LoadingStateProps {
  message?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <div className="text-gray-500">{message}</div>
    </div>
  )
}
