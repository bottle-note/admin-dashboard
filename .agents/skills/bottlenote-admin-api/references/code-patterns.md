# Bottlenote Admin Dashboard - Code Patterns

## 3-Layer API Pattern

New API: **types -> service -> hook**

### Layer 1: Types (`src/types/api/{domain}.api.ts`)

```typescript
// 1. API endpoint constants
export const ExampleApi = {
  list: { endpoint: '/admin/api/v1/examples', method: 'GET' },
  detail: { endpoint: '/admin/api/v1/examples/:id', method: 'GET' },
  create: { endpoint: '/admin/api/v1/examples', method: 'POST' },
  update: { endpoint: '/admin/api/v1/examples/:id', method: 'PUT' },
  delete: { endpoint: '/admin/api/v1/examples/:id', method: 'DELETE' },
} as const;

// 2. API types interface (namespaced)
export interface ExampleApiTypes {
  list: {
    params: { keyword?: string; page?: number; size?: number; };
    response: { id: number; korName: string; };
    meta: { page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean; };
  };
  detail: { response: { /* fields */ }; };
  create: {
    request: { /* fields */ };
    response: { code: string; message: string; targetId: number; responseAt: string; };
  };
  update: {
    request: { /* fields */ };
    response: { code: string; message: string; targetId: number; responseAt: string; };
  };
  delete: {
    response: { code: string; message: string; targetId: number; responseAt: string; };
  };
}

// 3. Helper types
export type ExampleSearchParams = ExampleApiTypes['list']['params'];
export type ExampleListItem = ExampleApiTypes['list']['response'];
export type ExamplePageMeta = ExampleApiTypes['list']['meta'];
export type ExampleDetail = ExampleApiTypes['detail']['response'];
export type ExampleCreateRequest = ExampleApiTypes['create']['request'];
// ... etc
```

### Layer 2: Service (`src/services/{domain}.service.ts`)

```typescript
import { apiClient } from '@/lib/api-client';
import { createQueryKeys } from '@/hooks/useApiQuery';

export const exampleKeys = createQueryKeys('examples');

export interface ExampleListResponse {
  items: ExampleListItem[];
  meta: ExamplePageMeta;
}

export const exampleService = {
  list: async (params?) => {
    const response = await apiClient.getWithMeta<ExampleListItem[]>(
      ExampleApi.list.endpoint, { params }
    );
    return { items: response.data ?? [], meta: { /* map fields */ } };
  },
  detail: async (id: number) => {
    const endpoint = ExampleApi.detail.endpoint.replace(':id', String(id));
    return apiClient.get<ExampleDetail>(endpoint);
  },
  create: async (data) => apiClient.post(ExampleApi.create.endpoint, data),
  update: async (id, data) => {
    const endpoint = ExampleApi.update.endpoint.replace(':id', String(id));
    return apiClient.put(endpoint, data);
  },
  delete: async (id) => {
    const endpoint = ExampleApi.delete.endpoint.replace(':id', String(id));
    return apiClient.delete(endpoint);
  },
};
```

### Layer 3: Hook (`src/hooks/use{Domain}.ts`)

```typescript
// Query hooks: useApiQuery(key, fn, options)
// Mutation hooks: useApiMutation(fn, { successMessage, onSuccess: invalidateQueries })
// Update variables: interface { id: number; data: UpdateRequest }
// Delete: mutationFn takes number (id)
```

## Key Conventions

- Pagination: 0-based
- URL params: `:param` pattern, replaced with `String(value)`
- Mutations always invalidate query caches
- Toast messages in Korean
- Types re-exported from `src/types/api/index.ts`
- DO NOT modify `src/components/ui/`
