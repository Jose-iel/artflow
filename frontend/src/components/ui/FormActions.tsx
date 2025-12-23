import React from 'react'

interface FormActionsProps {
  onCancel: () => void
  isSubmitting?: boolean
  isEditing?: boolean
  submitLabel?: string
  cancelLabel?: string
  className?: string
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  isSubmitting = false,
  isEditing = false,
  submitLabel,
  cancelLabel = 'Cancelar',
  className = ''
}) => {
  const defaultSubmitLabel = isSubmitting 
    ? 'Salvando...' 
    : isEditing 
      ? 'Salvar' 
      : 'Criar'

  return (
    <div className={`flex gap-3 pt-2 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {submitLabel || defaultSubmitLabel}
      </button>
    </div>
  )
}
