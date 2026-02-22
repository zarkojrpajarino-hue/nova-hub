import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Trophy,
  CheckCircle2,
  Star,
  Target,
  Zap,
  Users,
  BookOpen,
  TrendingUp,
  Check,
  Crown,
  Sparkles,
  Brain,
  Rocket,
} from 'lucide-react';

interface MastersPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Master {
  id: string;
  name: string;
  role: string;
  avatar: string;
  level: number;
  competencies: number;
  achievements: number;
  specialty: string;
}

interface Competency {
  name: string;
  level: number;
  category: string;
}

interface Achievement {
  title: string;
  date: string;
  description: string;
}

const MASTERS_DATA: Master[] = [
  { id: '1', name: 'Sarah Chen', role: 'Frontend Architect', avatar: '👩‍💻', level: 10, competencies: 15, achievements: 24, specialty: 'React Ecosystem' },
  { id: '2', name: 'Marcus Johnson', role: 'Backend Lead', avatar: '👨‍💼', level: 10, competencies: 18, achievements: 31, specialty: 'System Design' },
  { id: '3', name: 'Elena Rodriguez', role: 'DevOps Master', avatar: '👩‍🔧', level: 10, competencies: 14, achievements: 28, specialty: 'Cloud Infrastructure' },
  { id: '4', name: 'David Kim', role: 'Security Expert', avatar: '👨‍🔬', level: 10, competencies: 12, achievements: 22, specialty: 'Penetration Testing' },
  { id: '5', name: 'Olivia Thompson', role: 'Data Architect', avatar: '👩‍🎓', level: 10, competencies: 16, achievements: 26, specialty: 'ML Pipeline' },
  { id: '6', name: 'Raj Patel', role: 'Mobile Lead', avatar: '👨‍💻', level: 10, competencies: 13, achievements: 20, specialty: 'Cross-Platform' },
  { id: '7', name: 'Sofia Martinez', role: 'UX Master', avatar: '👩‍🎨', level: 10, competencies: 11, achievements: 19, specialty: 'Design Systems' },
  { id: '8', name: 'Chen Wei', role: 'AI Specialist', avatar: '👨‍🚀', level: 10, competencies: 17, achievements: 29, specialty: 'Deep Learning' },
];

const FEATURED_MASTER = MASTERS_DATA[0];

const MASTER_COMPETENCIES: Competency[] = [
  { name: 'Advanced React Patterns', level: 100, category: 'Frontend' },
  { name: 'TypeScript Mastery', level: 100, category: 'Languages' },
  { name: 'Performance Optimization', level: 98, category: 'Technical' },
  { name: 'Code Architecture', level: 100, category: 'Design' },
  { name: 'Testing Strategies', level: 95, category: 'Quality' },
  { name: 'Team Leadership', level: 92, category: 'Soft Skills' },
  { name: 'Build Tools', level: 97, category: 'DevOps' },
  { name: 'Web Security', level: 94, category: 'Security' },
  { name: 'GraphQL', level: 100, category: 'APIs' },
  { name: 'State Management', level: 100, category: 'Frontend' },
  { name: 'Component Libraries', level: 98, category: 'Frontend' },
  { name: 'Mentorship', level: 96, category: 'Soft Skills' },
];

const MASTER_ACHIEVEMENTS: Achievement[] = [
  { title: 'Master Certification Achieved', date: '2024-01', description: 'Completed all requirements for Master status' },
  { title: 'Led 5 Critical Projects', date: '2024-03', description: 'Successfully delivered enterprise-level initiatives' },
  { title: 'Mentored 15 Developers', date: '2024-06', description: 'Guided team members to advanced competency levels' },
  { title: 'Published 8 Tech Articles', date: '2024-09', description: 'Shared knowledge with the engineering community' },
  { title: 'Innovation Award Winner', date: '2024-11', description: 'Introduced groundbreaking architectural patterns' },
];

