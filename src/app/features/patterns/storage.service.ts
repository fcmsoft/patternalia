import { Injectable } from '@angular/core';
import { uploadData, getUrl } from 'aws-amplify/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async upload(file: File): Promise<string> {
    console.log('Uploading file:', file);
    const s3Key = `patterns/${file.name}`;
    try {
      const result = await uploadData({
        path: s3Key,
        data: file,
        options: { contentType: file.type },
      }).result;
      console.log('Upload result:', result);
      return s3Key;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async getUrl(s3Key: string): Promise<string> {
    const { url } = await getUrl({
      path: s3Key,
      options: { validateObjectExistence: false },
    });
    return url.toString();
  }

  async getUrlIfExists(s3Key: string): Promise<string | null> {
    try {
      const { url } = await getUrl({
        path: s3Key,
        options: { validateObjectExistence: true },
      });
      return url.toString();
    } catch {
      return null;
    }
  }

  async uploadBlob(s3Key: string, blob: Blob, contentType: string): Promise<void> {
    await uploadData({
      path: s3Key,
      data: blob,
      options: { contentType },
    }).result;
  }

  /** Key under which the user's annotated copy of a pattern PDF is stored. */
  annotatedKey(s3Key: string): string {
    return s3Key.startsWith('patterns/')
      ? s3Key.replace('patterns/', 'annotated/')
      : `annotated/${s3Key}`;
  }
}
