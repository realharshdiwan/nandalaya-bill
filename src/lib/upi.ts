import QRCode from "qrcode";

export function generateUpiUri(
  upiId: string,
  amount: number,
  billNumber: string
): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: "NANDALAYA",
    am: amount.toFixed(2),
    tn: billNumber,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

export async function generateQrDataUri(upiId: string, amount: number, billNumber: string): Promise<string> {
  const uri = generateUpiUri(upiId, amount, billNumber);
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
