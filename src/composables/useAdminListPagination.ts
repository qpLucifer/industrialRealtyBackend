import { ref } from 'vue'

export const ADMIN_LIST_PAGE_SIZE = 10

export type AdminPagedResult<T> = {
  list: T[]
  total: number
  page?: number
  pageSize?: number
  hasMore?: boolean
}

export function useAdminListPagination(initialPageSize = ADMIN_LIST_PAGE_SIZE) {
  const listPage = ref(1)
  const listPageSize = ref(initialPageSize)
  const listTotal = ref(0)

  function resetListPage() {
    listPage.value = 1
  }

  function applyPagedResult<T>(result: AdminPagedResult<T>) {
    listTotal.value = result.total ?? result.list?.length ?? 0
  }

  function listQueryParams() {
    return { page: listPage.value, pageSize: listPageSize.value }
  }

  return {
    listPage,
    listPageSize,
    listTotal,
    resetListPage,
    applyPagedResult,
    listQueryParams,
  }
}
