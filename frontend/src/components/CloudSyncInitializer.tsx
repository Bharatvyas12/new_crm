"use client";

import { useEffect } from "react";
import { initCloudSync } from "@/lib/syncEngine";

export function CloudSyncInitializer() {
  useEffect(() => {
    initCloudSync();
  }, []);

  return null;
}