const CERTIFICATION_STEPS = [
  {
    title: 'Expert Level',
    description: 'Achieve Expert (Level 8+) in your primary role',
    icon: Star,
    requirements: ['Complete all core competencies', 'Pass advanced assessments', '3+ years experience'],
  },
  {
    title: 'Competency Mastery',
    description: 'Master 12+ competencies in your domain',
    icon: Target,
    requirements: ['100% proficiency in 8 core skills', '90%+ in 4 advanced skills', 'Cross-functional knowledge'],
  },
  {
    title: 'Leadership Impact',
    description: 'Demonstrate significant team and project leadership',
    icon: Users,
    requirements: ['Lead 3+ major projects', 'Mentor 5+ team members', 'Drive technical decisions'],
  },
  {
    title: 'Community Contribution',
    description: 'Share knowledge and elevate team capabilities',
    icon: BookOpen,
    requirements: ['Write technical documentation', 'Present at team sessions', 'Code review participation'],
  },
];

const MASTER_BENEFITS = [
  {
    title: 'Executive Recognition',
    description: 'Direct acknowledgment from leadership team',
    icon: Crown,
    perks: ['Quarterly leadership meetings', 'Strategic planning input', 'Company-wide announcements'],
  },
  {
    title: 'Compensation Package',
    description: 'Enhanced rewards and incentives',
    icon: Sparkles,
    perks: ['20% salary increase eligibility', 'Signing bonus opportunities', 'Stock options consideration'],
  },
  {
    title: 'Learning Budget',
    description: 'Unlimited professional development',
    icon: Brain,
    perks: ['$10,000 annual learning budget', 'Conference speaker opportunities', 'Premium course access'],
  },
  {
    title: 'Career Acceleration',
    description: 'Fast-track to senior positions',
    icon: Rocket,
    perks: ['Priority for promotions', 'Cross-team project leads', 'Architecture council seat'],
  },
];

const USER_PROGRESS = {
  currentLevel: 7,
  requiredLevel: 8,
  competenciesMastered: 8,
  competenciesRequired: 12,
  projectsLed: 2,
  projectsRequired: 3,
  mentoringHours: 45,
  mentoringRequired: 80,
  overallProgress: 67,
};

