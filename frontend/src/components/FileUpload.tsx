import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuthStore } from '@/stores/authStore'
import { X, Upload, Image as ImageIcon, Film } from 'lucide-react'

export interface UploadedFile {
  filePath: string
  fileName: string
  url: string
  mimeType: string
  order: number
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  onFileRemoved?: (index: number) => void
  clienteId?: string
  postId?: string
  maxSize?: number
  maxFiles?: number
  accept?: { [key: string]: string[] }
  className?: string
  value?: UploadedFile[]
}

export function FileUpload({ 
  onFilesUploaded,
  onFileRemoved,
  clienteId,
  postId,
  maxSize = 500 * 1024 * 1024, // 500MB
  maxFiles = 10,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.webm']
  },
  className = '',
  value = []
}: FileUploadProps) {
  const { token } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(value)
  const [error, setError] = useState<string | null>(null)

  // Track current previews so they can be revoked on unmount (avoid memory leak)
  const previewsRef = useRef<string[]>([])
  useEffect(() => {
    previewsRef.current = previews
  }, [previews])
  useEffect(() => {
    return () => {
      previewsRef.current.forEach(URL.revokeObjectURL)
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    // Revoke object URL to prevent memory leak
    if (previews[index]) {
      URL.revokeObjectURL(previews[index])
    }
    
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    const newProgress = progress.filter((_, i) => i !== index)
    const newUploaded = uploadedFiles.filter((_, i) => i !== index)
    
    setFiles(newFiles)
    setPreviews(newPreviews)
    setProgress(newProgress)
    setUploadedFiles(newUploaded)
    
    onFileRemoved?.(index)
    onFilesUploaded(newUploaded)
  }, [files, previews, progress, uploadedFiles, onFileRemoved, onFilesUploaded])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    // Check max files limit
    const totalFiles = files.length + acceptedFiles.length
    if (totalFiles > maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    // Clear previous error
    setError(null)
    
    // Create previews for all files
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
    const allFiles = [...files, ...acceptedFiles]
    const allPreviews = [...previews, ...newPreviews]
    
    setFiles(allFiles)
    setPreviews(allPreviews)
    setProgress(new Array(allFiles.length).fill(0))

    // Upload para o servidor
    setUploading(true)

    try {
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append('file', file)
      })

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          // Update progress for all uploading files
          setProgress(prev => {
            const newProgress = [...prev]
            for (let i = files.length; i < newProgress.length; i++) {
              newProgress[i] = percentComplete
            }
            return newProgress
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText)
          const newUploadedFiles: UploadedFile[] = response.data.files.map((file: any, index: number) => ({
            filePath: file.filePath,
            fileName: file.fileName,
            url: `/uploads/${file.filePath}`,
            mimeType: file.mimeType,
            order: uploadedFiles.length + index
          }))
          
          const allUploaded = [...uploadedFiles, ...newUploadedFiles]
          setUploadedFiles(allUploaded)
          onFilesUploaded(allUploaded)
          setProgress(new Array(allUploaded.length).fill(100))
        } else {
          setError('Erro no upload')
          // Remove failed files from preview
          newPreviews.forEach(URL.revokeObjectURL)
          setFiles(files)
          setPreviews(previews)
        }
        setUploading(false)
      })

      xhr.addEventListener('error', () => {
        setError('Erro de conexão')
        newPreviews.forEach(URL.revokeObjectURL)
        setFiles(files)
        setPreviews(previews)
        setUploading(false)
      })

      // Construir URL com query params
      const params = new URLSearchParams()
      if (clienteId) params.append('clienteId', clienteId)
      if (postId) params.append('postId', postId)
      const url = `/api/upload-multiple${params.toString() ? `?${params.toString()}` : ''}`
      
      xhr.open('POST', url)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    } catch (err) {
      setError('Erro ao fazer upload')
      newPreviews.forEach(URL.revokeObjectURL)
      setFiles(files)
      setPreviews(previews)
      setUploading(false)
    }
  }, [files, previews, uploadedFiles, token, clienteId, postId, maxFiles, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple: true,
    disabled: uploading || uploadedFiles.length >= maxFiles
  })

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isVideo = (mimeType: string) => mimeType.startsWith('video/')

  return (
    <div className={`w-full ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading || uploadedFiles.length >= maxFiles ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="text-gray-500">
          <Upload className="mx-auto h-12 w-12 mb-2" />
          <p className="font-medium">
            {uploadedFiles.length >= maxFiles 
              ? `Limite de ${maxFiles} arquivos atingido` 
              : 'Arraste arquivos aqui ou clique para selecionar'}
          </p>
          <p className="text-sm mt-1 text-gray-400">
            {uploadedFiles.length}/{maxFiles} arquivos • Imagens e vídeos até 500MB
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => {
            const file = files[index]
            const isUploaded = index < uploadedFiles.length
            const fileProgress = progress[index] || 0
            
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {isUploaded && uploadedFiles[index] ? (
                    // Use server URL after upload
                    isImage(uploadedFiles[index].mimeType) ? (
                      <img 
                        src={uploadedFiles[index].url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Film className="w-8 h-8 text-white" />
                      </div>
                    )
                  ) : file && isImage(file.type) ? (
                    // Local preview before upload
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : file && isVideo(file.type) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Film className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Film className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  {/* Progress overlay */}
                  {!isUploaded && uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-16">
                        <div className="bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all"
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                        <p className="text-white text-xs text-center mt-1">{Math.round(fileProgress)}%</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Order indicator */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* File type indicator */}
                  <div className="absolute bottom-2 right-2">
                    {file && isImage(file.type) ? (
                      <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                    ) : (
                      <Film className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </div>
                </div>
                
                {/* File name */}
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {file?.name || uploadedFiles[index]?.fileName}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
