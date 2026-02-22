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

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres');
const nameSchema = z.string().min(2, 'Nombre muy corto').max(50, 'Nombre muy largo');

export default function AuthPage() {
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

  // Check if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
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
        logError('Auth.signIn', error);
        toast.error(mapAuthError(error));
      } else {
        toast.success('¡Bienvenido de vuelta!');
      }
    } catch (_error) {
      toast.error('Error de conexión');
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordStrength === 'weak') {
      toast.error('Contraseña muy débil. Añade mayúsculas, números o símbolos.');
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
        logError('Auth.signUp', error);
        toast.error(mapAuthError(error));
      } else if (data?.user) {
        setEmailSent(true);
        toast.success('Cuenta creada! Revisa tu email para confirmar.');
      }
    } catch (_error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logError('Auth.resetPassword', error);
        toast.error(mapAuthError(error));
      } else {
        setEmailSent(true);
        toast.success('Email enviado! Revisa tu bandeja de entrada.');
      }
    } catch (_error) {
      toast.error('Error de conexión');
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
      weak: 'Débil',
      medium: 'Media',
      strong: 'Fuerte',
    };

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
        <p className="text-xs text-gray-500">
          Usa mayúsculas, minúsculas, números y símbolos
        </p>
      </div>
    );
  };

  // Email sent confirmation view
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/95 backdrop-blur border-2 border-white/20 rounded-2xl p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              {mode === 'forgot' ? '📧 Email Enviado' : '✅ Cuenta Creada'}
            </h2>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {mode === 'forgot'
                ? 'Hemos enviado un link de recuperación a tu email. Revisa tu bandeja de entrada y spam.'
                : 'Te hemos enviado un email de confirmación. Por favor, verifica tu email antes de iniciar sesión.'
              }
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                📬 Email enviado a: <strong>{email}</strong>
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-2xl shadow-purple-500/50">
                O
              </div>
              <div>
                <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  OPTIMUS-K
                </span>
                <span className="ml-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-bold shadow-lg">
                  BETA
                </span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur border-2 border-white/20 rounded-2xl p-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setMode('login')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>

              <h2 className="text-2xl font-bold text-gray-900">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Ingresa tu email y te enviaremos un link para recuperarla
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                disabled={loading || !emailValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Link de Recuperación
                  </>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-2xl shadow-purple-500/50">
              O
            </div>
            <div>
              <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                OPTIMUS-K
              </span>
              <span className="ml-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-bold shadow-lg">
                BETA
              </span>
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            Plataforma de gestión estratégica para emprendedores
          </p>
        </div>

        {/* Form Card with Tabs */}
        <div className="bg-white/95 backdrop-blur border-2 border-white/20 rounded-2xl p-8">
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => setMode(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="font-semibold">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="font-semibold">
                Crear Cuenta
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                    <Label htmlFor="login-password">Contraseña</Label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP TAB */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nombre">Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-nombre"
                      type="text"
                      placeholder="Tu nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <Label htmlFor="signup-confirm">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Crear Cuenta
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Al registrarte, aceptas nuestros términos y condiciones
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Programa LEINN • Mondragón Team Academy
        </p>
      </div>
    </div>
  );
}
