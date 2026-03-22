import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award,
  Clock,
  ArrowRight,
  User,
  Mail,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';

interface RoleRotationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActiveRotation {
  id: string;
  name: string;
  avatar: string;
  currentRole: string;
  rotationRole: string;
  department: string;
  progress: number;
  startDate: string;
  endDate: string;
  mentor: string;
}

interface RotationHistory {
  id: string;
  name: string;
  role: string;
  department: string;
  duration: string;
  outcome: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export const RoleRotationPreviewModal: React.FC<RoleRotationPreviewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    desiredRole: '',
    department: '',
    duration: '',
    reason: '',
    goals: '',
  });

  const activeRotations: ActiveRotation[] = [
    {
      id: '1',
      name: t('preview.sarahChen'),
      avatar: 'SC',
      currentRole: t('preview.softwareEngineer'),
      rotationRole: t('preview.productManager'),
      department: t('preview.product'),
      progress: 60,
      startDate: '2025-12-01',
      endDate: '2026-03-01',
      mentor: t('preview.michaelRodriguez'),
    },
    {
      id: '2',
      name: t('preview.jamesWilson'),
      avatar: 'JW',
      currentRole: t('preview.dataAnalyst'),
      rotationRole: t('preview.dataScienceLead'),
      department: t('preview.analytics'),
      progress: 35,
      startDate: '2026-01-15',
      endDate: '2026-04-15',
      mentor: t('preview.emilyParker'),
    },
    {
      id: '3',
      name: t('preview.mariaGarcia'),
      avatar: 'MG',
      currentRole: t('preview.uxDesigner'),
      rotationRole: t('preview.designSystemsLead'),
      department: t('preview.design'),
      progress: 80,
      startDate: '2025-11-01',
      endDate: '2026-02-01',
      mentor: t('preview.davidKim'),
    },
    {
      id: '4',
      name: t('preview.alexThompson'),
      avatar: 'AT',
      currentRole: t('preview.backendEngineer'),
      rotationRole: t('preview.devopsEngineer'),
      department: t('preview.infrastructure'),
      progress: 45,
      startDate: '2025-12-15',
      endDate: '2026-03-15',
      mentor: t('preview.rachelFoster'),
    },
    {
      id: '5',
      name: t('preview.ninaPatel'),
      avatar: 'NP',
      currentRole: t('preview.marketingManager'),
      rotationRole: t('preview.growthLead'),
      department: t('preview.growth'),
      progress: 70,
      startDate: '2025-11-15',
      endDate: '2026-02-15',
      mentor: t('preview.tomBradley'),
    },
    {
      id: '6',
      name: t('preview.robertLee'),
      avatar: 'RL',
      currentRole: t('preview.salesRep'),
      rotationRole: t('preview.accountExecutive'),
      department: t('preview.sales'),
      progress: 25,
      startDate: '2026-01-01',
      endDate: '2026-04-01',
      mentor: t('preview.lisaChang'),
    },
  ];

  const rotationHistory: RotationHistory[] = [
    {
      id: '1',
      name: t('preview.emilyChen'),
      role: t('preview.engineeringManager'),
      department: t('preview.engineering'),
      duration: '3 months',
      outcome: t('preview.promotedToPermanentRole'),
      date: '2024-08-15',
      status: 'completed',
    },
    {
      id: '2',
      name: t('preview.marcusJohnson'),
      role: t('preview.productDesigner'),
      department: t('preview.design'),
      duration: '3 months',
      outcome: t('preview.returnedWithNewSkills'),
      date: '2024-10-01',
      status: 'completed',
    },
    {
      id: '3',
      name: t('preview.sophieAnderson'),
      role: t('preview.businessAnalyst'),
      department: t('preview.strategy'),
      duration: '2 months',
      outcome: t('preview.createdCrossteamInitiative'),
      date: '2025-01-15',
      status: 'completed',
    },
    {
      id: '4',
      name: t('preview.davidMartinez'),
      role: t('preview.technicalWriter'),
      department: t('preview.documentation'),
      duration: '3 months',
      outcome: t('preview.builtNewDocumentationSystem'),
      date: '2025-03-01',
      status: 'completed',
    },
    {
      id: '5',
      name: t('preview.rachelKim'),
      role: t('preview.qaLead'),
      department: t('preview.quality'),
      duration: '3 months',
      outcome: t('preview.improvedTestingProcesses'),
      date: '2025-05-15',
      status: 'completed',
    },
    {
      id: '6',
      name: t('preview.tomWilson'),
      role: t('preview.solutionsArchitect'),
      department: t('preview.architecture'),
      duration: '4 months',
      outcome: t('preview.ledMigrationProject'),
      date: '2025-07-01',
      status: 'completed',
    },
  ];

  const selectedRotation = activeRotations[0];

  const totalSlides = 6;

  const handleNext = () => {
  const { t } = useTranslation();
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
              <RefreshCw className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('preview.roleRotationProgram')}</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Explore different roles, gain new skills, and accelerate your career growth
              through our structured rotation program
            </p>
            <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Users className="w-8 h-8 text-purple-500 mb-2" />
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">{t('preview.activeRotations')}</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-500 mb-2" />
                <div className="text-2xl font-bold">18</div>
                <div className="text-sm text-muted-foreground">{t('preview.monthsOfData')}</div>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                <div className="text-2xl font-bold">85%</div>
                <div className="text-sm text-muted-foreground">{t('preview.successRate')}</div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="py-8 px-6">
            <h2 className="text-2xl font-bold mb-6">{t('preview.rotationProgramOverview')}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />{t('preview.benefits')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-semibold mb-1">{t('preview.skillDevelopment')}</div>
                    <div className="text-sm text-muted-foreground">{t('preview.learnNewCompetenciesAnd')}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-semibold mb-1">{t('preview.careerGrowth')}</div>
                    <div className="text-sm text-muted-foreground">{t('preview.exploreCareerPathsAnd')}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-semibold mb-1">{t('preview.networkBuilding')}</div>
                    <div className="text-sm text-muted-foreground">{t('preview.connectWithNewTeams')}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-semibold mb-1">{t('preview.freshPerspective')}</div>
                    <div className="text-sm text-muted-foreground">{t('preview.bringNewIdeasBack')}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />{t('preview.programStructure')}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      1
                    </div>
                    <div>
                      <div className="font-semibold">{t('preview.applicationApproval')}</div>
                      <div className="text-sm text-muted-foreground">
                        Submit request and get manager approval (1-2 weeks)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      2
                    </div>
                    <div>
                      <div className="font-semibold">{t('preview.rotationPeriod')}</div>
                      <div className="text-sm text-muted-foreground">
                        Work in new role with assigned mentor (2-4 months)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      3
                    </div>
                    <div>
                      <div className="font-semibold">{t('preview.reviewTransition')}</div>
                      <div className="text-sm text-muted-foreground">
                        Evaluate experience and decide next steps (1 week)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="py-8 px-6">
            <h2 className="text-2xl font-bold mb-2">{t('preview.activeRotations')}</h2>
            <p className="text-muted-foreground mb-6">
              {activeRotations.length} team members currently exploring new roles
            </p>
            <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {activeRotations.map((rotation) => (
                <div
                  key={rotation.id}
                  className="p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {rotation.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{rotation.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {rotation.currentRole}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="font-medium truncate">{rotation.rotationRole}</div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {rotation.department}
                    </Badge>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {new Date(rotation.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(rotation.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t('preview.progress')}</span>
                      <span className="font-semibold">{rotation.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${rotation.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="py-8 px-6">
            <h2 className="text-2xl font-bold mb-2">{t('preview.rotationDetails')}</h2>
            <p className="text-muted-foreground mb-6">
              Deep dive into {selectedRotation.name}'s rotation
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {selectedRotation.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedRotation.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>{selectedRotation.currentRole}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {selectedRotation.rotationRole}
                    </span>
                  </div>
                  <Badge>{selectedRotation.department}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div className="font-semibold">{t('preview.schedule')}</div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-medium">
                        {new Date(selectedRotation.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium">
                        {new Date(selectedRotation.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">3 months</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <div className="font-semibold">{t('preview.mentor')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedRotation.mentor
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="font-medium">{selectedRotation.mentor}</div>
                      <div className="text-xs text-muted-foreground">Senior PM</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Mail className="w-3 h-3 mr-2" />{t('preview.contact')}</Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-500" />
                  <div className="font-semibold">{t('preview.rotationGoals')}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{t('preview.leadProductDiscoveryFor')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{t('preview.conductUserResearchAnd')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{t('preview.createProductRoadmapFor')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{t('preview.presentToExecutiveTeam')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                      Progress: {selectedRotation.progress}% Complete
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      On track to complete all goals by end date. Recent highlight: Successfully
                      launched user research initiative.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="py-8 px-6">
            <h2 className="text-2xl font-bold mb-2">{t('preview.rotationHistory')}</h2>
            <p className="text-muted-foreground mb-6">{t('preview.trackRecordOfSuccessful')}</p>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {rotationHistory.map((item) => (
                  <div key={item.id} className="relative flex gap-4">
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold border-4 border-background">
                        {item.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="p-4 border rounded-lg bg-card hover:border-primary transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {item.role} • {item.department}
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {item.duration}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.outcome}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Completed{' '}
                            {new Date(item.date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">
                {rotationHistory.length} successful rotations completed
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="py-8 px-6">
            <h2 className="text-2xl font-bold mb-2">{t('preview.requestARotation')}</h2>
            <p className="text-muted-foreground mb-6">{t('preview.submitYourRotationRequest')}</p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('preview.desiredRole')}</label>
                <Input
                  name="desiredRole"
                  placeholder={t('preview.egProductManagerData')}
                  value={formData.desiredRole}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('preview.department')}</label>
                <Input
                  name="department"
                  placeholder={t('preview.egProductEngineeringDesign')}
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('preview.preferredDuration')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={formData.duration === '2 months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration: '2 months' })}
                  >
                    2 months
                  </Button>
                  <Button
                    variant={formData.duration === '3 months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration: '3 months' })}
                  >
                    3 months
                  </Button>
                  <Button
                    variant={formData.duration === '4 months' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration: '4 months' })}
                  >
                    4 months
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('preview.whyThisRotation')}</label>
                <Textarea
                  name="reason"
                  placeholder={t('preview.explainYourMotivationAnd')}
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('preview.learningGoals')}</label>
                <Textarea
                  name="goals"
                  placeholder={t('preview.whatSpecificSkillsOr')}
                  value={formData.goals}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="font-semibold text-sm">Next Steps:</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('preview.yourManagerWillReview')}</li>
                  <li>{t('preview.hrWillMatchYou')}</li>
                  <li>{t('preview.youllBeAssignedA')}</li>
                  <li>{t('preview.aKickoffMeetingWill')}</li>
                </ul>
              </div>

              <Button className="w-full" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />{t('preview.submitRotationRequest')}</Button>
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
          <DialogTitle>{t('preview.roleRotationPreview')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">{renderSlide()}</div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />{t('preview.previous')}</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : handleNext}
            >
              {currentSlide === totalSlides - 1 ? (
                <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>{t('preview.next')}<ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

