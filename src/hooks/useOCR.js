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
    const Tesseract = (await import('tesseract.js')).default;

    // 1. יוצרים את ה-Worker ללא ה-logger בשלב הראשון כדי למנוע את שגיאת ה-Clone
    const worker = await Tesseract.createWorker({
      // הנתיב לתיקיית המודלים בתוך public
      langPath: window.location.origin + '/tessdata', 
      
      // הגדרת ה-Gzip כ-false כי המודלים שהורדת הם קבצי .traineddata רגילים
      gzip: false, 
      
      // במקום להעביר את ה-logger כאן, אנחנו נגדיר אותו בשלב הבא אם הגרסה תומכת,
      // או שפשוט נוותר עליו אם הוא גורם לשגיאות קריטיות.
    });

    try {
      // 2. הגדרת הלוגר בצורה בטוחה יותר (אם זה עדיין זורק שגיאה, אפשר למחוק את השורה הזו)
      if (onProgress) {
        worker.setLogger((m) => {
          if (m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100));
          }
        });
      }

      // 3. טעינת השפות (עברית + רש"י)
      await worker.loadLanguage('heb+heb_rashi');
      
      // 4. אתחול המנוע
      await worker.initialize('heb+heb_rashi');

      // 5. ביצוע ה-OCR
      const { data: { text } } = await worker.recognize(croppedBlob);
      
      // 6. סגירת ה-Worker
      await worker.terminate();

      return text.trim();

    } catch (error) {
      console.error('Tesseract Error:', error);
      if (worker) await worker.terminate();
      throw new Error('נכשל בזיהוי טקסט (Tesseract)');
    }
  };

  // בתוך ה-Hook useOCR
  const performOCRWin = async (croppedBlob) => {
    // 1. יוצרים טופס וירטואלי
    const formData = new FormData();
    // 2. שמים בפנים את חתיכת התמונה שגזרנו
    formData.append('file', croppedBlob);

    // 3. שולחים את הטופס ל-API שלנו
    const response = await fetch('/api/ocrwin', {
      method: 'POST',
      // שים לב: לא שמים Headers של Content-Type, ה-fetch יודע לזהות לבד שזה FormData
      body: formData
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'OCRWIN failed');
    }
    return result.text;
  };

  return {
    isProcessing,
    setIsProcessing,
    performGeminiOCR,
    performTesseractOCR,
    performOCRWin // ייצוא הפונקציה החדשה
  }
}