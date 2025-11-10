import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ToothData {
  toothNumber: number;
  procedures: string[];
  status: 'healthy' | 'issue' | 'missing' | 'treated';
  notes?: string;
}

interface ToothChartProps {
  selectedTeeth: ToothData[];
  onToothSelect: (toothNumber: number) => void;
  onToothDeselect: (toothNumber: number) => void;
  interactiveMode?: boolean;
}

// FDI World Dental Federation notation
// Adult teeth: 11-18 (upper right), 21-28 (upper left), 31-38 (lower left), 41-48 (lower right)
const ADULT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [38, 37, 36, 35, 34, 33, 32, 31],
  lowerRight: [41, 42, 43, 44, 45, 46, 47, 48],
};

export function ToothChart({
  selectedTeeth,
  onToothSelect,
  onToothDeselect,
  interactiveMode = true
}: ToothChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const getToothData = (toothNumber: number): ToothData | undefined => {
    return selectedTeeth.find(t => t.toothNumber === toothNumber);
  };

  const isToothSelected = (toothNumber: number): boolean => {
    return selectedTeeth.some(t => t.toothNumber === toothNumber);
  };

  const getToothColor = (toothNumber: number): string => {
    const toothData = getToothData(toothNumber);
    if (!toothData) return 'bg-white hover:bg-blue-50 border-gray-300';

    switch (toothData.status) {
      case 'issue':
        return 'bg-red-100 border-red-400 hover:bg-red-200';
      case 'treated':
        return 'bg-green-100 border-green-400 hover:bg-green-200';
      case 'missing':
        return 'bg-gray-200 border-gray-400 opacity-50';
      case 'healthy':
      default:
        return 'bg-blue-100 border-blue-400 hover:bg-blue-200';
    }
  };

  const handleToothClick = (toothNumber: number) => {
    if (!interactiveMode) return;

    if (isToothSelected(toothNumber)) {
      onToothDeselect(toothNumber);
    } else {
      onToothSelect(toothNumber);
    }
  };

  const renderTooth = (toothNumber: number) => {
    const toothData = getToothData(toothNumber);
    const isSelected = isToothSelected(toothNumber);
    const isHovered = hoveredTooth === toothNumber;

    return (
      <TooltipProvider key={toothNumber}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative w-12 h-16 border-2 rounded-lg transition-all cursor-pointer",
                "flex flex-col items-center justify-center text-xs font-medium",
                getToothColor(toothNumber),
                isHovered && "scale-110 z-10 shadow-lg",
                isSelected && "ring-2 ring-blue-500 ring-offset-2"
              )}
              onClick={() => handleToothClick(toothNumber)}
              onMouseEnter={() => setHoveredTooth(toothNumber)}
              onMouseLeave={() => setHoveredTooth(null)}
            >
              <div className="text-center">
                <div className="font-bold">{toothNumber}</div>
                {toothData && toothData.procedures.length > 0 && (
                  <div className="text-[8px] text-gray-600 mt-1">
                    {toothData.procedures.length} proc.
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">Tooth #{toothNumber}</p>
              {toothData && toothData.procedures.length > 0 && (
                <div>
                  <p className="text-xs font-medium">Procedures:</p>
                  <ul className="text-xs list-disc list-inside">
                    {toothData.procedures.map((proc, idx) => (
                      <li key={idx}>{proc}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toothData?.notes && (
                <p className="text-xs text-gray-600 mt-1">{toothData.notes}</p>
              )}
              {!toothData && <p className="text-xs text-gray-500">Click to select</p>}
            </div>
          </ToothipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg border-2 border-blue-200">
      <div className="space-y-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
            <span>Issue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
            <span>Treated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded opacity-50"></div>
            <span>Missing</span>
          </div>
        </div>

        {/* Upper Teeth */}
        <div className="space-y-2">
          <div className="text-center text-sm font-semibold text-gray-600">UPPER JAW</div>
          <div className="flex justify-center gap-1">
            <div className="flex gap-1">
              {ADULT_TEETH.upperRight.map(renderTooth)}
            </div>
            <div className="w-8"></div> {/* Center gap */}
            <div className="flex gap-1">
              {ADULT_TEETH.upperLeft.map(renderTooth)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-4">
            <span>RIGHT</span>
            <span>LEFT</span>
          </div>
        </div>

        {/* Midline */}
        <div className="border-t-2 border-dashed border-gray-400"></div>

        {/* Lower Teeth */}
        <div className="space-y-2">
          <div className="text-center text-sm font-semibold text-gray-600">LOWER JAW</div>
          <div className="flex justify-between text-xs text-gray-500 px-4">
            <span>RIGHT</span>
            <span>LEFT</span>
          </div>
          <div className="flex justify-center gap-1">
            <div className="flex gap-1">
              {ADULT_TEETH.lowerRight.map(renderTooth)}
            </div>
            <div className="w-8"></div> {/* Center gap */}
            <div className="flex gap-1">
              {ADULT_TEETH.lowerLeft.map(renderTooth)}
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedTeeth.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Selected Teeth Summary</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTeeth.map((tooth) => (
                <Badge key={tooth.toothNumber} variant="secondary" className="text-xs">
                  #{tooth.toothNumber}
                  {tooth.procedures.length > 0 && ` (${tooth.procedures.length})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
