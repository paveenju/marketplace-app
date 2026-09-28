import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="header-row">
      <h1>Products</h1>
      <a routerLink="/products/new" class="btn btn-primary">+ New product</a>
    </div>

    <div class="filters card">
      <div class="form-row">
        <label>Search</label>
        <input [(ngModel)]="search" (ngModelChange)="reload()" placeholder="Search by name..." />
      </div>
      <div class="form-row">
        <label>Category</label>
        <select [(ngModel)]="categoryId" (ngModelChange)="reload()">
          <option [ngValue]="undefined">All categories</option>
          @for (c of categories; track c.id) {
            <option [ngValue]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
    </div>

    @if (loading) {
      <p>Loading products...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else if (products.length === 0) {
      <p>No products found.</p>
    } @else {
      <table class="card">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of products; track p.id) {
            <tr>
              <td><a [routerLink]="['/products', p.id]">{{ p.name }}</a></td>
              <td>{{ p.categoryName }}</td>
              <td>{{ p.price | currency }}</td>
              <td>{{ p.stock }}</td>
              <td class="actions">
                <a [routerLink]="['/products', p.id, 'edit']" class="btn btn-secondary">Edit</a>
                <button class="btn btn-danger" (click)="remove(p)">Delete</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `
      .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .filters { display: flex; gap: 16px; margin-bottom: 16px; }
      .filters .form-row { flex: 1; margin-bottom: 0; }
      .actions { display: flex; gap: 8px; }
      .error { color: #dc2626; }
    `,
  ],
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products: Product[] = [];
  categories: Category[] = [];
  search = '';
  categoryId: number | undefined;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({ next: (c) => (this.categories = c) });
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = null;

    this.productService.getAll(this.categoryId, this.search).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load products. Is the API running?';
        this.loading = false;
      },
    });
  }

  remove(product: Product): void {
    if (!confirm(`Delete "${product.name}"?`)) return;

    this.productService.delete(product.id).subscribe({
      next: () => this.reload(),
      error: () => (this.error = 'Could not delete product.'),
    });
  }
}
