import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = () => (
  <div className="p-3 md:p-4 space-y-3">
    <Skeleton className="h-7 w-1/3" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  </div>
);

export default PageSkeleton;

