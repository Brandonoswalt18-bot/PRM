import Link from "next/link";
import { DealRegistrationForm } from "@/components/product/deal-registration-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";

export default function NewDealPage() {
  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Register a deal"
        subtitle="Share the community and contact details GoAccess needs to review the opportunity."
        primaryLabel="View your deals"
        primaryHref="/portal/deals"
      />
      <div className="app-content">
        <section className="deal-registration-layout">
          <div id="deal-registration-form">
            <DealRegistrationForm />
          </div>
          <aside className="simple-panel simple-side-panel" aria-labelledby="deal-review-steps-title">
            <span className="simple-eyebrow">After submission</span>
            <h2 id="deal-review-steps-title">What happens next</h2>
            <ol className="simple-step-list">
              <li className="is-current">
                <span aria-hidden="true">1</span>
                <div>
                  <strong>Submitted</strong>
                  <p>Your registration enters the GoAccess review queue.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">2</span>
                <div>
                  <strong>Reviewed</strong>
                  <p>GoAccess verifies the opportunity and contact details.</p>
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <strong>Decision posted</strong>
                  <p>The approved or declined status appears in Deals.</p>
                </div>
              </li>
            </ol>
            <Link className="button button-secondary" href="/portal/deals" prefetch={false}>
              View deal history
            </Link>
          </aside>
        </section>
      </div>
    </>
  );
}
