import React from "react";
import { FolderOpen, Upload, Download, Share2, Files } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { AnimatedBackground, SectionHeader, EmptyState } from "@/components/ui/polished-components";

export default function PatientDocumentsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6">
        <AnimatedBackground />

        <div className="relative z-10">
          <SectionHeader
            icon={Files}
            title={t.pnav.docs.main}
            description="Upload, download, and manage your dental documents and records"
            gradient="from-cyan-600 to-blue-600"
          />
        </div>
      </div>

      <EmptyState
        icon={FolderOpen}
        title="No Documents Yet"
        description="You don't have any documents uploaded. Upload your dental records, x-rays, or insurance documents to keep everything organized in one place."
        action={{
          label: t.upload || "Upload Document",
          onClick: () => {}
        }}
        secondaryAction={{
          label: t.shareLink || "Get Share Link",
          onClick: () => {}
        }}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Upload className="h-4 w-4" />
            {t.upload}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t.download}
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            {t.shareLink}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

