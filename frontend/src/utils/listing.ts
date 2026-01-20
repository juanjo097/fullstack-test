export type FilterOperator = 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
export type FilterLogic = 'and' | 'or'
export type SortDirection = 'asc' | 'desc'

export interface ListFilter {
  field: string
  operator: FilterOperator
  value: string | number | Array<string | number>
}

export interface SortOption {
  field: string
  direction: SortDirection
}

export interface ListQueryParams {
  page?: number
  limit?: number
  filters?: ListFilter[]
  sort?: SortOption[]
  logic?: FilterLogic
}

export const sanitizeFilters = (filters: ListFilter[]): ListFilter[] =>
  filters.filter((filter) => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0
    }
    return String(filter.value ?? '').trim().length > 0
  })

const serializeSort = (sort: SortOption[]) =>
  sort.map((entry) => `${entry.field}:${entry.direction}`).join(',')

export const buildListQueryString = (params?: ListQueryParams): string => {
  if (!params) return ''

  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.logic) searchParams.set('logic', params.logic)

  if (params.sort && params.sort.length > 0) {
    searchParams.set('sort', serializeSort(params.sort))
  }

  if (params.filters && params.filters.length > 0) {
    searchParams.set('filters', JSON.stringify(params.filters))
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
