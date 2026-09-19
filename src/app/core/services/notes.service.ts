import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangeNoteVisibilityPayload,
  ChangeNoteVisibilityResponse,
  CreateNotePayload,
  CreateNoteResponse,
  NoteDetailResponse,
  NotesResponse,
  NoteVoteResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly baseUrl = `${environment.apiUrl}/notes`;

  constructor(private readonly http: HttpClient) {}

  list(subjectId?: string): Observable<NotesResponse> {
    let params = new HttpParams();
    if (subjectId) {
      params = params.set('subject_id', subjectId);
    }
    return this.http.get<NotesResponse>(this.baseUrl, { params });
  }

  get(noteId: string): Observable<NoteDetailResponse> {
    return this.http.get<NoteDetailResponse>(`${this.baseUrl}/${noteId}`);
  }

  vote(noteId: string): Observable<NoteVoteResponse> {
    return this.http.post<NoteVoteResponse>(`${this.baseUrl}/${noteId}/vote`, {});
  }

  create(payload: CreateNotePayload): Observable<CreateNoteResponse> {
    return this.http.post<CreateNoteResponse>(this.baseUrl, payload);
  }

  changeVisibility(noteId: string, payload: ChangeNoteVisibilityPayload): Observable<ChangeNoteVisibilityResponse> {
    return this.http.post<ChangeNoteVisibilityResponse>(`${this.baseUrl}/${noteId}/visibility`, payload);
  }
}
