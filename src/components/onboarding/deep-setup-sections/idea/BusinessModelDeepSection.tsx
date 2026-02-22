/**
 * 📊 BUSINESS MODEL DEEP DIVE SECTION
 *
 * Complete Business Model Canvas with all 9 blocks in detail
 * For users with an existing idea
 *
 * UNLOCKS:
 * - BMC Editor
 * - Value Prop Designer
 *
 * PROGRESS: +10%
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Users,
  Heart,
  MessageSquare,
  Handshake,
  DollarSign,
  Boxes,
  Zap,
  Network,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessModelDeepSectionProps {
  projectId: string;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

const BMC_BLOCKS = [
  {
    id: 'customer_segments',
    name: 'Customer Segments',
    icon: Users,
    color: 'bg-blue-500',
    question: 'Who are your most important customers? Describe each segment.',
    placeholder: 'e.g., Small businesses (10-50 employees) in retail sector, tech-savvy millennials, enterprise companies...',
  },
  {
    id: 'value_propositions',
    name: 'Value Propositions',
    icon: Heart,
    color: 'bg-red-500',
    question: 'What value do you deliver to each customer segment? What problems do you solve?',
    placeholder: 'e.g., Save 10 hours/week on manual tasks, reduce costs by 30%, provide peace of mind...',
  },
  {
    id: 'channels',
    name: 'Channels',
    icon: MessageSquare,
    color: 'bg-green-500',
    question: 'How do you reach and deliver value to your customers?',
    placeholder: 'e.g., Direct sales, website, mobile app, retail stores, partnerships...',
  },
  {
    id: 'customer_relationships',
    name: 'Customer Relationships',
    icon: Handshake,
    color: 'bg-purple-500',
    question: 'What type of relationship do you establish with each segment?',
    placeholder: 'e.g., Personal assistance, self-service, automated, communities...',
  },
  {
    id: 'revenue_streams',
    name: 'Revenue Streams',
    icon: DollarSign,
    color: 'bg-yellow-500',
    question: 'How do you make money from each customer segment?',
    placeholder: 'e.g., Subscription $99/mo, transaction fees 3%, one-time license $500...',
  },
  {
    id: 'key_resources',
    name: 'Key Resources',
    icon: Boxes,
    color: 'bg-orange-500',
    question: 'What key resources do you need to deliver your value proposition?',
    placeholder: 'e.g., Technology platform, brand, intellectual property, human resources...',
  },
  {
    id: 'key_activities',
    name: 'Key Activities',
    icon: Zap,
    color: 'bg-pink-500',
    question: 'What key activities must you perform to deliver your value proposition?',
    placeholder: 'e.g., Software development, customer support, marketing, supply chain...',
  },
  {
    id: 'key_partnerships',
    name: 'Key Partnerships',
    icon: Network,
    color: 'bg-indigo-500',
    question: 'Who are your key partners and suppliers?',
    placeholder: 'e.g., Cloud providers (AWS), payment processors (Stripe), strategic alliances...',
  },
  {
    id: 'cost_structure',
    name: 'Cost Structure',
    icon: TrendingUp,
    color: 'bg-cyan-500',
    question: 'What are your most important costs?',
    placeholder: 'e.g., Salaries $50k/mo, cloud infrastructure $5k/mo, marketing $10k/mo...',
  },
];

export function BusinessModelDeepSection({
  projectId,
  onComplete,
  onCancel,
}: BusinessModelDeepSectionProps) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [bmcData, setBmcData] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentBlockData = BMC_BLOCKS[currentBlock];
  const Icon = currentBlockData.icon;
  const progress = ((currentBlock + 1) / BMC_BLOCKS.length) * 100;

  const handleNext = () => {
    if (currentBlock < BMC_BLOCKS.length - 1) {
      setCurrentBlock(currentBlock + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentBlock > 0) {
      setCurrentBlock(currentBlock - 1);
    }
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      onComplete({
        section_id: 'business-model-deep',
        bmc_data: bmcData,
        analysis_completed: true,
        unlocked_tools: ['BMC Editor', 'Value Prop Designer'],
      });

      toast.success('Business Model completed!', {
        description: 'BMC Editor and Value Prop Designer unlocked'
      });
    } catch (error) {
      console.error('Error completing BMC:', error);
      toast.error('Failed to save', {
        description: 'Please try again'
      });
      setIsAnalyzing(false);
    }
  };

  const canProceed = () => {
    const currentAnswer = bmcData[currentBlockData.id] || '';
    return currentAnswer.trim().length >= 20;
  };

  if (isAnalyzing) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                Analyzing your Business Model Canvas
              </h3>
              <p className="text-muted-foreground max-w-md">
                Creating strategic insights, identifying gaps, and generating recommendations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${currentBlockData.color} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Business Model Canvas</CardTitle>
              <CardDescription className="text-base">
                Block {currentBlock + 1} of {BMC_BLOCKS.length}: {currentBlockData.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-600 min-w-[50px]">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Blocks Navigation */}
      <div className="grid grid-cols-9 gap-2">
        {BMC_BLOCKS.map((block, idx) => {
          const BlockIcon = block.icon;
          const isCompleted = bmcData[block.id] && bmcData[block.id].trim().length >= 20;
          const isCurrent = idx === currentBlock;

          return (
            <button
              key={block.id}
              onClick={() => setCurrentBlock(idx)}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${isCurrent ? `${block.color} border-transparent text-white scale-110` : ''}
                ${isCompleted && !isCurrent ? 'bg-green-100 border-green-300' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-100 border-gray-300 hover:border-gray-400' : ''}
              `}
              title={block.name}
            >
              <BlockIcon className={`h-4 w-4 mx-auto ${isCurrent ? 'text-white' : isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
            </button>
          );
        })}
      </div>

      {/* Current Block Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 text-blue-600`} />
            {currentBlockData.name}
          </CardTitle>
          <CardDescription>{currentBlockData.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={currentBlockData.placeholder}
            rows={6}
            value={bmcData[currentBlockData.id] || ''}
            onChange={(e) => setBmcData({ ...bmcData, [currentBlockData.id]: e.target.value })}
            className="resize-none"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {(bmcData[currentBlockData.id] || '').length} characters (minimum 20)
            </p>
            {canProceed() && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Looks good!</span>
              </div>
            )}
          </div>

          {!canProceed() && (
            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Provide at least 20 characters to describe this block of your business model
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={currentBlock === 0 ? onCancel : handleBack}
        >
          {currentBlock === 0 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">Section Progress</p>
            <p className="text-lg font-bold text-blue-600">+10%</p>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isAnalyzing}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {currentBlock === BMC_BLOCKS.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete BMC
              </>
            ) : (
              <>
                Next Block
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
