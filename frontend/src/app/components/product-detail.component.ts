import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (product) {
      <div class="card">
        <h1>{{ product.name }}</h1>
        <p class="muted">{{ product.categoryName }}</p>
        <p>{{ product.description }}</p>

        <dl>
          <dt>Price</dt>
          <dd>{{ product.price | currency }}</dd>
          <dt>Stock</dt>
          <dd>{{ product.stock }} units</dd>
          <dt>Added</dt>
          <dd>{{ product.createdAt | date: 'medium' }}</dd>
        </dl>

        <div class="actions">
          <a [routerLink]="['/products', product.id, 'edit']" class="btn btn-primary">Edit</a>
          <a routerLink="/products" class="btn btn-secondary">Back to list</a>
        </div>
      </div>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else {
      <p>Loading...</p>
    }
  `,
  styles: [
    `
      dl { display: grid; grid-template-columns: 120px 1fr; row-gap: 6px; margin: 16px 0; }
      dt { font-weight: 600; }
      .muted { color: #6b7280; }
      .actions { display: flex; gap: 10px; }
      .error { color: #dc2626; }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  product: Product | null = null;
  error: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(id).subscribe({
      next: (p) => (this.product = p),
      error: () => (this.error = 'Product not found.'),
    });
  }
}
