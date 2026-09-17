'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Star, Library } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TogglePill } from '@/components/ui/toggle-pill'
import { COOKBOOK_CATEGORIES } from '@/lib/data'
import type { Cookbook } from '@/types'

export default function CookbooksPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([])
  const [loadedCategory, setLoadedCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const categories = ['All', ...COOKBOOK_CATEGORIES]

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/cookbooks?category=${encodeURIComponent(activeCategory)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { cookbooks?: Cookbook[]; error?: string }
        if (!response.ok) throw new Error(data.error || 'Unable to load cookbooks.')
        return data.cookbooks || []
      })
      .then((books) => {
        setCookbooks(books)
        setError(null)
        setLoadedCategory(activeCategory)
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load cookbooks.')
        setCookbooks([])
        setLoadedCategory(activeCategory)
      })

    return () => controller.abort()
  }, [activeCategory])

  const isLoading = loadedCategory !== activeCategory

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Library className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cookbooks</h1>
          <p className="text-slate-500 text-sm">Handpicked recommendations to grow your cooking skills</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <TogglePill
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 text-sm normal-case"
          >
            {cat}
          </TogglePill>
        ))}
      </div>

      <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        📚 Live cookbook recommendations from Open Library. Book details and availability vary by edition and region.
      </p>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="flex-shrink-0 w-14 h-20" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-1.5" />
                <Skeleton className="h-3 w-full mb-1.5" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!isLoading && !error && cookbooks.length === 0 && (
        <p className="text-sm text-slate-500 py-8 text-center">No cookbooks found for this category.</p>
      )}

      {!isLoading && !error && cookbooks.length > 0 && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cookbooks.map((book) => (
          <Card key={book.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                {book.image_url ? (
                  <img src={book.image_url} alt={`Cover of ${book.title}`} className="flex-shrink-0 w-14 h-20 rounded-lg object-cover bg-amber-100" />
                ) : (
                  <div className="flex-shrink-0 w-14 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center text-2xl">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{book.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{book.author}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < Math.round(book.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">{book.rating > 0 ? book.rating : 'Not rated'}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-3">{book.description}</p>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{book.category}</Badge>
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <a
                  href={book.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors w-full justify-center"
                >
                  <ExternalLink className="h-4 w-4" />
                  View book
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  )
}
