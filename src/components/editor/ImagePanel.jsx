import { useRef, useEffect, useState } from 'react'

export default function ImagePanel({
  thumbnailUrl,
  pageNumber,
  imageZoom,
  isSelectionMode,
  selectionStart,
  selectionEnd,
  selectionRect,
  setSelectionStart,
  setSelectionEnd,
  setSelectionRect,
  layoutOrientation,
  imagePanelWidth,
  isResizing,
  handleResizeStart,
  rotation = 0,
  setRotation
}) {
  const imageContainerRef = useRef(null)
  const autoScrollRef = useRef(null)
  const contentRef = useRef(null)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    if (!isRotating) return

    const handleRotateMove = (e) => {
      if (!contentRef.current) return
      
      const rect = contentRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const radians = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const degrees = radians * (180 / Math.PI)
      
      setRotation(degrees + 90)
    }

    const handleRotateUp = () => {
      setIsRotating(false)
      document.body.style.cursor = 'default'
    }

    document.addEventListener('mousemove', handleRotateMove)
    document.addEventListener('mouseup', handleRotateUp)

    return () => {
      document.removeEventListener('mousemove', handleRotateMove)
      document.removeEventListener('mouseup', handleRotateUp)
    }
  }, [isRotating, setRotation])

  const handleRotationStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRotating(true)
    document.body.style.cursor = 'grabbing'
  }

  const rotateLeft = (e) => {
    e.stopPropagation()
    setRotation(prev => Math.round((prev - 0.1) * 10) / 10)
  }

  const rotateRight = (e) => {
    e.stopPropagation()
    setRotation(prev => Math.round((prev + 0.1) * 10) / 10)
  }

  const getImageCoordinates = (e, img) => {
    const container = img.parentElement
    const containerRect = container.getBoundingClientRect()
    const containerX = e.clientX - containerRect.left
    const containerY = e.clientY - containerRect.top
    const scale = imageZoom / 100
    const displayX = containerX 
    const displayY = containerY
    const x = (displayX / scale)
    const y = (displayY / scale)
    return { x, y, displayX, displayY }
  }

  const handleMouseDown = (e) => {
    if (isRotating || !isSelectionMode || e.target.classList.contains('selection-overlay') || e.target.closest('.rotation-controls')) return
    
    e.preventDefault()
    e.stopPropagation()
    const img = e.currentTarget.querySelector('img')
    if (!img) return
    const coords = getImageCoordinates(e, img)
    const scale = imageZoom / 100
    if (coords.displayX < 0 || coords.displayY < 0 || coords.displayX > img.naturalWidth * scale || coords.displayY > img.naturalHeight * scale) return
    setSelectionStart(coords)
    setSelectionEnd(coords)
    setSelectionRect(null)
  }

  const handleMouseMove = (e) => {
    if (isRotating || !isSelectionMode || !selectionStart) return
    e.preventDefault()
    e.stopPropagation()
    const img = e.currentTarget.querySelector('img')
    if (!img) return
    const coords = getImageCoordinates(e, img)
    setSelectionEnd(coords)

    const scrollContainer = imageContainerRef.current
    if (!scrollContainer) return
    const rect = scrollContainer.getBoundingClientRect()
    const threshold = 50
    const speed = 15
    let scrollX = 0, scrollY = 0

    if (e.clientY < rect.top + threshold) scrollY = -speed
    else if (e.clientY > rect.bottom - threshold) scrollY = speed
    if (e.clientX < rect.left + threshold) scrollX = -speed
    else if (e.clientX > rect.right - threshold) scrollX = speed

    if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    if (scrollX !== 0 || scrollY !== 0) {
      autoScrollRef.current = setInterval(() => {
        if (scrollX) scrollContainer.scrollLeft += scrollX
        if (scrollY) scrollContainer.scrollTop += scrollY
      }, 16)
    }
  }

  const handleMouseUp = (e) => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current)
      autoScrollRef.current = null
    }
    if (isRotating || !isSelectionMode || !selectionStart || !selectionEnd) return
    e.preventDefault()
    e.stopPropagation()

    const container = e.currentTarget
    const containerRect = container.getBoundingClientRect()
    const minDisplayX = Math.min(selectionStart.displayX, selectionEnd.displayX)
    const maxDisplayX = Math.max(selectionStart.displayX, selectionEnd.displayX)
    const minDisplayY = Math.min(selectionStart.displayY, selectionEnd.displayY)
    const maxDisplayY = Math.max(selectionStart.displayY, selectionEnd.displayY)
    const displayWidth = maxDisplayX - minDisplayX
    const displayHeight = maxDisplayY - minDisplayY

    if (displayWidth < 20 || displayHeight < 20) {
      setSelectionStart(null)
      setSelectionEnd(null)
      return
    }

    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)

    setSelectionRect({
      displayX: containerRect.width - maxDisplayX,
      displayY: minDisplayY,
      displayWidth,
      displayHeight,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    })
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  return (
    <>
      <div
        ref={imageContainerRef}
        className="overflow-auto p-4 bg-gray-50/50 relative block"
        style={{
          width: layoutOrientation === 'horizontal' ? '100%' : `${imagePanelWidth}%`,
          height: layoutOrientation === 'horizontal' ? `${imagePanelWidth}%` : 'auto',
          flexShrink: 0
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {thumbnailUrl ? (
          <div 
            className="relative mx-auto flex items-center justify-center min-h-full"
            style={{ 
              width: 'fit-content',
              paddingTop: '0px',
              paddingBottom: '40px'
            }}
          >
            <div
              ref={contentRef}
              className="inline-block relative transition-transform duration-75 ease-linear group"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ 
                transform: `scale(${imageZoom / 100}) rotate(${rotation}deg)`,
                cursor: isSelectionMode ? 'crosshair' : 'default',
                transformOrigin: 'center center',
                willChange: 'transform'
              }}
            >
              <div 
                className="rotation-controls absolute top-2 left-1/2 flex items-center gap-2 z-[100] opacity-0 group-hover:opacity-100 transition-opacity" // top-2 (בתוך התמונה), z-[100] (גובר על הכל)
                style={{ transform: `translateX(-50%) scale(${100 / imageZoom})` }}
              >

                <button 
                  className="w-4 h-4 bg-gray-600/90 border border-gray-100 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors font-bold leading-none pb-0.5 backdrop-blur-sm"
                  onMouseDown={rotateRight}
                  title="סובב 0.1° ימינה"
                >
                  <span>&lt;</span>
                </button>

                <div 
                  className="rotation-handle relative w-8 h-8 bg-gray-800/90 border border-gray-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg backdrop-blur-sm"
                  onMouseDown={handleRotationStart}
                  title="גרור לסיבוב חופשי"
                >
                   <span className="material-symbols-outlined text-white text-sm">sync</span>
                   <div className="absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/40 pointer-events-none"></div>
                   
                   {(isRotating || rotation !== 0) && (
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap dir-ltr shadow-md border border-gray-700">
                       {Number(rotation).toFixed(1)}°
                     </div>
                   )}
                </div>

                <button 
                  className="w-4 h-4 bg-gray-600/90 border border-gray-100 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors font-bold leading-none pb-0.5 backdrop-blur-sm"
                  onMouseDown={rotateLeft}
                  title="סובב 0.1° שמאלה"
                >
                  <span>&gt;</span>
                </button>
              </div>

              <img
                src={thumbnailUrl}
                alt={`עמוד ${pageNumber}`}
                className="rounded-lg shadow-lg select-none block"
                style={{
                  maxWidth: 'none',
                  pointerEvents: 'none'
                }}
                onDragStart={(e) => e.preventDefault()}
              />
              
              {isSelectionMode && selectionStart && selectionEnd && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none selection-overlay"
                  style={{
                    left: `${Math.min(selectionStart.displayX, selectionEnd.displayX)}px`,
                    top: `${Math.min(selectionStart.displayY, selectionEnd.displayY)}px`,
                    width: `${Math.abs(selectionStart.displayX - selectionEnd.displayX)}px`,
                    height: `${Math.abs(selectionStart.displayY - selectionEnd.displayY)}px`
                  }}
                />
              )}
              {selectionRect && (
                <div
                  className="absolute border-4 border-green-500 bg-green-500/10 pointer-events-none animate-pulse selection-overlay"
                  style={{
                    left: `${selectionRect.x * (imageZoom / 100)}px`,
                    top: `${selectionRect.y * (imageZoom / 100)}px`,
                    width: `${selectionRect.width * (imageZoom / 100)}px`,
                    height: `${selectionRect.height * (imageZoom / 100)}px`
                  }}
                >
                  <div 
                    className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
                    style={{ transform: `scale(${100 / imageZoom})`, transformOrigin: 'bottom right' }}
                  >
                    ✓ אזור נבחר
                  </div>
                </div>
              )}
            </div>
            
            {isSelectionMode && !selectionRect && !selectionStart && !isRotating && (
              <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse pointer-events-none z-50">
                <span className="material-symbols-outlined text-lg">crop_free</span>
                <span>סמן אזור לזיהוי</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full bg-surface rounded-lg w-full">
            <div className="text-center">
              <span className="material-symbols-outlined text-9xl text-on-surface/20 block mb-4">description</span>
              <p className="text-on-surface/60">אין תמונה זמינה</p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`relative flex items-center justify-center hover:bg-primary/10 transition-colors ${layoutOrientation === 'horizontal' ? 'cursor-row-resize' : 'cursor-col-resize'}`}
        style={{
          width: layoutOrientation === 'horizontal' ? '100%' : '8px',
          height: layoutOrientation === 'horizontal' ? '8px' : 'auto',
          backgroundColor: isResizing ? 'rgba(107, 93, 79, 0.2)' : 'transparent',
          flexShrink: 0,
          zIndex: 50
        }}
        onMouseDown={handleResizeStart}
      >
        <div
          className="absolute bg-surface-variant rounded-full"
          style={{
            width: layoutOrientation === 'horizontal' ? '32px' : '4px',
            height: layoutOrientation === 'horizontal' ? '4px' : '32px'
          }}
        ></div>
      </div>
    </>
  )
}
