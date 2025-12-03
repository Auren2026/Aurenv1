import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export const ImageUpload = ({ value, onChange }: ImageUploadProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError(t("imageUpload.invalidFile"));
      return;
    }

    // Validar tamanho original
    if (file.size > 10 * 1024 * 1024) {
      setError(t("imageUpload.fileTooLarge"));
      return;
    }

    setError(null);
    
    // Carregar imagem para o editor
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
      setIsCropOpen(true);
      
      // Aguardar dialog renderizar e calcular posições
      setTimeout(() => {
        const img = new Image();
        img.onload = () => {
          if (!containerRef.current) return;
          
          const containerSize = containerRef.current.offsetWidth;
          const cropGuideSize = containerSize * 0.75;
          
          // Calcular escala para a imagem preencher exatamente o quadrado
          const scaleX = cropGuideSize / img.width;
          const scaleY = cropGuideSize / img.height;
          const initialScale = Math.max(scaleX, scaleY); // Usa o maior para cobrir todo o quadrado
          
          setScale(initialScale);
          
          // Centralizar imagem no quadrado (não no container)
          const scaledWidth = img.width * initialScale;
          const scaledHeight = img.height * initialScale;
          const guideCenter = containerSize / 2; // Centro absoluto do container
          
          setCropPosition({
            x: guideCenter - scaledWidth / 2,
            y: guideCenter - scaledHeight / 2
          });
        };
        img.src = event.target?.result as string;
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    setError(null);
  };

  const closeCrop = () => {
    setIsCropOpen(false);
    setOriginalImage(null);
    setCropPosition({ x: 0, y: 0 });
    setScale(1);
  };

  const saveCroppedImage = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;

    setIsLoading(true);
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const containerSize = containerRef.current.offsetWidth;
    const cropGuideSize = containerSize * 0.75;
    
    canvas.width = 800;
    canvas.height = 800;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calcular área de crop (centro do container)
    const centerOffset = (containerSize - cropGuideSize) / 2;
    
    // Converter coordenadas da tela para coordenadas da imagem original
    const scaleRatio = image.naturalWidth / (image.width * scale);
    const cropX = (centerOffset - cropPosition.x) * scaleRatio;
    const cropY = (centerOffset - cropPosition.y) * scaleRatio;
    const cropSize = cropGuideSize * scaleRatio;
    
    // Desenhar área cropada no canvas 800x800
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropSize,
      cropSize,
      0,
      0,
      800,
      800
    );
    
    const photoBase64 = canvas.toDataURL("image/jpeg", 0.85);
    
    setPreview(photoBase64);
    onChange(photoBase64);
    setIsLoading(false);
    closeCrop();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - cropPosition.x, y: touch.clientY - cropPosition.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCropPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newScale: number) => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const oldWidth = img.width * scale;
    const oldHeight = img.height * scale;
    const newWidth = img.width * newScale;
    const newHeight = img.height * newScale;
    
    // Ajustar posição para manter o centro
    const deltaX = (newWidth - oldWidth) / 2;
    const deltaY = (newHeight - oldHeight) / 2;
    
    setCropPosition({
      x: cropPosition.x - deltaX,
      y: cropPosition.y - deltaY
    });
    setScale(newScale);
  };

  const displayImage = preview || value;

  return (
    <div className="space-y-3">
      <Label>{t("imageUpload.productImage")}</Label>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {displayImage && (
        <div className="relative w-full max-w-xs">
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
            loading="lazy"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <label className="flex-1 cursor-pointer">
        <div
          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-primary transition-colors bg-muted/30"
          style={{ pointerEvents: isLoading ? "none" : "auto", opacity: isLoading ? 0.6 : 1 }}
        >
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>{isLoading ? t("imageUpload.processing") : t("imageUpload.clickOrDrag")}</span>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
        </div>
      </label>

      <Dialog open={isCropOpen} onOpenChange={(open) => !open && closeCrop()}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{t("imageUpload.adjustImage") || "Ajustar Imagem"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Container com a imagem e guia de crop */}
            <div 
              ref={containerRef}
              className="relative w-full aspect-square mx-auto bg-black rounded-lg overflow-hidden touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                maxWidth: '500px'
              }}
            >
              {originalImage && (
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Ajustar"
                  className="absolute pointer-events-none select-none"
                  style={{
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${scale})`,
                    transformOrigin: 'top left'
                  }}
                  draggable={false}
                />
              )}
              
              {/* Overlay com guia quadrada */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/60"></div>
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: '75%',
                    height: '75%',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                    border: '3px solid white'
                  }}
                >
                  {/* Cantos da guia */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-white"></div>
                  
                  {/* Linhas de grade */}
                  <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/30"></div>
                  <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/30"></div>
                  <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                  <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                </div>
              </div>
            </div>

            {/* Controle de zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">{t("imageUpload.zoom") || "Zoom"}</Label>
                <span className="text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t("imageUpload.dragToAdjust") || "Arraste e ajuste o zoom para enquadrar"}
            </p>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeCrop}
              className="flex-1"
              disabled={isLoading}
            >
              {t("common.cancel") || "Cancelar"}
            </Button>
            <Button
              type="button"
              onClick={saveCroppedImage}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? t("imageUpload.processing") : (t("imageUpload.save") || "Guardar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        {t("imageUpload.formats")}
      </p>
    </div>
  );
};
