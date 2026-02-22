import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Target,
  Users,
  Brain,
  CheckCircle2,
  Loader2,
  Briefcase,
  TrendingUp,
  ListTodo,
  Zap,
  Star,
  Clock,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerativeOnboardingPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo data
const demoCompanyData = {
  name: 'TechVision AI',
  industry: 'Artificial Intelligence & SaaS',
  goals: [
    'Launch MVP in 3 months',
    'Build core AI features',
    'Acquire first 100 customers',
  ],
};

const generatedRoles = [
  {
    id: 1,
    name: 'Chief Executive Officer',
    department: 'Executive',
    color: 'bg-purple-500',
    icon: Award,
    competencies: [
      'Strategic Planning',
      'Leadership',
      'Investor Relations',
      'Vision Setting',
    ],
  },
  {
    id: 2,
    name: 'Chief Technology Officer',
    department: 'Engineering',
    color: 'bg-blue-500',
    icon: Brain,
    competencies: [
      'AI/ML Architecture',
      'System Design',
      'Technical Strategy',
      'Team Leadership',
    ],
  },
  {
    id: 3,
    name: 'Chief Marketing Officer',
    department: 'Marketing',
    color: 'bg-pink-500',
    icon: TrendingUp,
    competencies: [
      'Go-to-Market Strategy',
      'Brand Development',
      'Customer Acquisition',
      'Content Strategy',
    ],
  },
];

const generatedTasks = [
  {
    role: 'CEO',
    tasks: [
      {
        title: 'Define company vision and mission statement',
        priority: 'high',
        duration: '2 days',
      },
      {
        title: 'Create investor pitch deck',
        priority: 'high',
        duration: '3 days',
      },
      {
        title: 'Set up legal entity and banking',
        priority: 'medium',
        duration: '5 days',
      },
      {
        title: 'Establish company culture and values',
        priority: 'medium',
        duration: '3 days',
      },
      {
        title: 'Schedule weekly executive meetings',
        priority: 'low',
        duration: '1 day',
      },
    ],
  },
  {
    role: 'CTO',
    tasks: [
      {
        title: 'Design AI model architecture',
        priority: 'high',
        duration: '5 days',
      },
      {
        title: 'Set up cloud infrastructure (AWS/GCP)',
        priority: 'high',
        duration: '3 days',
      },
      {
        title: 'Implement CI/CD pipeline',
        priority: 'medium',
        duration: '4 days',
      },
      {
        title: 'Create technical documentation',
        priority: 'medium',
        duration: '2 days',
      },
      {
        title: 'Hire senior engineers',
        priority: 'high',
        duration: '7 days',
      },
    ],
  },
  {
    role: 'CMO',
    tasks: [
      {
        title: 'Develop go-to-market strategy',
        priority: 'high',
        duration: '4 days',
      },
      {
        title: 'Create brand identity and guidelines',
        priority: 'high',
        duration: '5 days',
      },
      {
        title: 'Launch company website and blog',
        priority: 'medium',
        duration: '7 days',
      },
      {
        title: 'Set up social media presence',
        priority: 'medium',
        duration: '2 days',
      },
      {
        title: 'Create content calendar for Q1',
        priority: 'low',
        duration: '3 days',
      },
    ],
  },
];

