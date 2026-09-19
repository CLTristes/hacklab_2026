import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CoursesResponse,
  CurrentTermResponse,
  CurriculumResponse,
  NextTermResponse,
  ProgressResponse,
  SimulatePayload,
  SimulateResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class JourneyService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  progress(): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.baseUrl}/me/progress`);
  }

  courses(): Observable<CoursesResponse> {
    return this.http.get<CoursesResponse>(`${this.baseUrl}/courses`);
  }

  curriculum(courseId: string): Observable<CurriculumResponse> {
    return this.http.get<CurriculumResponse>(`${this.baseUrl}/courses/${courseId}/curriculum`);
  }

  nextTerm(): Observable<NextTermResponse> {
    return this.http.get<NextTermResponse>(`${this.baseUrl}/me/next-term`);
  }

  currentTerm(): Observable<CurrentTermResponse> {
    return this.http.get<CurrentTermResponse>(`${this.baseUrl}/me/current-term`);
  }

  simulate(payload: SimulatePayload): Observable<SimulateResponse> {
    return this.http.post<SimulateResponse>(`${this.baseUrl}/me/simulate`, payload);
  }
}
