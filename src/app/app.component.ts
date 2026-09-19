import { Component, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'hacklab-app';

  readonly navOpen = signal(false);

  constructor(
    readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.navOpen.set(false);
      }
    });
  }

  toggleNav(): void {
    this.navOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
