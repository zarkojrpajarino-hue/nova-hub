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
import { useTranslation } from 'react-i18next';
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
  { id: '1', name: t('preview.sarahChen'), role: t('preview.frontendArchitect'), avatar: '👩‍💻', level: 10, competencies: 15, achievements: 24, specialty: t('preview.reactEcosystem') },
  { id: '2', name: t('preview.marcusJohnson'), role: t('preview.backendLead'), avatar: '👨‍💼', level: 10, competencies: 18, achievements: 31, specialty: t('preview.systemDesign') },
  { id: '3', name: t('preview.elenaRodriguez'), role: t('preview.devopsMaster'), avatar: '👩‍🔧', level: 10, competencies: 14, achievements: 28, specialty: t('preview.cloudInfrastructure') },
  { id: '4', name: t('preview.davidKim'), role: t('preview.securityExpert'), avatar: '👨‍🔬', level: 10, competencies: 12, achievements: 22, specialty: t('preview.penetrationTesting') },
  { id: '5', name: t('preview.oliviaThompson'), role: t('preview.dataArchitect'), avatar: '👩‍🎓', level: 10, competencies: 16, achievements: 26, specialty: t('preview.mlPipeline') },
  { id: '6', name: t('preview.rajPatel'), role: t('preview.mobileLead'), avatar: '👨‍💻', level: 10, competencies: 13, achievements: 20, specialty: t('preview.crossplatform') },
  { id: '7', name: t('preview.sofiaMartinez'), role: t('preview.uxMaster'), avatar: '👩‍🎨', level: 10, competencies: 11, achievements: 19, specialty: t('preview.designSystems') },
  { id: '8', name: t('preview.chenWei'), role: t('preview.aiSpecialist'), avatar: '👨‍🚀', level: 10, competencies: 17, achievements: 29, specialty: t('preview.deepLearning') },
];

const FEATURED_MASTER = MASTERS_DATA[0];

const MASTER_COMPETENCIES: Competency[] = [
  { name: t('preview.advancedReactPatterns'), level: 100, category: t('preview.frontend') },
  { name: t('preview.typescriptMastery'), level: 100, category: t('preview.languages') },
  { name: t('preview.performanceOptimization'), level: 98, category: t('preview.technical') },
  { name: t('preview.codeArchitecture'), level: 100, category: t('preview.design') },
  { name: t('preview.testingStrategies'), level: 95, category: t('preview.quality') },
  { name: t('preview.teamLeadership'), level: 92, category: t('preview.softSkills') },
  { name: t('preview.buildTools'), level: 97, category: t('preview.devops') },
  { name: t('preview.webSecurity'), level: 94, category: t('preview.security') },
  { name: 'GraphQL', level: 100, category: t('preview.apis') },
  { name: t('preview.stateManagement'), level: 100, category: t('preview.frontend') },
  { name: t('preview.componentLibraries'), level: 98, category: t('preview.frontend') },
  { name: t('preview.mentorship'), level: 96, category: t('preview.softSkills') },
];

const MASTER_ACHIEVEMENTS: Achievement[] = [
  { title: t('preview.masterCertificationAchieved'), date: '2024-01', description: t('preview.completedAllRequirementsFor') },
  { title: t('preview.led5CriticalProjects'), date: '2024-03', description: t('preview.successfullyDeliveredEnterpriselevelInitiatives') },
  { title: t('preview.mentored15Developers'), date: '2024-06', description: t('preview.guidedTeamMembersTo') },
  { title: t('preview.published8TechArticles'), date: '2024-09', description: t('preview.sharedKnowledgeWithThe') },
  { title: t('preview.innovationAwardWinner'), date: '2024-11', description: t('preview.introducedGroundbreakingArchitecturalPatterns') },
];

const CERTIFICATION_STEPS = [
  {
    title: t('preview.expertLevel'),
    description: t('preview.achieveExpertLevel8'),
    icon: Star,
    requirements: [t('preview.completeAllCoreCompetencies'), t('preview.passAdvancedAssessments'), '3+ years experience'],
  },
  {
    title: t('preview.competencyMastery'),
    description: t('preview.master12CompetenciesIn'),
    icon: Target,
    requirements: ['100% proficiency in 8 core skills', '90%+ in 4 advanced skills', t('preview.crossfunctionalKnowledge')],
  },
  {
    title: t('preview.leadershipImpact'),
    description: t('preview.demonstrateSignificantTeamAnd'),
    icon: Users,
    requirements: [t('preview.lead3MajorProjects'), t('preview.mentor5TeamMembers'), t('preview.driveTechnicalDecisions')],
  },
  {
    title: t('preview.communityContribution'),
    description: t('preview.shareKnowledgeAndElevate'),
    icon: BookOpen,
    requirements: [t('preview.writeTechnicalDocumentation'), t('preview.presentAtTeamSessions'), t('preview.codeReviewParticipation')],
  },
];

