'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'אישור',
    cancelText: 'ביטול'
  })

  const showAlert = useCallback((title, message) => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: null,
      confirmText: 'הבנתי, סגור'
    })
  }, [])

  const showConfirm = useCallback((title, message, onConfirmAction, confirmText = 'אישור', cancelText = 'ביטול') => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: onConfirmAction,
      confirmText,
      cancelText
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm()
    }
    closeDialog()
  }, [dialogConfig.onConfirm, closeDialog])

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}

      {dialogConfig.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all duration-300"
          onClick={closeDialog}
        >
          <div 
            className="glass-strong p-8 rounded-2xl max-w-sm w-full shadow-2xl transform transition-all scale-100 border border-surface-variant/50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-inner ${
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

            <div className="flex gap-3 justify-center mt-2">
              {dialogConfig.type === 'confirm' && (
                <button 
                  onClick={closeDialog}
                  className="px-5 py-2.5 rounded-xl border border-surface-variant text-on-surface/70 hover:bg-surface-variant/30 hover:text-on-surface font-medium transition-all duration-200"
                >
                  {dialogConfig.cancelText}
                </button>
              )}
              
              <button 
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl text-on-primary font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ${
                  dialogConfig.type === 'confirm' 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'bg-secondary hover:bg-secondary/90'
                }`}
              >
                {dialogConfig.confirmText}
              </button>
            </div>
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