export type SortDirection = 'asc' | 'desc'
export type FilterOperator = 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'

export interface ListFilter {
  field: string
  operator: FilterOperator
  value: unknown
}

export interface ListSort {
  field: string
  direction: SortDirection
}

export interface ListQuery {
  page: number
  limit: number
  filters: ListFilter[]
  sort: ListSort[]
  logic: 'and' | 'or'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const normalizedPage = Math.min(Math.max(page, 1), totalPages)
  return {
    page: normalizedPage,
    limit,
    total,
    totalPages,
    hasNextPage: normalizedPage < totalPages,
    hasPreviousPage: normalizedPage > 1,
  }
}

const toComparableNumber = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const asNumber = Number(value)
    if (!Number.isNaN(asNumber)) return asNumber
    const asDate = Date.parse(value)
    if (!Number.isNaN(asDate)) return asDate
  }
  return null
}

const toComparableString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).toLowerCase()
}

const evaluateFilter = (itemValue: unknown, filter: ListFilter): boolean => {
  const operator = filter.operator
  if (operator === 'contains') {
    return toComparableString(itemValue).includes(toComparableString(filter.value))
  }

  if (operator === 'in') {
    const list = Array.isArray(filter.value) ? filter.value : [filter.value]
    return list.some((entry) => toComparableString(entry) === toComparableString(itemValue))
  }

  const itemNumber = toComparableNumber(itemValue)
  const filterNumber = toComparableNumber(filter.value)

  if (itemNumber !== null && filterNumber !== null) {
    switch (operator) {
      case 'eq':
        return itemNumber === filterNumber
      case 'gt':
        return itemNumber > filterNumber
      case 'gte':
        return itemNumber >= filterNumber
      case 'lt':
        return itemNumber < filterNumber
      case 'lte':
        return itemNumber <= filterNumber
      default:
        return false
    }
  }

  if (operator === 'eq') {
    return toComparableString(itemValue) === toComparableString(filter.value)
  }

  return false
}

export const applyListQuery = <T extends Record<string, any>>(
  items: T[],
  query: ListQuery,
  allowedFields: string[]
): PaginatedResult<T> => {
  const allowed = new Set(allowedFields)
  const filters = query.filters.filter((filter) => allowed.has(filter.field))
  const sorters = query.sort.filter((sort) => allowed.has(sort.field))

  const filtered = filters.length
    ? items.filter((item) => {
        const results = filters.map((filter) => evaluateFilter(item[filter.field], filter))
        return query.logic === 'and' ? results.every(Boolean) : results.some(Boolean)
      })
    : items

  const sorted = sorters.length
    ? [...filtered].sort((a, b) => {
        for (const sorter of sorters) {
          const valueA = a[sorter.field]
          const valueB = b[sorter.field]

          if (valueA === valueB) continue

          const numberA = toComparableNumber(valueA)
          const numberB = toComparableNumber(valueB)

          if (numberA !== null && numberB !== null) {
            return sorter.direction === 'asc' ? numberA - numberB : numberB - numberA
          }

          const stringA = toComparableString(valueA)
          const stringB = toComparableString(valueB)
          if (stringA < stringB) return sorter.direction === 'asc' ? -1 : 1
          if (stringA > stringB) return sorter.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    : filtered

  const total = sorted.length
  const limit = query.limit
  const meta = buildPaginationMeta(query.page, limit, total)
  const start = (meta.page - 1) * limit
  const data = sorted.slice(start, start + limit)

  return {
    data,
    meta,
  }
}
