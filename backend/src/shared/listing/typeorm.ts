import { Brackets, type SelectQueryBuilder } from 'typeorm'
import type { ListFilter, ListQuery, ListSort, PaginatedResult } from './types'
import { buildPaginationMeta } from './types'

const applyFilters = <T>(
  qb: SelectQueryBuilder<T>,
  filters: ListFilter[],
  logic: 'and' | 'or',
  alias: string,
  allowedFields: Set<string>
): void => {
  qb.andWhere(
    new Brackets((subQuery) => {
      let isFirst = true

      const addCondition = (
        condition: string,
        parameters: Record<string, unknown>
      ) => {
        if (isFirst) {
          subQuery.where(condition, parameters)
          isFirst = false
          return
        }
        if (logic === 'or') {
          subQuery.orWhere(condition, parameters)
        } else {
          subQuery.andWhere(condition, parameters)
        }
      }

      filters.forEach((filter, index) => {
        if (!allowedFields.has(filter.field)) return

        const paramName = `filter_${index}`
        const fieldPath = `${alias}.${filter.field}`

        switch (filter.operator) {
          case 'contains':
            addCondition(`LOWER(${fieldPath}) LIKE :${paramName}`, {
              [paramName]: `%${String(filter.value ?? '').toLowerCase()}%`,
            })
            break
          case 'eq':
            addCondition(`${fieldPath} = :${paramName}`, { [paramName]: filter.value })
            break
          case 'gt':
            addCondition(`${fieldPath} > :${paramName}`, { [paramName]: filter.value })
            break
          case 'gte':
            addCondition(`${fieldPath} >= :${paramName}`, { [paramName]: filter.value })
            break
          case 'lt':
            addCondition(`${fieldPath} < :${paramName}`, { [paramName]: filter.value })
            break
          case 'lte':
            addCondition(`${fieldPath} <= :${paramName}`, { [paramName]: filter.value })
            break
          case 'in': {
            const value = Array.isArray(filter.value) ? filter.value : [filter.value]
            addCondition(`${fieldPath} IN (:...${paramName})`, { [paramName]: value })
            break
          }
          default:
            break
        }
      })
    })
  )
}

const applySort = <T>(
  qb: SelectQueryBuilder<T>,
  sort: ListSort[],
  alias: string,
  allowedFields: Set<string>
) => {
  sort.forEach((entry) => {
    if (!allowedFields.has(entry.field)) return
    qb.addOrderBy(`${alias}.${entry.field}`, entry.direction.toUpperCase() as 'ASC' | 'DESC')
  })
}

export const applyTypeOrmListQuery = async <T>(
  qb: SelectQueryBuilder<T>,
  query: ListQuery,
  allowedFields: string[],
  alias: string
): Promise<PaginatedResult<T>> => {
  const allowed = new Set(allowedFields)

  if (query.filters.length > 0) {
    applyFilters(qb, query.filters, query.logic, alias, allowed)
  }

  if (query.sort.length > 0) {
    applySort(qb, query.sort, alias, allowed)
  }

  qb.skip((query.page - 1) * query.limit).take(query.limit)

  const [data, total] = await qb.getManyAndCount()

  return {
    data,
    meta: buildPaginationMeta(query.page, query.limit, total),
  }
}
