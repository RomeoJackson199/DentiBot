import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimisticSlotProps {
  time: string;
  isSelected: boolean;
  isOptimisticallyBooked: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const OptimisticSlot = memo(({ time, isSelected, isOptimisticallyBooked, onClick, disabled }: OptimisticSlotProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isOptimisticallyBooked}
      className={cn(
        "p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium",
        isSelected && !isOptimisticallyBooked
          ? "bg-blue-600 text-white border-blue-600 shadow-lg"
          : isOptimisticallyBooked
          ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60"
          : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
      )}
    >
      {isOptimisticallyBooked ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          Réservation...
        </div>
      ) : (
        time
      )}
    </button>
  );
});

OptimisticSlot.displayName = 'OptimisticSlot';