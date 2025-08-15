import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2,
  Minimize2,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";

interface MedicalRecordViewerProps {
  record: {
    id: string;
    title: string;
    type: 'xray' | 'report' | 'image' | 'document';
    file_url: string;
    file_size?: number;
    created_at: string;
    visit_id?: string;
  };
  onClose: () => void;
  isMobile: boolean;
}

export const MedicalRecordViewer: React.FC<MedicalRecordViewerProps> = ({ 
  record, 
  onClose, 
  isMobile 
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load the file with signed URL if needed
    loadFile();
  }, [record.file_url]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In production, you would fetch a signed URL from your backend
      // For now, we'll use the provided URL directly
      setImageUrl(record.file_url);
      
    } catch (err) {
      setError("Can't load this file. Try again or contact clinic.");
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = record.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isImage = record.type === 'image' || record.type === 'xray';
  const isPDF = record.type === 'document' || record.type === 'report';

  const ViewerContent = () => (
    <>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate max-w-[200px]">{record.title}</h3>
            <span className="text-xs text-muted-foreground">
              {new Date(record.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button size="icon" variant="ghost" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
                <Button size="icon" variant="ghost" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {!isMobile && (
              <Button size="icon" variant="ghost" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            
            <Button size="icon" variant="ghost" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button size="icon" variant="ghost" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {isImage && !isMobile && (
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-muted-foreground">Zoom:</span>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={50}
              max={200}
              step={25}
              className="w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-muted/20">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading file...</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-[300px]">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={loadFile}>
              Try Again
            </Button>
          </div>
        )}
        
        {!loading && !error && imageUrl && (
          <div className="flex items-center justify-center min-h-[400px]">
            {isImage ? (
              <div 
                className="relative"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  transformOrigin: 'center'
                }}
              >
                <img
                  src={imageUrl}
                  alt={record.title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  onLoad={() => setLoading(false)}
                  onError={() => setError("Failed to load image")}
                />
              </div>
            ) : isPDF ? (
              <iframe
                src={imageUrl}
                title={record.title}
                className="w-full h-[600px] rounded-lg"
                onLoad={() => setLoading(false)}
                onError={() => setError("Failed to load PDF")}
              />
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">Preview not available for this file type.</p>
                <Button className="mt-4" onClick={handleDownload}>
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile pinch-to-zoom hint */}
      {isMobile && isImage && !loading && !error && (
        <div className="p-3 bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">Pinch to zoom • Swipe to pan</p>
        </div>
      )}
    </>
  );

  // Mobile: Full-screen sheet
  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
          <ViewerContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog with two-pane view
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[80vh] p-0 flex flex-col">
        <ViewerContent />
      </DialogContent>
    </Dialog>
  );
};