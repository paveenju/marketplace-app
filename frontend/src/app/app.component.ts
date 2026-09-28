import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <nav class="container">
        <span class="brand">🛒 Marketplace</span>
        <a routerLink="/products" routerLinkActive="active">Products</a>
        <a routerLink="/categories" routerLinkActive="active">Categories</a>
      </nav>
    </header>

    <main class="container">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      header {
        background: #111827;
      }
      nav {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 14px 16px;
      }
      .brand {
        color: #fff;
        font-weight: 600;
        margin-right: 12px;
      }
      nav a {
        color: #d1d5db;
        font-size: 14px;
      }
      nav a.active {
        color: #fff;
        font-weight: 600;
      }
    `,
  ],
})
export class AppComponent {}
