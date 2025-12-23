import React from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface FormCheckboxProps {
  id: string
  label: string
  register: UseFormRegisterReturn
  disabled?: boolean
  className?: string
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  id,
  label,
  register,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        {...register}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  )
}
