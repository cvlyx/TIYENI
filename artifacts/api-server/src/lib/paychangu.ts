const PAYCHANGU_BASE = "https://api.paychangu.com";

export interface InitiatePaymentParams {
  amount: number;
  currency: "MWK" | "USD";
  firstName: string;
  lastName: string;
  email?: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  title?: string;
  description?: string;
  meta?: Record<string, string>;
}

export interface PayChanguResponse {
  message: string;
  status: "success" | "error";
  data?: {
    event: string;
    checkout_url: string;
    data: {
      tx_ref: string;
      currency: string;
      amount: number;
      mode: string;
      status: string;
    };
  };
}

export interface VerifyResponse {
  status: "success" | "error";
  message: string;
  data?: {
    status: "successful" | "failed" | "pending";
    tx_ref: string;
    amount: number;
    currency: string;
    transaction_id: string;
  };
}

function getSecretKey(): string {
  const key = process.env.PAYCHANGU_SECRET_KEY;
  if (!key) throw new Error("PAYCHANGU_SECRET_KEY env var is not set");
  return key;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<PayChanguResponse> {
  const res = await fetch(`${PAYCHANGU_BASE}/payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getSecretKey()}`,
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: params.currency,
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email ?? "",
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        title: params.title ?? "Tiyeni Payment",
        description: params.description ?? "",
      },
      meta: params.meta ?? {},
    }),
  });
  return res.json() as Promise<PayChanguResponse>;
}

export async function verifyTransaction(txRef: string): Promise<VerifyResponse> {
  const res = await fetch(`${PAYCHANGU_BASE}/verify-payment/${txRef}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });
  return res.json() as Promise<VerifyResponse>;
}
