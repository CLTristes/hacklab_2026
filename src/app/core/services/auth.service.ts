import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginPayload, SignupPayload, VerifyEmailPayload } from '../models/api.models';

const TOKEN_KEY = 'campusos_token';
const USER_KEY = 'campusos_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  signup(payload: SignupPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/signup`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  verifyEmail(payload: VerifyEmailPayload): Observable<{ data: { id: string; email_verified: boolean } }> {
    return this.http
      .post<{ data: { id: string; email_verified: boolean } }>(`${this.baseUrl}/verify-email`, payload)
      .pipe(
        tap((res) => {
          const current = this.userSignal();
          if (current) {
            this.setUser({ ...current, email_verified: res.data.email_verified });
          }
        })
      );
  }

  resendVerification(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/verify-email/resend`, {});
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(tap(() => this.clearSession()));
  }

  private persistSession(res: AuthResponse): void {
    this.tokenSignal.set(res.token);
    this.setUser(res.data);
    localStorage.setItem(TOKEN_KEY, res.token);
  }

  private setUser(user: AuthUser): void {
    this.userSignal.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}
