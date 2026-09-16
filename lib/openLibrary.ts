import type { Cookbook } from '@/types'

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json'
const REQUEST_TIMEOUT_MS = 12_000
const MAX_RESULTS = 50

const CATEGORY_QUERIES: Record<string, string> = {
  All: 'subject:cooking',
  'General Cooking': 'subject:cooking',
  'Healthy Cooking': 'subject:cooking healthy',
  'Meal Prep': 'subject:cooking',
  'Beginner Cooking': 'subject:cooking beginner',
  'Dietary-Specific': 'subject:cooking',
}

const COOKING_TERMS = /cook|recipe|kitchen|baking|meal prep|vegetarian|vegan|gluten[- ]?free|keto|nutrition/i
const DIETARY_TERMS = /vegetarian|vegan|gluten[- ]?free|keto|paleo|allerg|diabet|plant[- ]?based|low[- ]?carb/i
const HEALTHY_TERMS = /healthy|vegetarian|vegan|nutrition|whole[- ]?food|plant[- ]?based|salad/i
const MEAL_PREP_TERMS = /meal prep|batch cook|make[- ]?ahead|freezer|weekly meal/i
const BEGINNER_TERMS = /beginner|easy|simple|basic|essential|first cookbook|for dummies/i

type OpenLibraryDocument = {
  key?: unknown
  title?: unknown
  author_name?: unknown
  first_publish_year?: unknown
  cover_i?: unknown
  isbn?: unknown
  subject?: unknown
  first_sentence?: unknown
  ratings_average?: unknown
}

type OpenLibrarySearchResponse = {
  docs?: unknown
}

function getText(value: unknown): string {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (Array.isArray(value)) return value.map(getText).filter(Boolean).join(' ')
  if (value && typeof value === 'object' && 'value' in value) return getText(value.value)
  return ''
}

function getStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function getCategory(title: string, description: string, subjects: string[], requestedCategory: string): string {
  if (requestedCategory !== 'All') return requestedCategory
  const text = [title, description, ...subjects].join(' ')
  if (DIETARY_TERMS.test(text)) return 'Dietary-Specific'
  if (MEAL_PREP_TERMS.test(text)) return 'Meal Prep'
  if (BEGINNER_TERMS.test(text)) return 'Beginner Cooking'
  if (HEALTHY_TERMS.test(text)) return 'Healthy Cooking'
  return 'General Cooking'
}

function getTags(title: string, description: string, subjects: string[]): string[] {
  const text = [title, description, ...subjects].join(' ')
  const tags: string[] = []
  if (DIETARY_TERMS.test(text)) tags.push('dietary options')
  if (HEALTHY_TERMS.test(text)) tags.push('healthy')
  if (MEAL_PREP_TERMS.test(text)) tags.push('meal prep')
  if (BEGINNER_TERMS.test(text)) tags.push('beginner-friendly')
  const subject = subjects.find((item) => item.length > 0 && item.length < 32)
  if (subject) tags.push(subject)
  return [...new Set(tags)].slice(0, 3)
}

function toCookbook(document: OpenLibraryDocument, requestedCategory: string): Cookbook | null {
  const key = typeof document.key === 'string' ? document.key : ''
  const title = getText(document.title)
  const authors = getStrings(document.author_name)
  const subjects = getStrings(document.subject)
  const description = getText(document.first_sentence)
  const searchableText = [title, description, ...subjects].join(' ')

  if (!key || !title || !COOKING_TERMS.test(searchableText)) return null

  const coverId = typeof document.cover_i === 'number' ? document.cover_i : null
  const year = typeof document.first_publish_year === 'number' ? document.first_publish_year : null
  const isbn = getStrings(document.isbn)[0] || null
  const rating = typeof document.ratings_average === 'number' ? Math.round(document.ratings_average * 10) / 10 : 0

  return {
    id: `open-library-${key}`,
    title,
    author: authors.join(', ') || 'Unknown author',
    description: description || 'A cookbook with recipes and practical ideas for the kitchen.',
    category: getCategory(title, description, subjects, requestedCategory),
    rating,
    image_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    buy_url: `https://openlibrary.org${key}`,
    tags: getTags(title, description, subjects),
    publication_year: year,
    isbn,
  }
}

async function fetchOpenLibrary(url: string): Promise<OpenLibrarySearchResponse> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (response.status === 429) throw new Error('RATE_LIMITED')
  if (!response.ok) throw new Error(`UPSTREAM_${response.status}`)
  return response.json() as Promise<OpenLibrarySearchResponse>
}

export async function searchOpenLibraryCookbooks(requestedCategory: string): Promise<Cookbook[]> {
  const query = CATEGORY_QUERIES[requestedCategory] || CATEGORY_QUERIES.All
  const params = new URLSearchParams({
    q: query,
    fields: 'key,title,author_name,first_publish_year,cover_i,isbn,subject,first_sentence,ratings_average',
    limit: String(MAX_RESULTS),
  })
  const data = await fetchOpenLibrary(`${OPEN_LIBRARY_SEARCH_URL}?${params}`)
  const documents = Array.isArray(data.docs) ? data.docs : []
  const seen = new Set<string>()
  const cookbooks: Cookbook[] = []

  for (const document of documents) {
    if (!document || typeof document !== 'object') continue
    const cookbook = toCookbook(document as OpenLibraryDocument, requestedCategory)
    if (!cookbook || seen.has(cookbook.id)) continue
    seen.add(cookbook.id)
    cookbooks.push(cookbook)
  }

  return cookbooks
}
