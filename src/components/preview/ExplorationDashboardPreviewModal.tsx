import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Code,
  Megaphone,
  Shield,
  Settings,
  BarChart,
  Lightbulb,
  Target,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Building2,
} from 'lucide-react';

interface ExplorationDashboardPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Role {
  id: string;
  title: string;
  department: string;
  icon: React.ElementType;
  description: string;
  competencies: string[];
  responsibilities: string[];
  kpis: string[];
  salary: string;
}

const roles: Role[] = [
  {
    id: 'ceo',
    title: 'CEO',
    department: 'Executive',
    icon: Users,
    description: 'Chief Executive Officer - Lidera la visión y estrategia general de la empresa',
    competencies: ['Liderazgo Estratégico', 'Visión de Negocio', 'Toma de Decisiones', 'Comunicación'],
    responsibilities: ['Definir visión y estrategia', 'Supervisar operaciones', 'Relaciones con inversores', 'Cultura organizacional'],
    kpis: ['Crecimiento de ingresos', 'Valoración de empresa', 'Satisfacción de stakeholders', 'Retención de talento'],
    salary: '$150k - $250k',
  },
  {
    id: 'cto',
    title: 'CTO',
    department: 'Technology',
    icon: Code,
    description: 'Chief Technology Officer - Dirige la estrategia tecnológica y desarrollo de producto',
    competencies: ['Arquitectura de Software', 'Gestión Técnica', 'Innovación', 'Escalabilidad'],
    responsibilities: ['Estrategia tecnológica', 'Supervisar desarrollo', 'Infraestructura técnica', 'Seguridad de sistemas'],
    kpis: ['Tiempo de desarrollo', 'Calidad del código', 'Uptime del sistema', 'Innovación técnica'],
    salary: '$130k - $220k',
  },
  {
    id: 'cmo',
    title: 'CMO',
    department: 'Marketing',
    icon: Megaphone,
    description: 'Chief Marketing Officer - Gestiona la estrategia de marketing y marca',
    competencies: ['Marketing Digital', 'Branding', 'Análisis de Mercado', 'Growth Hacking'],
    responsibilities: ['Estrategia de marketing', 'Gestión de marca', 'Generación de leads', 'Análisis de mercado'],
    kpis: ['CAC', 'ROI de marketing', 'Brand awareness', 'Conversión de leads'],
    salary: '$120k - $200k',
  },
  {
    id: 'cfo',
    title: 'CFO',
    department: 'Finance',
    icon: DollarSign,
    description: 'Chief Financial Officer - Administra finanzas y estrategia financiera',
    competencies: ['Finanzas Corporativas', 'Análisis Financiero', 'Fundraising', 'Compliance'],
    responsibilities: ['Gestión financiera', 'Fundraising', 'Reportes financieros', 'Control de costos'],
    kpis: ['Burn rate', 'Runway', 'Profit margins', 'Cash flow'],
    salary: '$130k - $210k',
  },
  {
    id: 'coo',
    title: 'COO',
    department: 'Operations',
    icon: Settings,
    description: 'Chief Operating Officer - Supervisa operaciones diarias y eficiencia',
    competencies: ['Gestión de Operaciones', 'Optimización de Procesos', 'Logística', 'Calidad'],
    responsibilities: ['Operaciones diarias', 'Optimización de procesos', 'Gestión de equipos', 'Eficiencia operativa'],
    kpis: ['Eficiencia operativa', 'Reducción de costos', 'Calidad de servicio', 'Productividad'],
    salary: '$120k - $190k',
  },
  {
    id: 'head-product',
    title: 'Head of Product',
    department: 'Product',
    icon: Lightbulb,
    description: 'Lidera el desarrollo y estrategia de producto',
    competencies: ['Product Management', 'UX/UI', 'Análisis de Datos', 'Roadmapping'],
    responsibilities: ['Roadmap de producto', 'Priorización de features', 'User research', 'Product-market fit'],
    kpis: ['Adopción de producto', 'NPS', 'Feature adoption', 'Time to market'],
    salary: '$100k - $160k',
  },
  {
    id: 'head-sales',
    title: 'Head of Sales',
    department: 'Sales',
    icon: TrendingUp,
    description: 'Dirige el equipo de ventas y estrategia comercial',
    competencies: ['Sales Strategy', 'Negociación', 'CRM', 'Account Management'],
    responsibilities: ['Estrategia de ventas', 'Gestión de pipeline', 'Cierre de deals', 'Relaciones con clientes'],
    kpis: ['Revenue', 'Win rate', 'Sales cycle', 'ACV'],
    salary: '$90k - $150k',
  },
  {
    id: 'head-engineering',
    title: 'Head of Engineering',
    department: 'Technology',
    icon: Code,
    description: 'Gestiona el equipo de ingeniería y delivery técnico',
    competencies: ['Gestión de Equipos', 'Arquitectura', 'Agile', 'Code Review'],
    responsibilities: ['Gestión de equipo técnico', 'Sprint planning', 'Code quality', 'Technical debt'],
    kpis: ['Velocity', 'Bug rate', 'Deploy frequency', 'Team satisfaction'],
    salary: '$110k - $170k',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    department: 'Data',
    icon: BarChart,
    description: 'Analiza datos y construye modelos predictivos',
    competencies: ['Machine Learning', 'Estadística', 'Python/R', 'Data Visualization'],
    responsibilities: ['Análisis de datos', 'Modelos predictivos', 'A/B testing', 'Dashboards'],
    kpis: ['Model accuracy', 'Data coverage', 'Insights delivered', 'Impact on metrics'],
    salary: '$80k - $140k',
  },
  {
    id: 'security-officer',
    title: 'Security Officer',
    department: 'Security',
    icon: Shield,
    description: 'Protege los sistemas y datos de la empresa',
    competencies: ['Ciberseguridad', 'Compliance', 'Risk Management', 'Incident Response'],
    responsibilities: ['Seguridad de sistemas', 'Auditorías de seguridad', 'Compliance', 'Incident response'],
    kpis: ['Security incidents', 'Compliance score', 'Response time', 'Vulnerabilities fixed'],
    salary: '$90k - $150k',
  },
  {
    id: 'hr-manager',
    title: 'HR Manager',
    department: 'Human Resources',
    icon: Users,
    description: 'Gestiona talento, cultura y desarrollo del equipo',
    competencies: ['Reclutamiento', 'Desarrollo Organizacional', 'Cultura', 'Compensation'],
    responsibilities: ['Reclutamiento', 'Onboarding', 'Desarrollo de talento', 'Cultura empresarial'],
    kpis: ['Time to hire', 'Retention rate', 'Employee satisfaction', 'Training completion'],
    salary: '$70k - $120k',
  },
  {
    id: 'business-dev',
    title: 'Business Developer',
    department: 'Business Development',
    icon: Target,
    description: 'Identifica y desarrolla oportunidades de negocio',
    competencies: ['Networking', 'Partnerships', 'Negociación', 'Market Analysis'],
    responsibilities: ['Identificar oportunidades', 'Partnerships estratégicos', 'Expansión de mercado', 'Deal structuring'],
    kpis: ['Partnership deals', 'Revenue from partnerships', 'Market expansion', 'Deal velocity'],
    salary: '$75k - $130k',
  },
];

