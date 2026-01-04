'use server'

import { writeFile } from 'fs/promises';
import path from 'path';

export async function uploadFileAction(formData) {
  try {
    const file = formData.get('file');

    if (!file) {
      return { success: false, error: "No file found" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // שמירת הקובץ בתיקיית השורש של הפרויקט
    const filePath = path.join(process.cwd(), file.name);
    await writeFile(filePath, buffer);

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}