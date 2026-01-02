import { useState } from 'react'

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)

  const performGeminiOCR = async (croppedBlob, apiKey, model, prompt) => {
    const reader = new FileReader()
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(croppedBlob)
    })

    const imageBase64 = await base64Promise

    const response = await fetch('/api/gemini-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        model,
        userApiKey: apiKey || undefined,
        customPrompt: prompt || undefined
      })
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Gemini OCR failed')
    }
    return result.text
  }

  const performTesseractOCR = async (croppedBlob, onProgress) => {
    const Tesseract = (await import('tesseract.js')).default
    const result = await Tesseract.recognize(
      croppedBlob,
      'heb',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100))
          }
        }
      }
    )
    return result.data.text.trim()
  }

  return {
    isProcessing,
    setIsProcessing,
    performGeminiOCR,
    performTesseractOCR
  }
}