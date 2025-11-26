import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, signupSchema, type LoginFormData, type SignupFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Heart, Shield, Sparkles, Users, User } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { toast } from "sonner";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "", confirmPassword: "", userType: "patient" },
  });

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
        toast.error("Email ou senha incorretos. Verifique suas credenciais.");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Email não confirmado. Verifique sua caixa de entrada.");
      } else {
        toast.error(error.message || "Erro ao fazer login");
      }
      return;
    }

    // Check if there's a pending invitation token
    const pendingToken = sessionStorage.getItem('pendingInvitationToken');
    if (pendingToken) {
      sessionStorage.removeItem('pendingInvitationToken');
      navigate(`/accept-invitation?token=${pendingToken}`);
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    const { error } = await signUp(data.email, data.password, data.fullName, data.userType);
    if (!error) {
      // Check if there's a pending invitation token
      const pendingToken = sessionStorage.getItem('pendingInvitationToken');
      if (pendingToken) {
        sessionStorage.removeItem('pendingInvitationToken');
        navigate(`/accept-invitation?token=${pendingToken}`);
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-retro medical-pattern">
      <Card className="w-full max-w-md p-8 bg-radio-wood border-4 border-radio-metal shadow-floating animate-fade-in-up">
        {/* Radio Header com coração pulsante */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-full animate-heartbeat">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
          <div className="bg-radio-screen p-6 rounded-lg mb-2">
            <h1 className="text-3xl font-display text-radio-glow font-bold">Dr. Memo</h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Cuidando de você com carinho e tecnologia</p>
          </div>
          
          {/* Badges de confiança */}
          <div className="flex items-center justify-between mt-4 text-xs text-white/90">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Dados Seguros</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Fácil de usar</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span>+1000 usuários</span>
            </div>
          </div>
        </div>

        {/* Toggle entre Login e Cadastro */}
        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={!isSignUp ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsSignUp(false)}
          >
            Entrar
          </Button>
          <Button
            type="button"
            variant={isSignUp ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsSignUp(true)}
          >
            Cadastrar
          </Button>
        </div>

        {/* Formulário de Login */}
        {!isSignUp ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-lg text-white font-semibold">Email</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="email"
                  type="email"
                  className="h-14 text-lg bg-white"
                  placeholder="seu@email.com"
                  {...loginForm.register("email")}
                />
              </div>
                {loginForm.formState.errors.email && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="password" className="text-lg text-white font-semibold">Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10"
                  >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="h-14 text-lg pl-12 bg-white"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                />
              </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
              disabled={loginForm.formState.isSubmitting}
            >
              {loginForm.formState.isSubmitting ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-white hover:text-primary-foreground underline transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        ) : (
          // Formulário de Cadastro
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-lg text-white font-semibold">Nome Completo</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="fullName"
                  type="text"
                  className="h-14 text-lg bg-white"
                  placeholder="Seu nome"
                  {...signupForm.register("fullName")}
                />
              </div>
                {signupForm.formState.errors.fullName && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {signupForm.formState.errors.fullName.message}
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="userType" className="text-lg text-white font-semibold">Eu sou:</Label>
              <div className="relative mt-2">
                <Select 
                  onValueChange={(value) => signupForm.setValue('userType', value as 'patient' | 'angel')}
                  defaultValue="patient"
                >
                  <SelectTrigger className="h-14 text-lg bg-white border-2">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Paciente (preciso de cuidados)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="angel">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>Anjo/Cuidador (vou cuidar de alguém)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {signupForm.formState.errors.userType && (
                <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                  {signupForm.formState.errors.userType.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="signup-email" className="text-lg text-white font-semibold">Email</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="signup-email"
                  type="email"
                  className="h-14 text-lg bg-white"
                  placeholder="seu@email.com"
                  {...signupForm.register("email")}
                />
              </div>
                {signupForm.formState.errors.email && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="signup-password" className="text-lg text-white font-semibold">Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10"
                  >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className="h-14 text-lg pl-12 bg-white"
                  placeholder="••••••••"
                  {...signupForm.register("password")}
                  onChange={(e) => {
                    signupForm.register("password").onChange(e);
                    setPasswordValue(e.target.value);
                  }}
                />
              </div>
              
              <PasswordStrengthMeter password={passwordValue} />
              
                {signupForm.formState.errors.password && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-lg text-white font-semibold">Confirmar Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10"
                  >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-14 text-lg pl-12 bg-white"
                  placeholder="••••••••"
                  {...signupForm.register("confirmPassword")}
                />
              </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-red-600 bg-white/90 px-2 py-1 rounded text-sm mt-1 font-semibold">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
              disabled={signupForm.formState.isSubmitting}
            >
              {signupForm.formState.isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        )}
      </Card>

      <ForgotPasswordModal open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </div>
  );
};

export default Login;
