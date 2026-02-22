import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, BookOpen, Trophy, Target, Clock, Award, TrendingUp, CheckCircle2, Lock, Play, Users, BarChart3, Zap, Star } from 'lucide-react';

interface CaminoMasterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const learningPaths = [
  {
    id: 1,
    title: 'Product Manager',
    icon: Target,
    description: 'Master product strategy, roadmapping, and user research',
    modules: 8,
    courses: 12,
    hours: 64,
    color: 'from-blue-500 to-cyan-500',
    progress: 45,
  },
  {
    id: 2,
    title: 'Software Engineer',
    icon: Zap,
    description: 'Deep dive into system design, algorithms, and architecture',
    modules: 8,
    courses: 8,
    hours: 52,
    color: 'from-purple-500 to-pink-500',
    progress: 60,
  },
  {
    id: 3,
    title: 'Product Designer',
    icon: TrendingUp,
    description: 'Learn UX research, design systems, and user psychology',
    modules: 8,
    courses: 4,
    hours: 40,
    color: 'from-orange-500 to-red-500',
    progress: 30,
  },
];

const pathModules = [
  { id: 1, title: 'Product Strategy Fundamentals', status: 'completed', hours: 8, courses: 2 },
  { id: 2, title: 'User Research & Discovery', status: 'completed', hours: 6, courses: 1 },
  { id: 3, title: 'Roadmapping & Prioritization', status: 'in-progress', hours: 8, courses: 2 },
  { id: 4, title: 'Metrics & Analytics', status: 'locked', hours: 10, courses: 2 },
  { id: 5, title: 'Stakeholder Management', status: 'locked', hours: 8, courses: 1 },
  { id: 6, title: 'Go-to-Market Strategy', status: 'locked', hours: 12, courses: 2 },
  { id: 7, title: 'Product Leadership', status: 'locked', hours: 6, courses: 1 },
  { id: 8, title: 'Advanced Product Thinking', status: 'locked', hours: 6, courses: 1 },
];

const courses = [
  {
    id: 1,
    title: 'Product Strategy for Startups',
    provider: 'Reforge',
    instructor: 'Casey Winters',
    duration: '6 weeks',
    hours: 12,
    level: 'Advanced',
    enrolled: 234,
    rating: 4.9,
    image: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    id: 2,
    title: 'Data-Driven Product Management',
    provider: 'Coursera',
    instructor: 'Google',
    duration: '4 weeks',
    hours: 8,
    level: 'Intermediate',
    enrolled: 1234,
    rating: 4.7,
    image: 'bg-gradient-to-br from-green-500 to-green-600',
  },
  {
    id: 3,
    title: 'User Research Mastery',
    provider: 'Maven',
    instructor: 'Teresa Torres',
    duration: '3 weeks',
    hours: 6,
    level: 'Intermediate',
    enrolled: 456,
    rating: 4.8,
    image: 'bg-gradient-to-br from-purple-500 to-purple-600',
  },
  {
    id: 4,
    title: 'Building Products That Scale',
    provider: 'Reforge',
    instructor: 'Ravi Mehta',
    duration: '5 weeks',
    hours: 10,
    level: 'Advanced',
    enrolled: 189,
    rating: 4.9,
    image: 'bg-gradient-to-br from-orange-500 to-orange-600',
  },
  {
    id: 5,
    title: 'Product Analytics Fundamentals',
    provider: 'Udacity',
    instructor: 'Amplitude',
    duration: '4 weeks',
    hours: 8,
    level: 'Beginner',
    enrolled: 789,
    rating: 4.6,
    image: 'bg-gradient-to-br from-pink-500 to-pink-600',
  },
  {
    id: 6,
    title: 'Growth Product Management',
    provider: 'Reforge',
    instructor: 'Kevin Kwok',
    duration: '6 weeks',
    hours: 12,
    level: 'Advanced',
    enrolled: 312,
    rating: 4.8,
    image: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  },
];

