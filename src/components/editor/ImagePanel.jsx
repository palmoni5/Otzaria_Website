import { useRef, useEffect, useState } from 'react'

export default function ImagePanel({
  thumbnailUrl,
  pageNumber,
  handleOCRSelection,
  isOcrProcessing,
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
  const wrapperRef = useRef(null)
  const imageRef = useRef(null)
  const [isRotating, setIsRotating] = useState(false)

  const [interactionMode, setInteractionMode] = useState(null)
  const [activeHandle, setActiveHandle] = useState(null)
  
  const dragStartRef = useRef({
    x: 0, y: 0, 
    rectX: 0, rectY: 0, 
    rectW: 0, rectH: 0
  })

  useEffect(() => {
    if (!isRotating) return
    const handleRotateMove = (e) => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
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
    e.preventDefault(); e.stopPropagation();
    setIsRotating(true); document.body.style.cursor = 'grabbing';
  }
  const rotateLeft = (e) => { e.stopPropagation(); setRotation(prev => Math.round((prev - 0.1) * 10) / 10) }
  const rotateRight = (e) => { e.stopPropagation(); setRotation(prev => Math.round((prev + 0.1) * 10) / 10) }

  const getWrapperCoordinates = (e) => {
    if (!wrapperRef.current) return { x: 0, y: 0 }
    const containerRect = wrapperRef.current.getBoundingClientRect()
    const scale = imageZoom / 100
    return {
      x: (e.clientX - containerRect.left) / scale,
      y: (e.clientY - containerRect.top) / scale
    }
  }

  const handleMouseDownCreate = (e) => {
    if (isRotating || !isSelectionMode || e.target.closest('.rotation-controls')) return
    if (e.target.closest('.selection-box') || e.target.tagName === 'BUTTON') return

    e.preventDefault()
    e.stopPropagation()
    
    const coords = getWrapperCoordinates(e)
    setSelectionStart(coords)
    setSelectionEnd(coords)
    setSelectionRect(null) // איפוס בחירה קיימת
    setInteractionMode('create')
  }

  const handleMouseDownMove = (e) => {
    if (!selectionRect) return
    e.preventDefault()
    e.stopPropagation()
    
    const coords = getWrapperCoordinates(e)
    dragStartRef.current = {
      x: coords.x,
      y: coords.y,
      rectX: selectionRect.x,
      rectY: selectionRect.y,
      rectW: selectionRect.width,
      rectH: selectionRect.height
    }
    setInteractionMode('move')
  }

  const handleMouseDownResize = (e, handle) => {
    e.preventDefault()
    e.stopPropagation()
    
    const coords = getWrapperCoordinates(e)
    dragStartRef.current = {
      x: coords.x,
      y: coords.y,
      rectX: selectionRect.x,
      rectY: selectionRect.y,
      rectW: selectionRect.width,
      rectH: selectionRect.height
    }
    setActiveHandle(handle)
    setInteractionMode('resize')
  }

  const handleMouseMove = (e) => {
    if (!interactionMode) return
    e.preventDefault()
    e.stopPropagation()
    
    const currentPos = getWrapperCoordinates(e)
    
    if (interactionMode === 'create') {
      setSelectionEnd(currentPos)
      handleAutoScroll(e) 
    }
    
    else if (interactionMode === 'move') {
      const deltaX = currentPos.x - dragStartRef.current.x
      const deltaY = currentPos.y - dragStartRef.current.y
      
      setSelectionRect({
        ...selectionRect,
        x: dragStartRef.current.rectX + deltaX,
        y: dragStartRef.current.rectY + deltaY,
        width: dragStartRef.current.rectW,
        height: dragStartRef.current.rectH
      })
    }
    
    else if (interactionMode === 'resize') {
        const deltaX = currentPos.x - dragStartRef.current.x
        const deltaY = currentPos.y - dragStartRef.current.y
        const start = dragStartRef.current

        let newX = start.rectX
        let newY = start.rectY
        let newW = start.rectW
        let newH = start.rectH

        // חישוב לפי הידית הנבחרת
        if (activeHandle.includes('w')) {
            newW = start.rectW - deltaX
            newX = start.rectX + deltaX
        }
        if (activeHandle.includes('e')) { 
            newW = start.rectW + deltaX
        }
        if (activeHandle.includes('n')) { 
            newH = start.rectH - deltaY
            newY = start.rectY + deltaY
        }
        if (activeHandle.includes('s')) { 
            newH = start.rectH + deltaY
        }

        if (newW < 10) { 
           if (activeHandle.includes('w')) newX = start.rectX + start.rectW - 10; 
           newW = 10; 
        }
        if (newH < 10) {
           if (activeHandle.includes('n')) newY = start.rectY + start.rectH - 10;
           newH = 10;
        }

        setSelectionRect({
            x: newX, y: newY, width: newW, height: newH
        })
    }
  }

  const handleAutoScroll = (e) => {
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
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null }
    
    if (interactionMode === 'create' && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x)
      const maxX = Math.max(selectionStart.x, selectionEnd.x)
      const minY = Math.min(selectionStart.y, selectionEnd.y)
      const maxY = Math.max(selectionStart.y, selectionEnd.y)
      
      const width = maxX - minX
      const height = maxY - minY

      if (width > 5 && height > 5) {
        setSelectionRect({ x: minX, y: minY, width, height })
      }
      setSelectionStart(null)
      setSelectionEnd(null)
    }
    
    setInteractionMode(null)
    setActiveHandle(null)
  }

  const ResizeHandle = ({ cursor, position, handle }) => (
    <div
      onMouseDown={(e) => handleMouseDownResize(e, handle)}
      className={`absolute w-3 h-3 bg-white border border-blue-600 rounded-full z-20 hover:bg-blue-100 ${position}`}
      style={{ 
        cursor: cursor,
        transform: `scale(${100 / imageZoom})`
      }}
    />
  )

  return (
    <>
      <div
        ref={imageContainerRef}
        className="overflow-auto p-4 bg-gray-50/50 relative block select-none"
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
            style={{ width: 'fit-content', paddingBottom: '40px' }}
          >
            <div
              ref={wrapperRef}
              className="inline-block relative transition-transform duration-75 ease-linear group select-none"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onMouseDown={handleMouseDownCreate} 
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} 
              style={{ 
                transform: `scale(${imageZoom / 100})`,
                cursor: interactionMode === 'create' ? 'crosshair' : 'default',
                transformOrigin: 'center center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none'
              }}
            >
              
              <div 
                style={{ 
                    transform: `rotate(${rotation}deg)`, 
                    transition: isRotating ? 'none' : 'transform 0.1s ease-out',
                    position: 'relative'
                }}
              >
                  <div className="rotation-controls absolute top-2 left-1/2 flex items-center gap-2 z-[100] opacity-0 group-hover:opacity-100 transition-opacity"
                       style={{ transform: `translateX(-50%) scale(${100 / imageZoom})` }}>
                     <button className="w-4 h-4 bg-gray-600/90 border border-gray-100 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm" onMouseDown={rotateRight}>&lt;</button>
                     
                     <div className="rotation-handle relative w-8 h-8 bg-gray-800/90 border border-gray-600 rounded-full flex items-center justify-center cursor-grab backdrop-blur-sm" onMouseDown={handleRotationStart}>
                        <span className="material-symbols-outlined text-white text-sm">sync</span>
                        
                        {(isRotating || rotation !== 0) && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap dir-ltr shadow-md border border-gray-700">
                            {Number(rotation).toFixed(1)}°
                          </div>
                        )}
                     </div>

                     <button className="w-4 h-4 bg-gray-600/90 border border-gray-100 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm" onMouseDown={rotateLeft}>&gt;</button>
                  </div>

                  <img
                    ref={imageRef}
                    src={thumbnailUrl}
                    alt={`עמוד ${pageNumber}`}
                    className="rounded-lg shadow-lg block select-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ maxWidth: 'none', pointerEvents: 'none', userSelect: 'none' }}
                  />
              </div>
              
              {interactionMode === 'create' && selectionStart && selectionEnd && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                  style={{
                    left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                    top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                    width: `${Math.abs(selectionStart.x - selectionEnd.x)}px`,
                    height: `${Math.abs(selectionStart.y - selectionEnd.y)}px`
                  }}
                />
              )}

              {selectionRect && (
                <div
                  className="selection-box absolute border-2 border-green-500 bg-green-500/10 group/box"
                  style={{
                    left: `${selectionRect.x}px`,
                    top: `${selectionRect.y}px`,
                    width: `${selectionRect.width}px`,
                    height: `${selectionRect.height}px`,
                    cursor: 'move'
                  }}
                  onMouseDown={handleMouseDownMove}
                >
                  {/* ידיות שינוי גודל (Resize Handles) */}
                  <ResizeHandle cursor="nw-resize" position="-top-1.5 -left-1.5" handle="nw" />
                  <ResizeHandle cursor="n-resize" position="-top-1.5 left-1/2 -translate-x-1/2" handle="n" />
                  <ResizeHandle cursor="ne-resize" position="-top-1.5 -right-1.5" handle="ne" />
                  <ResizeHandle cursor="e-resize" position="top-1/2 -translate-y-1/2 -right-1.5" handle="e" />
                  <ResizeHandle cursor="se-resize" position="-bottom-1.5 -right-1.5" handle="se" />
                  <ResizeHandle cursor="s-resize" position="-bottom-1.5 left-1/2 -translate-x-1/2" handle="s" />
                  <ResizeHandle cursor="sw-resize" position="-bottom-1.5 -left-1.5" handle="sw" />
                  <ResizeHandle cursor="w-resize" position="top-1/2 -translate-y-1/2 -left-1.5" handle="w" />

                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); handleOCRSelection(); }}
                    disabled={isOcrProcessing}
                    className="absolute bottom-0 right-0 translate-y-full mt-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center p-1 rounded shadow-md pointer-events-auto transition-colors disabled:opacity-50 z-30"
                    title="זהה טקסט"
                    style={{ transform: `scale(${100 / imageZoom})`, transformOrigin: 'top right', cursor: 'pointer' }}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isOcrProcessing ? 'animate-spin' : ''}`}>
                      {isOcrProcessing ? 'progress_activity' : 'check'}
                    </span>
                  </button>
                </div>
              )}

            </div>
            
            {isSelectionMode && !selectionRect && interactionMode !== 'create' && (
              <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse pointer-events-none z-50">
                <span className="material-symbols-outlined text-lg">crop_free</span>
                <span>סמן אזור לזיהוי</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full bg-surface rounded-lg w-full">
            <p className="text-on-surface/60">אין תמונה זמינה</p>
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
         <div className="absolute bg-surface-variant rounded-full" style={{ width: layoutOrientation === 'horizontal' ? '32px' : '4px', height: layoutOrientation === 'horizontal' ? '4px' : '32px' }}></div>
      </div>
    </>
  )
}