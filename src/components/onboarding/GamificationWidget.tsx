/**
 * 🏆 GAMIFICATION WIDGET
 *
 * Shows user's points, level, achievements, and badges
 * Motivates completion through game mechanics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Target,
  Sparkles,
} from 'lucide-react';
import { GamificationSystem, ACHIEVEMENTS, BADGES } from '@/lib/gamification';

interface GamificationWidgetProps {
  projectId: string;
  userId: string;
}

export function GamificationWidget({ projectId, userId }: GamificationWidgetProps) {
  const [gamData, setGamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [projectId]);

  const loadGamificationData = async () => {
    const system = new GamificationSystem(projectId, userId);
    const data = await system.getGamificationData();
    setGamData(data);
    setLoading(false);
  };

  if (loading || !gamData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Trophy className="h-6 w-6 animate-pulse text-yellow-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pointsToNextLevel = ((gamData.level) * 1000) - gamData.points;
  const levelProgress = ((gamData.points % 1000) / 1000) * 100;

  const unlockedAchievements = gamData.achievements || [];
  const lockedAchievements = ACHIEVEMENTS.filter(
    a => !unlockedAchievements.some((ua: any) => ua.id === a.id)
  );

  const userBadges = BADGES.filter(b => gamData.badges?.includes(b.id));

  return (
    <Card className="border-2 border-yellow-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Progress</CardTitle>
              <CardDescription>Level {gamData.level} Founder</CardDescription>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600">{gamData.points}</div>
            <div className="text-xs text-gray-600">Total Points</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Level Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Level {gamData.level}
            </span>
            <span className="text-sm text-gray-600">
              {pointsToNextLevel} pts to Level {gamData.level + 1}
            </span>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </div>

        {/* Badges */}
        {userBadges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Your Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              {userBadges.map((badge) => (
                <Badge
                  key={badge.id}
                  className={`${badge.color} gap-1 px-3 py-1`}
                  variant="outline"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span>{badge.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs for Achievements */}
        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unlocked">
              Unlocked ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Locked ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          {/* Unlocked Achievements */}
          <TabsContent value="unlocked" className="space-y-2 mt-4">
            {unlockedAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Complete onboarding tasks to earn achievements!
                </p>
              </div>
            ) : (
              unlockedAchievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-gray-900">{achievement.name}</h5>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points} pts
                        </Badge>
                        {achievement.rarity === 'legendary' && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Locked Achievements */}
          <TabsContent value="locked" className="space-y-2 mt-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl grayscale">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-700">{achievement.name}</h5>
                      <Badge variant="secondary" className="text-xs">
                        +{achievement.points} pts
                      </Badge>
                      {achievement.rarity === 'legendary' && (
                        <Star className="h-4 w-4 text-gray-400" />
                      )}
                      {achievement.rarity === 'epic' && (
                        <Sparkles className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {unlockedAchievements.length}
            </div>
            <div className="text-xs text-gray-600">Achievements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userBadges.length}
            </div>
            <div className="text-xs text-gray-600">Badges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {gamData.level}
            </div>
            <div className="text-xs text-gray-600">Level</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
