import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuthStore } from '@/stores/authStore'

interface FileUploadProps {
  onFileUploaded: (fileData: { filePath: string; fileName: string; url: string; mimeType: string }) => void
  clienteId?: string
  postId?: string
  maxSize?: number
  accept?: { [key: string]: string[] }
  className?: string
}

export function FileUpload({ 
  onFileUploaded,
  clienteId,
  postId,
  maxSize = 500 * 1024 * 1024, // 500MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.webm']
  },
  className = ''
}: FileUploadProps) {
  const { token } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    // Clear previous error
    setError(null)
    
    // Preview local
    const previewUrl = URL.createObjectURL(uploadedFile)
    setPreview(previewUrl)
    setFile(uploadedFile)

    // Upload para o servidor
    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText)
          onFileUploaded({
            ...response.data,
            mimeType: response.data.mimeType
          })
        } else {
          setError('Erro no upload')
        }
        setUploading(false)
      })

      xhr.addEventListener('error', () => {
        setError('Erro de conexão')
        setUploading(false)
      })

      // Construir URL com query params
      const params = new URLSearchParams()
      if (clienteId) params.append('clienteId', clienteId)
      if (postId) params.append('postId', postId)
      const url = `/api/upload${params.toString() ? `?${params.toString()}` : ''}`
      
      xhr.open('POST', url)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    } catch (err) {
      setError('Erro ao fazer upload')
      setUploading(false)
    }
  }, [onFileUploaded, token, clienteId, postId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple: false
  })

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {preview && file ? (
          <div className="mb-4">
            {file.type.startsWith('image/') ? (
              <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded" />
            ) : (
              <video src={preview} className="mx-auto max-h-48 rounded" controls />
            )}
          </div>
        ) : (
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p>Arraste um arquivo aqui ou clique para selecionar</p>
            <p className="text-sm mt-1">Imagens e vídeos até 500MB</p>
          </div>
        )}
        
        {uploading && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-1 text-gray-600">{Math.round(progress)}%</p>
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
