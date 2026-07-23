const ONES = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  return ONES[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " AND " + twoDigits(n % 100) : "");
}

function groupWords(n: number): string {
  if (n === 0) return "";
  if (n < 1000) return threeDigits(n);
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  return threeDigits(thousands) + " THOUSAND" + (remainder ? " " + threeDigits(remainder) : "");
}

function groupLakhs(n: number): string {
  if (n < 100000) return groupWords(n);
  const lakhs = Math.floor(n / 100000);
  const remainder = n % 100000;
  return groupWords(lakhs) + " LAKH" + (remainder ? " " + groupWords(remainder) : "");
}

function groupCrores(n: number): string {
  if (n < 10000000) return groupLakhs(n);
  const crores = Math.floor(n / 10000000);
  const remainder = n % 10000000;
  return groupWords(crores) + " CRORE" + (remainder ? " " + groupLakhs(remainder) : "");
}

export function amountToWords(amount: number): string {
  const paise = Math.round((amount - Math.floor(amount)) * 100);
  const whole = Math.floor(amount);
  const words = groupCrores(whole);
  if (paise === 0) return words + " RUPEES ONLY";
  return words + " RUPEES AND " + twoDigits(paise) + " PAISE ONLY";
}
