import Link from "next/link";
import type { ClientApprovedVendor } from "@/types/goaccess";

type VendorNextStepCardProps = {
  vendor: ClientApprovedVendor | null;
  dealCount: number;
  alwaysShow?: boolean;
};

export function VendorNextStepCard({
  vendor,
  dealCount,
  alwaysShow = false,
}: VendorNextStepCardProps) {
  if (!vendor) {
    return null;
  }

  const ndaAccepted = vendor.ndaStatus === "signed";
  const termsAccepted = Boolean(vendor.termsAcceptedAt);
  const accessActive = vendor.portalAccess === "active" && vendor.credentialsIssued;
  const legalComplete = ndaAccepted && termsAccepted;
  const portalAccessComplete = legalComplete && accessActive;
  const firstDealComplete = portalAccessComplete && dealCount > 0;
  const onboardingComplete = firstDealComplete;

  if (onboardingComplete && !alwaysShow) {
    return null;
  }

  const nextStep = !ndaAccepted || !termsAccepted
    ? {
        eyebrow: "Step 1 · Required",
        title: "Accept your NDA and Partner Agreement",
        detail: "Review both GoAccess-hosted PDFs and accept each agreement for your company.",
        href: "/portal/onboarding",
        label: "Open legal onboarding",
      }
    : !accessActive
        ? {
            eyebrow: "Step 2 · Activate access",
            title: "Activate your vendor portal",
            detail: "Use the one-time activation email from GoAccess to create your password and unlock the workspace.",
            href: "/portal/onboarding",
            label: "View onboarding status",
          }
        : dealCount === 0
          ? {
              eyebrow: "Step 3 · Start your pipeline",
              title: "Register your first deal",
              detail: "Your legal onboarding and portal access are complete. Add your first community opportunity next.",
              href: "/portal/links",
              label: "Register your first deal",
            }
          : {
              eyebrow: "Onboarding complete",
              title: "You are ready to grow with GoAccess",
              detail: "Legal onboarding, portal access, and your first deal are complete.",
              href: "/portal/deals",
              label: "Open your deals",
            };

  const steps = [
    { label: "NDA", state: ndaAccepted ? "complete" : "current" },
    {
      label: "Partner Agreement",
      state: termsAccepted ? "complete" : ndaAccepted ? "current" : "upcoming",
    },
    {
      label: "Portal access",
      state: portalAccessComplete ? "complete" : legalComplete ? "current" : "upcoming",
    },
    {
      label: "First deal",
      state: firstDealComplete ? "complete" : portalAccessComplete ? "current" : "upcoming",
    },
  ];

  return (
    <section className="vendor-next-step-card" aria-labelledby="vendor-next-step-title">
      <div className="vendor-next-step-copy">
        <span className="section-kicker">{nextStep.eyebrow}</span>
        <h2 id="vendor-next-step-title">{nextStep.title}</h2>
        <p>{nextStep.detail}</p>
        <Link className="button button-primary" href={nextStep.href} prefetch={false}>
          {nextStep.label}
          <span aria-hidden="true" className="button-arrow">→</span>
        </Link>
      </div>
      <ol className="vendor-onboarding-steps" aria-label="Vendor onboarding progress">
        {steps.map((step, index) => (
          <li
            aria-current={step.state === "current" ? "step" : undefined}
            className={`is-${step.state}`}
            key={step.label}
          >
            <span className="vendor-onboarding-step-marker" aria-hidden="true">
              {step.state === "complete" ? "✓" : index + 1}
            </span>
            <span className="vendor-onboarding-step-copy">
              <strong>{step.label}</strong>
              <small>
                {step.state === "complete"
                  ? "Complete"
                  : step.state === "current"
                    ? "Next"
                    : "Upcoming"}
              </small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
