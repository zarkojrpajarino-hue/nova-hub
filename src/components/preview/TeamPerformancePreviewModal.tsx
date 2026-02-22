import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Users, Target, TrendingUp, Briefcase, Award, Network, BarChart3, Building2, Zap, Clock, CheckCircle2, Activity } from 'lucide-react';

interface TeamPerformancePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  performance: number;
  utilization: number;
  projects: string[];
  manager?: string;
  skills: { [key: string]: number };
}

interface Department {
  name: string;
  headcount: number;
  avgPerformance: number;
  avgUtilization: number;
  budget: number;
}

interface Project {
  name: string;
  members: string[];
  allocation: { [key: string]: number };
}

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah Chen', role: 'Engineering Lead', department: 'Engineering', performance: 95, utilization: 88, projects: ['Project Alpha', 'Project Beta'], manager: 'CEO', skills: { 'Leadership': 95, 'Technical': 90, 'Communication': 88, 'Strategy': 85 } },
  { id: '2', name: 'Marcus Williams', role: 'Senior Developer', department: 'Engineering', performance: 92, utilization: 85, projects: ['Project Alpha', 'Project Gamma'], manager: '1', skills: { 'Leadership': 75, 'Technical': 95, 'Communication': 80, 'Strategy': 70 } },
  { id: '3', name: 'Emma Rodriguez', role: 'Product Manager', department: 'Product', performance: 88, utilization: 82, projects: ['Project Beta', 'Project Delta'], manager: 'CPO', skills: { 'Leadership': 85, 'Technical': 70, 'Communication': 92, 'Strategy': 88 } },
  { id: '4', name: 'Alex Kim', role: 'UX Designer', department: 'Design', performance: 90, utilization: 79, projects: ['Project Beta', 'Project Epsilon'], manager: '15', skills: { 'Leadership': 65, 'Technical': 75, 'Communication': 85, 'Strategy': 70 } },
  { id: '5', name: 'Jordan Taylor', role: 'Marketing Director', department: 'Marketing', performance: 86, utilization: 76, projects: ['Project Zeta', 'Project Eta'], manager: 'CMO', skills: { 'Leadership': 88, 'Technical': 60, 'Communication': 95, 'Strategy': 85 } },
  { id: '6', name: 'Maya Patel', role: 'Data Analyst', department: 'Analytics', performance: 94, utilization: 91, projects: ['Project Alpha', 'Project Theta'], manager: '20', skills: { 'Leadership': 70, 'Technical': 92, 'Communication': 75, 'Strategy': 80 } },
  { id: '7', name: 'Chris Anderson', role: 'DevOps Engineer', department: 'Engineering', performance: 91, utilization: 87, projects: ['Project Gamma', 'Project Iota'], manager: '1', skills: { 'Leadership': 72, 'Technical': 94, 'Communication': 78, 'Strategy': 75 } },
  { id: '8', name: 'Sofia Martinez', role: 'Sales Manager', department: 'Sales', performance: 89, utilization: 84, projects: ['Project Kappa'], manager: 'CSO', skills: { 'Leadership': 90, 'Technical': 55, 'Communication': 93, 'Strategy': 82 } },
  { id: '9', name: 'Ryan O\'Connor', role: 'Backend Developer', department: 'Engineering', performance: 87, utilization: 83, projects: ['Project Alpha', 'Project Lambda'], manager: '1', skills: { 'Leadership': 68, 'Technical': 90, 'Communication': 74, 'Strategy': 70 } },
  { id: '10', name: 'Lily Zhang', role: 'Content Strategist', department: 'Marketing', performance: 85, utilization: 80, projects: ['Project Eta', 'Project Mu'], manager: '5', skills: { 'Leadership': 75, 'Technical': 65, 'Communication': 88, 'Strategy': 85 } },
  { id: '11', name: 'David Brown', role: 'QA Lead', department: 'Engineering', performance: 93, utilization: 89, projects: ['Project Beta', 'Project Gamma'], manager: '1', skills: { 'Leadership': 82, 'Technical': 88, 'Communication': 85, 'Strategy': 78 } },
  { id: '12', name: 'Aria Johnson', role: 'Product Designer', department: 'Design', performance: 91, utilization: 86, projects: ['Project Delta', 'Project Epsilon'], manager: '15', skills: { 'Leadership': 70, 'Technical': 80, 'Communication': 90, 'Strategy': 75 } },
  { id: '13', name: 'Tyler Moore', role: 'Frontend Developer', department: 'Engineering', performance: 88, utilization: 82, projects: ['Project Beta', 'Project Iota'], manager: '1', skills: { 'Leadership': 65, 'Technical': 92, 'Communication': 76, 'Strategy': 68 } },
  { id: '14', name: 'Nina Kowalski', role: 'HR Manager', department: 'HR', performance: 84, utilization: 78, projects: ['Project Nu'], manager: 'CHRO', skills: { 'Leadership': 86, 'Technical': 58, 'Communication': 92, 'Strategy': 80 } },
  { id: '15', name: 'Oliver Smith', role: 'Design Director', department: 'Design', performance: 92, utilization: 85, projects: ['Project Beta', 'Project Delta'], manager: 'CDO', skills: { 'Leadership': 90, 'Technical': 75, 'Communication': 88, 'Strategy': 87 } },
  { id: '16', name: 'Isabella Garcia', role: 'Account Executive', department: 'Sales', performance: 87, utilization: 81, projects: ['Project Kappa', 'Project Xi'], manager: '8', skills: { 'Leadership': 78, 'Technical': 52, 'Communication': 90, 'Strategy': 76 } },
  { id: '17', name: 'Ethan Lee', role: 'ML Engineer', department: 'Engineering', performance: 96, utilization: 90, projects: ['Project Theta', 'Project Omicron'], manager: '1', skills: { 'Leadership': 75, 'Technical': 98, 'Communication': 72, 'Strategy': 82 } },
  { id: '18', name: 'Zoe Campbell', role: 'Social Media Manager', department: 'Marketing', performance: 83, utilization: 77, projects: ['Project Eta', 'Project Pi'], manager: '5', skills: { 'Leadership': 70, 'Technical': 68, 'Communication': 86, 'Strategy': 72 } },
  { id: '19', name: 'Lucas Wilson', role: 'Mobile Developer', department: 'Engineering', performance: 89, utilization: 84, projects: ['Project Lambda', 'Project Rho'], manager: '1', skills: { 'Leadership': 68, 'Technical': 91, 'Communication': 75, 'Strategy': 70 } },
  { id: '20', name: 'Hannah Foster', role: 'Analytics Lead', department: 'Analytics', performance: 94, utilization: 88, projects: ['Project Alpha', 'Project Theta'], manager: 'CAO', skills: { 'Leadership': 88, 'Technical': 93, 'Communication': 82, 'Strategy': 90 } },
  { id: '21', name: 'Jack Thompson', role: 'Security Engineer', department: 'Engineering', performance: 90, utilization: 86, projects: ['Project Sigma', 'Project Tau'], manager: '1', skills: { 'Leadership': 72, 'Technical': 95, 'Communication': 70, 'Strategy': 78 } },
  { id: '22', name: 'Ava Mitchell', role: 'Brand Manager', department: 'Marketing', performance: 86, utilization: 79, projects: ['Project Zeta', 'Project Upsilon'], manager: '5', skills: { 'Leadership': 82, 'Technical': 62, 'Communication': 90, 'Strategy': 84 } },
  { id: '23', name: 'Noah Davis', role: 'Solutions Architect', department: 'Engineering', performance: 93, utilization: 87, projects: ['Project Alpha', 'Project Gamma'], manager: '1', skills: { 'Leadership': 85, 'Technical': 96, 'Communication': 80, 'Strategy': 88 } },
  { id: '24', name: 'Mia Robinson', role: 'Customer Success', department: 'Sales', performance: 88, utilization: 83, projects: ['Project Kappa', 'Project Phi'], manager: '8', skills: { 'Leadership': 80, 'Technical': 65, 'Communication': 94, 'Strategy': 78 } },
  { id: '25', name: 'Liam Carter', role: 'Data Engineer', department: 'Analytics', performance: 91, utilization: 85, projects: ['Project Theta', 'Project Chi'], manager: '20', skills: { 'Leadership': 70, 'Technical': 93, 'Communication': 73, 'Strategy': 76 } },
  { id: '26', name: 'Emma Watson', role: 'Recruiter', department: 'HR', performance: 82, utilization: 75, projects: ['Project Nu', 'Project Psi'], manager: '14', skills: { 'Leadership': 75, 'Technical': 55, 'Communication': 88, 'Strategy': 72 } },
  { id: '27', name: 'James Harris', role: 'Business Analyst', department: 'Analytics', performance: 87, utilization: 81, projects: ['Project Delta', 'Project Omega'], manager: '20', skills: { 'Leadership': 76, 'Technical': 82, 'Communication': 84, 'Strategy': 86 } },
  { id: '28', name: 'Olivia White', role: 'UI Designer', department: 'Design', performance: 89, utilization: 82, projects: ['Project Epsilon', 'Project Iota'], manager: '15', skills: { 'Leadership': 68, 'Technical': 78, 'Communication': 86, 'Strategy': 72 } },
];

