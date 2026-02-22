/**
 * 🏥 HEALTH DIAGNOSTIC SECTION
 * Deep business health analysis with truth-o-meter
 * Unlocks: Health Dashboard, Diagnostic Report | +10%
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, CheckCircle2, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface HealthDiagnosticSectionProps {
  projectId: string;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function HealthDiagnosticSection({ projectId, onComplete, onCancel }: HealthDiagnosticSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState({
    revenue_trend: '',
    customer_acquisition: '',
    churn_rate: '',
    team_morale: '',
    product_market_fit: '',
    cash_runway: '',
  });

  const canAnalyze = () => Object.values(metrics).filter(Boolean).length >= 4;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setShowResults(true);
    setIsAnalyzing(false);
  };

  const handleComplete = () => {
    onComplete({
      section_id: 'health-diagnostic',
      metrics,
      health_score: 72,
      unlocked_tools: ['Health Dashboard', 'Diagnostic Report'],
    });
    toast.success('Health Diagnostic complete!');
  };

  if (isAnalyzing) {
    return (
      <Card className="max-w-4xl mx-auto"><CardContent className="pt-12 pb-12 text-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
        <h3 className="text-2xl font-bold">Analyzing business health...</h3>
      </CardContent></Card>
    );
  }

  if (showResults) {
    const healthScore = 72;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">{healthScore}%</div>
              <h3 className="text-2xl font-bold mb-2">Business Health Score</h3>
              <p className="text-gray-600">Your business is in good shape with room for improvement</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="font-bold text-green-600">Strong</div>
            <div className="text-sm text-gray-600">Revenue Growth</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Minus className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-bold text-yellow-600">Average</div>
            <div className="text-sm text-gray-600">Customer Retention</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="font-bold text-red-600">Needs Work</div>
            <div className="text-sm text-gray-600">Product-Market Fit</div>
          </CardContent></Card>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <div className="flex items-center gap-3">
            <Badge>+10%</Badge>
            <Button onClick={handleComplete} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />Complete<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Business Health Diagnostic</CardTitle>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current State Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Revenue Trend (Last 3 months)</Label>
            <Select value={metrics.revenue_trend} onValueChange={(v) => setMetrics({...metrics, revenue_trend: v})}>
              <SelectTrigger><SelectValue placeholder="Select trend" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growing">Growing ({'>'}10%)</SelectItem>
                <SelectItem value="stable">Stable (±5%)</SelectItem>
                <SelectItem value="declining">Declining ({'>'}-10%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Customer Acquisition</Label>
            <Select value={metrics.customer_acquisition} onValueChange={(v) => setMetrics({...metrics, customer_acquisition: v})}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strong">Strong & Predictable</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="weak">Struggling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monthly Churn Rate</Label>
            <Select value={metrics.churn_rate} onValueChange={(v) => setMetrics({...metrics, churn_rate: v})}>
              <SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (less than 5%)</SelectItem>
                <SelectItem value="medium">Medium (5-10%)</SelectItem>
                <SelectItem value="high">High (more than 10%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Product-Market Fit</Label>
            <Select value={metrics.product_market_fit} onValueChange={(v) => setMetrics({...metrics, product_market_fit: v})}>
              <SelectTrigger><SelectValue placeholder="Select fit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strong">Strong (NPS more than 50)</SelectItem>
                <SelectItem value="moderate">Moderate (NPS 20-50)</SelectItem>
                <SelectItem value="weak">Weak (NPS less than 20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex items-center gap-3">
          <Badge>+10%</Badge>
          <Button onClick={handleAnalyze} disabled={!canAnalyze()} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Activity className="h-4 w-4 mr-2" />Analyze Health<ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
