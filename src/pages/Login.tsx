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
import { Eye, EyeOff, Heart, Shield, Sparkles, Users } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate("/");
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (!error) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-retro medical-pattern">
      <Card className="w-full max-w-md p-8 bg-radio-wood border-2 border-radio-metal shadow-floating animate-fade-in-up">
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
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-secondary" />
              <span>Dados Seguros</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Fácil de usar</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" />
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
              <Label htmlFor="email" className="text-lg">Email</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="email"
                  type="email"
                  className="h-14 text-lg"
                  placeholder="seu@email.com"
                  {...loginForm.register("email")}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-lg">Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="h-14 text-lg pr-12"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-destructive text-sm mt-1">
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
          </form>
        ) : (
          // Formulário de Cadastro
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-lg">Nome Completo</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="fullName"
                  type="text"
                  className="h-14 text-lg"
                  placeholder="Seu nome"
                  {...signupForm.register("fullName")}
                />
              </div>
              {signupForm.formState.errors.fullName && (
                <p className="text-destructive text-sm mt-1">
                  {signupForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="signup-email" className="text-lg">Email</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="signup-email"
                  type="email"
                  className="h-14 text-lg"
                  placeholder="seu@email.com"
                  {...signupForm.register("email")}
                />
              </div>
              {signupForm.formState.errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="signup-password" className="text-lg">Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className="h-14 text-lg pr-12"
                  placeholder="••••••••"
                  {...signupForm.register("password")}
                  onChange={(e) => {
                    signupForm.register("password").onChange(e);
                    setPasswordValue(e.target.value);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <PasswordStrengthMeter password={passwordValue} />
              
              {signupForm.formState.errors.password && (
                <p className="text-destructive text-sm mt-1">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-lg">Confirmar Senha</Label>
              <div className="relative mt-2 input-glow rounded-lg">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-14 text-lg pr-12"
                  placeholder="••••••••"
                  {...signupForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1">
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
    </div>
  );
};

export default Login;