const departments: Department[] = [
  { name: 'Engineering', headcount: 10, avgPerformance: 91, avgUtilization: 86, budget: 2500000 },
  { name: 'Product', headcount: 1, avgPerformance: 88, avgUtilization: 82, budget: 180000 },
  { name: 'Design', headcount: 4, avgPerformance: 91, avgUtilization: 84, budget: 480000 },
  { name: 'Marketing', headcount: 4, avgPerformance: 85, avgUtilization: 78, budget: 520000 },
  { name: 'Sales', headcount: 3, avgPerformance: 88, avgUtilization: 83, budget: 450000 },
  { name: 'Analytics', headcount: 4, avgPerformance: 92, avgUtilization: 86, budget: 580000 },
];

const projects: Project[] = [
  { name: 'Project Alpha', members: ['Sarah Chen', 'Marcus Williams', 'Maya Patel', 'Ryan O\'Connor', 'Hannah Foster', 'Noah Davis'], allocation: { 'Sarah Chen': 40, 'Marcus Williams': 80, 'Maya Patel': 60, 'Ryan O\'Connor': 100, 'Hannah Foster': 50, 'Noah Davis': 70 } },
  { name: 'Project Beta', members: ['Sarah Chen', 'Emma Rodriguez', 'Alex Kim', 'David Brown', 'Tyler Moore', 'Oliver Smith'], allocation: { 'Sarah Chen': 30, 'Emma Rodriguez': 50, 'Alex Kim': 60, 'David Brown': 70, 'Tyler Moore': 80, 'Oliver Smith': 40 } },
  { name: 'Project Gamma', members: ['Marcus Williams', 'Chris Anderson', 'David Brown', 'Noah Davis'], allocation: { 'Marcus Williams': 60, 'Chris Anderson': 70, 'David Brown': 50, 'Noah Davis': 50 } },
  { name: 'Project Delta', members: ['Emma Rodriguez', 'Aria Johnson', 'Oliver Smith', 'James Harris'], allocation: { 'Emma Rodriguez': 70, 'Aria Johnson': 60, 'Oliver Smith': 40, 'James Harris': 50 } },
  { name: 'Project Epsilon', members: ['Alex Kim', 'Aria Johnson', 'Olivia White'], allocation: { 'Alex Kim': 70, 'Aria Johnson': 80, 'Olivia White': 60 } },
  { name: 'Project Zeta', members: ['Jordan Taylor', 'Ava Mitchell'], allocation: { 'Jordan Taylor': 50, 'Ava Mitchell': 60 } },
  { name: 'Project Eta', members: ['Jordan Taylor', 'Lily Zhang', 'Zoe Campbell'], allocation: { 'Jordan Taylor': 40, 'Lily Zhang': 70, 'Zoe Campbell': 50 } },
  { name: 'Project Theta', members: ['Maya Patel', 'Ethan Lee', 'Hannah Foster', 'Liam Carter'], allocation: { 'Maya Patel': 80, 'Ethan Lee': 60, 'Hannah Foster': 70, 'Liam Carter': 60 } },
  { name: 'Project Iota', members: ['Chris Anderson', 'Tyler Moore', 'Olivia White'], allocation: { 'Chris Anderson': 50, 'Tyler Moore': 60, 'Olivia White': 70 } },
  { name: 'Project Kappa', members: ['Sofia Martinez', 'Isabella Garcia', 'Mia Robinson'], allocation: { 'Sofia Martinez': 80, 'Isabella Garcia': 70, 'Mia Robinson': 60 } },
  { name: 'Project Lambda', members: ['Ryan O\'Connor', 'Lucas Wilson'], allocation: { 'Ryan O\'Connor': 50, 'Lucas Wilson': 70 } },
  { name: 'Project Nu', members: ['Nina Kowalski', 'Emma Watson'], allocation: { 'Nina Kowalski': 60, 'Emma Watson': 70 } },
];

