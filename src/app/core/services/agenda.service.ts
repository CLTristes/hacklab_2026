import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendaResponse, CreateTaskPayload, TaskResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  agenda(): Observable<AgendaResponse> {
    return this.http.get<AgendaResponse>(`${this.baseUrl}/me/agenda`);
  }

  createTask(payload: CreateTaskPayload): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.baseUrl}/tasks`, payload);
  }
}
