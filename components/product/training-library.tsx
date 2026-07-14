"use client";

import type { TrainingAsset } from "@/types/goaccess";

function formatAssetType(asset: TrainingAsset) {
  return asset.type === "video" ? "Video" : "Document";
}

export function TrainingLibrary({
  assets,
  emptyTitle,
  emptyMessage,
  emptyIcon = "document",
  variant = "default",
}: {
  assets: TrainingAsset[];
  emptyTitle: string;
  emptyMessage: string;
  emptyIcon?: "video" | "document";
  variant?: "default" | "vendor";
}) {
  if (variant === "vendor") {
    if (assets.length === 0) {
      return (
        <div className="workspace-row training-library-empty">
          <span className={`training-library-empty-icon is-${emptyIcon}`} aria-hidden="true">
            {emptyIcon === "video" ? "▶" : "PDF"}
          </span>
          <div>
            <span className="training-library-empty-label">Resource library</span>
            <h3>{emptyTitle}</h3>
            <p>{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="training-asset-list">
        {assets.map((asset) => {
          const assetType = formatAssetType(asset);
          const assetHref =
            asset.source === "external" && asset.externalUrl
              ? asset.externalUrl
              : `/api/training-assets/file?id=${asset.id}`;

          return (
            <article className={`workspace-row training-asset-card is-${asset.type}`} key={asset.id}>
              <span className="training-asset-icon" aria-hidden="true">
                {asset.type === "video" ? "▶" : "PDF"}
              </span>
              <div className="training-asset-copy">
                <div className="training-asset-heading">
                  <h3>{asset.title}</h3>
                  <span className="training-asset-kind">{assetType}</span>
                </div>
                <p>{asset.description || `${assetType} training item`}</p>
                <div className="training-asset-meta">
                  <span>
                    {asset.source === "external"
                      ? asset.type === "video"
                        ? "Hosted video"
                        : "External document"
                      : asset.fileName ?? "Downloadable file"}
                  </span>
                  <span>Added {new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <a
                className="training-asset-action"
                href={assetHref}
                rel="noreferrer"
                target="_blank"
              >
                <span>{asset.type === "video" ? "Watch" : "Open"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          );
        })}
      </div>
    );
  }

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
