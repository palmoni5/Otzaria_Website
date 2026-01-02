import { useRef, useEffect } from 'react'

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
  handleResizeStart
}) {
  const imageContainerRef = useRef(null)
  const autoScrollRef = useRef(null)

  const getImageCoordinates = (e, img) => {
    const container = img.parentElement
    const containerRect = container.getBoundingClientRect()
    const containerX = e.clientX - containerRect.left
    const containerY = e.clientY - containerRect.top
    const scale = imageZoom / 100
    // RTL correction
    const displayX = containerRect.width - containerX
    const displayY = containerY
    const x = (displayX / scale)
    const y = (displayY / scale)
    return { x, y, displayX, displayY }
  }

  const handleMouseDown = (e) => {
    if (!isSelectionMode || e.target.classList.contains('selection-overlay')) return
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
    if (!isSelectionMode || !selectionStart) return
    e.preventDefault()
    e.stopPropagation()
    const img = e.currentTarget.querySelector('img')
    if (!img) return
    const coords = getImageCoordinates(e, img)
    setSelectionEnd(coords)

    // Auto scroll logic
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
    if (!isSelectionMode || !selectionStart || !selectionEnd) return
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
      alert('⚠️ האזור קטן מדי. אנא בחר אזור גדול יותר')
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
        className="overflow-auto p-4"
        style={{
          width: layoutOrientation === 'horizontal' ? '100%' : `${imagePanelWidth}%`,
          height: layoutOrientation === 'horizontal' ? `${imagePanelWidth}%` : 'auto',
          flexShrink: 0
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {thumbnailUrl ? (
          <div
            className="inline-block relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: isSelectionMode ? 'crosshair' : 'default' }}
          >
            <img
              src={thumbnailUrl}
              alt={`עמוד ${pageNumber}`}
              className="rounded-lg shadow-lg transition-all duration-200 select-none"
              style={{
                transform: `scale(${imageZoom / 100})`,
                transformOrigin: 'top right',
                maxWidth: 'none',
                pointerEvents: 'none'
              }}
              onDragStart={(e) => e.preventDefault()}
            />
            {isSelectionMode && selectionStart && selectionEnd && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none selection-overlay"
                style={{
                  right: `${Math.min(selectionStart.displayX, selectionEnd.displayX)}px`,
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
                  right: `${selectionRect.x * (imageZoom / 100)}px`,
                  top: `${selectionRect.y * (imageZoom / 100)}px`,
                  width: `${selectionRect.width * (imageZoom / 100)}px`,
                  height: `${selectionRect.height * (imageZoom / 100)}px`
                }}
              >
                <div className="absolute -top-8 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  ✓ אזור נבחר - לחץ זהה אזור
                </div>
              </div>
            )}
            {isSelectionMode && !selectionRect && !selectionStart && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse">
                <span className="material-symbols-outlined text-base">crop_free</span>
                <span>גרור לבחירת אזור</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full bg-surface rounded-lg">
            <div className="text-center">
              <span className="material-symbols-outlined text-9xl text-on-surface/20 block mb-4">description</span>
              <p className="text-on-surface/60">אין תמונה זמינה</p>
            </div>
          </div>
        )}
      </div>

      {/* Resizable Divider */}
      <div
        className={`relative flex items-center justify-center hover:bg-primary/10 transition-colors ${layoutOrientation === 'horizontal' ? 'cursor-row-resize' : 'cursor-col-resize'}`}
        style={{
          width: layoutOrientation === 'horizontal' ? '100%' : '8px',
          height: layoutOrientation === 'horizontal' ? '8px' : 'auto',
          backgroundColor: isResizing ? 'rgba(107, 93, 79, 0.2)' : 'transparent',
          flexShrink: 0
        }}
        onMouseDown={handleResizeStart}
      >
        <div
          className="absolute bg-surface-variant rounded-full"
          style={{
            width: layoutOrientation === 'horizontal' ? '12px' : '1px',
            height: layoutOrientation === 'horizontal' ? '1px' : '12px'
          }}
        ></div>
      </div>
    </>
  )
}