'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef(null)
  const closeTimerRef = useRef(null)
  
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'alert', 
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'אישור',
    cancelText: 'ביטול',
    timestamp: 0 
  })

  const clearAutoCloseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const showAlert = useCallback((title, message) => {
    clearAutoCloseTimer()
    clearCloseTimer()
    setIsVisible(true)
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: null,
      confirmText: 'הבנתי, סגור',
      timestamp: Date.now()
    })
  }, [clearAutoCloseTimer, clearCloseTimer])

  const showConfirm = useCallback((title, message, onConfirmAction, confirmText = 'אישור', cancelText = 'ביטול') => {
    clearAutoCloseTimer()
    clearCloseTimer()
    setIsVisible(true)
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: onConfirmAction,
      confirmText,
      cancelText,
      timestamp: Date.now()
    })
  }, [clearAutoCloseTimer, clearCloseTimer])

  const closeDialog = useCallback(() => {
    clearAutoCloseTimer()
    clearCloseTimer()
    setIsVisible(false)
    
    closeTimerRef.current = setTimeout(() => {
      setDialogConfig(prev => ({ ...prev, isOpen: false }))
    }, 300)
  }, [clearAutoCloseTimer, clearCloseTimer])

  const handleConfirm = useCallback(() => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm()
    }
    closeDialog()
  }, [dialogConfig.onConfirm, closeDialog])

  useEffect(() => {
    if (dialogConfig.isOpen) {
      const animationTimer = setTimeout(() => setIsVisible(true), 10)
      
      if (dialogConfig.type === 'alert') {
        clearAutoCloseTimer()
        
        timerRef.current = setTimeout(() => {
          closeDialog()
        }, 2500)
      }

      return () => {
        clearTimeout(animationTimer)
        clearAutoCloseTimer()
      }
    }
  }, [dialogConfig.isOpen, dialogConfig.type, dialogConfig.timestamp, closeDialog, clearAutoCloseTimer])

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-bar {
          animation: shrinkWidth 2.5s linear forwards;
        }
      `}</style>

      {children}

      {dialogConfig.isOpen && (
        <div 
          className={`fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeDialog}
        >
          <div 
            className={`glass-strong p-8 rounded-2xl max-w-sm w-full shadow-2xl border border-surface-variant/50 transform transition-all duration-300 ease-out relative overflow-hidden ${
              isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-inner transition-transform duration-500 ${
                isVisible ? 'scale-100 rotate-0' : 'scale-0 -rotate-180'
              } ${
                dialogConfig.type === 'confirm' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary/10 text-secondary'
              }`}>
                <span className="material-symbols-outlined text-[32px]">
                  {dialogConfig.type === 'confirm' ? 'help' : 'info'}
                </span>
              </div>
              
              <h3 className="text-xl font-frank font-bold text-on-surface mb-2 tracking-wide">
                {dialogConfig.title}
              </h3>
              
              <p className="text-on-surface/80 text-base leading-relaxed whitespace-pre-line">
                {dialogConfig.message}
              </p>
            </div>

            <div className="flex gap-3 justify-center mt-2 z-10 relative">
              {dialogConfig.type === 'confirm' ? (
                <>
                  <button 
                    onClick={closeDialog}
                    className="px-5 py-2.5 rounded-xl border border-surface-variant text-on-surface/70 hover:bg-surface-variant/30 hover:text-on-surface font-medium transition-all duration-200"
                  >
                    {dialogConfig.cancelText}
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="px-6 py-2.5 rounded-xl text-on-primary font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 bg-primary hover:bg-primary/90"
                  >
                    {dialogConfig.confirmText}
                  </button>
                </>
              ) : (
                <button 
                  onClick={closeDialog}
                  className="px-6 py-2.5 rounded-xl text-on-primary font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 bg-secondary hover:bg-secondary/90"
                >
                  {dialogConfig.confirmText}
                </button>
              )}
            </div>
            
            {dialogConfig.type === 'alert' && (
               <div className="absolute bottom-0 left-0 h-1 bg-secondary/30 w-full">
                  <div 
                    key={dialogConfig.timestamp} 
                    className="h-full bg-secondary animate-progress-bar"
                  />
               </div>
            )}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}