const MASTER_BENEFITS = [
  {
    title: t('preview.executiveRecognition'),
    description: t('preview.directAcknowledgmentFromLeadership'),
    icon: Crown,
    perks: [t('preview.quarterlyLeadershipMeetings'), t('preview.strategicPlanningInput'), t('preview.companywideAnnouncements')],
  },
  {
    title: t('preview.compensationPackage'),
    description: t('preview.enhancedRewardsAndIncentives'),
    icon: Sparkles,
    perks: ['20% salary increase eligibility', t('preview.signingBonusOpportunities'), t('preview.stockOptionsConsideration')],
  },
  {
    title: t('preview.learningBudget'),
    description: t('preview.unlimitedProfessionalDevelopment'),
    icon: Brain,
    perks: ['$10,000 annual learning budget', t('preview.conferenceSpeakerOpportunities'), t('preview.premiumCourseAccess')],
  },
  {
    title: t('preview.careerAcceleration'),
    description: t('preview.fasttrackToSeniorPositions'),
    icon: Rocket,
    perks: [t('preview.priorityForPromotions'), t('preview.crossteamProjectLeads'), t('preview.architectureCouncilSeat')],
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
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
        <h2 className="text-3xl font-bold">{t('preview.mastersProgram')}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('preview.theHighestLevelOf')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
            <div className="text-2xl font-bold mb-1">8</div>
            <div className="text-sm text-muted-foreground">{t('preview.activeMasters')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <div className="text-2xl font-bold mb-1">12+</div>
            <div className="text-sm text-muted-foreground">{t('preview.competenciesRequired')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <div className="text-2xl font-bold mb-1">Level 10</div>
            <div className="text-sm text-muted-foreground">{t('preview.peakAchievement')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border border-yellow-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />{t('preview.whatMakesAMaster')}</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>{t('preview.exceptionalTechnicalExpertiseAcross')}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>{t('preview.provenLeadershipInDriving')}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>{t('preview.significantContributionsToEngineering')}</span>
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
        <h2 className="text-2xl font-bold mb-2">{t('preview.meetOurMasters')}</h2>
        <p className="text-muted-foreground">{t('preview.eliteEngineersWhoShape')}</p>
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
            <Award className="w-5 h-5" />{t('preview.recentAchievements')}</CardTitle>
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
        <h2 className="text-2xl font-bold mb-2">{t('preview.pathToMasterCertification')}</h2>
        <p className="text-muted-foreground">{t('preview.fourKeyAreasYou')}</p>
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
        <h2 className="text-2xl font-bold mb-2">{t('preview.masterBenefits')}</h2>
        <p className="text-muted-foreground">{t('preview.exclusivePerksAndOpportunities')}</p>
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
      title: t('preview.levelRequirement'),
      current: USER_PROGRESS.currentLevel,
      required: USER_PROGRESS.requiredLevel,
      icon: Star,
      color: 'text-blue-500',
    },
    {
      title: t('preview.competenciesMastered'),
      current: USER_PROGRESS.competenciesMastered,
      required: USER_PROGRESS.competenciesRequired,
      icon: Target,
      color: 'text-green-500',
    },
    {
      title: t('preview.projectsLed'),
      current: USER_PROGRESS.projectsLed,
      required: USER_PROGRESS.projectsRequired,
      icon: Rocket,
      color: 'text-purple-500',
    },
    {
      title: t('preview.mentoringHours'),
      current: USER_PROGRESS.mentoringHours,
      required: USER_PROGRESS.mentoringRequired,
      icon: Users,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('preview.yourPathToMaster')}</h2>
        <p className="text-muted-foreground mb-4">{t('preview.trackYourProgressToward')}</p>
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-3 rounded-lg border border-blue-500/20">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div className="text-left">
            <div className="text-2xl font-bold">{USER_PROGRESS.overallProgress}%</div>
            <div className="text-xs text-muted-foreground">{t('preview.overallProgress')}</div>
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
                        <span className="text-green-600 font-medium">{t('preview.requirementMet')}</span>
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
          <Zap className="w-5 h-5 text-yellow-500" />{t('preview.nextSteps')}</h3>
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
            <Trophy className="h-5 w-5 text-yellow-500" />{t('preview.mastersPreview')}</DialogTitle>
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
              <ChevronLeft className="h-4 w-4 mr-1" />{t('preview.previous')}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={currentSlide === 5 ? () => onOpenChange(false) : nextSlide}
            >
              {currentSlide === 5 ? (
                <>{t('preview.finalizar')}<CheckCircle2 className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>{t('preview.next')}<ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
