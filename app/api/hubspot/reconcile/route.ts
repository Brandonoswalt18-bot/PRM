import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import {
  applyHubSpotDealReconciliation,
  listDeals,
} from "@/lib/goaccess-store";
import { readHubSpotDealForReconciliation } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runReconciliation() {
  if (!process.env.HUBSPOT_ACCESS_TOKEN?.trim()) {
    return NextResponse.json(
      { message: "HubSpot reconciliation is not configured." },
      { status: 503 }
    );
  }

  const deals = (await listDeals()).filter((deal) => Boolean(deal.hubspotDealId));
  const results: Array<{
    dealId: string;
    hubspotDealId?: string;
    changed?: boolean;
    status?: string;
    error?: string;
  }> = [];

  for (const deal of deals) {
    try {
      const snapshot = await readHubSpotDealForReconciliation(deal);
      const reconciliation = await applyHubSpotDealReconciliation(deal.id, snapshot);
      results.push({
        dealId: deal.id,
        hubspotDealId: deal.hubspotDealId,
        changed: reconciliation.changed,
        status: reconciliation.deal.status,
      });
    } catch (error) {
      results.push({
        dealId: deal.id,
        hubspotDealId: deal.hubspotDealId,
        error: error instanceof Error ? error.message : "Unknown reconciliation failure.",
      });
    }
  }

  const failures = results.filter((result) => result.error);

  return NextResponse.json(
    {
      ok: failures.length === 0,
      checked: results.length,
      changed: results.filter((result) => result.changed).length,
      failed: failures.length,
      results,
    },
    { status: failures.length === results.length && results.length > 0 ? 502 : 200 }
  );
}

function hasCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!hasCronAuthorization(request)) {
    return NextResponse.json({ message: "Cron authorization required." }, { status: 401 });
  }

  return runReconciliation();
}

export async function POST() {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  return runReconciliation();
}
