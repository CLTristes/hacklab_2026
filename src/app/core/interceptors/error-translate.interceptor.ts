import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const RAW_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Unauthenticated.': 'Sua sessão expirou. Faça login novamente.'
};

export const errorTranslateInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
        const translated = RAW_MESSAGE_TRANSLATIONS[err.error.message];
        if (translated) {
          const translatedError = new HttpErrorResponse({
            error: { ...err.error, message: translated },
            headers: err.headers,
            status: err.status,
            statusText: err.statusText,
            url: err.url ?? undefined
          });
          return throwError(() => translatedError);
        }
      }
      return throwError(() => err);
    })
  );
