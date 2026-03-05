type SessionRole = "admin" | "vendor";

export type SignedSessionPayload = {
  role: SessionRole;
  email: string;
  vendorId?: string;
  exp: number;
};

const encoder = new TextEncoder();

function getAuthSecret() {
  const value = process.env.AUTH_SECRET?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-auth-secret-change-me";
  }

  return null;
}

function bytesToBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBase64Url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;

  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  try {
    return base64ToBytes(`${normalized}${padding}`);
  } catch {
    return null;
  }
}

async function signValue(value: string) {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured for production auth.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string, signature: string) {
  const expected = await signValue(value);
  return expected === signature;
}

export async function createSignedSession(input: {
  role: SessionRole;
  email: string;
  vendorId?: string;
  maxAgeSeconds?: number;
}) {
  const payload: SignedSessionPayload = {
    role: input.role,
    email: input.email,
    vendorId: input.vendorId,
    exp: Math.floor(Date.now() / 1000) + (input.maxAgeSeconds ?? 60 * 60 * 8),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function readSignedSession(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const isValid = await verifyValue(encodedPayload, signature);

  if (!isValid) {
    return null;
  }

  const payloadBytes = fromBase64Url(encodedPayload);

  if (!payloadBytes) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as SignedSessionPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (payload.role !== "admin" && payload.role !== "vendor") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
