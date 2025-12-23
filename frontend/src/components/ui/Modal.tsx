import React from 'react'

interface ModalProps {
  children: React.ReactNode
  title: string
  titleId?: string
  onClose?: () => void
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  children,
  title,
  titleId = 'modal-title',
  className = ''
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={`bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto ${className}`}>
        <h2
          id={titleId}
          className="text-lg font-bold text-gray-900 mb-4"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
