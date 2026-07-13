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
  const onboardingComplete = legalComplete && accessActive && dealCount > 0;

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
    { label: "NDA", complete: ndaAccepted, current: !ndaAccepted },
    { label: "Partner Agreement", complete: termsAccepted, current: ndaAccepted && !termsAccepted },
    { label: "Portal access", complete: accessActive, current: legalComplete && !accessActive },
    { label: "First deal", complete: dealCount > 0, current: accessActive && dealCount === 0 },
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
            className={`${step.complete ? "is-complete" : ""}${step.current ? " is-current" : ""}`.trim()}
            key={step.label}
          >
            <span className="vendor-onboarding-step-marker" aria-hidden="true">
              {step.complete ? "✓" : index + 1}
            </span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
