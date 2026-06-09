import { Injectable } from '@angular/core';
import { uploadData, getUrl } from 'aws-amplify/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async upload(file: File): Promise<string> {
    console.log('Uploading file:', file);
    const s3Key = `patterns/${file.name}`;
    const result = await uploadData({
      path: s3Key,
      data: file,
      options: { contentType: file.type },
    }).result;
    console.log('Upload result:', result);
    return s3Key;
  }

  async getUrl(s3Key: string): Promise<string> {
    const { url } = await getUrl({
      path: s3Key,
      options: { validateObjectExistence: false },
    });
    return url.toString();
  }
}
