/**
 * STARTUP OS DASHBOARD
 *
 * El dashboard central que integra todas las capas:
 * - Strategy: OKRs, Competitor Intelligence, Market Research
 * - Execution: Content Calendar, Launch Checklist, Beta Testers
 * - Metrics: Financial Projections, Key Metrics, Alerts
 * - Intelligence: AI Recommendations, Weekly Insights, Advisor Chat
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Target,
  Rocket,
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Calendar,
  DollarSign,
  Database,
} from 'lucide-react';
import { FounderMetricsDashboard } from './FounderMetricsDashboard';
import { StrategyEditor } from '@/components/engine-inputs/StrategyEditor';
import { EconomicProfileForm } from '@/components/engine-inputs/EconomicProfileForm';
import { ProcessArtifactEditor } from '@/components/engine-inputs/ProcessArtifactEditor';

import { useTranslation } from 'react-i18next';
interface StartupOSDashboardProps {
  projectId: string;
}

export function StartupOSDashboard({ projectId }: StartupOSDashboardProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'overview' | 'strategy' | 'execution' | 'metrics' | 'intelligence' | 'inputs'>(
    'overview'
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Startup OS</h1>
            <p className="text-gray-600 mt-1">{t('startupOs.yourCompleteOperatingSystem')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Health: 85%
            </Badge>
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />{t('startupOs.askAiAdvisor')}</Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="flex-1">
        <div className="border-b bg-gray-50 px-6">
          <TabsList className="bg-transparent">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />{t('startupOs.overview')}</TabsTrigger>
            <TabsTrigger value="strategy" className="gap-2">
              <Target className="h-4 w-4" />{t('startupOs.strategy')}</TabsTrigger>
            <TabsTrigger value="execution" className="gap-2">
              <Rocket className="h-4 w-4" />{t('startupOs.execution')}</TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />{t('startupOs.metrics')}</TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-2">
              <Sparkles className="h-4 w-4" />{t('startupOs.intelligence')}</TabsTrigger>
            <TabsTrigger value="inputs" className="gap-2">
              <Database className="h-4 w-4" />{t('startupOs.inputs')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              title={t('startupOs.mrr')}
              value="$12,450"
              change="+18%"
              icon={<DollarSign className="h-4 w-4" />}
              trend="up"
            />
            <QuickStatCard
              title={t('startupOs.activeOkrs')}
              value="4"
              subtitle={t('startupOs.2OnTrack')}
              icon={<Target className="h-4 w-4" />}
            />
            <QuickStatCard
              title={t('startupOs.launchProgress')}
              value="67%"
              subtitle={t('startupOs.24Of36Items')}
              icon={<CheckSquare className="h-4 w-4" />}
            />
            <QuickStatCard
              title={t('startupOs.aiRecommendations0')}
              value="3"
              subtitle={t('startupOs.2HighPriority')}
              icon={<Sparkles className="h-4 w-4" />}
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title={t('startupOs.updateWeeklyMetrics')}
              description="Log this week's MRR, customers, and churn"
              icon={<TrendingUp />}
              action={t('startupOs.updateNow')}
              onClick={() => {}}
            />
            <ActionCard
              title={t('startupOs.reviewAiRecommendations')}
              description="3 new strategic recommendations"
              icon={<Sparkles />}
              action={t('startupOs.review')}
              badge="3 new"
              onClick={() => setActiveView('intelligence')}
            />
            <ActionCard
              title={t('startupOs.contentCalendar1')}
              description="5 posts scheduled this week"
              icon={<Calendar />}
              action={t('startupOs.viewCalendar')}
              onClick={() => setActiveView('execution')}
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('startupOs.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ActivityItem
                  icon={<AlertCircle className="h-4 w-4 text-yellow-600" />}
                  title={t('startupOs.competitorPricingChangeDetected')}
                  subtitle={t('startupOs.notionIncreasedProPlan')}
                  time="2 hours ago"
                />
                <ActivityItem
                  icon={<Users className="h-4 w-4 text-green-600" />}
                  title={t('startupOs.newBetaTesterFeedback')}
                  subtitle={t('startupOs.sarahFromTechcorpRated')}
                  time="5 hours ago"
                />
                <ActivityItem
                  icon={<FileText className="h-4 w-4 text-blue-600" />}
                  title={t('startupOs.blogPostPublished')}
                  subtitle='How to Validate Your SaaS Idea in 48 Hours'
                  time="1 day ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OKRs (Objectives & Key Results)</CardTitle>
                <CardDescription>{t('startupOs.trackYourQuarterlyObjectives')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.okrsComponentHere')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('startupOs.competitorIntelligence')}</CardTitle>
                <CardDescription>{t('startupOs.automatedWeeklyTrackingOf')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.competitorTrackingComponentHere')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution" className="p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('startupOs.contentCalendar')}</CardTitle>
                <CardDescription>50 SEO-optimized content ideas for the next 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.contentCalendarComponentHere')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('startupOs.launchChecklist')}</CardTitle>
                <CardDescription>36 items to complete before launch</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.launchChecklistComponentHere')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="p-6">
          <FounderMetricsDashboard projectId={projectId} />
        </TabsContent>

        {/* Inputs Tab — engine data pipeline */}
        <TabsContent value="inputs" className="p-6">
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-semibold">{t('startupOs.datosParaLosMotores')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('startupOs.estrategiaPerfilEconómicoY')}</p>
            </div>
            <StrategyEditor projectId={projectId} />
            <EconomicProfileForm projectId={projectId} />
            <ProcessArtifactEditor projectId={projectId} />
          </div>
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('startupOs.aiRecommendations')}</CardTitle>
                <CardDescription>{t('startupOs.strategicRecommendationsBasedOn')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.aiRecommendationsComponentHere')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('startupOs.aiBusinessAdvisor')}</CardTitle>
                <CardDescription>{t('startupOs.chatWithAiAbout')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('startupOs.aiChatComponentHere')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string;
  change?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-gray-600'} mt-1`}>{change}</p>
        )}
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  icon,
  action,
  badge,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {badge && (
                <Badge variant="secondary" className="mt-1">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <Button size="sm" variant="outline" className="w-full">
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  icon,
  title,
  subtitle,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-gray-600 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  );
}
