import { badRequest } from '@shared/errors'
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  type FilterOperator,
  type ListFilter,
  type ListQuery,
  type ListSort,
  type SortDirection,
} from './types'

const validOperators: FilterOperator[] = ['eq', 'contains', 'gt', 'gte', 'lt', 'lte', 'in']
const validDirections: SortDirection[] = ['asc', 'desc']

const parseFilters = (rawFilters?: unknown): ListFilter[] => {
  if (!rawFilters) return []

  const parsed =
    typeof rawFilters === 'string' ? JSON.parse(rawFilters) : rawFilters

  if (!Array.isArray(parsed)) {
    throw badRequest('Filters must be an array')
  }

  return parsed.map((filter) => {
    if (!filter || typeof filter !== 'object') {
      throw badRequest('Invalid filter format')
    }
    const field = String((filter as any).field ?? '')
    const operator = String((filter as any).operator ?? 'eq') as FilterOperator
    const value = (filter as any).value

    if (!field) throw badRequest('Filter field is required')
    if (!validOperators.includes(operator)) {
      throw badRequest(`Invalid filter operator: ${operator}`)
    }

    return { field, operator, value }
  })
}

const parseSort = (rawSort?: unknown): ListSort[] => {
  if (!rawSort) return []

  if (Array.isArray(rawSort)) {
    return rawSort
      .map((entry) => ({
        field: String((entry as any).field ?? ''),
        direction: String((entry as any).direction ?? 'asc') as SortDirection,
      }))
      .filter((entry) => entry.field && validDirections.includes(entry.direction))
  }

  if (typeof rawSort !== 'string') {
    throw badRequest('Sort must be a string')
  }

  return rawSort
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [field, direction] = part.split(':')
      const normalizedDirection = (direction ?? 'asc').toLowerCase() as SortDirection
      if (!field) throw badRequest('Sort field is required')
      if (!validDirections.includes(normalizedDirection)) {
        throw badRequest(`Invalid sort direction: ${direction}`)
      }
      return { field, direction: normalizedDirection }
    })
}

export const parseListQuery = (query: Record<string, unknown>): ListQuery => {
  const rawPage = Number(query.page ?? DEFAULT_PAGE)
  const rawLimit = Number(query.limit ?? DEFAULT_LIMIT)

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT

  const logic = query.logic === 'or' ? 'or' : 'and'

  let filters: ListFilter[] = []
  let sort: ListSort[] = []

  try {
    filters = parseFilters(query.filters)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw badRequest('Filters must be valid JSON')
    }
    throw error
  }

  sort = parseSort(query.sort)
  if (sort.length === 0) {
    sort = [{ field: 'createdAt', direction: 'desc' }]
  }

  return {
    page,
    limit,
    filters,
    sort,
    logic,
  }
}
