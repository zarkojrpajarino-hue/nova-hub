import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Building2,
  Shield,
  Bell,
  CreditCard,
  Users,
  Globe,
  Clock,
  Upload,
  Check,
  X,
  Mail,
  Smartphone,
  Lock,
  Key,
  AlertCircle,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface SettingsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsPreviewModal: React.FC<SettingsPreviewModalProps> = ({
  open,
  onOpenChange,
}) => {
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
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t('preview.personalizaTuWorkspace')}</h2>
            <p className="text-muted-foreground text-lg max-w-md mb-8">{t('preview.configuraTuOrganizaciónCon')}</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">{t('preview.organización')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{t('preview.seguridad')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Bell className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">{t('preview.notificaciones')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">{t('preview.equipos')}</span>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="py-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('preview.organizationSettings')}</h3>
                <p className="text-sm text-muted-foreground">{t('preview.configuraLaInformaciónBásica')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="org-name">{t('preview.nombreDeLaOrganización')}</Label>
                <Input
                  id="org-name"
                  defaultValue={t('preview.acmeCorporation')}
                  className="font-medium"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>{t('preview.logoDeLaEmpresa')}</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    AC
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />{t('preview.subirLogo')}</Button>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />{t('preview.zonaHoraria')}</Label>
                <select
                  id="timezone"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  defaultValue="utc-5"
                >
                  <option value="utc-5">UTC-5 (Eastern Time)</option>
                  <option value="utc-6">UTC-6 (Central Time)</option>
                  <option value="utc-7">UTC-7 (Mountain Time)</option>
                  <option value="utc-8">UTC-8 (Pacific Time)</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />{t('preview.idiomaPredeterminado')}</Label>
                <select
                  id="language"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  defaultValue="es"
                >
                  <option value="es">{t('preview.español')}</option>
                  <option value="en">{t('preview.english')}</option>
                  <option value="pt">{t('preview.portugus')}</option>
                  <option value="fr">{t('preview.franais')}</option>
                </select>
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <Label htmlFor="url-slug">{t('preview.urlDelWorkspace')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">app.nova-hub.com/</span>
                  <Input
                    id="url-slug"
                    defaultValue="acme-corp"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="py-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('preview.securityPermissions')}</h3>
                <p className="text-sm text-muted-foreground">{t('preview.protegeTuOrganizaciónCon')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Autenticación de Dos Factores (2FA)</div>
                    <div className="text-sm text-muted-foreground">{t('preview.requeridaParaTodosLos')}</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              {/* SSO */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Single Sign-On (SSO)
                      <Badge variant="secondary" className="text-xs">{t('preview.enterprise')}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Google Workspace, Okta, Azure AD</div>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Access Control */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />{t('preview.controlDeAccesoPor')}</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-3 font-medium">{t('preview.rol')}</th>
                        <th className="text-center p-3 font-medium">{t('preview.ver')}</th>
                        <th className="text-center p-3 font-medium">{t('preview.editar')}</th>
                        <th className="text-center p-3 font-medium">{t('preview.admin')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 font-medium">{t('preview.owner')}</td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">{t('preview.admin')}</td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">{t('preview.member')}</td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">{t('preview.viewer')}</td>
                        <td className="text-center p-3"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                        <td className="text-center p-3"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label htmlFor="session-timeout">{t('preview.tiempoDeExpiraciónDe')}</Label>
                <select
                  id="session-timeout"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  defaultValue="30"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="480">8 horas</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="py-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('preview.notificationPreferences')}</h3>
                <p className="text-sm text-muted-foreground">{t('preview.configuraCómoYCuándo')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="w-4 h-4 text-blue-500" />{t('preview.notificacionesPorEmail')}</div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-mentions" className="text-sm font-normal">{t('preview.mencionesYRespuestas')}</Label>
                    <Switch id="email-mentions" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-assignments" className="text-sm font-normal">{t('preview.asignacionesDeTareas')}</Label>
                    <Switch id="email-assignments" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-deadlines" className="text-sm font-normal">{t('preview.fechasLímitePróximas')}</Label>
                    <Switch id="email-deadlines" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-updates" className="text-sm font-normal">{t('preview.actualizacionesDeProyectos')}</Label>
                    <Switch id="email-updates" />
                  </div>
                </div>
              </div>

              {/* Slack Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>{t('preview.notificacionesDeSlack')}</div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slack-urgent" className="text-sm font-normal">{t('preview.alertasUrgentes')}</Label>
                    <Switch id="slack-urgent" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slack-daily" className="text-sm font-normal">{t('preview.resumenDiario')}</Label>
                    <Switch id="slack-daily" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slack-team" className="text-sm font-normal">{t('preview.actividadDelEquipo')}</Label>
                    <Switch id="slack-team" />
                  </div>
                </div>
              </div>

              {/* In-App Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Bell className="w-4 h-4 text-green-500" />{t('preview.notificacionesInapp')}</div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-comments" className="text-sm font-normal">{t('preview.comentariosNuevos')}</Label>
                    <Switch id="app-comments" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-status" className="text-sm font-normal">{t('preview.cambiosDeEstado')}</Label>
                    <Switch id="app-status" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-files" className="text-sm font-normal">{t('preview.archivosCompartidos')}</Label>
                    <Switch id="app-files" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-sound" className="text-sm font-normal">{t('preview.sonidoDeNotificaciones')}</Label>
                    <Switch id="app-sound" />
                  </div>
                </div>
              </div>

              {/* Do Not Disturb */}
              <div className="p-4 border rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-orange-500" />{t('preview.modoNoMolestar')}</div>
                  <Switch />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground ml-6">
                  <span>{t('preview.desde')}</span>
                  <Input type="time" defaultValue="22:00" className="w-24 h-8" />
                  <span>hasta</span>
                  <Input type="time" defaultValue="08:00" className="w-24 h-8" />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="py-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('preview.billingSubscription')}</h3>
                <p className="text-sm text-muted-foreground">{t('preview.gestionaTuPlanPagos')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Current Plan */}
              <div className="border rounded-lg p-5 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold">{t('preview.enterprisePlan')}</h4>
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">{t('preview.activo')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('preview.paraEquiposGrandesCon')}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$299</div>
                    <div className="text-sm text-muted-foreground">/mes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Próxima facturación: 1 de Marzo, 2026
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>{t('preview.métodoDePago')}</Label>
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-muted-foreground">Expira 12/2026</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">{t('preview.actualizar')}</Button>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />{t('preview.usoDelPlan')}</Label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{t('preview.usuariosActivos')}</span>
                      <span className="font-medium">47 / 50</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{t('preview.almacenamiento')}</span>
                      <span className="font-medium">238 GB / 500 GB</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '47.6%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{t('preview.apiCalls')}</span>
                      <span className="font-medium">124K / 250K</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: '49.6%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div className="space-y-3">
                <Label>{t('preview.historialDeFacturación')}</Label>
                <div className="border rounded-lg divide-y">
                  {[
                    { date: '1 Feb 2026', amount: '$299.00', status: t('preview.pagado') },
                    { date: '1 Ene 2026', amount: '$299.00', status: t('preview.pagado') },
                    { date: '1 Dic 2025', amount: '$299.00', status: t('preview.pagado') },
                  ].map((invoice, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{invoice.date}</div>
                        <Badge variant="outline" className="text-xs">{invoice.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{invoice.amount}</div>
                        <Button variant="ghost" size="sm">{t('preview.descargar')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="py-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('preview.teamManagement')}</h3>
                <p className="text-sm text-muted-foreground">{t('preview.invitaUsuariosYGestiona')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Invite Users */}
              <div className="space-y-3">
                <Label>{t('preview.invitarNuevosMiembros')}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('preview.emailejemplocom')}
                    className="flex-1"
                  />
                  <select className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[120px]">
                    <option>{t('preview.member')}</option>
                    <option>{t('preview.admin')}</option>
                    <option>{t('preview.viewer')}</option>
                  </select>
                  <Button className="gap-2">
                    <Mail className="w-4 h-4" />{t('preview.enviar')}</Button>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Miembros del Equipo (47)</Label>
                  <Button variant="outline" size="sm">{t('preview.exportarLista')}</Button>
                </div>
                <div className="border rounded-lg divide-y max-h-[340px] overflow-y-auto">
                  {[
                    { name: t('preview.sarahJohnson'), email: 's.johnson@acme.com', role: t('preview.owner8'), status: 'active', avatar: 'SJ' },
                    { name: t('preview.michaelChen'), email: 'm.chen@acme.com', role: t('preview.admin9'), status: 'active', avatar: 'MC' },
                    { name: t('preview.emmaWilliams'), email: 'e.williams@acme.com', role: t('preview.admin9'), status: 'active', avatar: 'EW' },
                    { name: t('preview.davidMartinez'), email: 'd.martinez@acme.com', role: t('preview.member10'), status: 'active', avatar: 'DM' },
                    { name: t('preview.lisaAnderson'), email: 'l.anderson@acme.com', role: t('preview.member10'), status: 'active', avatar: 'LA' },
                    { name: t('preview.jamesTaylor'), email: 'j.taylor@acme.com', role: t('preview.member10'), status: 'invited', avatar: 'JT' },
                    { name: t('preview.sophieBrown'), email: 's.brown@acme.com', role: t('preview.viewer11'), status: 'active', avatar: 'SB' },
                    { name: t('preview.tomWilson'), email: 't.wilson@acme.com', role: t('preview.viewer11'), status: 'active', avatar: 'TW' },
                  ].map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            {member.name}
                            {member.status === 'invited' && (
                              <Badge variant="outline" className="text-xs">{t('preview.invitado')}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          className="h-8 px-2 rounded-md border border-input bg-background text-xs min-w-[90px]"
                          defaultValue={member.role}
                          disabled={member.role === t('preview.owner8')}
                        >
                          <option>{t('preview.owner')}</option>
                          <option>{t('preview.admin')}</option>
                          <option>{t('preview.member')}</option>
                          <option>{t('preview.viewer')}</option>
                        </select>
                        {member.role !== t('preview.owner8') && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-500">47</div>
                  <div className="text-xs text-muted-foreground">{t('preview.total')}</div>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">45</div>
                  <div className="text-xs text-muted-foreground">{t('preview.activos')}</div>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-500">2</div>
                  <div className="text-xs text-muted-foreground">{t('preview.pendientes')}</div>
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
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{t('preview.settingsPreview')}</span>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <span>
                  {currentSlide + 1} / {totalSlides}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[calc(85vh-160px)]">
            {renderSlide()}
          </div>

          <div className="p-6 pt-4 border-t flex items-center justify-between bg-secondary/20">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />{t('preview.anterior')}</Button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'bg-primary w-8'
                    : 'bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
            className="gap-2"
          >
            {currentSlide === totalSlides - 1 ? (
              <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4" />
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
};

