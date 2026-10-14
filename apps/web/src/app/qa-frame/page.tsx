"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Frame() {
  const params = useSearchParams();
  const page = params.get("page") || "/economy/shg";
  const w = Number(params.get("w") || 390);
  const h = Number(params.get("h") || 12000);

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <iframe
        src={page}
        title="qa-frame"
        width={w}
        height={h}
        style={{ border: 0, display: "block", width: w, height: h }}
      />
    </div>
  );
}

export default function QaFramePage() {
  return (
    <Suspense>
      <Frame />
    </Suspense>
  );
}
