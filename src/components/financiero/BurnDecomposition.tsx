/**
 * UPGRADE 4 — BurnDecomposition
 *
 * Pie chart or horizontal stacked bar showing burn_rate breakdown by categories.
 * If no breakdown data configured, shows CTA to configure categories.
 * Stores allocation in localStorage per project.
 */

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, PieChart as PieChartIcon, Settings2, Save, Info } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useStressTest } from '@/hooks/useFinancialIntelligence'

interface BurnDecompositionProps {
  projectId: string
}

interface BurnCategory {
  key: string
  pct: number
}

const DEFAULT_CATEGORIES: BurnCategory[] = [
  { key: 'personal', pct: 0 },
  { key: 'infrastructure', pct: 0 },
  { key: 'marketing', pct: 0 },
  { key: 'other', pct: 0 },
]

const CATEGORY_COLORS: Record<string, string> = {
  personal: '#3B82F6',
  infrastructure: '#8B5CF6',
  marketing: '#F59E0B',
  other: '#6B7280',
}

function getStorageKey(projectId: string) {
  return `burn_decomposition_${projectId}`
}

function loadCategories(projectId: string): BurnCategory[] | null {
  try {
    const raw = localStorage.getItem(getStorageKey(projectId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as BurnCategory[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    const total = parsed.reduce((s, c) => s + c.pct, 0)
    if (total === 0) return null
    return parsed
  } catch {
    return null
  }
}

function saveCategories(projectId: string, categories: BurnCategory[]) {
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(categories))
}

export function BurnDecomposition({ projectId }: BurnDecompositionProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useStressTest(projectId)
  const [isEditing, setIsEditing] = useState(false)
  const [editCategories, setEditCategories] = useState<BurnCategory[]>(DEFAULT_CATEGORIES)
  const [savedCategories, setSavedCategories] = useState<BurnCategory[] | null>(() => loadCategories(projectId))

  const burnRate = data?.inputs?.burn_rate ?? 0

  const chartData = useMemo(() => {
    if (!savedCategories || burnRate === 0) return null
    return savedCategories
      .filter(c => c.pct > 0)
      .map(c => ({
        name: t(`financialIntelligence.burnCategory_${c.key}`),
        key: c.key,
        value: Math.round(burnRate * c.pct / 100),
        pct: c.pct,
      }))
  }, [savedCategories, burnRate, t])

  const handleStartEdit = useCallback(() => {
    setEditCategories(savedCategories ?? DEFAULT_CATEGORIES)
    setIsEditing(true)
  }, [savedCategories])

  const handleSave = useCallback(() => {
    saveCategories(projectId, editCategories)
    setSavedCategories(editCategories)
    setIsEditing(false)
  }, [projectId, editCategories])

  const updateCategoryPct = useCallback((key: string, pct: number) => {
    setEditCategories(prev => prev.map(c => c.key === key ? { ...c, pct } : c))
  }, [])

  const editTotal = editCategories.reduce((s, c) => s + c.pct, 0)

  // Insight: personal cost relative to burn
  const personalPct = savedCategories?.find(c => c.key === 'personal')?.pct ?? 0
  const hireImpact = burnRate > 0 ? Math.round(((personalPct + (3000 / burnRate * 100)) - personalPct) * 10) / 10 : 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data?.inputs || data.status === 'insufficient_data') {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.insufficientData')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-500" />
            {t('financialIntelligence.burnDecompTitle')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleStartEdit}
          >
            <Settings2 className="w-3 h-3 mr-1" />
            {t('financialIntelligence.burnDecompConfigure')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.burnDecompSubtitle', {
            burn: burnRate.toLocaleString('es-ES'),
          })}
        </p>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {editCategories.map(cat => (
              <div key={cat.key} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[cat.key] }}
                />
                <Label className="text-xs w-28 shrink-0">
                  {t(`financialIntelligence.burnCategory_${cat.key}`)}
                </Label>
                <Input
                  type="number"
                  className="h-7 w-20 text-xs"
                  min={0}
                  max={100}
                  value={cat.pct || ''}
                  onChange={(e) => updateCategoryPct(cat.key, Number(e.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className={`text-xs font-medium ${editTotal !== 100 ? 'text-red-500' : 'text-green-600'}`}>
                {t('financialIntelligence.burnDecompTotal', { total: editTotal })}
              </span>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={editTotal !== 100}
                onClick={handleSave}
              >
                <Save className="w-3 h-3 mr-1" />
                {t('financialIntelligence.burnDecompSave')}
              </Button>
            </div>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <div className="space-y-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, pct }) => `${name} ${pct}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={CATEGORY_COLORS[entry.key] ?? '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('es-ES')}`, '']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Insight */}
            {personalPct > 0 && burnRate > 0 && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {t('financialIntelligence.burnDecompInsight', {
                    personalPct,
                    hireImpact,
                  })}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('financialIntelligence.burnDecompEmpty')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
            >
              <Settings2 className="w-4 h-4 mr-1" />
              {t('financialIntelligence.burnDecompConfigure')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
