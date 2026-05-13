"use client";

import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/components/pwa-provider";

const DISMISSED_KEY = "riffsync-pwa-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function PWAInstallBanner() {
  const { canInstall, isInstalled, install } = usePWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  if (isInstalled || dismissed) return null;

  const showBanner = canInstall || (isIOS() && !isInstalled);
  if (!showBanner) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setShowIOSGuide(false);
  }

  async function handleInstall() {
    if (canInstall) {
      await install();
    } else if (isIOS()) {
      setShowIOSGuide(true);
    }
  }

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {isIOS() ? (
            <Share className="size-5 shrink-0 text-primary" />
          ) : (
            <Download className="size-5 shrink-0 text-primary" />
          )}
          {showIOSGuide ? (
            <p className="text-sm">
              Tap the <strong>Share</strong> button in Safari, then tap{" "}
              <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
            </p>
          ) : (
            <p className="text-sm">
              Add RiffSync to your home screen for the best experience.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!showIOSGuide && (
            <Button size="sm" variant="default" onClick={handleInstall}>
              {isIOS() ? "How?" : "Install"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
