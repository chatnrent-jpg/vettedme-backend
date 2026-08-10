"use client";

import { RlhfWorkspace } from "@/components/RlhfWorkspace";

/**
 * Local sandbox route for the side-by-side RLHF calibration panel.
 * Open: http://localhost:3000/test-rlhf
 *
 * userId is an existing row from the local users table.
 */
export default function Page() {
  return <RlhfWorkspace userId="15613ec2-3f70-4cee-abad-6531007e18c8" />;
}
