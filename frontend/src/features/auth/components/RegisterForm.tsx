import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface RegisterFormData {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}

interface FormErrors {
  nome?: string
  email?: string
  senha?: string
  confirmarSenha?: string
  general?: string
}

export const RegisterForm: React.FC = () => {
  const { register } = useAuthStore()
  const [formData, setFormData] = useState<RegisterFormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateName = (nome: string): string | undefined => {
    if (!nome) return 'Nome é obrigatório'
    if (nome.length < 3) return 'Nome deve ter pelo menos 3 caracteres'
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido'
    return undefined
  }

  const validatePassword = (senha: string): string | undefined => {
    if (!senha) return 'Senha é obrigatória'
    if (senha.length < 8) return 'Senha deve ter pelo menos 8 caracteres'
    return undefined
  }

  const validateConfirmPassword = (senha: string, confirmarSenha: string): string | undefined => {
    if (!confirmarSenha) return 'Confirmação de senha é obrigatória'
    if (senha !== confirmarSenha) return 'Senhas não coincidem'
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      nome: validateName(formData.nome),
      email: validateEmail(formData.email),
      senha: validatePassword(formData.senha),
      confirmarSenha: validateConfirmPassword(formData.senha, formData.confirmarSenha)
    }

    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors]
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let error: string | undefined

    switch (name) {
      case 'nome':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'senha':
        error = validatePassword(value)
        break
      case 'confirmarSenha':
        error = validateConfirmPassword(formData.senha, value)
        break
    }

    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      await register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha
      })
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Erro ao fazer cadastro'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.nome && formData.email && formData.senha && formData.confirmarSenha &&
    !validateName(formData.nome) && !validateEmail(formData.email) && 
    !validatePassword(formData.senha) && !validateConfirmPassword(formData.senha, formData.confirmarSenha)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Entre aqui
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="sr-only">
                Nome completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                autoComplete="name"
                required
                aria-label="Nome completo"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.nome ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Nome completo"
                value={formData.nome}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isLoading}
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-label="Email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="senha" className="sr-only">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                required
                aria-label="Senha"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.senha ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Senha"
                value={formData.senha}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isLoading}
              />
              {errors.senha && (
                <p className="mt-1 text-sm text-red-600">{errors.senha}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="sr-only">
                Confirmar senha
              </label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                autoComplete="new-password"
                required
                aria-label="Confirmar senha"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmarSenha ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirmar senha"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={isLoading}
              />
              {errors.confirmarSenha && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errors.general}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
