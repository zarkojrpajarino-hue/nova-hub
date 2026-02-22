/**
 * 🎯 ONBOARDING PROGRESS BANNER
 *
 * Displayed on project dashboard after Fast Start completion
 * Shows progress, unlocked features, and CTA for Deep Setup
 *
 * STATES:
 * - Fast Start Complete (25%): Show Deep Setup CTA
 * - Deep Setup In Progress (26-99%): Show current section + progress
 * - Complete (100%): Show celebration + all features unlocked
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  TrendingUp,
  Rocket,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingProgressBannerProps {
  projectId: string;
  progress: number; // 0-100
  fastStartCompleted: boolean;
  deepSetupSections: {
    id: string;
    name: string;
    completed: boolean;
    locked: boolean;
  }[];
  onboardingType: 'generative' | 'idea' | 'existing';
}

export function OnboardingProgressBanner({
  projectId,
  progress,
  fastStartCompleted,
  deepSetupSections,
  onboardingType: _onboardingType,
}: OnboardingProgressBannerProps) {
  const navigate = useNavigate();

  // Calculate stats
  const completedSections = deepSetupSections.filter(s => s.completed).length;
  const totalSections = deepSetupSections.length;
  const unlockedTools = deepSetupSections.filter(s => !s.locked).length;

  // Dismissed state (can be stored in localStorage)
  const isDismissed = localStorage.getItem(`onboarding-banner-dismissed-${projectId}`) === 'true';

  if (isDismissed && progress >= 100) {
    return null; // Don't show banner if dismissed and completed
  }

  // State 1: Fast Start Complete (25%)
  if (progress === 25 && fastStartCompleted) {
    return (
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 mb-6 overflow-hidden relative">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-purple-200/20 animate-pulse" />

        <CardContent className="pt-6 pb-6 relative z-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Rocket className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Fast Start Complete!
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Your project is ready to use. Complete Deep Setup (optional) to unlock advanced tools and AI features.
                </p>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 mb-2">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    {progress}%
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Fast Start ✓</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Unlock className="h-3 w-3 text-blue-600" />
                    <span>Basic features unlocked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-gray-400" />
                    <span>{totalSections} advanced tools locked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/proyecto/${projectId}/deep-setup`)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                Continue Deep Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => localStorage.setItem(`onboarding-banner-dismissed-${projectId}`, 'true')}
                className="text-gray-500"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 2: Deep Setup In Progress (26-99%)
  if (progress > 25 && progress < 100) {
    return (
      <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 mb-6">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                <Star className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Great Progress! Keep Going
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  You've completed {completedSections} of {totalSections} Deep Setup sections. {unlockedTools} advanced tools unlocked!
                </p>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 mb-2">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    {progress}%
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>{completedSections}/{totalSections} sections complete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Unlock className="h-3 w-3 text-purple-600" />
                    <span>{unlockedTools} tools unlocked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/proyecto/${projectId}/deep-setup`)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="h-4 w-4" />
                Continue Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => localStorage.setItem(`onboarding-banner-dismissed-${projectId}`, 'true')}
                className="text-gray-500"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 3: Complete (100%)
  if (progress >= 100) {
    return (
      <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 mb-6">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  Onboarding Complete!
                  <span className="text-2xl">🎉</span>
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  You've unlocked all features and tools. Your business ecosystem is fully configured!
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>All {totalSections} sections complete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Unlock className="h-3 w-3 text-green-600" />
                    <span>All tools unlocked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-600" />
                    <span>Master badge earned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => localStorage.setItem(`onboarding-banner-dismissed-${projectId}`, 'true')}
              className="text-gray-500"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
