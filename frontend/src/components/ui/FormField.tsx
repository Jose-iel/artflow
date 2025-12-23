import React from 'react'
import { UseFormRegisterReturn, FieldError } from 'react-hook-form'

interface FormFieldProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  register: UseFormRegisterReturn
  error?: FieldError
  disabled?: boolean
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
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
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  )
}
