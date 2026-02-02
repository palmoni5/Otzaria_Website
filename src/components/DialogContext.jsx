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

  const handleConfirm = () => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm()
    }
    closeDialog()
  }

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}

      {dialogConfig.isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeDialog}
        >
          <div 
            className="bg-white/90 dark:bg-gray-800/90 border border-white/20 backdrop-blur-xl p-6 rounded-2xl max-w-sm w-full shadow-2xl transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                dialogConfig.type === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="material-symbols-outlined text-2xl">
                  {dialogConfig.type === 'confirm' ? 'help' : 'info'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {dialogConfig.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {dialogConfig.message}
              </p>
            </div>

            <div className="flex gap-3 justify-center mt-6">
              {dialogConfig.type === 'confirm' && (
                <button 
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                >
                  {dialogConfig.cancelText}
                </button>
              )}
              
              <button 
                onClick={handleConfirm}
                className={`px-6 py-2 rounded-lg text-white text-sm font-medium shadow-md transition-colors ${
                  dialogConfig.type === 'confirm' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-800 hover:bg-gray-900'
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