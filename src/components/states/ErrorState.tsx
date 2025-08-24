import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "We couldn’t load this right now.", message = "Try again.", onRetry }: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-[var(--radius-pill)] bg-[hsl(var(--danger-100))] text-[hsl(var(--danger-600))] flex items-center justify-center text-lg">!</div>
        <h3 className="text-base font-semibold">{title}</h3>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>Retry</Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ErrorState;

