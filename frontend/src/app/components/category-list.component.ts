import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../models/category.model';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h1>Categories</h1>

    <form [formGroup]="form" (ngSubmit)="add()" class="card add-form">
      <div class="form-row">
        <label>Name</label>
        <input formControlName="name" placeholder="e.g. Sports" />
      </div>
      <div class="form-row">
        <label>Description</label>
        <input formControlName="description" placeholder="Optional" />
      </div>
      <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Add category</button>
    </form>

    @if (error) {
      <p class="error">{{ error }}</p>
    }

    <table class="card">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Products</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (c of categories; track c.id) {
          <tr>
            <td>{{ c.name }}</td>
            <td>{{ c.description }}</td>
            <td>{{ c.productCount }}</td>
            <td>
              <button class="btn btn-danger" (click)="remove(c)" [disabled]="c.productCount > 0">
                Delete
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .add-form { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
      .add-form .form-row { flex: 1; margin-bottom: 0; }
      .error { color: #dc2626; }
    `,
  ],
})
export class CategoryListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  error: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.categoryService.getAll().subscribe({
      next: (c) => (this.categories = c),
      error: () => (this.error = 'Could not load categories.'),
    });
  }

  add(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.categoryService.create({ name: value.name, description: value.description || null }).subscribe({
      next: () => {
        this.form.reset();
        this.reload();
      },
      error: () => (this.error = 'Could not create category (name may already exist).'),
    });
  }

  remove(category: Category): void {
    if (!confirm(`Delete "${category.name}"?`)) return;

    this.categoryService.delete(category.id).subscribe({
      next: () => this.reload(),
      error: () => (this.error = 'Could not delete category.'),
    });
  }
}
