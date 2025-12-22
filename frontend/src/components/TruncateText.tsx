import React, { useState } from 'react'

interface TruncateTextProps {
  text: string
  maxLength?: number
  className?: string
}

export const TruncateText: React.FC<TruncateTextProps> = ({ 
  text, 
  maxLength = 100, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text.length <= maxLength) {
    return <span className={className}>{text}</span>
  }

  const truncatedText = text.substring(0, maxLength) + '...'

  return (
    <div className={`${className} block`}>
      {isExpanded ? (
        <span className="block">{text}</span>
      ) : (
        <span className="block">{truncatedText}</span>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium underline block"
      >
        {isExpanded ? 'mostrar menos' : 'mostrar mais'}
      </button>
    </div>
  )
}
