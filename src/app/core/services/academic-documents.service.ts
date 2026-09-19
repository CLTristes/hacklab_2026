import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AcademicDocumentStatus,
  AcademicDocumentUploadResponse,
  ConfirmDocumentPayload,
  ConfirmDocumentResponse,
  DocumentKind
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AcademicDocumentsService {
  private readonly baseUrl = `${environment.apiUrl}/me/academic-documents`;

  constructor(private readonly http: HttpClient) {}

  upload(kind: DocumentKind, file: File): Observable<AcademicDocumentUploadResponse> {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    return this.http.post<AcademicDocumentUploadResponse>(this.baseUrl, form);
  }

  status(erqId: string): Observable<AcademicDocumentStatus> {
    return this.http.get<AcademicDocumentStatus>(`${this.baseUrl}/${erqId}`);
  }

  confirm(documentErqId: string, payload: ConfirmDocumentPayload): Observable<ConfirmDocumentResponse> {
    return this.http.post<ConfirmDocumentResponse>(`${this.baseUrl}/${documentErqId}/confirm`, payload);
  }
}
