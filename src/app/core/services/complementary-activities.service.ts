import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComplementaryActivitiesResponse, CreateComplementaryActivityResponse } from '../models/api.models';

export interface DeclareComplementaryActivityPayload {
  category_id: string;
  title: string;
  hours_claimed: number;
  issued_at?: string;
  certificate?: File | null;
}

@Injectable({ providedIn: 'root' })
export class ComplementaryActivitiesService {
  private readonly baseUrl = `${environment.apiUrl}/me/complementary-activities`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ComplementaryActivitiesResponse> {
    return this.http.get<ComplementaryActivitiesResponse>(this.baseUrl);
  }

  declare(payload: DeclareComplementaryActivityPayload): Observable<CreateComplementaryActivityResponse> {
    const form = new FormData();
    form.append('category_id', payload.category_id);
    form.append('title', payload.title);
    form.append('hours_claimed', String(payload.hours_claimed));
    if (payload.issued_at) {
      form.append('issued_at', payload.issued_at);
    }
    if (payload.certificate) {
      form.append('certificate', payload.certificate);
    }
    return this.http.post<CreateComplementaryActivityResponse>(this.baseUrl, form);
  }
}