// Slide Components
function IntroSlide() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
        <h2 className="text-3xl font-bold">Masters Program</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The highest level of recognition for technical excellence, leadership, and impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
            <div className="text-2xl font-bold mb-1">8</div>
            <div className="text-sm text-muted-foreground">Active Masters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <div className="text-2xl font-bold mb-1">12+</div>
            <div className="text-sm text-muted-foreground">Competencies Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <div className="text-2xl font-bold mb-1">Level 10</div>
            <div className="text-sm text-muted-foreground">Peak Achievement</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border border-yellow-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          What Makes a Master?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Exceptional technical expertise across multiple domains</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Proven leadership in driving critical projects and team growth</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Significant contributions to engineering culture and knowledge sharing</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MastersGallerySlide() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Meet Our Masters</h2>
        <p className="text-muted-foreground">
          Elite engineers who shape our technical direction
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {MASTERS_DATA.map((master) => (
          <Card key={master.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{master.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{master.name}</h3>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                      Level {master.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{master.role}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{master.specialty}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{master.competencies} competencies</span>
                    <span>{master.achievements} achievements</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MasterProfileSlide() {
  return (
    <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2">
      <div className="text-center">
        <div className="text-5xl mb-3">{FEATURED_MASTER.avatar}</div>
        <h2 className="text-2xl font-bold mb-1">{FEATURED_MASTER.name}</h2>
        <p className="text-muted-foreground mb-2">{FEATURED_MASTER.role}</p>
        <Badge className="bg-yellow-500/20 text-yellow-700">
          Level {FEATURED_MASTER.level} Master
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Competencies ({MASTER_COMPETENCIES.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MASTER_COMPETENCIES.map((comp, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{comp.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {comp.category}
                  </Badge>
                  <span className="text-sm font-semibold">{comp.level}%</span>
                </div>
              </div>
              <Progress value={comp.level} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MASTER_ACHIEVEMENTS.map((achievement, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{achievement.title}</span>
                  <span className="text-xs text-muted-foreground">{achievement.date}</span>
                </div>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CertificationProcessSlide() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Path to Master Certification</h2>
        <p className="text-muted-foreground">
          Four key areas you must excel in to achieve Master status
        </p>
      </div>

      <div className="space-y-4">
        {CERTIFICATION_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      <Badge variant="outline">{idx + 1} of 4</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <div className="space-y-1">
                      {step.requirements.map((req, reqIdx) => (
                        <div key={reqIdx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MasterBenefitsSlide() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Master Benefits</h2>
        <p className="text-muted-foreground">
          Exclusive perks and opportunities for recognized Masters
        </p>
      </div>

      <div className="space-y-4">
        {MASTER_BENEFITS.map((benefit, idx) => {
          const Icon = benefit.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                    <div className="space-y-1">
                      {benefit.perks.map((perk, perkIdx) => (
                        <div key={perkIdx} className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PathToMasterySlide() {
  const progressCategories = [
    {
      title: 'Level Requirement',
      current: USER_PROGRESS.currentLevel,
      required: USER_PROGRESS.requiredLevel,
      icon: Star,
      color: 'text-blue-500',
    },
    {
      title: 'Competencies Mastered',
      current: USER_PROGRESS.competenciesMastered,
      required: USER_PROGRESS.competenciesRequired,
      icon: Target,
      color: 'text-green-500',
    },
    {
      title: 'Projects Led',
      current: USER_PROGRESS.projectsLed,
      required: USER_PROGRESS.projectsRequired,
      icon: Rocket,
      color: 'text-purple-500',
    },
    {
      title: 'Mentoring Hours',
      current: USER_PROGRESS.mentoringHours,
      required: USER_PROGRESS.mentoringRequired,
      icon: Users,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Path to Master</h2>
        <p className="text-muted-foreground mb-4">Track your progress toward Master certification</p>
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-3 rounded-lg border border-blue-500/20">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div className="text-left">
            <div className="text-2xl font-bold">{USER_PROGRESS.overallProgress}%</div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {progressCategories.map((category, idx) => {
          const Icon = category.icon;
          const percentage = Math.round((category.current / category.required) * 100);
          const isComplete = category.current >= category.required;

          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 ${category.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{category.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {category.current} / {category.required}
                        </span>
                        {isComplete && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {isComplete ? (
                        <span className="text-green-600 font-medium">Requirement met!</span>
                      ) : (
                        <span>
                          {category.required - category.current} more needed
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border border-yellow-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Next Steps
        </h3>
        <ul className="space-y-2 text-sm">
          {USER_PROGRESS.currentLevel < USER_PROGRESS.requiredLevel && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Reach Level {USER_PROGRESS.requiredLevel} by completing core competencies</span>
            </li>
          )}
          {USER_PROGRESS.competenciesMastered < USER_PROGRESS.competenciesRequired && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Master {USER_PROGRESS.competenciesRequired - USER_PROGRESS.competenciesMastered} more competencies</span>
            </li>
          )}
          {USER_PROGRESS.projectsLed < USER_PROGRESS.projectsRequired && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Lead {USER_PROGRESS.projectsRequired - USER_PROGRESS.projectsLed} more major projects</span>
            </li>
          )}
          {USER_PROGRESS.mentoringHours < USER_PROGRESS.mentoringRequired && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Complete {USER_PROGRESS.mentoringRequired - USER_PROGRESS.mentoringHours} more mentoring hours</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function MastersPreviewModal({ open, onOpenChange }: MastersPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < 5) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return <IntroSlide />;
      case 1:
        return <MastersGallerySlide />;
      case 2:
        return <MasterProfileSlide />;
      case 3:
        return <CertificationProcessSlide />;
      case 4:
        return <MasterBenefitsSlide />;
      case 5:
        return <PathToMasterySlide />;
      default:
        return <IntroSlide />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Masters Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {renderSlide()}
        </div>

        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={currentSlide === 5 ? () => onOpenChange(false) : nextSlide}
            >
              {currentSlide === 5 ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
