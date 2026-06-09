import { Injectable } from '@angular/core';
import { uploadData, getUrl } from 'aws-amplify/storage';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async upload(patternId: string, file: File): Promise<string> {
    const s3Key = `patterns/${patternId}/${file.name}`;
    await uploadData({
      path: s3Key,
      data: file,
      options: { contentType: file.type },
    }).result;
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
