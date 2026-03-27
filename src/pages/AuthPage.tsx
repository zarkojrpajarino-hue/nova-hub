/**
 * 🔐 AUTH PAGE - Enterprise-Level Authentication
 *
 * Features:
 * - Login & Sign Up tabs
 * - Email validation en tiempo real
 * - Password strength indicator
 * - Show/hide password toggle
 * - Forgot password flow
 * - Email confirmation
 * - Error handling profesional
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  User,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { z } from 'zod';
import { mapAuthError, logError } from '@/lib/errorMapper';

import { useTranslation } from 'react-i18next';
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres');
const nameSchema = z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres');

export default function AuthPage() {
  const { t } = useTranslation();
  const [_searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Login/Signup fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Check if already authenticated — validate session with server before redirecting
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        // getUser() validates with the server, unlike getSession() which reads local cache
        const { data: { user: validUser } } = await supabase.auth.getUser();
        if (validUser && !cancelled) {
          navigate('/home');
        }
      } catch {
        // Invalid/expired session — stay on auth page
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/home');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Email validation en tiempo real
  useEffect(() => {
    if (email.length === 0) {
      setEmailValid(null);
      return;
    }
    const result = emailSchema.safeParse(email);
    setEmailValid(result.success);
  }, [email]);

  // Password strength calculation
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast.error(validationError.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logError(t('auth.authsignin'), error);
        toast.error(mapAuthError(error));
      } else {
        toast.success(t('auth.bienvenidoDeVuelta'));
      }
    } catch (validationError) {
      toast.error(t('auth.errorDeConexión'));
    } finally {
      setLoading(false);
    }
  };

  // SIGN UP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    try {
      nameSchema.parse(nombre);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast.error(validationError.errors[0].message);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.lasContraseñasNoCoinciden4'));
      return;
    }

    if (passwordStrength === 'weak') {
      toast.error(t('auth.contraseñaMuyDébilAñade'));
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
          },
        },
      });

      if (error) {
        logError(t('auth.authsignup'), error);
        toast.error(mapAuthError(error));
      } else if (data?.user) {
        setEmailSent(true);
        toast.success(t('auth.cuentaCreadaRevisaTu'));
      }
    } catch (validationError) {
      toast.error(t('auth.errorDeConexión'));
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast.error(validationError.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logError(t('auth.authresetpassword'), error);
        toast.error(mapAuthError(error));
      } else {
        setEmailSent(true);
        toast.success(t('auth.emailEnviadoRevisaTu'));
      }
    } catch (validationError) {
      toast.error(t('auth.errorDeConexión'));
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!passwordStrength) return null;

    const colors = {
      weak: 'bg-red-500',
      medium: 'bg-yellow-500',
      strong: 'bg-green-500',
    };

    const widths = {
      weak: 'w-1/3',
      medium: 'w-2/3',
      strong: 'w-full',
    };

    const labels = {
      weak: t('auth.débil'),
      medium: t('auth.media'),
      strong: t('auth.fuerte'),
    };

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#2E1065] rounded-full overflow-hidden">
            <div className={`h-full ${colors[passwordStrength]} ${widths[passwordStrength]} transition-all duration-300`} />
          </div>
          <span className={`text-xs font-semibold ${
            passwordStrength === 'weak' ? 'text-red-600' :
            passwordStrength === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {labels[passwordStrength]}
          </span>
        </div>
        <p className="text-xs text-[#C4B5FD]/50">{t('auth.usaMayúsculasMinúsculasNúmeros')}</p>
      </div>
    );
  };

  // Email sent confirmation view
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1a1333]/80 backdrop-blur-xl border border-[#2E1065] rounded-xl p-8">
            <div className="w-20 h-20 bg-[#7C3AED] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-3 text-white">
              {mode === 'forgot' ? 'Email Enviado': t('auth.cuentaCreada')}
            </h2>

            <p className="text-[#C4B5FD] mb-6 leading-relaxed">
              {mode === 'forgot'
                ? 'Hemos enviado un link de recuperación a tu email. Revisa tu bandeja de entrada y spam.': t('auth.teHemosEnviadoUn')
              }
            </p>

            <div className="bg-[#2E1065]/50 border border-[#7C3AED]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#C4B5FD]">
                Email enviado a: <strong className="text-white">{email}</strong>
              </p>
            </div>

            <Button
              onClick={() => {
                setEmailSent(false);
                setMode('login');
                setEmail('');
                setPassword('');
              }}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />{t('auth.volverAlLogin')}</Button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              OPTIMUS-K
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-[#1a1333]/80 backdrop-blur-xl border border-[#2E1065] rounded-xl p-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setMode('login')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />{t('auth.volver')}</Button>

              <h2 className="text-2xl font-bold text-white">{t('auth.olvidasteTuContraseña')}</h2>
              <p className="text-sm text-[#C4B5FD]/70 mt-2">{t('auth.ingresaTuEmailY')}</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.tuemailcom')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  {emailValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold"
                disabled={loading || !emailValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.enviando')}</>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />{t('auth.enviarLinkDeRecuperación')}</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main login/signup view
  return (
    <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            OPTIMUS-K
          </h1>
          <p className="text-[#C4B5FD] text-sm">{t('auth.gestionaElFuturoDe')}</p>
        </div>

        {/* Form Card with Tabs */}
        <div className="bg-[#1a1333]/80 backdrop-blur-xl border border-[#2E1065] rounded-xl p-8">
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => setMode(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="font-semibold">{t('auth.iniciarSesión')}</TabsTrigger>
              <TabsTrigger value="signup" className="font-semibold">{t('auth.crearCuenta')}</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    {emailValid !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">{t('auth.contraseña')}</Label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-[#C4B5FD] hover:text-[#7C3AED] font-medium"
                    >{t('auth.olvidasteTuContraseña')}</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40 hover:text-[#C4B5FD]/70"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.entrando')}</>
                  ) : (
                    t('auth.entrar')
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP TAB */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nombre">{t('auth.nombre')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="signup-nombre"
                      type="text"
                      placeholder={t('auth.tuNombre')}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    {emailValid !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.contraseña')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.mínimo8Caracteres')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40 hover:text-[#C4B5FD]/70"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">{t('auth.confirmarContraseña')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4B5FD]/40" />
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.repiteTuContraseña')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40 hover:text-[#C4B5FD]/70"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-600">{t('auth.lasContraseñasNoCoinciden')}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.creandoCuenta')}</>
                  ) : (
                    t('auth.crearCuenta5')
                  )}
                </Button>

                <p className="text-xs text-[#C4B5FD]/50 text-center mt-4">{t('auth.alRegistrarteAceptasNuestros')}</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#C4B5FD]/50 mt-6">
          optimusk.com
        </p>
      </div>
    </div>
  );
}
