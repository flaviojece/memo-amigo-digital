import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Check, Loader2, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

// Cores do Dr. Memo
const PRIMARY_COLOR = "#9b87f5";
const PRIMARY_DARK = "#7c3aed";
const BACKGROUND_DARK = "#1A1F2C";
const CARD_BG = "#242837";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_MUTED = "#9CA3AF";
const GREEN = "#22C55E";

interface GeneratedScreenshot {
  name: string;
  width: number;
  height: number;
  blob: Blob;
  url: string;
  formFactor: "narrow" | "wide";
  label: string;
}

const SCREENSHOTS_CONFIG = [
  { name: "home", width: 1080, height: 1920, formFactor: "narrow" as const, label: "Tela Inicial" },
  { name: "medications", width: 1080, height: 1920, formFactor: "narrow" as const, label: "Medicamentos" },
  { name: "home-wide", width: 1920, height: 1080, formFactor: "wide" as const, label: "Tela Inicial Desktop" },
  { name: "medications-wide", width: 1920, height: 1080, formFactor: "wide" as const, label: "Medicamentos Desktop" },
];

const DevGenerateScreenshots = () => {
  const [generatedScreenshots, setGeneratedScreenshots] = useState<GeneratedScreenshot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  };

  const drawPill = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    const pillWidth = size * 0.3;
    const pillHeight = size * 0.7;
    const pillRadius = pillWidth / 2;

    // Metade superior (branca)
    ctx.beginPath();
    ctx.roundRect(x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight / 2, [pillRadius, pillRadius, 0, 0]);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Metade inferior (rosa)
    ctx.beginPath();
    ctx.roundRect(x - pillWidth / 2, y, pillWidth, pillHeight / 2, [0, 0, pillRadius, pillRadius]);
    ctx.fillStyle = "#FFE4E9";
    ctx.fill();
  };

  const drawHomeScreen = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isWide: boolean
  ) => {
    const scale = isWide ? 1 : 1;
    const padding = width * 0.05;
    const headerHeight = height * 0.12;

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, BACKGROUND_DARK);
    gradient.addColorStop(1, "#0f1117");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Header com gradiente
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, PRIMARY_COLOR);
    headerGradient.addColorStop(1, PRIMARY_DARK);
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    // Logo e título no header
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.06}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    
    const logoSize = width * 0.08;
    drawPill(ctx, padding + logoSize / 2, headerHeight / 2, logoSize);
    ctx.fillText("Dr. Memo", padding + logoSize + 20, headerHeight / 2);

    // Greeting
    const contentY = headerHeight + padding;
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.055}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Olá! 👋", padding, contentY + width * 0.03);

    ctx.fillStyle = TEXT_MUTED;
    ctx.font = `${width * 0.035}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Bem-vindo ao seu assistente de saúde", padding, contentY + width * 0.09);

    // Cards de resumo
    const cardY = contentY + width * 0.18;
    const cardWidth = isWide ? (width - padding * 3) / 2 : width - padding * 2;
    const cardHeight = height * 0.15;
    const cardRadius = width * 0.025;

    // Card de medicamentos
    ctx.fillStyle = CARD_BG;
    drawRoundedRect(ctx, padding, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();

    ctx.fillStyle = PRIMARY_COLOR;
    ctx.font = `bold ${width * 0.035}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("💊 Próximo Medicamento", padding + 20, cardY + cardHeight * 0.3);

    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.045}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Losartana 50mg", padding + 20, cardY + cardHeight * 0.55);

    ctx.fillStyle = GREEN;
    ctx.font = `${width * 0.03}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("08:00 - Em 30 minutos", padding + 20, cardY + cardHeight * 0.78);

    // Card de consultas (ao lado em wide, abaixo em narrow)
    const card2X = isWide ? padding * 2 + cardWidth : padding;
    const card2Y = isWide ? cardY : cardY + cardHeight + padding;

    ctx.fillStyle = CARD_BG;
    drawRoundedRect(ctx, card2X, card2Y, cardWidth, cardHeight, cardRadius);
    ctx.fill();

    ctx.fillStyle = PRIMARY_COLOR;
    ctx.font = `bold ${width * 0.035}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("📅 Próxima Consulta", card2X + 20, card2Y + cardHeight * 0.3);

    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.045}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Dr. João Silva", card2X + 20, card2Y + cardHeight * 0.55);

    ctx.fillStyle = TEXT_MUTED;
    ctx.font = `${width * 0.03}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Cardiologista - 15/01 às 14:00", card2X + 20, card2Y + cardHeight * 0.78);

    // Quick Actions
    const actionsY = isWide ? card2Y + cardHeight + padding * 2 : card2Y + cardHeight + padding * 2;
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.04}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Ações Rápidas", padding, actionsY);

    // Action buttons
    const buttonY = actionsY + padding;
    const buttonWidth = isWide ? (width - padding * 5) / 4 : (width - padding * 3) / 2;
    const buttonHeight = height * 0.1;

    const actions = [
      { icon: "💊", label: "Medicamentos" },
      { icon: "📅", label: "Consultas" },
      { icon: "👥", label: "Contatos" },
      { icon: "📍", label: "Localização" },
    ];

    actions.forEach((action, i) => {
      const bx = isWide
        ? padding + i * (buttonWidth + padding)
        : padding + (i % 2) * (buttonWidth + padding);
      const by = isWide ? buttonY : buttonY + Math.floor(i / 2) * (buttonHeight + padding);

      ctx.fillStyle = CARD_BG;
      drawRoundedRect(ctx, bx, by, buttonWidth, buttonHeight, cardRadius);
      ctx.fill();

      ctx.font = `${width * 0.06}px -apple-system`;
      ctx.textAlign = "center";
      ctx.fillText(action.icon, bx + buttonWidth / 2, by + buttonHeight * 0.4);

      ctx.fillStyle = TEXT_PRIMARY;
      ctx.font = `${width * 0.028}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(action.label, bx + buttonWidth / 2, by + buttonHeight * 0.75);
      ctx.textAlign = "left";
    });

    // Bottom navigation (apenas narrow)
    if (!isWide) {
      const navHeight = height * 0.08;
      const navY = height - navHeight;

      ctx.fillStyle = CARD_BG;
      ctx.fillRect(0, navY, width, navHeight);

      const navItems = ["🏠", "💊", "📅", "👤"];
      navItems.forEach((icon, i) => {
        ctx.font = `${width * 0.06}px -apple-system`;
        ctx.textAlign = "center";
        ctx.fillText(icon, (width / 4) * i + width / 8, navY + navHeight / 2 + 5);
      });
    }
  };

  const drawMedicationsScreen = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isWide: boolean
  ) => {
    const padding = width * 0.05;
    const headerHeight = height * 0.1;

    // Fundo
    ctx.fillStyle = BACKGROUND_DARK;
    ctx.fillRect(0, 0, width, height);

    // Header
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, PRIMARY_COLOR);
    headerGradient.addColorStop(1, PRIMARY_DARK);
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = `bold ${width * 0.05}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("💊 Meus Medicamentos", width / 2, headerHeight / 2 + 5);
    ctx.textAlign = "left";

    // Lista de medicamentos
    const cardY = headerHeight + padding;
    const cardWidth = isWide ? (width - padding * 3) / 2 : width - padding * 2;
    const cardHeight = height * 0.12;
    const cardRadius = width * 0.02;

    const medications = [
      { name: "Losartana 50mg", time: "08:00", status: "Tomado ✓", statusColor: GREEN },
      { name: "Metformina 850mg", time: "12:00", status: "Pendente", statusColor: "#F59E0B" },
      { name: "AAS 100mg", time: "20:00", status: "Pendente", statusColor: "#F59E0B" },
      { name: "Omeprazol 20mg", time: "07:00", status: "Tomado ✓", statusColor: GREEN },
    ];

    medications.forEach((med, i) => {
      const cx = isWide ? padding + (i % 2) * (cardWidth + padding) : padding;
      const cy = isWide
        ? cardY + Math.floor(i / 2) * (cardHeight + padding)
        : cardY + i * (cardHeight + padding);

      // Card
      ctx.fillStyle = CARD_BG;
      drawRoundedRect(ctx, cx, cy, cardWidth, cardHeight, cardRadius);
      ctx.fill();

      // Pill icon
      const pillSize = cardHeight * 0.5;
      drawPill(ctx, cx + padding + pillSize / 2, cy + cardHeight / 2, pillSize);

      // Nome
      ctx.fillStyle = TEXT_PRIMARY;
      ctx.font = `bold ${width * 0.035}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(med.name, cx + padding * 2 + pillSize, cy + cardHeight * 0.35);

      // Horário
      ctx.fillStyle = TEXT_MUTED;
      ctx.font = `${width * 0.028}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(`⏰ ${med.time}`, cx + padding * 2 + pillSize, cy + cardHeight * 0.6);

      // Status
      ctx.fillStyle = med.statusColor;
      ctx.font = `bold ${width * 0.025}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(med.status, cx + cardWidth - padding, cy + cardHeight / 2 + 5);
      ctx.textAlign = "left";
    });

    // FAB
    if (!isWide) {
      const fabSize = width * 0.14;
      const fabX = width - padding - fabSize;
      const fabY = height - padding * 3 - fabSize;

      ctx.beginPath();
      ctx.arc(fabX + fabSize / 2, fabY + fabSize / 2, fabSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = PRIMARY_COLOR;
      ctx.fill();

      ctx.fillStyle = TEXT_PRIMARY;
      ctx.font = `bold ${fabSize * 0.5}px -apple-system`;
      ctx.textAlign = "center";
      ctx.fillText("+", fabX + fabSize / 2, fabY + fabSize / 2 + fabSize * 0.15);
      ctx.textAlign = "left";

      // Bottom navigation
      const navHeight = height * 0.08;
      const navY = height - navHeight;

      ctx.fillStyle = CARD_BG;
      ctx.fillRect(0, navY, width, navHeight);

      const navItems = ["🏠", "💊", "📅", "👤"];
      navItems.forEach((icon, i) => {
        ctx.font = `${width * 0.06}px -apple-system`;
        ctx.textAlign = "center";
        const iconColor = i === 1 ? PRIMARY_COLOR : TEXT_MUTED;
        ctx.fillStyle = iconColor;
        ctx.fillText(icon, (width / 4) * i + width / 8, navY + navHeight / 2 + 5);
      });
    }
  };

  const generateScreenshot = async (
    config: typeof SCREENSHOTS_CONFIG[0]
  ): Promise<GeneratedScreenshot> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const isWide = config.formFactor === "wide";
      const isHome = config.name.includes("home");

      if (isHome) {
        drawHomeScreen(ctx, config.width, config.height, isWide);
      } else {
        drawMedicationsScreen(ctx, config.width, config.height, isWide);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({
              name: config.name,
              width: config.width,
              height: config.height,
              blob,
              url,
              formFactor: config.formFactor,
              label: config.label,
            });
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/png",
        1.0
      );
    });
  };

  const generateAllScreenshots = async () => {
    setIsGenerating(true);
    try {
      const screenshots: GeneratedScreenshot[] = [];

      for (const config of SCREENSHOTS_CONFIG) {
        const screenshot = await generateScreenshot(config);
        screenshots.push(screenshot);
      }

      setGeneratedScreenshots(screenshots);
      toast.success(`${screenshots.length} screenshots gerados com sucesso!`);
    } catch (error) {
      console.error("Error generating screenshots:", error);
      toast.error("Erro ao gerar screenshots");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadScreenshot = (screenshot: GeneratedScreenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.url;
    link.download = `${screenshot.name}.png`;
    link.click();
  };

  const downloadAllScreenshots = () => {
    generatedScreenshots.forEach((screenshot, index) => {
      setTimeout(() => downloadScreenshot(screenshot), index * 100);
    });
    toast.success("Download de todos os screenshots iniciado!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📸 Gerador de Screenshots PWA - Dr. Memo
            </CardTitle>
            <CardDescription>
              Gera screenshots placeholder via Canvas API para PWA. Inclui telas
              mobile (1080x1920) e desktop (1920x1080) para o manifest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={generateAllScreenshots} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Gerar Todos os Screenshots
                  </>
                )}
              </Button>

              {generatedScreenshots.length > 0 && (
                <Button variant="outline" onClick={downloadAllScreenshots}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Todos ({generatedScreenshots.length})
                </Button>
              )}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Narrow: 1080x1920 (Mobile)</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>Wide: 1920x1080 (Desktop)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screenshots gerados */}
        {generatedScreenshots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Screenshots Gerados</CardTitle>
              <CardDescription>
                Clique em cada screenshot para fazer download individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedScreenshots.map((screenshot) => (
                  <div
                    key={screenshot.name}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => downloadScreenshot(screenshot)}
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-lg border border-border">
                      <img
                        src={screenshot.url}
                        alt={screenshot.label}
                        className="object-contain"
                        style={{
                          maxWidth: screenshot.formFactor === "narrow" ? 180 : 320,
                          maxHeight: screenshot.formFactor === "narrow" ? 320 : 180,
                        }}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-sm font-medium block">{screenshot.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {screenshot.name}.png ({screenshot.width}x{screenshot.height})
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {(screenshot.blob.size / 1024).toFixed(1)} KB
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                        screenshot.formFactor === "narrow" 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {screenshot.formFactor === "narrow" ? "📱 Mobile" : "🖥️ Desktop"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Clique em "Gerar Todos os Screenshots" para criar os PNGs</p>
            <p>2. Clique em "Baixar Todos" para fazer download de todos os arquivos</p>
            <p>3. Crie a pasta <code className="bg-muted px-1 rounded">public/screenshots/</code></p>
            <p>4. Copie os arquivos para a pasta screenshots</p>
            <p>5. Faça upload dos arquivos para o Lovable</p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">Arquivos gerados:</p>
              <ul className="list-disc list-inside space-y-1">
                {SCREENSHOTS_CONFIG.map((config) => (
                  <li key={config.name}>
                    {config.name}.png - {config.width}x{config.height} ({config.formFactor})
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="font-medium text-foreground mb-2">Configuração do Manifest (vite.config.ts):</p>
              <pre className="text-xs overflow-x-auto">
{`screenshots: [
  { src: '/screenshots/home.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Tela Inicial' },
  { src: '/screenshots/medications.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Medicamentos' },
  { src: '/screenshots/home-wide.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Tela Inicial Desktop' },
  { src: '/screenshots/medications-wide.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Medicamentos Desktop' },
]`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevGenerateScreenshots;
