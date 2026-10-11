'use client';

import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify6 justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Return to MedVision AI
        </Button>
      </div>
    </div>
  );
}
