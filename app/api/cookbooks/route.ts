import { NextRequest, NextResponse } from 'next/server'
import { searchOpenLibraryCookbooks } from '@/lib/openLibrary'

export async function GET(request: NextRequest) {
  const requestedCategory = request.nextUrl.searchParams.get('category') || 'All'

  try {
    const cookbooks = await searchOpenLibraryCookbooks(requestedCategory)
    return NextResponse.json({ cookbooks }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Book search is temporarily rate-limited. Please try again shortly.' }, { status: 429 })
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Book search took too long to respond. Please try again.' }, { status: 504 })
    }
    console.error('Open Library API error:', error)
    return NextResponse.json({ error: 'Book search is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
