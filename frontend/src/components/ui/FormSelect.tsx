import React from 'react'
import { UseFormRegisterReturn, FieldError } from 'react-hook-form'

interface Option {
  value: string
  label: string
}

interface FormSelectProps {
  id: string
  label: string
  options: Option[]
  placeholder?: string
  register: UseFormRegisterReturn
  error?: FieldError
  disabled?: boolean
  className?: string
}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  options,
  placeholder = 'Selecione...',
  register,
  error,
  disabled = false,
  className = ''
}) => {
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <select
        id={id}
        disabled={disabled}
        {...register}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  )
}
