import type { ClientPartnerUpdate, PartnerUpdateCategory } from "@/types/goaccess";

const CATEGORY_LABELS: Record<PartnerUpdateCategory, string> = {
  product_update: "Product update",
  sales_resource: "Sales resource",
  operational_notice: "Operational notice",
};

function getUpdateTimestamp(update: ClientPartnerUpdate) {
  return Date.parse(update.publishedAt ?? update.updatedAt);
}

function formatPublishedDate(update: ClientPartnerUpdate) {
  const date = new Date(update.publishedAt ?? update.updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isNewUpdate(update: ClientPartnerUpdate) {
  const publishedAt = getUpdateTimestamp(update);
  return Number.isFinite(publishedAt) && Date.now() - publishedAt <= 14 * 24 * 60 * 60 * 1000;
}

function safeResourceUrl(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function UpdateResourceLink({ update }: { update: ClientPartnerUpdate }) {
  const href = safeResourceUrl(update.resourceUrl);

  if (!href) {
    return null;
  }

  return (
    <a className="update-resource-link" href={href} rel="noreferrer" target="_blank">
      {update.resourceLabel || "Open resource"}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export function VendorUpdatesLibrary({ updates }: { updates: ClientPartnerUpdate[] }) {
  const sortedUpdates = [...updates].sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a));
  const featuredUpdate = sortedUpdates.find((update) => update.isPinned) ?? sortedUpdates[0];
  const feedUpdates = featuredUpdate
    ? sortedUpdates.filter((update) => update.id !== featuredUpdate.id)
    : [];

  if (!featuredUpdate) {
    return (
      <section className="updates-page-shell">
        <div className="updates-empty-state updates-empty-state-vendor">
          <span className="updates-empty-icon" aria-hidden="true">◎</span>
          <div>
            <span className="simple-eyebrow">Updates from GoAccess</span>
            <h2>No updates yet</h2>
            <p>Product news, sales resources, and important notices will appear here when they are published.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="updates-page-shell">
      <article className={`featured-update-card is-${featuredUpdate.category}`} id="latest-update">
        <div className="featured-update-accent" aria-hidden="true" />
        <div className="featured-update-content">
          <div className="update-card-meta">
            <span className={`update-category-pill is-${featuredUpdate.category}`}>
              {CATEGORY_LABELS[featuredUpdate.category]}
            </span>
            <span className="update-pinned-label">
              {featuredUpdate.isPinned ? "Pinned" : "Latest"}
            </span>
            {isNewUpdate(featuredUpdate) ? <span className="update-new-label">New</span> : null}
          </div>
          <h2>{featuredUpdate.title}</h2>
          <p className="featured-update-summary">{featuredUpdate.summary}</p>
          <p className="featured-update-body">{featuredUpdate.body}</p>
          <div className="featured-update-footer">
            <time dateTime={featuredUpdate.publishedAt ?? featuredUpdate.updatedAt}>
              {formatPublishedDate(featuredUpdate)}
            </time>
            <UpdateResourceLink update={featuredUpdate} />
          </div>
        </div>
      </article>

      <section className="updates-feed-panel" aria-labelledby="updates-feed-title">
        <div className="updates-feed-header">
          <div>
            <span className="simple-eyebrow">Latest from GoAccess</span>
            <h2 id="updates-feed-title">More updates</h2>
            <p>Product news, sales resources, and operational notices in one place.</p>
          </div>
          <span className="updates-feed-count">{feedUpdates.length} {feedUpdates.length === 1 ? "update" : "updates"}</span>
        </div>

        {feedUpdates.length > 0 ? (
          <div className="vendor-update-feed">
            {feedUpdates.map((update) => (
              <article className={`vendor-update-card is-${update.category}`} id={`update-${update.id}`} key={update.id}>
                <div className="update-card-meta">
                  <span className={`update-category-pill is-${update.category}`}>
                    {CATEGORY_LABELS[update.category]}
                  </span>
                  {isNewUpdate(update) ? <span className="update-new-label">New</span> : null}
                  <time dateTime={update.publishedAt ?? update.updatedAt}>{formatPublishedDate(update)}</time>
                </div>
                <h3>{update.title}</h3>
                <p className="vendor-update-summary">{update.summary}</p>
                <details className="vendor-update-details">
                  <summary>Read full update</summary>
                  <p>{update.body}</p>
                </details>
                <UpdateResourceLink update={update} />
              </article>
            ))}
          </div>
        ) : (
          <div className="updates-feed-empty">
            <strong>You are all caught up</strong>
            <span>New updates will appear below the featured announcement.</span>
          </div>
        )}
      </section>
    </div>
  );
}