const achievements = [
  { id: 1, title: 'First Steps', description: 'Completed your first course', icon: Trophy, earned: true, color: 'bg-yellow-500' },
  { id: 2, title: 'Quick Learner', description: 'Finished 3 courses in a month', icon: Zap, earned: true, color: 'bg-blue-500' },
  { id: 3, title: 'Path Pioneer', description: 'Completed a full learning path', icon: Target, earned: false, color: 'bg-purple-500' },
  { id: 4, title: 'Knowledge Master', description: '100+ hours of learning', icon: Award, earned: true, color: 'bg-green-500' },
  { id: 5, title: 'Streak Champion', description: '30-day learning streak', icon: Star, earned: false, color: 'bg-orange-500' },
  { id: 6, title: 'Certificate Pro', description: 'Earned 5 certificates', icon: Award, earned: true, color: 'bg-pink-500' },
];

const leaderboard = [
  { rank: 1, name: 'Sarah Chen', avatar: 'SC', role: 'Senior PM', hours: 142, certificates: 8, streak: 45, trend: 'up' },
  { rank: 2, name: 'Marcus Rodriguez', avatar: 'MR', role: 'Product Lead', hours: 128, certificates: 7, streak: 30, trend: 'up' },
  { rank: 3, name: 'You', avatar: 'YO', role: 'Product Manager', hours: 89, certificates: 4, streak: 12, trend: 'same', highlight: true },
  { rank: 4, name: 'Emily Watson', avatar: 'EW', role: 'PM', hours: 76, certificates: 5, streak: 8, trend: 'down' },
  { rank: 5, name: 'David Kim', avatar: 'DK', role: 'Associate PM', hours: 64, certificates: 3, streak: 15, trend: 'up' },
];

