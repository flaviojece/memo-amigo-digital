import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Cores do Dr. Memo
const PRIMARY_COLOR = "#9b87f5";
const PRIMARY_DARK = "#7c3aed";
const BACKGROUND_DARK = "#1A1F2C";

interface GeneratedIcon {
  size: number;
  blob: Blob;
  url: string;
  type: "regular" | "maskable";
}

const DevGenerateIcons = () => {
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawIcon = (
    ctx: CanvasRenderingContext2D,
    size: number,
    isMaskable: boolean
  ) => {
    const padding = isMaskable ? size * 0.1 : 0; // 10% padding for maskable
    const iconSize = size - padding * 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Limpar canvas
    ctx.clearRect(0, 0, size, size);

    // Fundo com gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, PRIMARY_COLOR);
    gradient.addColorStop(1, PRIMARY_DARK);

    // Desenhar fundo arredondado (squircle)
    const radius = size * 0.22;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Desenhar pílula/cápsula
    const pillWidth = iconSize * 0.18;
    const pillHeight = iconSize * 0.45;
    const pillX = centerX - pillWidth / 2;
    const pillY = centerY - pillHeight / 2 - iconSize * 0.02;
    const pillRadius = pillWidth / 2;

    // Sombra da pílula
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = size * 0.03;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.015;

    // Metade superior da pílula (branca)
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight / 2, [pillRadius, pillRadius, 0, 0]);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Metade inferior da pílula (rosa claro)
    ctx.beginPath();
    ctx.roundRect(pillX, pillY + pillHeight / 2, pillWidth, pillHeight / 2, [0, 0, pillRadius, pillRadius]);
    ctx.fillStyle = "#FFE4E9";
    ctx.fill();

    // Linha divisória
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.moveTo(pillX, pillY + pillHeight / 2);
    ctx.lineTo(pillX + pillWidth, pillY + pillHeight / 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = size * 0.005;
    ctx.stroke();

    // Desenhar check mark
    const checkSize = iconSize * 0.15;
    const checkX = centerX + iconSize * 0.12;
    const checkY = centerY + iconSize * 0.15;

    // Círculo de fundo do check
    ctx.beginPath();
    ctx.arc(checkX, checkY, checkSize * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#22C55E";
    ctx.shadowColor = "rgba(34, 197, 94, 0.4)";
    ctx.shadowBlur = size * 0.02;
    ctx.fill();

    // Check mark
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = size * 0.02;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const checkStart = checkSize * 0.25;
    ctx.moveTo(checkX - checkStart, checkY);
    ctx.lineTo(checkX - checkStart * 0.3, checkY + checkStart * 0.7);
    ctx.lineTo(checkX + checkStart, checkY - checkStart * 0.5);
    ctx.stroke();

    // Texto "Dr." pequeno no topo
    ctx.font = `bold ${iconSize * 0.1}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Dr.", centerX, padding + iconSize * 0.08);
  };

  const generateIcon = async (
    size: number,
    isMaskable: boolean
  ): Promise<GeneratedIcon> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      drawIcon(ctx, size, isMaskable);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({
              size,
              blob,
              url,
              type: isMaskable ? "maskable" : "regular",
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

  const generateAllIcons = async () => {
    setIsGenerating(true);
    try {
      const icons: GeneratedIcon[] = [];

      // Gerar ícones regulares
      for (const size of ICON_SIZES) {
        const icon = await generateIcon(size, false);
        icons.push(icon);
      }

      // Gerar ícones maskable
      for (const size of MASKABLE_SIZES) {
        const icon = await generateIcon(size, true);
        icons.push(icon);
      }

      setGeneratedIcons(icons);
      toast.success(`${icons.length} ícones gerados com sucesso!`);
    } catch (error) {
      console.error("Error generating icons:", error);
      toast.error("Erro ao gerar ícones");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadIcon = (icon: GeneratedIcon) => {
    const link = document.createElement("a");
    link.href = icon.url;
    const prefix = icon.type === "maskable" ? "icon-maskable-" : "icon-";
    link.download = `${prefix}${icon.size}.png`;
    link.click();
  };

  const downloadAllIcons = () => {
    generatedIcons.forEach((icon, index) => {
      setTimeout(() => downloadIcon(icon), index * 100);
    });
    toast.success("Download de todos os ícones iniciado!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 Gerador de Ícones PNG - Dr. Memo
            </CardTitle>
            <CardDescription>
              Gera ícones PNG reais via Canvas API para PWA. Use esta página para
              gerar todos os tamanhos necessários e fazer download.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={generateAllIcons} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Gerar Todos os Ícones
                  </>
                )}
              </Button>

              {generatedIcons.length > 0 && (
                <Button variant="outline" onClick={downloadAllIcons}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Todos ({generatedIcons.length})
                </Button>
              )}
            </div>

            {/* Preview do ícone grande */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-3">Preview (512x512)</h3>
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="w-32 h-32 rounded-2xl shadow-lg"
                style={{ imageRendering: "auto" }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      drawIcon(ctx, 512, false);
                    }
                  }
                }}
              >
                Atualizar Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de ícones gerados */}
        {generatedIcons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ícones Gerados</CardTitle>
              <CardDescription>
                Clique em cada ícone para fazer download individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {generatedIcons.map((icon) => (
                  <div
                    key={`${icon.type}-${icon.size}`}
                    className="flex flex-col items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => downloadIcon(icon)}
                  >
                    <img
                      src={icon.url}
                      alt={`Icon ${icon.size}x${icon.size}`}
                      className="rounded-lg shadow-sm"
                      style={{
                        width: Math.min(icon.size, 96),
                        height: Math.min(icon.size, 96),
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">
                      {icon.type === "maskable" ? "maskable-" : ""}
                      {icon.size}x{icon.size}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(icon.blob.size / 1024).toFixed(1)} KB
                    </span>
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
            <p>1. Clique em "Gerar Todos os Ícones" para criar os PNGs</p>
            <p>2. Clique em "Baixar Todos" para fazer download de todos os arquivos</p>
            <p>3. Copie os arquivos para a pasta <code className="bg-muted px-1 rounded">public/</code></p>
            <p>4. Os arquivos já estão nomeados corretamente para o PWA manifest</p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-2">Arquivos gerados:</p>
              <ul className="list-disc list-inside space-y-1">
                {ICON_SIZES.map((size) => (
                  <li key={size}>icon-{size}.png</li>
                ))}
                {MASKABLE_SIZES.map((size) => (
                  <li key={`maskable-${size}`}>icon-maskable-{size}.png</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevGenerateIcons;
