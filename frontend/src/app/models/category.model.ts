export interface Category {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
}

export interface CategoryCreate {
  name: string;
  description: string | null;
}
