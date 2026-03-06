"use client";

import type { TrainingAsset } from "@/types/goaccess";

function formatAssetType(asset: TrainingAsset) {
  return asset.type === "video" ? "Video" : "Document";
}

export function TrainingLibrary({
  assets,
  emptyTitle,
  emptyMessage,
}: {
  assets: TrainingAsset[];
  emptyTitle: string;
  emptyMessage: string;
}) {
  if (assets.length === 0) {
    return (
      <div className="stack-list">
        <article className="stack-card">
          <div className="stack-card-header">
            <div>
              <h3>{emptyTitle}</h3>
              <p>{emptyMessage}</p>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="stack-list">
      {assets.map((asset) => (
        <article className="stack-card" key={asset.id}>
          <div className="stack-card-header">
            <div>
              <h3>{asset.title}</h3>
              <p>{asset.description || `${formatAssetType(asset)} training item`}</p>
            </div>
            <span className="status-pill">
              {formatAssetType(asset)}
            </span>
          </div>
          <div className="stack-meta-grid">
            <span>{asset.fileName ?? "External link"}</span>
            <span>Added {new Date(asset.createdAt).toLocaleDateString()}</span>
            <span>{asset.uploadedBy}</span>
          </div>
          <div className="detail-link-row">
            <a
              className="detail-link-chip"
              href={
                asset.source === "external" && asset.externalUrl
                  ? asset.externalUrl
                  : `/api/training-assets/file?id=${asset.id}`
              }
              rel="noreferrer"
              target="_blank"
            >
              Open {formatAssetType(asset).toLowerCase()}
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
