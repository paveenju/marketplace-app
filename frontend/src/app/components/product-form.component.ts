import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h1>{{ isEdit ? 'Edit product' : 'New product' }}</h1>

    <form [formGroup]="form" (ngSubmit)="save()" class="card">
      <div class="form-row">
        <label>Name</label>
        <input formControlName="name" />
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <small class="error">Name is required.</small>
        }
      </div>

      <div class="form-row">
        <label>Description</label>
        <textarea formControlName="description" rows="3"></textarea>
      </div>

      <div class="form-row">
        <label>Category</label>
        <select formControlName="categoryId">
          <option [ngValue]="null" disabled>Select a category</option>
          @for (c of categories; track c.id) {
            <option [ngValue]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>

      <div class="form-row">
        <label>Price</label>
        <input type="number" step="0.01" formControlName="price" />
      </div>

      <div class="form-row">
        <label>Stock</label>
        <input type="number" formControlName="stock" />
      </div>

      <div class="form-row">
        <label>Image URL (optional)</label>
        <input formControlName="imageUrl" />
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <div class="actions">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <a routerLink="/products" class="btn btn-secondary">Cancel</a>
      </div>
    </form>
  `,
  styles: [
    `
      .actions { display: flex; gap: 10px; margin-top: 8px; }
      .error { color: #dc2626; }
    `,
  ],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  isEdit = false;
  productId: number | null = null;
  saving = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    categoryId: [null as number | null, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({ next: (c) => (this.categories = c) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.productId = Number(idParam);

      this.productService.getById(this.productId).subscribe({
        next: (p) =>
          this.form.patchValue({
            name: p.name,
            description: p.description ?? '',
            categoryId: p.categoryId,
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl ?? '',
          }),
        error: () => (this.error = 'Could not load product.'),
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.error = null;

    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      description: value.description || null,
      categoryId: value.categoryId!,
      price: value.price,
      stock: value.stock,
      imageUrl: value.imageUrl || null,
    };

    const request: Observable<Product | void> = this.isEdit
      ? this.productService.update(this.productId!, payload)
      : this.productService.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => {
        this.saving = false;
        this.error = 'Could not save product. Check the fields and try again.';
      },
    });
  }
}
