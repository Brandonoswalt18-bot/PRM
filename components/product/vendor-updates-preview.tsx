import Link from "next/link";
import type { ClientPartnerUpdate, PartnerUpdateCategory } from "@/types/goaccess";

const CATEGORY_LABELS: Record<PartnerUpdateCategory, string> = {
  product_update: "Product update",
  sales_resource: "Sales resource",
  operational_notice: "Operational notice",
};

function updateTimestamp(update: ClientPartnerUpdate) {
  return Date.parse(update.publishedAt ?? update.updatedAt);
}

function formatShortDate(update: ClientPartnerUpdate) {
  const date = new Date(update.publishedAt ?? update.updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function VendorUpdatesPreview({ updates }: { updates: ClientPartnerUpdate[] }) {
  const sorted = [...updates].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return updateTimestamp(b) - updateTimestamp(a);
  });
  const previewUpdates = sorted.slice(0, 3);
  const featuredId = sorted.find((update) => update.isPinned)?.id ?? sorted[0]?.id;

  return (
    <section className="workspace-card workspace-panel simple-panel portal-updates-preview" aria-labelledby="portal-updates-preview-title">
      <div className="simple-panel-header">
        <div>
          <span className="simple-eyebrow">Updates</span>
          <h2 id="portal-updates-preview-title">Latest from GoAccess</h2>
          <p>Product news, new sales resources, and important partner notices.</p>
        </div>
        <Link href="/portal/updates" className="simple-text-link" prefetch={false}>
          View all updates
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {previewUpdates.length > 0 ? (
        <div className="portal-update-preview-list">
          {previewUpdates.map((update) => (
            <Link
              className={`workspace-row portal-update-preview-row is-${update.category}`}
              href={
                update.id === featuredId
                  ? "/portal/updates#latest-update"
                  : `/portal/updates#update-${encodeURIComponent(update.id)}`
              }
              key={update.id}
              prefetch={false}
            >
              <span className="portal-update-preview-marker" aria-hidden="true" />
              <span className="portal-update-preview-copy">
                <span>
                  {CATEGORY_LABELS[update.category]}
                  {update.isPinned ? " · Pinned" : ""}
                </span>
                <strong>{update.title}</strong>
                <small>{update.summary}</small>
              </span>
              <time dateTime={update.publishedAt ?? update.updatedAt}>{formatShortDate(update)}</time>
              <span className="simple-row-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="training-preview-empty portal-updates-preview-empty">
          <strong>No updates yet</strong>
          <span>Announcements published by GoAccess will appear here.</span>
        </div>
      )}
    </section>
  );
}
