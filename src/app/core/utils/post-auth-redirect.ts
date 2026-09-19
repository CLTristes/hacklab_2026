import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { JourneyService } from '../services/journey.service';

/** Depois de logar/cadastrar: manda pra home se já tem vínculo, senão pra upload de histórico. */
export function redirectAfterAuth(journey: JourneyService, router: Router): void {
  journey
    .progress()
    .pipe(catchError(() => of(null)))
    .subscribe((res) => router.navigateByUrl(res ? '/home' : '/documents'));
}