export function CaminoMasterPreviewModal({ open, onOpenChange }: CaminoMasterPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

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

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center  text-center px-8">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 p-8 rounded-3xl">
                <BookOpen className="w-20 h-20 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tu Camino hacia la Maestría
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Sistema de learning paths personalizados para dominar tu rol profesional
            </p>
            <div className="grid grid-cols-3 gap-8 mt-8">
              <div className="p-6 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
                <div className="text-sm text-muted-foreground">Learning Paths</div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-purple-600 mb-2">24</div>
                <div className="text-sm text-muted-foreground">Cursos Premium</div>
              </div>
              <div className="p-6 rounded-xl border bg-card">
                <div className="text-3xl font-bold text-pink-600 mb-2">156</div>
                <div className="text-sm text-muted-foreground">Horas de Contenido</div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className=" px-8 py-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Learning Paths Disponibles</h2>
              <p className="text-muted-foreground">Elige tu camino y comienza a dominar tu rol</p>
            </div>
            <div className="grid gap-6">
              {learningPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <div
                    key={path.id}
                    className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${path.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${path.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{path.title}</h3>
                            <Badge variant="secondary">{path.progress}% completado</Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">{path.description}</p>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{path.modules} módulos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Play className="w-4 h-4" />
                              <span>{path.courses} cursos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{path.hours} horas</span>
                            </div>
                          </div>
                          <Progress value={path.progress} className="h-2" />
                        </div>
                        <Button size="sm" className={`bg-gradient-to-r ${path.color} text-white border-0`}>
                          Continuar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className=" px-8 py-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Product Manager Path</h2>
              </div>
              <p className="text-muted-foreground">8 módulos • 12 cursos • 64 horas totales</p>
            </div>
            <div className="space-y-3">
              {pathModules.map((module, index) => (
                <div
                  key={module.id}
                  className={`relative rounded-lg border p-4 transition-all ${
                    module.status === 'locked'
                      ? 'bg-muted/50 opacity-60'
                      : 'bg-card hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        module.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : module.status === 'in-progress'
                          ? 'bg-blue-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {module.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : module.status === 'locked' ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < pathModules.length - 1 && (
                        <div className={`absolute left-1/2 top-full w-0.5 h-3 -ml-px ${
                          module.status === 'completed' ? 'bg-green-500' : 'bg-border'
                        }`}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{module.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{module.hours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{module.courses} cursos</span>
                        </div>
                        {module.status === 'in-progress' && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            En progreso
                          </Badge>
                        )}
                      </div>
                    </div>
                    {module.status !== 'locked' && (
                      <Button
                        size="sm"
                        variant={module.status === 'completed' ? 'outline' : 'default'}
                      >
                        {module.status === 'completed' ? 'Revisar' : 'Continuar'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className=" px-8 py-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Catálogo de Cursos</h2>
              <p className="text-muted-foreground">Cursos premium de los mejores proveedores</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-32 ${course.image} p-4 flex items-start justify-between`}>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                      {course.provider}
                    </Badge>
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.hours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{course.enrolled}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{course.level}</Badge>
                    </div>
                    <Button size="sm" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Comenzar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className=" px-8 py-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Tu Progreso</h2>
              <p className="text-muted-foreground">Avance, badges y certificaciones</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Cursos</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">7/24</div>
                <Progress value={29} className="h-1.5" />
              </div>
              <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">Horas</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">89/156</div>
                <Progress value={57} className="h-1.5" />
              </div>
              <div className="p-4 rounded-xl border bg-gradient-to-br from-green-500/10 to-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Certificados</span>
                </div>
                <div className="text-3xl font-bold text-green-600">4</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Logros Desbloqueados</h3>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-xl border text-center transition-all ${
                        achievement.earned
                          ? 'bg-card hover:shadow-md'
                          : 'bg-muted/50 opacity-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full ${achievement.color} ${
                        achievement.earned ? '' : 'grayscale'
                      } flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {achievement.earned && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className=" px-8 py-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Leaderboard</h2>
              <p className="text-muted-foreground">Top learners de tu organización</p>
            </div>
            <div className="space-y-2">
              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`relative rounded-xl border p-4 transition-all ${
                    user.highlight
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-md'
                      : 'bg-card hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 text-center font-bold ${
                      user.rank === 1 ? 'text-yellow-500' :
                      user.rank === 2 ? 'text-gray-400' :
                      user.rank === 3 ? 'text-orange-600' :
                      'text-muted-foreground'
                    }`}>
                      #{user.rank}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      user.highlight
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{user.name}</h3>
                        {user.highlight && (
                          <Badge className="bg-blue-500 text-white">Tú</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="flex items-center gap-1 justify-center text-muted-foreground text-xs mb-1">
                          <Clock className="w-3 h-3" />
                          <span>Horas</span>
                        </div>
                        <div className="font-bold">{user.hours}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 justify-center text-muted-foreground text-xs mb-1">
                          <Award className="w-3 h-3" />
                          <span>Certificados</span>
                        </div>
                        <div className="font-bold">{user.certificates}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 justify-center text-muted-foreground text-xs mb-1">
                          <Zap className="w-3 h-3" />
                          <span>Racha</span>
                        </div>
                        <div className="font-bold">{user.streak}d</div>
                      </div>
                    </div>
                    <div className="w-6">
                      {user.trend === 'up' && (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      )}
                      {user.trend === 'down' && (
                        <BarChart3 className="w-5 h-5 text-red-500 rotate-180" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 text-center">
              <p className="text-sm text-muted-foreground">
                Completa más cursos para subir en el ranking y desbloquear rewards exclusivos
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>Camino Master Preview</DialogTitle>
          <DialogDescription>
            Interactive preview of the Camino Master learning paths
          </DialogDescription>
        </VisuallyHidden>
        <div className="relative h-full flex flex-col">

          <div className="flex-1 overflow-auto max-h-[calc(85vh-160px)]">
            {renderSlide()}
          </div>

          <div className="border-t bg-background/95 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
              >
                {currentSlide === totalSlides - 1 ? (
                  <>
                    Finalizar
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
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
