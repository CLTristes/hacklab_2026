import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AtRiskResponse, BottlenecksResponse, CohortsResponse, DemandResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CoordinationService {
  private readonly baseUrl = `${environment.apiUrl}/staff/insights`;

  constructor(private readonly http: HttpClient) {}

  bottlenecks(lastTerms?: number): Observable<BottlenecksResponse> {
    const params: Record<string, number> = {};
    if (lastTerms) {
      params['last_terms'] = lastTerms;
    }
    return this.http.get<BottlenecksResponse>(`${this.baseUrl}/bottlenecks`, { params });
  }

  cohorts(): Observable<CohortsResponse> {
    return this.http.get<CohortsResponse>(`${this.baseUrl}/cohorts`);
  }

  atRisk(within?: number): Observable<AtRiskResponse> {
    const params: Record<string, number> = {};
    if (within) {
      params['within'] = within;
    }
    return this.http.get<AtRiskResponse>(`${this.baseUrl}/at-risk`, { params });
  }

  demand(): Observable<DemandResponse> {
    return this.http.get<DemandResponse>(`${this.baseUrl}/demand`);
  }
}
