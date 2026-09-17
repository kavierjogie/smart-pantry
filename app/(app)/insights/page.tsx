'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart3, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { getPantryItems } from '@/lib/db/pantry'
import { isExpiringSoon, isExpired, isLowStock, formatCurrency } from '@/lib/utils'
import type { PantryItem } from '@/types'
import { toast } from 'sonner'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function StatBox({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InsightsPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const items = await getPantryItems(user.id)
      setPantryItems(items)
    } catch {
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Derived data
  const byCategory = Object.entries(
    pantryItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const totalPurchaseValue = pantryItems.reduce((sum, i) => sum + (i.purchase_price || 0), 0)

  const expiringItems = pantryItems.filter(i => isExpiringSoon(i.expiry_date))
  const expiredItems = pantryItems.filter(i => isExpired(i.expiry_date))
  const wasteValue = expiredItems.reduce((sum, i) => sum + (i.purchase_price || 0), 0)
  const lowStock = pantryItems.filter(isLowStock)

  const stockStatus = [
    { name: 'Good stock', value: pantryItems.filter(i => !isLowStock(i) && !isExpired(i.expiry_date)).length },
    { name: 'Low stock', value: lowStock.length },
    { name: 'Expiring soon', value: expiringItems.length },
    { name: 'Expired', value: expiredItems.length },
  ].filter(d => d.value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BarChart3 className="h-8 w-8 text-slate-300 animate-pulse" />
      </div>
    )
  }

  if (pantryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="h-12 w-12 text-slate-200 mb-4" />
        <p className="font-medium text-slate-500">No data yet</p>
        <p className="text-sm text-slate-400 mt-1">Add items to your pantry to see insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Food Insights</h1>
        <p className="text-slate-500 text-sm mt-1">An overview of your pantry health and food habits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          icon={DollarSign}
          label="Estimated stock value"
          value={formatCurrency(totalPurchaseValue)}
          sub="based on purchase prices"
          color="bg-emerald-100 text-emerald-700"
        />
        <StatBox
          icon={TrendingDown}
          label="Estimated waste"
          value={formatCurrency(wasteValue)}
          sub={`${expiredItems.length} expired item${expiredItems.length !== 1 ? 's' : ''}`}
          color="bg-red-100 text-red-700"
        />
        <StatBox
          icon={AlertTriangle}
          label="Expiring within 7 days"
          value={String(expiringItems.length)}
          sub={expiringItems.map(i => i.name).slice(0, 2).join(', ') || 'None — well done!'}
          color="bg-amber-100 text-amber-700"
        />
        <StatBox
          icon={BarChart3}
          label="Low stock alerts"
          value={String(lowStock.length)}
          sub={lowStock.map(i => i.name).slice(0, 2).join(', ') || 'All well stocked'}
          color="bg-blue-100 text-blue-700"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Items by category bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items by category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1, 4)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [v, 'items']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock status pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock health</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stockStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stockStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring items table */}
      {(expiringItems.length > 0 || expiredItems.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items needing attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Expiry</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...expiredItems, ...expiringItems].map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 text-slate-500 capitalize">{item.category}</td>
                      <td className="py-2.5 text-slate-500">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 text-slate-500">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-ZA') : '—'}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isExpired(item.expiry_date)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isExpired(item.expiry_date) ? 'Expired' : 'Expiring soon'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
