// Utilitários para manipulação de URLs do Google Drive

// Extrai o ID do arquivo do Google Drive de qualquer formato de URL
export const extractGoogleDriveFileId = (url: string): string | null => {
  // Padrão: https://drive.google.com/file/d/FILE_ID/view ou /preview
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveFileMatch) return driveFileMatch[1]
  
  // Padrão: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (driveOpenMatch) return driveOpenMatch[1]

  // Padrão: https://drive.google.com/uc?id=FILE_ID ou export=download
  const driveUcMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (driveUcMatch) return driveUcMatch[1]
  
  // Padrão: https://drive.google.com/drive/folders/FOLDER_ID (pastas não são suportadas)
  if (url.includes('/folders/')) {
    console.warn('⚠️ URLs de pastas do Google Drive não são suportadas. Use o link direto do arquivo.')
    return null
  }
  
  return null
}

// Normaliza URL do Google Drive para formato /view (padrão de armazenamento)
export const normalizeGoogleDriveUrl = (url: string): string => {
  const cleanUrl = url.replace('#video', '')
  const fileId = extractGoogleDriveFileId(cleanUrl)
  
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`
  }
  
  return cleanUrl
}

// Verifica se a URL tem marcador de vídeo
export const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || url.includes('#video')
}

// Converte URL para formato de preview
export const getPreviewUrl = (url: string): { 
  url: string
  isVideo: boolean
  isDriveFile: boolean
  useIframe: boolean 
} => {
  const cleanUrl = url.replace('#video', '')
  const fileId = extractGoogleDriveFileId(cleanUrl)
  const isVideo = isVideoUrl(url)
  
  if (fileId) {
    if (isVideo) {
      // Para vídeos, usar iframe com /preview
      return {
        url: `https://drive.google.com/file/d/${fileId}/preview`,
        isVideo: true,
        isDriveFile: true,
        useIframe: true
      }
    } else {
      // Para imagens, usar URL de thumbnail direto
      return {
        url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        isVideo: false,
        isDriveFile: true,
        useIframe: false
      }
    }
  }
  
  return { url: cleanUrl, isVideo, isDriveFile: false, useIframe: false }
}