export function GenerativeOnboardingPreviewModal({
  open,
  onOpenChange,
}: GenerativeOnboardingPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const totalSlides = 6;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      // Show loading animation for slides 2 and 4
      if (currentSlide === 1 || currentSlide === 3) {
        setIsGenerating(true);
        setTimeout(() => {
          setIsGenerating(false);
          setCurrentSlide(currentSlide + 1);
        }, 2000);
      } else {
        setCurrentSlide(currentSlide + 1);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const progress = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Generative Onboarding
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create enterprise-ready projects in 5 minutes with AI
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Zap className="w-3 h-3 mr-1" />
              Starter Plan Required
            </Badge>
          </div>
          <div className="pt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {currentSlide + 1} of {totalSlides}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-8 overflow-y-auto flex-1">
          
            {currentSlide === 0 && <IntroSlide key="intro" />}
            {currentSlide === 1 && <Step1BasicInfo key="step1" />}
            {currentSlide === 2 && (
              <Step2GeneratingRoles key="step2" isGenerating={isGenerating} />
            )}
            {currentSlide === 3 && <Step3GeneratedRoles key="step3" />}
            {currentSlide === 4 && (
              <Step4GeneratingTasks key="step4" isGenerating={isGenerating} />
            )}
            {currentSlide === 5 && <Step5FinalResult key="step5" />}
          
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/30">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0 || isGenerating}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => !isGenerating && setCurrentSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentSlide
                    ? 'bg-purple-500 w-6'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>
          <Button
            onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
            disabled={isGenerating}
          >
            {currentSlide === totalSlides - 1 ? (
              <>
                Finalizar
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Slide 0: Intro
function IntroSlide() {
  return (
    <div
      className="space-y-8 text-center max-w-3xl mx-auto"
    >
      <div className="relative">
        <div
          className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div
          className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
        >
          <Star className="w-5 h-5 text-white" />
        </div>
      </div>

      <div
        className="space-y-4"
      >
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create Projects in 5 Minutes
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Our AI-powered wizard automatically generates roles, competencies, and initial tasks
          tailored to your company's needs.
        </p>
      </div>

      <div
        className="grid grid-cols-3 gap-6 pt-8"
      >
        {[
          {
            icon: Brain,
            title: 'AI-Powered',
            description: 'Smart role and task generation',
            color: 'text-purple-500',
          },
          {
            icon: Zap,
            title: 'Fast Setup',
            description: 'Complete in under 5 minutes',
            color: 'text-yellow-500',
          },
          {
            icon: Briefcase,
            title: 'Enterprise Ready',
            description: 'Professional project structure',
            color: 'text-blue-500',
          },
        ].map((feature, index) => (
          <div
            key={feature.title}
            className="group p-6 rounded-2xl border-2 border-dashed hover:border-solid hover:bg-muted/50 transition-all cursor-pointer"
          >
            <feature.icon className={cn('w-10 h-10 mx-auto mb-3', feature.color)} />
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Slide 1: Step 1 - Basic Info
function Step1BasicInfo() {
  return (
    <div
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="text-center space-y-2">
        <Badge className="bg-purple-100 text-purple-700 mb-2">Step 1 of 4</Badge>
        <h2 className="text-3xl font-bold">Tell us about your company</h2>
        <p className="text-muted-foreground">
          Provide basic information to help our AI understand your needs
        </p>
      </div>

      <div className="space-y-6 pt-6">
        <div
          className="group p-6 rounded-xl border-2 hover:border-purple-300 hover:shadow-lg transition-all bg-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <div className="text-xl font-semibold">{demoCompanyData.name}</div>
            </div>
          </div>
        </div>

        <div
          className="group p-6 rounded-xl border-2 hover:border-blue-300 hover:shadow-lg transition-all bg-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Industry</label>
              <div className="text-xl font-semibold">{demoCompanyData.industry}</div>
            </div>
          </div>
        </div>

        <div
          className="group p-6 rounded-xl border-2 hover:border-pink-300 hover:shadow-lg transition-all bg-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Initial Goals</label>
              <div className="space-y-2">
                {demoCompanyData.goals.map((goal, index) => (
                  <div
                    key={goal}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide 2: Generating Roles
function Step2GeneratingRoles({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div
      className="space-y-8 text-center max-w-2xl mx-auto"
    >
      <div className="space-y-2">
        <Badge className="bg-blue-100 text-blue-700 mb-2">Step 2 of 4</Badge>
        <h2 className="text-3xl font-bold">AI is generating roles</h2>
        <p className="text-muted-foreground">
          Analyzing your industry and goals to create the perfect team structure
        </p>
      </div>

      <div className="relative py-12">
        <div
          className="w-32 h-32 mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl" />
          <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Brain className="w-16 h-16 text-white" />
          </div>
        </div>

        <div
          className="mt-8 space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-lg font-medium">Analyzing company requirements...</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['Executive Roles', 'Technical Roles', 'Business Roles'].map((item, index) => (
          <div
            key={item}
            className="p-4 rounded-xl border-2 border-dashed bg-muted/30"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            </div>
            <p className="text-sm font-medium">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Slide 3: Generated Roles
function Step3GeneratedRoles() {
  return (
    <div
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="text-center space-y-2">
        <Badge className="bg-green-100 text-green-700 mb-2">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Roles Generated
        </Badge>
        <h2 className="text-3xl font-bold">Your AI-generated team structure</h2>
        <p className="text-muted-foreground">3 executive roles with tailored competencies</p>
      </div>

      <div className="space-y-4 pt-6">
        {generatedRoles.map((role, index) => (
          <div
            key={role.id}
            className="group relative p-6 rounded-xl border-2 hover:border-purple-300 hover:shadow-xl transition-all bg-card overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

            <div className="relative flex items-start gap-4">
              <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0', role.color)}>
                <role.icon className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{role.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {role.department}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">AI-generated role</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Core Competencies</p>
                  <div className="flex flex-wrap gap-2">
                    {role.competencies.map((competency, idx) => (
                      <div
                        key={competency}
                        className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
                      >
                        {competency}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Slide 4: Generating Tasks
function Step4GeneratingTasks({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div
      className="space-y-8 text-center max-w-2xl mx-auto"
    >
      <div className="space-y-2">
        <Badge className="bg-orange-100 text-orange-700 mb-2">Step 3 of 4</Badge>
        <h2 className="text-3xl font-bold">Creating initial tasks</h2>
        <p className="text-muted-foreground">
          Generating role-specific tasks to kickstart your project
        </p>
      </div>

      <div className="relative py-12">
        <div className="relative w-32 h-32 mx-auto">
          <div
            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl opacity-20 blur-xl"
          />
          <div
            className="relative w-full h-full bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center"
          >
            <ListTodo className="w-16 h-16 text-white" />
          </div>
        </div>

        <div
          className="mt-8 space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className="text-lg font-medium">Generating tasks for each role...</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {generatedRoles.map((role, index) => (
          <div
            key={role.id}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card"
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', role.color)}>
              <role.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{role.name}</p>
              <p className="text-sm text-muted-foreground">Generating 5 initial tasks...</p>
            </div>
            <div
            >
              <Loader2 className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Slide 5: Final Result
function Step5FinalResult() {
  const totalTasks = generatedTasks.reduce((acc, role) => acc + role.tasks.length, 0);

  return (
    <div
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="text-center space-y-3">
        <div
          className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl mx-auto flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold">Project created successfully!</h2>
        <p className="text-muted-foreground">
          Your enterprise-ready project with {totalTasks} tasks is ready to go
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 py-6">
        <div
          className="p-6 rounded-2xl border-2 bg-purple-50 border-purple-200 text-center"
        >
          <Users className="w-10 h-10 text-purple-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-purple-600">{generatedRoles.length}</div>
          <p className="text-sm text-muted-foreground mt-1">Roles Created</p>
        </div>

        <div
          className="p-6 rounded-2xl border-2 bg-blue-50 border-blue-200 text-center"
        >
          <ListTodo className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-blue-600">{totalTasks}</div>
          <p className="text-sm text-muted-foreground mt-1">Tasks Generated</p>
        </div>

        <div
          className="p-6 rounded-2xl border-2 bg-green-50 border-green-200 text-center"
        >
          <Clock className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-green-600">~5m</div>
          <p className="text-sm text-muted-foreground mt-1">Setup Time</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Generated Tasks Preview</h3>
        {generatedTasks.map((roleData, roleIndex) => (
          <div
            key={roleData.role}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', generatedRoles[roleIndex].color)}>
                {React.createElement(generatedRoles[roleIndex].icon, { className: 'w-4 h-4 text-white' })}
              </div>
              <h4 className="font-semibold">{roleData.role}</h4>
              <Badge variant="secondary">{roleData.tasks.length} tasks</Badge>
            </div>

            <div className="ml-11 space-y-2">
              {roleData.tasks.slice(0, 3).map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className="group flex items-center gap-3 p-3 rounded-lg border hover:border-purple-300 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 group-hover:border-purple-500 transition-colors" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          task.priority === 'high' && 'border-red-300 text-red-700',
                          task.priority === 'medium' && 'border-yellow-300 text-yellow-700',
                          task.priority === 'low' && 'border-gray-300 text-gray-700'
                        )}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.duration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {roleData.tasks.length > 3 && (
                <p className="text-sm text-muted-foreground ml-3">
                  +{roleData.tasks.length - 3} more tasks...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
