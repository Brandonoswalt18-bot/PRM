import Link from "next/link";
import { getVendorByInviteToken } from "@/lib/goaccess-store";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const vendor = await getVendorByInviteToken(token);

  if (!vendor) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <span className="eyebrow">INVITE NOT FOUND</span>
          <h1>This GoAccess vendor invite is invalid.</h1>
          <p>The invite link may have expired or already been replaced. Contact GoAccess to receive a fresh portal invite.</p>
          <div className="login-footer">
            <Link className="button button-primary" href="/">
              Back to vendor access
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <span className="eyebrow">VENDOR INVITE</span>
        <h1>Activate your GoAccess vendor portal access.</h1>
        <p>
          {vendor.companyName} has been approved. Your NDA is {vendor.ndaStatus}, and your portal credentials are ready.
          Continue to activate your vendor profile and enter the portal.
        </p>
        <div className="stack-list">
          <div className="stack-card">
            <div className="stack-meta-grid">
              <span>{vendor.primaryContactName}</span>
              <span>{vendor.primaryContactEmail}</span>
              <span>{vendor.hubspotPartnerId}</span>
            </div>
          </div>
        </div>
        <div className="login-actions">
          <Link
            className="button button-primary"
            href={`/auth/mock-login?role=partner&invite=${encodeURIComponent(token)}&next=/portal/profile`}
          >
            Activate vendor access
          </Link>
          <Link className="button button-secondary" href="/login?workspace=partner">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
