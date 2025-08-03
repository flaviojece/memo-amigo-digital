import { Heart, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface WelcomeHeaderProps {
  userName?: string;
}

export function WelcomeHeader({ userName = "Usuário" }: WelcomeHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="radio-vintage p-6 mx-4 mt-4 vintage-texture">
      {/* Alto-falantes decorativos nas laterais */}
      <div className="flex items-start justify-between mb-6">
        <div className="radio-speaker w-8 h-8"></div>
        <div className="flex items-center gap-2">
          <div className={`status-led ${isOnline ? 'online' : 'offline'}`}></div>
          <span className="text-accent text-senior-xs font-semibold">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div className="radio-speaker w-8 h-8"></div>
      </div>

      {/* Visor principal do rádio */}
      <div className="radio-display p-4 mb-6">
        <div className="text-center space-y-3">
          {/* Nome do app no visor */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-senior-xl font-bold text-foreground tracking-wide">Dr. Memo</h1>
              <p className="text-muted-foreground text-senior-sm">Cuidando de você</p>
            </div>
          </div>

          {/* Saudação no visor digital */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3">
            <h2 className="text-senior-lg font-bold text-foreground mb-1">
              {getGreeting()}, {userName}! 👋
            </h2>
            <p className="text-muted-foreground text-senior-sm capitalize mb-1">
              {formatDate()}
            </p>
            <p className="text-primary text-senior-base font-semibold">
              {formatTime()}
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes decorativos do rádio */}
      <div className="flex justify-center gap-4">
        <div className="w-3 h-3 bg-accent rounded-full shadow-inner"></div>
        <div className="w-3 h-3 bg-secondary rounded-full shadow-inner"></div>
        <div className="w-3 h-3 bg-primary rounded-full shadow-inner"></div>
      </div>
    </header>
  );
}