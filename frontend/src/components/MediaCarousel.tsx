import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface MediaItem {
  url: string
  mimeType: string
}

interface MediaCarouselProps {
  media: MediaItem[]
  aspectRatio?: '1:1' | '4:5' | '9:16' | '3:4'
  showDots?: boolean
  showArrows?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

export function MediaCarousel({
  media,
  aspectRatio = '4:5',
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = ''
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isVideo = (mimeType: string) => mimeType.startsWith('video/')

  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '9:16': 'aspect-[9/16]',
    '3:4': 'aspect-[3/4]'
  }[aspectRatio]

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }, [media.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || media.length <= 1) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isPlaying, autoPlayInterval, goToNext, media.length])

  // Keep currentIndex within bounds when media list shrinks
  useEffect(() => {
    if (currentIndex > media.length - 1) {
      setCurrentIndex(Math.max(0, media.length - 1))
    }
  }, [media.length, currentIndex])

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsPlaying(false)
  const handleMouseLeave = () => setIsPlaying(autoPlay)

  const currentMedia = media[currentIndex]

  if (!media || media.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${aspectRatioClass} ${className}`}>
        <p className="text-gray-400">Sem mídia</p>
      </div>
    )
  }

  return (
    <div 
      className={`relative group overflow-hidden ${className}`}
      style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main media display */}
      <div className={`relative overflow-hidden bg-black ${aspectRatioClass} flex items-center justify-center`} style={{ width: '100%', maxWidth: '100%' }}>
        {isImage(currentMedia.mimeType) ? (
          <img
            src={currentMedia.url}
            alt={`Mídia ${currentIndex + 1} de ${media.length}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : isVideo(currentMedia.mimeType) ? (
          <video
            src={currentMedia.url}
            controls
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onPlay={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(autoPlay)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-white">Formato não suportado</p>
          </div>
        )}

        {/* Media counter overlay */}
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Navigation arrows */}
        {showArrows && media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-lg"
              aria-label="Mídia anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-lg"
              aria-label="Próxima mídia"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots navigation */}
      {showDots && media.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-200 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-blue-600'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir para mídia ${index + 1}`}
            >
              <span className="sr-only">Mídia {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
