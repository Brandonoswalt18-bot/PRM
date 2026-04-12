import type { DealRegistration } from "@/types/goaccess";

const DEAL_META_PREFIX = "__goaccess_deal_meta__:";

type DealMetadata = {
  communityAddress?: string;
  city?: string;
  state?: string;
};

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseDealNotes(rawNotes: string | undefined) {
  const notes = rawNotes ?? "";

  if (!notes.startsWith(DEAL_META_PREFIX)) {
    return {
      communityAddress: undefined,
      city: undefined,
      state: undefined,
      legacyNotes: notes.trim(),
    };
  }

  const [encodedMetadata, ...rest] = notes.split("\n");

  try {
    const metadata = JSON.parse(encodedMetadata.slice(DEAL_META_PREFIX.length)) as DealMetadata;

    return {
      communityAddress: clean(metadata.communityAddress),
      city: clean(metadata.city),
      state: clean(metadata.state),
      legacyNotes: rest.join("\n").trim(),
    };
  } catch {
    return {
      communityAddress: undefined,
      city: undefined,
      state: undefined,
      legacyNotes: notes.trim(),
    };
  }
}

export function formatDealLocation(
  deal: Pick<DealRegistration, "communityAddress" | "city" | "state" | "domain">
) {
  const cityState = [deal.city, deal.state].filter(Boolean).join(", ");

  if (deal.communityAddress && cityState) {
    return `${deal.communityAddress} · ${cityState}`;
  }

  if (deal.communityAddress) {
    return deal.communityAddress;
  }

  if (cityState) {
    return cityState;
  }

  if (deal.domain) {
    return deal.domain;
  }

  return "Location not provided";
}
