/** Mock user session — maps to DB: admin_user / role / region_scope */

export interface AuthUser {
  displayName: string
  roleLine: string
  avatarUrl?: string
}

export const mockAuthUser: AuthUser = {
  displayName: '周瑾',
  roleLine: '超级管理员 · 全区域',
}
