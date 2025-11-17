import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&#]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = passedChecks === 0 ? 0 : (passedChecks / 5) * 100;

  const getStrengthColor = () => {
    if (strength < 40) return "bg-destructive";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength < 40) return "Fraca";
    if (strength < 80) return "Média";
    return "Forte";
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className={`font-semibold ${
            strength < 40 ? "text-destructive" : 
            strength < 80 ? "text-yellow-600" : 
            "text-green-600"
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Lista de critérios */}
      <div className="space-y-1 text-sm">
        <CheckItem checked={checks.minLength} text="Mínimo 8 caracteres" />
        <CheckItem checked={checks.hasUpperCase} text="Uma letra MAIÚSCULA" />
        <CheckItem checked={checks.hasLowerCase} text="Uma letra minúscula" />
        <CheckItem checked={checks.hasNumber} text="Um número" />
        <CheckItem checked={checks.hasSpecialChar} text="Um caractere especial (@$!%*?&#)" />
      </div>
    </div>
  );
};

const CheckItem = ({ checked, text }: { checked: boolean; text: string }) => (
  <div className={`flex items-center gap-2 ${checked ? "text-green-600" : "text-muted-foreground"}`}>
    {checked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span>{text}</span>
  </div>
);
