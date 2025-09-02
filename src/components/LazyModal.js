"use client";

import React, { memo, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";

const ModalContent = dynamic(() => import("./OptimizedModal"), {
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          border: "2px solid #f3f3f3",
          borderTop: "2px solid #63899e",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  ),
  ssr: false,
});

const LazyModal = memo(({ open, onClose, ...props }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={null}>
      <ModalContent open={open} onClose={onClose} {...props} />
    </Suspense>
  );
});

LazyModal.displayName = "LazyModal";

export default LazyModal;
