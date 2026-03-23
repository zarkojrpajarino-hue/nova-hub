/**
 * TeamContributionHeatmap — F29 Upgrade 4
 *
 * Matrix: rows = team members, columns = demand/delivery/cash
 * Cell value: task count with color intensity.
 * Risk detection: >70% concentration in any category.
 * Only shown if team size > 1.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface TeamContributionHeatmapProps {
  projectId: string
}

interface MemberContribution {
  memberId: string
  memberName: string
  demand: number
  delivery: number
  cash: number
  total: number
}

interface ConcentrationRisk {
  memberName: string
  category: string
  percentage: number
}

async function fetchTeamContributions(projectId: string): Promise<MemberContribution[]> {
  // Query tasks completed in last 30 days, grouped by assignee + function_type
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('tasks')
    .select('assignee_id, function_type, profiles!tasks_assignee_id_fkey(id, nombre)')
    .eq('project_id', projectId)
    .eq('status', 'done')
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .not('assignee_id', 'is', null)
    .not('function_type', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return []

  // Group by member
  const memberMap = new Map<string, MemberContribution>()

  for (const task of data) {
    const id = task.assignee_id as string
    const profile = task.profiles as { id: string; nombre: string } | null
    const name = profile?.nombre ?? 'Unknown'
    const ft = task.function_type as string

    if (!memberMap.has(id)) {
      memberMap.set(id, { memberId: id, memberName: name, demand: 0, delivery: 0, cash: 0, total: 0 })
    }

    const entry = memberMap.get(id)!
    if (ft === 'demand') entry.demand++
    else if (ft === 'delivery') entry.delivery++
    else if (ft === 'cash') entry.cash++
    entry.total++
  }

  return Array.from(memberMap.values()).sort((a, b) => b.total - a.total)
}

function useTeamContributions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['team_contributions', projectId],
    enabled: !!projectId,
    staleTime: 10 * 60_000,
    queryFn: () => fetchTeamContributions(projectId!),
  })
}

function CellColor({ value, maxValue }: { value: number; maxValue: number }) {
  // Intensity from 0 to 1
  const intensity = maxValue > 0 ? value / maxValue : 0
  const bgClass =
    intensity === 0 ? 'bg-muted/30' :
    intensity < 0.3 ? 'bg-primary/10' :
    intensity < 0.6 ? 'bg-primary/25' :
    intensity < 0.8 ? 'bg-primary/40' :
    'bg-primary/60'

  return (
    <div className={cn('rounded px-2 py-1.5 text-center text-xs font-mono tabular-nums min-w-[3rem]', bgClass)}>
      {value}
    </div>
  )
}

export function TeamContributionHeatmap({ projectId }: TeamContributionHeatmapProps) {
  const { t } = useTranslation()
  const { data: contributions, isLoading } = useTeamContributions(projectId)

  // Don't render for solo founders
  const teamSize = contributions?.length ?? 0

  // Detect concentration risks
  const risks = useMemo<ConcentrationRisk[]>(() => {
    if (!contributions || contributions.length < 2) return []
    const result: ConcentrationRisk[] = []

    // Total per category across all members
    const totalDemand = contributions.reduce((s, c) => s + c.demand, 0)
    const totalDelivery = contributions.reduce((s, c) => s + c.delivery, 0)
    const totalCash = contributions.reduce((s, c) => s + c.cash, 0)

    for (const member of contributions) {
      const checks: [number, number, string][] = [
        [member.demand, totalDemand, 'demand'],
        [member.delivery, totalDelivery, 'delivery'],
        [member.cash, totalCash, 'cash'],
      ]
      for (const [memberVal, total, cat] of checks) {
        if (total > 0 && memberVal / total > 0.7) {
          result.push({
            memberName: member.memberName,
            category: cat,
            percentage: Math.round((memberVal / total) * 100),
          })
        }
      }
    }
    return result
  }, [contributions])

  // Max value for color scaling
  const maxValue = useMemo(() => {
    if (!contributions) return 0
    return Math.max(...contributions.flatMap(c => [c.demand, c.delivery, c.cash]), 1)
  }, [contributions])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Only show for teams > 1
  if (teamSize <= 1) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <CardTitle className="text-sm">{t('teamContribution.title')}</CardTitle>
          </div>
          {risks.length > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle size={10} className="mr-1" />
              {t('teamContribution.concentrationRisk')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t('teamContribution.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_3rem_3rem_3rem] gap-1.5 items-center text-xs text-muted-foreground font-medium">
          <span>{t('teamContribution.member')}</span>
          <span className="text-center">{t('teamContribution.demand')}</span>
          <span className="text-center">{t('teamContribution.delivery')}</span>
          <span className="text-center">{t('teamContribution.cash')}</span>
        </div>

        {/* Data rows */}
        {contributions?.map(member => (
          <div key={member.memberId} className="grid grid-cols-[1fr_3rem_3rem_3rem] gap-1.5 items-center">
            <span className="text-xs font-medium truncate">{member.memberName}</span>
            <CellColor value={member.demand} maxValue={maxValue} />
            <CellColor value={member.delivery} maxValue={maxValue} />
            <CellColor value={member.cash} maxValue={maxValue} />
          </div>
        ))}

        {/* Concentration risks */}
        {risks.map((risk, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2">
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>
              {t('teamContribution.riskDetail', {
                name: risk.memberName,
                percentage: risk.percentage,
                category: t(`teamContribution.${risk.category}`),
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