const departments = [
  'Executive',
  'Technology',
  'Marketing',
  'Finance',
  'Operations',
  'Product',
  'Sales',
  'Data',
];

export function ExplorationDashboardPreviewModal({
  open,
  onOpenChange,
}: ExplorationDashboardPreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [comparisonRoles, setComparisonRoles] = useState<Role[]>([]);
  const [teamRoles, setTeamRoles] = useState<Role[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('saas');

  const totalSlides = 6;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setCurrentSlide(2);
  };

  const toggleComparisonRole = (role: Role) => {
    if (comparisonRoles.find((r) => r.id === role.id)) {
      setComparisonRoles(comparisonRoles.filter((r) => r.id !== role.id));
    } else if (comparisonRoles.length < 3) {
      setComparisonRoles([...comparisonRoles, role]);
    }
  };

  const toggleTeamRole = (role: Role) => {
    if (teamRoles.find((r) => r.id === role.id)) {
      setTeamRoles(teamRoles.filter((r) => r.id !== role.id));
    } else {
      setTeamRoles([...teamRoles, role]);
    }
  };

  const getRecommendedRoles = (industry: string): Role[] => {
    const recommendations: Record<string, string[]> = {
      saas: ['ceo', 'cto', 'head-product', 'head-sales', 'cmo', 'data-scientist'],
      fintech: ['ceo', 'cto', 'cfo', 'security-officer', 'head-product', 'business-dev'],
      ecommerce: ['ceo', 'cmo', 'head-sales', 'coo', 'data-scientist', 'head-product'],
      healthtech: ['ceo', 'cto', 'security-officer', 'head-product', 'business-dev', 'data-scientist'],
    };

    const roleIds = recommendations[industry] || recommendations.saas;
    return roles.filter((role) => roleIds.includes(role.id));
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">Explora Roles Ideales</h2>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
              Descubre qué roles necesitas en tu startup. Explora nuestro catálogo de 12 roles
              profesionales organizados en 8 departamentos clave.
            </p>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 text-4xl font-bold text-blue-600">12</div>
                <div className="text-sm text-muted-foreground">Roles Disponibles</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 text-4xl font-bold text-green-600">8</div>
                <div className="text-sm text-muted-foreground">Departamentos</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 text-4xl font-bold text-purple-600">3</div>
                <div className="text-sm text-muted-foreground">Roles Comparables</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 text-4xl font-bold text-orange-600">AI</div>
                <div className="text-sm text-muted-foreground">Recomendaciones</div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold">Catálogo de Roles</h2>
              <p className="text-muted-foreground">
                Explora nuestros 12 roles disponibles. Haz clic en cualquier rol para ver detalles.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Card
                    key={role.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-500"
                    onClick={() => handleRoleClick(role)}
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <Badge variant="secondary">{role.department}</Badge>
                      </div>
                      <CardTitle className="text-lg">{role.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {role.description.split(' - ')[1]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Salario estimado</span>
                        <span className="font-semibold text-green-600">{role.salary}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        if (!selectedRole) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                Selecciona un rol del catálogo para ver los detalles
              </p>
              <Button onClick={() => setCurrentSlide(1)} className="mt-4">
                Ir al Catálogo
              </Button>
            </div>
          );
        }
        const SelectedIcon = selectedRole.icon;
        return (
          <div>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <SelectedIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{selectedRole.title}</h2>
                  <Badge>{selectedRole.department}</Badge>
                </div>
                <p className="text-muted-foreground">{selectedRole.description}</p>
                <div className="mt-2 text-lg font-semibold text-green-600">
                  {selectedRole.salary}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competencias Clave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.competencies.map((comp, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">KPIs Principales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedRole.kpis.map((kpi, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-blue-600" />
                        {kpi}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Responsabilidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedRole.responsibilities.map((resp, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                        </div>
                        <span className="text-sm">{resp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => setCurrentSlide(1)} variant="outline">
                Volver al Catálogo
              </Button>
              <Button
                onClick={() => {
                  toggleComparisonRole(selectedRole);
                  setCurrentSlide(3);
                }}
                variant="secondary"
              >
                Comparar Rol
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold">Comparar Roles</h2>
              <p className="text-muted-foreground">
                Selecciona hasta 3 roles para comparar lado a lado. {comparisonRoles.length}/3
                seleccionados.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = comparisonRoles.find((r) => r.id === role.id);
                return (
                  <Button
                    key={role.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-auto flex-col gap-2 py-3"
                    onClick={() => toggleComparisonRole(role)}
                    disabled={!isSelected && comparisonRoles.length >= 3}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{role.title}</span>
                  </Button>
                );
              })}
            </div>

            {comparisonRoles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-semibold">Atributo</th>
                      {comparisonRoles.map((role) => (
                        <th key={role.id} className="p-3 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = role.icon;
                              return <Icon className="h-4 w-4" />;
                            })()}
                            {role.title}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-medium">Departamento</td>
                      {comparisonRoles.map((role) => (
                        <td key={role.id} className="p-3">
                          <Badge variant="secondary">{role.department}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Salario</td>
                      {comparisonRoles.map((role) => (
                        <td key={role.id} className="p-3 font-semibold text-green-600">
                          {role.salary}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-medium">Competencias</td>
                      {comparisonRoles.map((role) => (
                        <td key={role.id} className="p-3">
                          <div className="flex flex-col gap-1">
                            {role.competencies.map((comp, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">KPIs</td>
                      {comparisonRoles.map((role) => (
                        <td key={role.id} className="p-3">
                          <ul className="space-y-1">
                            {role.kpis.map((kpi, idx) => (
                              <li key={idx} className="text-xs">
                                • {kpi}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Selecciona roles para comenzar la comparación
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold">Crea Tu Equipo Ideal</h2>
              <p className="text-muted-foreground">
                Agrega roles a tu equipo ideal. {teamRoles.length} roles seleccionados.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Roles Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isInTeam = teamRoles.find((r) => r.id === role.id);
                      return (
                        <div
                          key={role.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{role.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {role.department}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isInTeam ? 'destructive' : 'default'}
                            onClick={() => toggleTeamRole(role)}
                          >
                            {isInTeam ? (
                              <Minus className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Tu Equipo ({teamRoles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamRoles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {teamRoles.map((role) => {
                          const Icon = role.icon;
                          return (
                            <div
                              key={role.id}
                              className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{role.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {role.department}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleTeamRole(role)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total de Roles:</span>
                          <span className="font-semibold">{teamRoles.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Departamentos:</span>
                          <span className="font-semibold">
                            {new Set(teamRoles.map((r) => r.department)).size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Costo Total:</span>
                          <span className="font-semibold text-green-600">
                            $
                            {teamRoles.reduce((sum, role) => {
                              const avg =
                                (parseInt(role.salary.split(' - ')[0].slice(1)) +
                                  parseInt(role.salary.split(' - ')[1].slice(1))) /
                                2;
                              return sum + avg;
                            }, 0)}
                            k
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="mb-3 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Agrega roles para comenzar a construir tu equipo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        const recommendedRoles = getRecommendedRoles(selectedIndustry);
        return (
          <div>
            <div className="mb-6">
              <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Roles Recomendados por IA
              </h2>
              <p className="text-muted-foreground">
                Basado en tu industria, te recomendamos estos roles para tu startup.
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Selecciona tu industria:</label>
              <div className="flex flex-wrap gap-2">
                {['saas', 'fintech', 'ecommerce', 'healthtech'].map((industry) => (
                  <Button
                    key={industry}
                    variant={selectedIndustry === industry ? 'default' : 'outline'}
                    onClick={() => setSelectedIndustry(industry)}
                    className="capitalize"
                  >
                    {industry}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Sparkles className="h-4 w-4" />
                Recomendación de IA para {selectedIndustry.toUpperCase()}
              </div>
              <p className="text-sm text-blue-800">
                {selectedIndustry === 'saas' &&
                  'Para una startup SaaS, recomendamos un equipo enfocado en producto, tecnología y growth. Prioriza CTO y Head of Product al inicio.'}
                {selectedIndustry === 'fintech' &&
                  'Para fintech, la seguridad y compliance son críticos. Necesitarás un Security Officer y CFO experimentado desde el inicio.'}
                {selectedIndustry === 'ecommerce' &&
                  'Para e-commerce, enfócate en marketing, operaciones y datos. El CMO y COO son esenciales para escalar.'}
                {selectedIndustry === 'healthtech' &&
                  'Para healthtech, la seguridad de datos y desarrollo de producto son prioritarios. Business Development te ayudará con partnerships clave.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedRoles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <Card
                    key={role.id}
                    className="relative overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white"
                  >
                    {index === 0 && (
                      <div className="absolute right-2 top-2">
                        <Badge className="bg-yellow-500">Top Pick</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                        <Icon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <CardTitle className="text-lg">{role.title}</CardTitle>
                      <CardDescription>{role.description.split(' - ')[1]}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Departamento</span>
                          <Badge variant="secondary">{role.department}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Salario</span>
                          <span className="font-semibold text-green-600">{role.salary}</span>
                        </div>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => toggleTeamRole(role)}
                            variant={teamRoles.find((r) => r.id === role.id) ? 'secondary' : 'default'}
                          >
                            {teamRoles.find((r) => r.id === role.id)
                              ? 'En tu equipo'
                              : 'Agregar al equipo'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-2 font-semibold">Por qué estas recomendaciones:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Roles priorizados según la fase temprana de tu startup</li>
                <li>• Balance entre capacidades técnicas y de negocio</li>
                <li>• Enfoque en roles que generan mayor impacto inicial</li>
                <li>• Optimización de presupuesto y estructura organizacional</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const slideTitle = [
    'Introducción',
    'Catálogo de Roles',
    'Detalle de Rol',
    'Comparación',
    'Team Builder',
    'Recomendaciones IA',
  ][currentSlide];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Exploration Dashboard Preview</DialogTitle>
          <DialogDescription>
            Interactive preview of the Exploration Dashboard
          </DialogDescription>
        </VisuallyHidden>
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">Exploración de Roles</h1>
            <p className="text-sm text-muted-foreground">{slideTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} / {totalSlides}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-blue-600 w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">{renderSlide()}</div>

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              {roles.length} Roles
            </Badge>
            <Badge variant="secondary">
              <Building2 className="mr-1 h-3 w-3" />
              {departments.length} Departamentos
            </Badge>
          </div>

          <Button
            onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : handleNext}
          >
            {currentSlide === totalSlides - 1 ? (
              <>
                Finalizar
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
