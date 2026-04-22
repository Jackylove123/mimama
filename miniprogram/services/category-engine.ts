import type { VaultCategory, VaultCategorySource } from '../types/vault'

export interface CategoryOption {
  key: VaultCategory
  label: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'social', label: '社交' },
  { key: 'email', label: '邮箱' },
  { key: 'finance', label: '财务' },
  { key: 'website', label: '网站' },
  { key: 'others', label: '其他' },
]

export const CATEGORY_LABELS: Record<VaultCategory, string> = {
  social: '社交',
  email: '邮箱',
  finance: '财务',
  website: '网站',
  others: '其他',
}

export interface InferredCategoryResult {
  category: VaultCategory
  source: VaultCategorySource
}

const ICON_FIRST_RULES: Array<{ category: VaultCategory; keywords: string[] }> = [
  { category: 'finance', keywords: ['支付宝', '微信支付', '云闪付', 'pay', 'paypal', 'apple pay'] },
  { category: 'social', keywords: ['微信', 'qq', '微博', '抖音', 'telegram', 'twitter', 'facebook', 'instagram'] },
  { category: 'email', keywords: ['gmail', 'outlook', '邮箱', 'mail'] },
  { category: 'website', keywords: ['百度', 'b站', '知乎', 'github', 'wikipedia'] },
]

const KEYWORD_RULES: Array<{ category: VaultCategory; keywords: string[] }> = [
  {
    category: 'social',
    keywords: [
      '微信',
      'qq',
      '微博',
      '小红书',
      '豆瓣',
      '抖音',
      '知乎',
      'fb',
      'twitter',
      'ins',
      'telegram',
      '群',
      '社区',
    ],
  },
  {
    category: 'email',
    keywords: ['邮箱', 'mail', 'gmail', 'outlook', '@', '163', '126', '网易', '雅虎', '阿里', '企业邮'],
  },
  {
    category: 'finance',
    keywords: [
      '银行',
      '支付',
      '财务',
      '宝',
      '钱包',
      '卡',
      '证券',
      '股票',
      '基金',
      'icbc',
      'ccb',
      '招商',
      '工商',
      '农业',
      '建设',
    ],
  },
  {
    category: 'website',
    keywords: ['.com', '.cn', '.net', '登录', '官网', '平台', '论坛', '站点', '导航', '博客', 'wiki', 'b站', '百度'],
  },
]

export const inferCategoryByTitle = (title: string): InferredCategoryResult => {
  const normalized = (title || '').trim().toLowerCase()
  if (!normalized) {
    return {
      category: 'others',
      source: 'default',
    }
  }

  const iconMatch = matchRule(normalized, ICON_FIRST_RULES)
  if (iconMatch) {
    return {
      category: iconMatch,
      source: 'icon',
    }
  }

  const keywordMatch = matchRule(normalized, KEYWORD_RULES)
  if (keywordMatch) {
    return {
      category: keywordMatch,
      source: 'keyword',
    }
  }

  return {
    category: 'others',
    source: 'default',
  }
}

export const normalizeCategory = (
  category?: string,
  source?: string,
  fallbackTitle = '',
): { category: VaultCategory; source: VaultCategorySource } => {
  if (isCategory(category) && isCategorySource(source)) {
    return { category, source }
  }

  if (isCategory(category) && !source) {
    return { category, source: 'manual' }
  }

  return inferCategoryByTitle(fallbackTitle)
}

export const isCategory = (value: unknown): value is VaultCategory => {
  return value === 'social' || value === 'email' || value === 'finance' || value === 'website' || value === 'others'
}

export const isCategorySource = (value: unknown): value is VaultCategorySource => {
  return value === 'manual' || value === 'icon' || value === 'keyword' || value === 'default'
}

const matchRule = (normalized: string, rules: Array<{ category: VaultCategory; keywords: string[] }>) => {
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return rule.category
      }
    }
  }

  return ''
}
