import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFDocumentViewerProps {
  content: string;
  onPageClick?: (pageNumber: number, x: number, y: number) => void;
  overlayContent?: (pageNumber: number) => React.ReactNode;
}

export const PDFDocumentViewer = ({ content, onPageClick, overlayContent }: PDFDocumentViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfData, setPdfData] = useState<string>("");

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Convert HTML content to PDF blob URL (simplified - in production use proper PDF generation)
  useState(() => {
    // For now, we'll create a data URL from the content
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPdfData(url);
  });

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPageClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onPageClick(pageNumber, x, y);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative border rounded-lg overflow-hidden bg-muted/20">
          <div onClick={handlePageClick} className="relative">
            {/* Render content as HTML preview for now */}
            <div 
              className="p-8 bg-background min-h-[800px]"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
            />
            
            {/* Overlay for field positions */}
            {overlayContent && (
              <div className="absolute inset-0 pointer-events-none">
                {overlayContent(pageNumber)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