const skills = ['Leadership', 'Technical', 'Communication', 'Strategy'];

export function TeamPerformancePreviewModal({ open, onOpenChange }: TeamPerformancePreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 7;

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

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-300';
    if (score >= 80) return 'bg-blue-100 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-orange-100 border-orange-300';
  };

  const getSkillColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const avgPerformance = Math.round(teamMembers.reduce((sum, m) => sum + m.performance, 0) / teamMembers.length);
  const avgUtilization = Math.round(teamMembers.reduce((sum, m) => sum + m.utilization, 0) / teamMembers.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>Team Performance Preview</DialogTitle>
          <DialogDescription>
            Interactive preview of the Team Performance Dashboard
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Performance Dashboard</h2>
              <p className="text-sm text-gray-600">Vista 360° de tu organización</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-8">
            {/* Slide 0: Intro */}
            {currentSlide === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl">
                  <Network className="w-14 h-14 text-white" />
                </div>
                <div className="space-y-4 max-w-2xl">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Vista 360° de tu Organización
                  </h1>
                  <p className="text-xl text-gray-600">
                    Análisis completo de rendimiento, estructura y capacidades del equipo
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full max-w-3xl mt-8">
                  <div className="p-6 rounded-xl border-2 border-purple-200 bg-purple-50">
                    <Users className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="text-3xl font-bold text-purple-900">28</div>
                    <div className="text-sm text-purple-700">Team Members</div>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-blue-200 bg-blue-50">
                    <Briefcase className="w-8 h-8 text-blue-600 mb-3" />
                    <div className="text-3xl font-bold text-blue-900">12</div>
                    <div className="text-sm text-blue-700">Active Projects</div>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-cyan-200 bg-cyan-50">
                    <Building2 className="w-8 h-8 text-cyan-600 mb-3" />
                    <div className="text-3xl font-bold text-cyan-900">6</div>
                    <div className="text-sm text-cyan-700">Departments</div>
                  </div>
                </div>

                <div className="mt-8">
                  <Badge variant="secondary" className="text-sm px-4 py-2">
                    <Zap className="w-4 h-4 mr-2" />
                    Advanced Analytics
                  </Badge>
                </div>
              </div>
            )}

            {/* Slide 1: Team Overview */}
            {currentSlide === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Team Overview</h3>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <Users className="w-8 h-8 mb-3 opacity-80" />
                    <div className="text-3xl font-bold">{teamMembers.length}</div>
                    <div className="text-sm opacity-90">Total Headcount</div>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Target className="w-8 h-8 mb-3 opacity-80" />
                    <div className="text-3xl font-bold">{avgPerformance}%</div>
                    <div className="text-sm opacity-90">Avg Performance</div>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                    <Activity className="w-8 h-8 mb-3 opacity-80" />
                    <div className="text-3xl font-bold">{avgUtilization}%</div>
                    <div className="text-sm opacity-90">Avg Utilization</div>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                    <div className="text-3xl font-bold">+12%</div>
                    <div className="text-sm opacity-90">Growth Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 border-2 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Performance Distribution
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-700 font-medium">Excellent (90-100)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.performance >= 90).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.performance >= 90).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-700 font-medium">Good (80-89)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.performance >= 80 && m.performance < 90).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.performance >= 80 && m.performance < 90).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-yellow-700 font-medium">Average (70-79)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.performance >= 70 && m.performance < 80).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.performance >= 70 && m.performance < 80).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-2 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Utilization Distribution
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-700 font-medium">High (85-100%)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.utilization >= 85).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.utilization >= 85).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-700 font-medium">Optimal (75-84%)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.utilization >= 75 && m.utilization < 85).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.utilization >= 75 && m.utilization < 85).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-orange-700 font-medium">Low (&lt;75%)</span>
                          <span className="font-semibold">{teamMembers.filter(m => m.utilization < 75).length} members</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(teamMembers.filter(m => m.utilization < 75).length / teamMembers.length) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-2 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Top Performers
                  </h4>
                  <div className="grid grid-cols-5 gap-3">
                    {teamMembers
                      .sort((a, b) => b.performance - a.performance)
                      .slice(0, 5)
                      .map((member, index) => (
                        <div key={member.id} className="p-4 bg-white rounded-lg border-2 border-purple-200 text-center">
                          <div className="text-2xl font-bold text-purple-600">#{index + 1}</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">{member.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{member.role}</div>
                          <div className="mt-2 text-lg font-bold text-green-600">{member.performance}%</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Performance Matrix */}
            {currentSlide === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Performance Matrix</h3>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border-2 ${getPerformanceBg(member.performance)} transition-all hover:scale-105 hover:shadow-lg cursor-pointer`}
                    >
                      <div className="text-xs font-semibold text-gray-700 truncate" title={member.name}>
                        {member.name.split(' ')[0]}
                      </div>
                      <div className="text-xs text-gray-600 truncate mt-1" title={member.role}>
                        {member.role}
                      </div>
                      <div className={`text-xl font-bold ${getPerformanceColor(member.performance)} mt-2`}>
                        {member.performance}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {member.utilization}% util
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {member.performance >= 90 && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        {member.utilization >= 85 && <Zap className="w-3 h-3 text-yellow-600" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-700">90-100 (Excellent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-sm text-gray-700">80-89 (Good)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">70-79 (Average)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Top Performer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">High Utilization</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Department Breakdown */}
            {currentSlide === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Department Breakdown</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {departments.map((dept, index) => (
                    <div
                      key={dept.name}
                      className="p-6 rounded-xl border-2 hover:shadow-xl transition-all bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900">{dept.name}</h4>
                        <Badge variant="secondary">{dept.headcount} members</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{dept.avgPerformance}%</div>
                          <div className="text-xs text-gray-600 mt-1">Performance</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{dept.avgUtilization}%</div>
                          <div className="text-xs text-gray-600 mt-1">Utilization</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">${(dept.budget / 1000).toFixed(0)}K</div>
                          <div className="text-xs text-gray-600 mt-1">Budget</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">Team Members:</div>
                        <div className="flex flex-wrap gap-1">
                          {teamMembers
                            .filter((m) => m.department === dept.name)
                            .map((member) => (
                              <div
                                key={member.id}
                                className="text-xs px-2 py-1 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200 transition-colors"
                                title={`${member.name} - ${member.role}`}
                              >
                                {member.name.split(' ')[0]}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Department Comparison</h4>
                  <div className="space-y-3">
                    {departments.map((dept) => (
                      <div key={dept.name} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-gray-700">{dept.name}</div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">Performance</div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${dept.avgPerformance}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">Utilization</div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${dept.avgUtilization}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 4: Project Allocation */}
            {currentSlide === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="w-6 h-6 text-green-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Project Allocation</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.name}
                      className="p-5 rounded-xl border-2 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">{project.name}</h4>
                        <Badge variant="outline">{project.members.length} members</Badge>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(project.allocation).map(([name, allocation]) => (
                          <div key={name} className="flex items-center gap-3">
                            <div className="text-sm text-gray-700 w-32 truncate" title={name}>
                              {name.split(' ')[0]}
                            </div>
                            <div className="flex-1">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    allocation >= 80 ? 'bg-red-500' : allocation >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${allocation}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 w-12 text-right">
                              {allocation}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-700">0-59% (Available)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">60-79% (Busy)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-sm text-gray-700">80-100% (Overloaded)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 5: Skills Matrix */}
            {currentSlide === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Skills Matrix</h3>
                </div>

                <div className="overflow-auto">
                  <div className="inline-block min-w-full">
                    <div className="grid grid-cols-5 gap-1">
                      {/* Header */}
                      <div className="p-3 bg-gray-100 font-semibold text-sm sticky left-0">
                        Team Member
                      </div>
                      {skills.map((skill) => (
                        <div key={skill} className="p-3 bg-gray-100 font-semibold text-sm text-center">
                          {skill}
                        </div>
                      ))}

                      {/* Rows */}
                      {teamMembers.map((member) => (
                        <React.Fragment key={member.id}>
                          <div className="p-3 bg-white border text-sm font-medium sticky left-0 flex items-center">
                            <div className="truncate" title={member.name}>
                              {member.name}
                            </div>
                          </div>
                          {skills.map((skill) => {
                            const score = member.skills[skill];
                            return (
                              <div
                                key={`${member.id}-${skill}`}
                                className="p-3 border flex items-center justify-center"
                                style={{
                                  backgroundColor: `rgba(${score >= 90 ? '34, 197, 94' : score >= 80 ? '59, 130, 246' : score >= 70 ? '234, 179, 8' : score >= 60 ? '249, 115, 22' : '239, 68, 68'}, ${score / 100})`,
                                }}
                              >
                                <div className="text-sm font-semibold text-gray-900">{score}</div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  {skills.map((skill) => {
                    const avgScore = Math.round(
                      teamMembers.reduce((sum, m) => sum + m.skills[skill], 0) / teamMembers.length
                    );
                    return (
                      <div key={skill} className="p-4 border-2 rounded-xl bg-gradient-to-br from-white to-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2">{skill}</h4>
                        <div className="text-3xl font-bold text-blue-600 mb-2">{avgScore}</div>
                        <div className="text-xs text-gray-600">Team Average</div>
                        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getSkillColor(avgScore)} rounded-full`}
                            style={{ width: `${avgScore}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-700">90-100 (Expert)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-sm text-gray-700">80-89 (Advanced)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">70-79 (Intermediate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span className="text-sm text-gray-700">60-69 (Basic)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-sm text-gray-700">&lt;60 (Beginner)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 6: Org Chart */}
            {currentSlide === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Network className="w-6 h-6 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Organization Chart</h3>
                </div>

                <div className="space-y-6">
                  {/* Engineering Department */}
                  <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="text-center mb-6">
                      <div className="inline-block p-4 bg-blue-600 rounded-lg text-white">
                        <div className="font-bold">Sarah Chen</div>
                        <div className="text-sm">Engineering Lead</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {teamMembers.filter((m) => m.manager === '1').map((member) => (
                        <div key={member.id} className="p-3 bg-white rounded-lg border-2 border-blue-200 text-center">
                          <div className="text-sm font-semibold text-gray-900">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600 mt-1">{member.role}</div>
                          <div className="text-xs text-blue-600 mt-2 font-semibold">{member.performance}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Design Department */}
                  <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="text-center mb-6">
                      <div className="inline-block p-4 bg-purple-600 rounded-lg text-white">
                        <div className="font-bold">Oliver Smith</div>
                        <div className="text-sm">Design Director</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {teamMembers.filter((m) => m.manager === '15').map((member) => (
                        <div key={member.id} className="p-3 bg-white rounded-lg border-2 border-purple-200 text-center">
                          <div className="text-sm font-semibold text-gray-900">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600 mt-1">{member.role}</div>
                          <div className="text-xs text-purple-600 mt-2 font-semibold">{member.performance}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marketing Department */}
                  <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-orange-50 to-yellow-50">
                    <div className="text-center mb-6">
                      <div className="inline-block p-4 bg-orange-600 rounded-lg text-white">
                        <div className="font-bold">Jordan Taylor</div>
                        <div className="text-sm">Marketing Director</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {teamMembers.filter((m) => m.manager === '5').map((member) => (
                        <div key={member.id} className="p-3 bg-white rounded-lg border-2 border-orange-200 text-center">
                          <div className="text-sm font-semibold text-gray-900">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600 mt-1">{member.role}</div>
                          <div className="text-xs text-orange-600 mt-2 font-semibold">{member.performance}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analytics Department */}
                  <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="text-center mb-6">
                      <div className="inline-block p-4 bg-green-600 rounded-lg text-white">
                        <div className="font-bold">Hannah Foster</div>
                        <div className="text-sm">Analytics Lead</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {teamMembers.filter((m) => m.manager === '20').map((member) => (
                        <div key={member.id} className="p-3 bg-white rounded-lg border-2 border-green-200 text-center">
                          <div className="text-sm font-semibold text-gray-900">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600 mt-1">{member.role}</div>
                          <div className="text-xs text-green-600 mt-2 font-semibold">{member.performance}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other Departments */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border-2 bg-gradient-to-br from-cyan-50 to-blue-50">
                      <div className="text-center mb-4">
                        <div className="inline-block p-3 bg-cyan-600 rounded-lg text-white text-sm">
                          <div className="font-bold">Product</div>
                        </div>
                      </div>
                      {teamMembers.filter((m) => m.department === 'Product').map((member) => (
                        <div key={member.id} className="p-2 bg-white rounded border text-center">
                          <div className="text-xs font-semibold">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-cyan-600">{member.performance}%</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl border-2 bg-gradient-to-br from-red-50 to-pink-50">
                      <div className="text-center mb-4">
                        <div className="inline-block p-3 bg-red-600 rounded-lg text-white text-sm">
                          <div className="font-bold">Sales</div>
                        </div>
                      </div>
                      {teamMembers.filter((m) => m.department === 'Sales' && m.manager !== '8').slice(0, 1).map((member) => (
                        <div key={member.id} className="p-2 bg-white rounded border text-center mb-2">
                          <div className="text-xs font-semibold">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-red-600">{member.performance}%</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        {teamMembers.filter((m) => m.manager === '8').map((member) => (
                          <div key={member.id} className="p-2 bg-white rounded border text-center">
                            <div className="text-xs font-semibold">{member.name.split(' ')[0]}</div>
                            <div className="text-xs text-red-600">{member.performance}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border-2 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <div className="text-center mb-4">
                        <div className="inline-block p-3 bg-indigo-600 rounded-lg text-white text-sm">
                          <div className="font-bold">HR</div>
                        </div>
                      </div>
                      {teamMembers.filter((m) => m.department === 'HR' && !m.manager?.includes('14')).slice(0, 1).map((member) => (
                        <div key={member.id} className="p-2 bg-white rounded border text-center mb-2">
                          <div className="text-xs font-semibold">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-indigo-600">{member.performance}%</div>
                        </div>
                      ))}
                      {teamMembers.filter((m) => m.manager === '14').map((member) => (
                        <div key={member.id} className="p-2 bg-white rounded border text-center">
                          <div className="text-xs font-semibold">{member.name.split(' ')[0]}</div>
                          <div className="text-xs text-indigo-600">{member.performance}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Advanced Analytics
              </Badge>
              <span className="text-sm text-gray-600">
                Slide {currentSlide + 1} of {totalSlides}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'bg-purple-600 w-6' : 'bg-gray-300'
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
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
