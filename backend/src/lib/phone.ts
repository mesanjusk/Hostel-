const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/** Normalizes a raw mobile number input (10-digit, or with +91/91/0 prefix) into "91XXXXXXXXXX". */
export function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let tenDigit: string | null = null;
  if (digits.length === 10) {
    tenDigit = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigit = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigit = digits.slice(2);
  }

  if (!tenDigit || !INDIAN_MOBILE_REGEX.test(tenDigit)) {
    return null;
  }

  return `91${tenDigit}`;
}

export function formatMobileForDisplay(normalized: string): string {
  const local = normalized.slice(2);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}
