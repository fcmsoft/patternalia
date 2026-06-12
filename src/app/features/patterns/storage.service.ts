import { Injectable } from '@angular/core';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

// Presigned URLs can't outlive the Cognito temporary credentials (~1h), so
// 1h is the practical maximum.
const URL_EXPIRES_IN_SECONDS = 3600;
// Refresh cached URLs a bit before they expire so in-flight image loads
// never race the expiry.
const URL_CACHE_MARGIN_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly urlCache = new Map<string, { url: string; freshUntil: number }>();
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
    const cached = this.urlCache.get(s3Key);
    if (cached && cached.freshUntil > Date.now()) {
      return cached.url;
    }
    const { url, expiresAt } = await getUrl({
      path: s3Key,
      options: { validateObjectExistence: false, expiresIn: URL_EXPIRES_IN_SECONDS },
    });
    this.urlCache.set(s3Key, {
      url: url.toString(),
      freshUntil: expiresAt.getTime() - URL_CACHE_MARGIN_MS,
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

  /** Key under which the resize lambda stores the thumbnail for a pattern. */
  thumbnailKey(s3Key: string): string {
    return s3Key.replace(/^patterns\//, 'thumbnails/').replace(/\.[^.]+$/, '.jpg');
  }

  /** Removes a pattern's original file plus its thumbnail and annotated copy. */
  async removePatternFiles(s3Key: string): Promise<void> {
    for (const key of [s3Key, this.thumbnailKey(s3Key), this.annotatedKey(s3Key)]) {
      this.urlCache.delete(key);
    }
    await remove({ path: s3Key });
    // Thumbnail and annotated copy may never have been created.
    await Promise.all([
      this.removeIfExists(this.thumbnailKey(s3Key)),
      this.removeIfExists(this.annotatedKey(s3Key)),
    ]);
  }

  private async removeIfExists(s3Key: string): Promise<void> {
    try {
      await remove({ path: s3Key });
    } catch (error) {
      console.warn(`Skipping removal of ${s3Key}:`, error);
    }
  }
}
