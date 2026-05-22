import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
}

interface ViewUrlResponse {
  viewUrl: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly api = inject(ApiService);

  getUploadUrl(patternId: string, filename: string): Observable<UploadUrlResponse> {
    return this.api.post<UploadUrlResponse>('/patterns/upload-url', { patternId, filename });
  }

  getViewUrl(patternId: string): Observable<string> {
    return this.api
      .get<ViewUrlResponse>(`/patterns/${patternId}/view-url`)
      .pipe(map((res) => res.viewUrl));
  }

  uploadFile(uploadUrl: string, file: File): Observable<void> {
    return from(
      fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }
      }),
    );
  }
}
