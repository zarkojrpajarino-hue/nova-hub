/**
 * MI DESARROLLO PREVIEW MODAL
 *
 * Modal interactivo enterprise-level que muestra desarrollo profesional
 * y learning con datos demo perfectos.
 *
 * Se activa desde el botón t('preview.verSecciónEnAcción') en HowItWorks
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  Target,
  Award,
  Users,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  Star,
  Trophy,
} from 'lucide-react';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';

import { useTranslation } from 'react-i18next';
interface MiDesarrolloPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSlides(t: (key: string) => string) { return [
  {
    id: 'intro',
    title: t('preview.tuPlanDeDesarrollo'),
    icon: GraduationCap,
    description: t('preview.centroPersonalizadoDeCrecimiento'),
    content: (
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
              👋
            </div>
            <div>
              <h3 className="text-xl font-bold">
                Bienvenida, {PREMIUM_DEMO_DATA.miDesarrollo.user.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {PREMIUM_DEMO_DATA.miDesarrollo.user.role} • {PREMIUM_DEMO_DATA.miDesarrollo.user.tenure} en la empresa
              </p>
            </div>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t('preview.horasEsteMes'), value: PREMIUM_DEMO_DATA.miDesarrollo.stats.learningHoursThisMonth, target: PREMIUM_DEMO_DATA.miDesarrollo.stats.learningHoursTarget, icon: '⏱️' },
              { label: t('preview.cursosCompletados'), value: PREMIUM_DEMO_DATA.miDesarrollo.stats.coursesCompleted, icon: '📚' },
              { label: t('preview.certificaciones0'), value: PREMIUM_DEMO_DATA.miDesarrollo.stats.certificationsEarned, icon: '🏆' },
              { label: t('preview.rachaActual'), value: `${PREMIUM_DEMO_DATA.miDesarrollo.stats.learningStreak} días`, icon: '🔥' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="group p-3 rounded-lg bg-background border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ animation: `slideIn 0.4s ease-out ${idx * 0.1}s both` }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1 group-hover:scale-125 transition-transform">
                    {stat.icon}
                  </div>
                  <p className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  {stat.target && (
                    <p className="text-[10px] text-muted-foreground">Meta: {stat.target}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Features overview */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />{t('preview.quéPuedesHacerEn')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.trackingDeCompetenciasActuales')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.learningPathsPersonalizadosCon')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.colecciónDeCertificacionesY')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.programaDeMentoría1on1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.okrsPersonalesDeDesarrollo')}</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'competencias',
    title: t('preview.competenciasActuales'),
    icon: Target,
    description: t('preview.visualizaTuProgresoEn'),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Pasa el raton sobre cada competencia para ver detalles y proximos pasos
        </p>

        <div className="grid grid-cols-2 gap-3">
          {PREMIUM_DEMO_DATA.miDesarrollo.competencias.map((comp, idx) => {
            const isOnTarget = comp.score >= comp.target;
            const gap = comp.target - comp.score;
            return (
              <Card
                key={idx}
                className="group border-primary/10 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ animation: `slideIn 0.4s ease-out ${idx * 0.1}s both` }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-2xl group-hover:scale-125 transition-transform">
                      {comp.icon}
                    </span>
                    <span className="truncate group-hover:text-primary transition-colors">
                      {comp.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('preview.currentScore')}</span>
                    <span className={`font-bold group-hover:scale-110 transition-transform inline-block ${
                      isOnTarget ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {comp.score}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={comp.score}
                      className="h-2 group-hover:h-3 transition-all"
                    />
                    {/* Target marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-primary/50"
                      style={{ left: `${comp.target}%` }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                      style={{ animation: 'shimmer 2s infinite' }}
                    />
                  </div>
                  <div className="pt-2 space-y-1 text-xs">
                    <div className="flex justify-between group-hover:bg-primary/5 p-1 rounded transition-colors">
                      <span className="text-muted-foreground">{t('preview.target')}</span>
                      <span className="font-semibold">{comp.target}%</span>
                    </div>
                    {!isOnTarget && (
                      <div className="flex justify-between group-hover:bg-amber-500/10 p-1 rounded transition-colors">
                        <span className="text-muted-foreground">{t('preview.gap')}</span>
                        <span className="font-semibold text-amber-600">-{gap}%</span>
                      </div>
                    )}
                    {isOnTarget && (
                      <div className="flex items-center justify-center gap-1 bg-green-500/10 p-1 rounded text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="font-semibold">{t('preview.targetAchieved')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2">Insights Automaticos</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Fortaleza principal: Product Strategy (94%)</li>
            <li>• Área de mejora: Technical Skills (gap de 9%)</li>
            <li>• 3/6 competencias en target o superior</li>
            <li>• Progreso general: 85.3% promedio</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'learning-paths',
    title: t('preview.learningPathsRecomendados'),
    icon: BookOpen,
    description: t('preview.cursosYCertificacionesPersonalizadas'),
    content: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium">
            3 Paths Activos
            <span className="text-xs text-muted-foreground ml-2">(Click para ver detalles completos)</span>
          </p>
        </div>

        <div className="space-y-3">
          {PREMIUM_DEMO_DATA.miDesarrollo.learningPaths.map((path, idx) => (
            <Card
              key={path.id}
              className="group border-primary/10 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              style={{ animation: `slideIn 0.4s ease-out ${idx * 0.15}s both` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${path.color}20` }}
                  >
                    <span className="text-2xl">{path.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {path.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{path.provider}</p>
                      </div>
                      <Badge
                        variant={path.difficulty === t('preview.advanced') ? 'destructive' : 'secondary'}
                        className="group-hover:scale-110 transition-transform"
                      >
                        {path.difficulty}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t('preview.progress')}</span>
                        <span className="font-bold text-primary">{path.progress}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={path.progress} className="h-2 group-hover:h-3 transition-all" />
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                          style={{ animation: 'shimmer 2s infinite' }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {path.duration}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        {path.timeInvestment}
                      </div>
                      {path.certification && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Award className="w-3 h-3" />{t('preview.certification')}</div>
                      )}
                    </div>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-1">
                      {path.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-[10px]">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    {/* Next lesson */}
                    <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <p className="text-xs font-medium">
                        Next: <span className="text-primary">{path.nextLesson}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            🎓 Con el plan Advanced: Learning library ilimitada + curación por IA
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'achievements',
    title: t('preview.certificacionesYLogros'),
    icon: Award,
    description: t('preview.tuColecciónDeCertificaciones'),
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold">{t('preview.certificaciones')}</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {PREMIUM_DEMO_DATA.miDesarrollo.achievements.filter(a => a.verified).length}
            </p>
            <p className="text-xs text-muted-foreground">{t('preview.verificadas')}</p>
          </div>
          <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold">{t('preview.badges')}</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {PREMIUM_DEMO_DATA.miDesarrollo.achievements.filter(a => !a.verified).length}
            </p>
            <p className="text-xs text-muted-foreground">{t('preview.desbloqueados')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">{t('preview.colecciónCompleta')}<span className="text-xs ml-2">(Hover para ver detalles)</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {PREMIUM_DEMO_DATA.miDesarrollo.achievements.map((achievement, idx) => (
              <div
                key={achievement.id}
                className="group relative p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s both` }}
              >
                {/* Hover tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg bg-popover border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-semibold text-sm mb-1">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">Issued by {achievement.issuer}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {achievement.verified && (
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-xs font-medium">{t('preview.verifiedCredential')}</span>
                    </div>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-popover" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-3xl group-hover:scale-125 transition-transform">
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                      {achievement.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {achievement.issuer}
                    </p>
                    {achievement.verified && (
                      <Badge variant="secondary" className="text-[8px] mt-1 px-1 py-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium mb-2">Proximas Certificaciones</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Advanced Product Leadership (Reforge) - En progreso (65%)</li>
            <li>• Data Analytics Professional (Coursera) - Próximamente</li>
            <li>• Leadership Excellence (LinkedIn Learning) - Q2 2024</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'mentorship',
    title: t('preview.mentoríaY1on1s'),
    icon: Users,
    description: t('preview.programaDeMentoríaBidireccional'),
    content: (
      <div className="space-y-4">
        {/* Mentor section */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />{t('preview.tuMentor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                👩‍💼
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.role}
                </p>
                <div className="flex items-center gap-4 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="font-medium">{PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.totalSessions} sesiones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="font-medium">{PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.rating}/5.0</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.focus.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-[10px]">
                      {topic}
                    </Badge>
                  ))}
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Próxima sesión: {new Date(PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentor.nextSession).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentees section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Tus Mentees ({PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentees.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {PREMIUM_DEMO_DATA.miDesarrollo.mentorship.mentees.map((mentee, idx) => (
              <Card
                key={idx}
                className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ animation: `slideIn 0.4s ease-out ${idx * 0.15}s both` }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="text-2xl group-hover:scale-125 transition-transform">
                      U
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                        {mentee.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mb-1">
                        {mentee.role}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {mentee.totalSessions} sesiones • {mentee.progress}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Upcoming sessions */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Próximas Sesiones (4)
          </h4>
          <div className="space-y-2">
            {PREMIUM_DEMO_DATA.miDesarrollo.mentorship.upcomingSessions.map((session, idx) => (
              <div
                key={idx}
                className="group p-2 rounded-lg border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      session.type === 'mentor' ? 'bg-primary/10 text-primary' :
                      session.type === 'mentee' ? 'bg-green-500/10 text-green-600' :
                      'bg-purple-500/10 text-purple-600'
                    }`}>
                      {session.type === 'mentor' ? 'M' : session.type === 'mentee' ? 'T' : 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                        {session.with}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session.topic}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {new Date(session.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {session.time} • {session.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    ),
  },
  {
    id: 'development-okrs',
    title: 'Objetivos de Desarrollo (OKRs)',
    icon: Target,
    description: t('preview.tusOkrsPersonalesCon'),
    content: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{t('preview.q12024Progress')}</span>
            <span className="text-sm font-bold text-primary">
              {Math.round(
                PREMIUM_DEMO_DATA.miDesarrollo.developmentOKRs.reduce((sum, okr) => sum + okr.progress, 0) /
                PREMIUM_DEMO_DATA.miDesarrollo.developmentOKRs.length
              )}% Overall
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{PREMIUM_DEMO_DATA.miDesarrollo.developmentOKRs[0].daysRemaining} días restantes en el quarter</span>
          </div>
        </div>

        <div className="space-y-3">
          {PREMIUM_DEMO_DATA.miDesarrollo.developmentOKRs.map((okr, idx) => (
            <Card
              key={okr.id}
              className="group border-primary/10 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              style={{ animation: `slideIn 0.4s ease-out ${idx * 0.15}s both` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-sm group-hover:text-primary transition-colors">
                      {okr.objective}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {okr.quarter} • {okr.keyResults.length} Key Results
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">
                      {okr.progress}%
                    </p>
                  </div>
                </div>
                <div className="relative mt-2">
                  <Progress value={okr.progress} className="h-2 group-hover:h-3 transition-all" />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                    style={{ animation: 'shimmer 2s infinite' }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {okr.keyResults.map((kr) => (
                  <div
                    key={kr.id}
                    className={`p-2 rounded-lg border transition-all ${
                      kr.status === 'achieved' ? 'bg-green-500/10 border-green-500/30' :
                      kr.status === 'on_track' ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-amber-500/10 border-amber-500/30'
                    } group-hover:shadow-md`}
                  >
                    <div className="flex items-start gap-2">
                      {kr.status === 'achieved' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : kr.status === 'on_track' ? (
                        <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{kr.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {kr.current} of {kr.target}
                          </p>
                          <p className={`text-xs font-semibold ${
                            kr.status === 'achieved' ? 'text-green-600' :
                            kr.status === 'on_track' ? 'text-blue-600' :
                            'text-amber-600'
                          }`}>
                            {kr.progress}%
                          </p>
                        </div>
                        <Progress value={kr.progress} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Recomendaciones IA
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Focus on Data Analytics certification - actualmente 0% y en riesgo</li>
            <li>• Excellent progress on Product Leadership OKR (78%) - mantén el momentum</li>
            <li>• 2/9 Key Results achieved - on track para Q1 goals</li>
          </ul>
        </div>
      </div>
    ),
  },
]; }

export function MiDesarrolloPreviewModal({ open, onOpenChange }: MiDesarrolloPreviewModalProps) {
  const { t } = useTranslation();
  const SLIDES = getSlides(t);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{t('preview.miDesarrolloPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfPersonal')}</DialogDescription>
        </VisuallyHidden>
        {/* Header */}
        <div className="relative p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-background/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{slide.title}</h2>
              <p className="text-sm text-muted-foreground">{slide.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Paso {currentSlide + 1} de {SLIDES.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {slide.content}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />{t('preview.anterior')}</Button>

            <div className="flex gap-1">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'w-8 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={currentSlide === SLIDES.length - 1 ? handleClose : handleNext}
              className="gap-2"
            >
              {currentSlide === SLIDES.length - 1 ? (
                <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>{t('preview.siguiente')}<ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
