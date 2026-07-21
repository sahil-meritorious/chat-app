// src/components/SkeletonLoader.jsx
import React from "react";

export function SidebarSkeleton({ rows = 6 }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-item" key={i}>
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line skeleton-line--long" />
        </div>
      ))}
    </div>
  );
}
