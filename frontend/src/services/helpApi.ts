import { ApiClient, ApiResponse } from './apiClient';

// Types
export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  is_active: boolean;
  article_count: number;
  created_at: string;
  updated_at: string;
}

export interface HelpCategoryDetail extends HelpCategory {
  articles: HelpArticleSummary[];
}

export interface HelpArticleSummary {
  id: string;
  title: string;
  slug: string;
  category_slug: string;
  category_name: string;
  excerpt: string;
  order: number;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  author_name: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface HelpArticleDetail extends HelpArticleSummary {
  content: string;
}

export interface HelpArticleWrite {
  title: string;
  slug: string;
  category_slug: string;
  content: string;
  excerpt: string;
  order?: number;
  is_published?: boolean;
  is_featured?: boolean;
  tags?: string[];
}

export interface HelpCategoryWrite {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
  is_active?: boolean;
}

class HelpApiService extends ApiClient {
  private readonly BASE_PATH = '/help';

  // Categories
  async getCategories(): Promise<ApiResponse<HelpCategory[]>> {
    return this.get<HelpCategory[]>(`${this.BASE_PATH}/categories/`);
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<HelpCategoryDetail>> {
    return this.get<HelpCategoryDetail>(`${this.BASE_PATH}/categories/${slug}/`);
  }

  async createCategory(data: HelpCategoryWrite): Promise<ApiResponse<HelpCategory>> {
    return this.post<HelpCategory>(`${this.BASE_PATH}/categories/`, data);
  }

  async updateCategory(slug: string, data: Partial<HelpCategoryWrite>): Promise<ApiResponse<HelpCategory>> {
    return this.put<HelpCategory>(`${this.BASE_PATH}/categories/${slug}/`, data);
  }

  async deleteCategory(slug: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/categories/${slug}/`);
  }

  // Articles
  async getArticles(categorySlug?: string): Promise<ApiResponse<HelpArticleSummary[]>> {
    return this.get<HelpArticleSummary[]>(`${this.BASE_PATH}/articles/`, {
      params: categorySlug ? { category: categorySlug } : undefined,
    });
  }

  async getArticleBySlug(slug: string): Promise<ApiResponse<HelpArticleDetail>> {
    return this.get<HelpArticleDetail>(`${this.BASE_PATH}/articles/${slug}/`);
  }

  async searchArticles(query: string): Promise<ApiResponse<HelpArticleSummary[]>> {
    return this.get<HelpArticleSummary[]>(`${this.BASE_PATH}/articles/search/`, {
      params: { q: query },
    });
  }

  async getFeaturedArticles(): Promise<ApiResponse<HelpArticleSummary[]>> {
    return this.get<HelpArticleSummary[]>(`${this.BASE_PATH}/articles/featured/`);
  }

  async createArticle(data: HelpArticleWrite): Promise<ApiResponse<HelpArticleDetail>> {
    return this.post<HelpArticleDetail>(`${this.BASE_PATH}/articles/`, data);
  }

  async updateArticle(slug: string, data: Partial<HelpArticleWrite>): Promise<ApiResponse<HelpArticleDetail>> {
    return this.put<HelpArticleDetail>(`${this.BASE_PATH}/articles/${slug}/`, data);
  }

  async deleteArticle(slug: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.BASE_PATH}/articles/${slug}/`);
  }
}

export const helpApi = new HelpApiService();
export default helpApi;
