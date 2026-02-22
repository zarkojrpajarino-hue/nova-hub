import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Trophy, Medal, Star, TrendingUp, Award, Target, Zap, Crown, Gift, Users, CheckCircle2 } from 'lucide-react';

interface RankingsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamMember {
  id: number;
  name: string;
  avatar: string;
  points: number;
  badges: number;
  rank: number;
  change: number;
  department: string;
}

interface CategoryRanking {
  category: string;
  icon: React.ReactNode;
  color: string;
  leader: string;
  points: number;
  trend: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const RankingsPreviewModal: React.FC<RankingsPreviewModalProps> = ({ open, onOpenChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  // Mock data for enterprise team (28 members)
  const leaderboardData: TeamMember[] = [
    { id: 1, name: 'Sarah Chen', avatar: 'SC', points: 15840, badges: 24, rank: 1, change: 0, department: 'Sales' },
    { id: 2, name: 'Michael Torres', avatar: 'MT', points: 14520, badges: 21, rank: 2, change: 1, department: 'Sales' },
    { id: 3, name: 'Emma Wilson', avatar: 'EW', points: 13890, badges: 19, rank: 3, change: -1, department: 'Marketing' },
    { id: 4, name: 'James Park', avatar: 'JP', points: 12760, badges: 18, rank: 4, change: 2, department: 'Sales' },
    { id: 5, name: 'Lisa Rodriguez', avatar: 'LR', points: 11920, badges: 17, rank: 5, change: 0, department: 'Customer Success' },
    { id: 6, name: 'David Kim', avatar: 'DK', points: 11340, badges: 16, rank: 6, change: -2, department: 'Sales' },
    { id: 7, name: 'Rachel Green', avatar: 'RG', points: 10880, badges: 15, rank: 7, change: 1, department: 'Marketing' },
    { id: 8, name: 'Thomas Anderson', avatar: 'TA', points: 10420, badges: 14, rank: 8, change: 0, department: 'Sales' },
    { id: 9, name: 'Nina Patel', avatar: 'NP', points: 9850, badges: 13, rank: 9, change: 3, department: 'Learning' },
    { id: 10, name: 'Alex Morgan', avatar: 'AM', points: 9520, badges: 12, rank: 10, change: -1, department: 'Sales' },
  ];

  const categoryRankings: CategoryRanking[] = [
    { category: 'OBVs', icon: <Target className="w-5 h-5" />, color: 'bg-blue-500', leader: 'Sarah Chen', points: 4820, trend: '+12%' },
    { category: 'Learning', icon: <Star className="w-5 h-5" />, color: 'bg-purple-500', leader: 'Nina Patel', points: 3650, trend: '+28%' },
    { category: 'Revenue', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-500', leader: 'Michael Torres', points: 5240, trend: '+18%' },
    { category: 'Quality', icon: <Award className="w-5 h-5" />, color: 'bg-orange-500', leader: 'Emma Wilson', points: 4120, trend: '+9%' },
    { category: 'Collaboration', icon: <Users className="w-5 h-5" />, color: 'bg-pink-500', leader: 'Lisa Rodriguez', points: 3890, trend: '+15%' },
    { category: 'Innovation', icon: <Zap className="w-5 h-5" />, color: 'bg-yellow-500', leader: 'James Park', points: 3340, trend: '+22%' },
  ];

  const achievements: Achievement[] = [
    { id: 1, name: 'Century Club', description: '100 OBVs completed', icon: <Trophy className="w-8 h-8" />, unlocked: true, progress: 100, rarity: 'legendary' },
    { id: 2, name: 'Quick Learner', description: 'Complete 50 training modules', icon: <Star className="w-8 h-8" />, unlocked: true, progress: 100, rarity: 'epic' },
    { id: 3, name: 'Revenue Hero', description: 'Generate $500K in revenue', icon: <TrendingUp className="w-8 h-8" />, unlocked: true, progress: 100, rarity: 'rare' },
    { id: 4, name: 'Team Player', description: 'Help 20 team members', icon: <Users className="w-8 h-8" />, unlocked: false, progress: 75, rarity: 'rare' },
    { id: 5, name: 'Perfect Week', description: '7 days of 100% completion', icon: <Award className="w-8 h-8" />, unlocked: false, progress: 60, rarity: 'epic' },
    { id: 6, name: 'Innovation Master', description: 'Submit 10 ideas implemented', icon: <Zap className="w-8 h-8" />, unlocked: false, progress: 40, rarity: 'legendary' },
  ];

  const teamRankings = [
    { department: 'Sales', members: 12, totalPoints: 84520, avgPoints: 7043, rank: 1, change: 0 },
    { department: 'Marketing', members: 6, totalPoints: 38640, avgPoints: 6440, rank: 2, change: 1 },
    { department: 'Customer Success', members: 5, totalPoints: 29850, avgPoints: 5970, rank: 3, change: -1 },
    { department: 'Learning & Dev', members: 3, totalPoints: 16420, avgPoints: 5473, rank: 4, change: 0 },
    { department: 'Operations', members: 2, totalPoints: 9840, avgPoints: 4920, rank: 5, change: 0 },
  ];

  const currentUser = {
    name: 'You',
    rank: 12,
    points: 8940,
    badges: 11,
    department: 'Sales',
    weeklyProgress: 240,
    monthlyProgress: 1180,
    streak: 7,
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        // Intro slide
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 blur-3xl opacity-30 animate-pulse" />
              <Trophy className="w-32 h-32 text-yellow-500 relative z-10" />
            </div>
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Team Rankings
              </h2>
              <p className="text-xl text-muted-foreground">
                Compite, colabora, destaca
              </p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-semibold">Compete</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Rise through the ranks
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-semibold">Collaborate</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Help your team succeed
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="font-semibold">Excel</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Unlock achievements
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        // Overall leaderboard
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Overall Leaderboard
              </h3>
              <p className="text-sm text-muted-foreground">Top 10 performers this month</p>
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* 2nd place */}
              <div className="flex flex-col items-center">
                <Medal className="w-8 h-8 text-gray-400 mb-2" />
                <div className="w-24 h-32 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                    {leaderboardData[1].avatar}
                  </div>
                  <p className="text-xs font-semibold text-center px-1">{leaderboardData[1].name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-700">{leaderboardData[1].points.toLocaleString()}</p>
                </div>
              </div>

              {/* 1st place */}
              <div className="flex flex-col items-center">
                <Crown className="w-10 h-10 text-yellow-500 mb-2 animate-pulse" />
                <div className="w-24 h-40 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold mb-2">
                    {leaderboardData[0].avatar}
                  </div>
                  <p className="text-xs font-semibold text-center px-1">{leaderboardData[0].name.split(' ')[0]}</p>
                  <p className="text-xs text-yellow-900">{leaderboardData[0].points.toLocaleString()}</p>
                </div>
              </div>

              {/* 3rd place */}
              <div className="flex flex-col items-center">
                <Medal className="w-8 h-8 text-amber-700 mb-2" />
                <div className="w-24 h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold mb-2">
                    {leaderboardData[2].avatar}
                  </div>
                  <p className="text-xs font-semibold text-center px-1">{leaderboardData[2].name.split(' ')[0]}</p>
                  <p className="text-xs text-amber-900">{leaderboardData[2].points.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Full leaderboard */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Rank</th>
                      <th className="text-left p-3 text-sm font-semibold">Member</th>
                      <th className="text-right p-3 text-sm font-semibold">Points</th>
                      <th className="text-center p-3 text-sm font-semibold">Badges</th>
                      <th className="text-center p-3 text-sm font-semibold">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((member, index) => (
                      <tr key={member.id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <span className={`font-bold ${index < 3 ? 'text-yellow-500' : ''}`}>
                            #{member.rank}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {member.points.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Award className="w-4 h-4 text-purple-500" />
                            {member.badges}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {member.change > 0 ? (
                            <span className="text-green-600 text-sm flex items-center justify-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{member.change}
                            </span>
                          ) : member.change < 0 ? (
                            <span className="text-red-600 text-sm flex items-center justify-center gap-1">
                              <TrendingUp className="w-3 h-3 rotate-180" />
                              {member.change}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 2:
        // Rankings by category
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                Category Rankings
              </h3>
              <p className="text-sm text-muted-foreground">Performance across different areas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryRankings.map((category, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${category.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{category.category}</h4>
                        <p className="text-xs text-muted-foreground">Monthly leader</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      {category.trend}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-sm">{category.leader}</span>
                    </div>
                    <span className="font-bold text-lg">{category.points.toLocaleString()}</span>
                  </div>

                  <div className="mt-3 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`${category.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((category.points / 6000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-semibold text-sm">Pro Tip</p>
                  <p className="text-xs text-muted-foreground">
                    Focus on your weakest category to become a well-rounded top performer
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Individual profile
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-purple-500" />
                Your Performance
              </h3>
              <p className="text-sm text-muted-foreground">Track your progress and achievements</p>
            </div>

            {/* Profile header */}
            <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center text-2xl font-bold">
                  YU
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold">{currentUser.name}</h4>
                  <p className="text-sm text-muted-foreground">{currentUser.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">#{currentUser.rank}</p>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentUser.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentUser.badges}</p>
                  <p className="text-xs text-muted-foreground">Badges Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentUser.streak} days</p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
              </div>
            </div>

            {/* Progress stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Weekly Progress</p>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mb-2">+{currentUser.weeklyProgress}</p>
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">60% to weekly goal</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Monthly Progress</p>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold mb-2">+{currentUser.monthlyProgress}</p>
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '78%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">78% to monthly goal</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Your Category Performance</h4>
              <div className="space-y-3">
                {categoryRankings.slice(0, 4).map((cat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`${cat.color} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{cat.category}</p>
                        <span className="text-xs text-muted-foreground">
                          #{Math.floor(Math.random() * 15) + 5}
                        </span>
                      </div>
                      <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`${cat.color} h-full rounded-full`}
                          style={{ width: `${Math.floor(Math.random() * 40) + 50}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        // Team rankings
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                Team Rankings
              </h3>
              <p className="text-sm text-muted-foreground">Department competition standings</p>
            </div>

            {/* Top 3 teams podium */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {teamRankings.slice(0, 3).map((team, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    index === 0 ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-500' :
                      'text-amber-700'
                    }`}>
                      #{team.rank}
                    </span>
                    {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                    {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                    {index === 2 && <Medal className="w-6 h-6 text-amber-700" />}
                  </div>
                  <h4 className="font-bold mb-1">{team.department}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{team.members} members</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{team.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg/Member</span>
                      <span className="font-semibold">{team.avgPoints.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Full team standings */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Rank</th>
                    <th className="text-left p-3 text-sm font-semibold">Department</th>
                    <th className="text-center p-3 text-sm font-semibold">Members</th>
                    <th className="text-right p-3 text-sm font-semibold">Total Points</th>
                    <th className="text-right p-3 text-sm font-semibold">Avg Points</th>
                    <th className="text-center p-3 text-sm font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRankings.map((team, index) => (
                    <tr key={index} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <span className={`font-bold ${index === 0 ? 'text-yellow-500' : ''}`}>
                          #{team.rank}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{team.department}</td>
                      <td className="p-3 text-center text-muted-foreground">{team.members}</td>
                      <td className="p-3 text-right font-bold">
                        {team.totalPoints.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-muted-foreground">
                        {team.avgPoints.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {team.change > 0 ? (
                          <span className="text-green-600 text-sm">+{team.change}</span>
                        ) : team.change < 0 ? (
                          <span className="text-red-600 text-sm">{team.change}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Team insights */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="font-semibold text-sm mb-1">Your Team: {currentUser.department}</p>
                  <p className="text-xs text-muted-foreground">
                    Your team is currently ranked #{teamRankings.find(t => t.department === currentUser.department)?.rank || 1}.
                    Every point you earn helps your entire department climb the rankings!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        // Rewards & achievements
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Award className="w-6 h-6 text-purple-500" />
                Rewards & Achievements
              </h3>
              <p className="text-sm text-muted-foreground">Unlock badges and earn prizes</p>
            </div>

            {/* Achievement cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 ${
                    achievement.unlocked ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center bg-gradient-to-br ${getRarityColor(achievement.rarity)} ${
                      achievement.unlocked ? '' : 'grayscale'
                    }`}>
                      <div className="text-white">
                        {achievement.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold">{achievement.name}</h4>
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Trophy className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{achievement.progress}%</span>
                      </div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prizes section */}
            <div className="border rounded-lg p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-6 h-6 text-orange-500" />
                <h4 className="font-bold text-lg">Monthly Prizes</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center mb-2">
                    <Crown className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm">1st Place</p>
                  <p className="text-xs text-muted-foreground">$500 Gift Card</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-300 text-white flex items-center justify-center mb-2">
                    <Medal className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm">2nd Place</p>
                  <p className="text-xs text-muted-foreground">$300 Gift Card</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-700 to-amber-600 text-white flex items-center justify-center mb-2">
                    <Medal className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-sm">3rd Place</p>
                  <p className="text-xs text-muted-foreground">$200 Gift Card</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900">
                <p className="text-sm text-center font-semibold">Top 10 finishers get exclusive swag</p>
              </div>
            </div>

            {/* Motivation box */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-semibold text-sm">Keep Going!</p>
                  <p className="text-xs text-muted-foreground">
                    You're only 3 achievements away from unlocking the Innovation Master badge!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rankings Preview</span>
            <span className="text-sm text-muted-foreground font-normal">
              Slide {currentSlide + 1} of {totalSlides}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {renderSlide()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

        <Button
          variant="outline"
          size="sm"
          onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
        >
          {currentSlide === totalSlides - 1 ? (
            <>
              Finalizar
              <CheckCircle2 className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

