/** System settings toggles — maps to system_config kv */

export interface SecuritySwitch {
  key: string
  label: string
  enabled: boolean
}

export const mockSecuritySwitches: SecuritySwitch[] = [
  { key: 'forceMiniAuth', label: '强制小程序微信 + 手机号授权', enabled: true },
  { key: 'propertyAudit', label: '房源发布需管理员审核', enabled: true },
  { key: 'contactMask', label: '联系人默认脱敏（业务侧）', enabled: true },
  { key: 'exportPropertyCsv', label: '批量导出房源 CSV', enabled: false },
  { key: 'exportCustomerCsv', label: '批量导出客户 CSV', enabled: false },
  { key: 'exportAuditLog', label: '记录导出尝试（即使拒绝）', enabled: true },
]
