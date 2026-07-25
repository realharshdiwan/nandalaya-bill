"use client";

import { amountToWords } from "@/lib/amount-to-words";

const ESC = "\x1b";
const GS = "\x1d";

function initPrinter(): string {
  return `${ESC}@`;
}

function setBold(on: boolean): string {
  return `${ESC}E${on ? "\x01" : "\x00"}`;
}

function setDoubleSize(on: boolean): string {
  return `${GS}!${on ? "\x30" : "\x00"}`;
}

function alignCenter(): string {
  return `${ESC}a\x01`;
}

function alignLeft(): string {
  return `${ESC}a\x00`;
}

function cutPaper(): string {
  return `${GS}V\x01`;
}

function setCodepage(): string {
  return `${ESC}t\x00`;
}

interface BillItem {
  product_name: string;
  size_label: string | null;
  qty: number;
  price: number;
  discount_amount: number;
  subtotal: number;
}

interface BillData {
  bill_number: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_details?: { method: string; amount: number }[] | null;
  notes: string | null;
}

interface ShopConfig {
  legal_name?: string;
  shop_address?: string;
  shop_phone?: string;
  gstin?: string;
  shop_tagline?: string;
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return " ".repeat(len - str.length) + str;
}

export function getStoredLineWidth(): number {
  if (typeof window === "undefined") return 48;
  return parseInt(localStorage.getItem("nandalaya_printer_width") || "48", 10);
}

export function setStoredLineWidth(width: number) {
  localStorage.setItem("nandalaya_printer_width", String(width));
}

export function generateReceipt(
  bill: BillData,
  items: BillItem[],
  shop?: ShopConfig,
  lineWidth = 48
): string {
  const isNarrow = lineWidth < 40;
  let receipt = "";

  receipt += initPrinter();
  receipt += setCodepage();

  // ── HEADER ──
  receipt += alignCenter();
  receipt += setBold(true);

  if (!isNarrow) {
    receipt += setDoubleSize(true);
    receipt += "BILL OF SUPPLY\n";
    receipt += setDoubleSize(false);
  } else {
    receipt += "BILL OF SUPPLY\n";
  }

  receipt += (shop?.legal_name || "NANDALAYA") + "\n";
  receipt += (shop?.shop_tagline || "SCHOOL UNIFORMS & GARMENTS") + "\n";
  if (shop?.shop_address) {
    receipt += shop.shop_address + "\n";
  }
  if (shop?.gstin) {
    receipt += `GSTIN: ${shop.gstin}\n`;
  }
  if (shop?.shop_phone) {
    receipt += `Mob. ${shop.shop_phone}\n`;
  }
  receipt += "-".repeat(lineWidth) + "\n";

  // ── BILL INFO ──
  receipt += alignLeft();
  receipt += `No: ${bill.bill_number}\n`;

  const date = new Date(bill.created_at);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: isNarrow ? "2-digit" : "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  receipt += `${dateStr} ${timeStr}\n`;

  if (bill.customer_name) {
    receipt += `${isNarrow ? "Cust: " : "Customer: "}${bill.customer_name}\n`;
  }
  if (bill.customer_phone) {
    receipt += `Ph: ${bill.customer_phone}\n`;
  }

  receipt += "-".repeat(lineWidth) + "\n";

  // ── ITEMS ──
  receipt += setBold(true);
  const columns = isNarrow
    ? { itemW: 21, qtyW: 3, amtW: 8 }
    : { itemW: lineWidth - 12, qtyW: 4, amtW: 8 };
  receipt += padRight("Item", columns.itemW)
    + padLeft("Qty", columns.qtyW)
    + padLeft("Amt", columns.amtW) + "\n";
  receipt += setBold(false);
  receipt += "-".repeat(lineWidth) + "\n";

  for (const item of items) {
    const name = item.size_label
      ? `${item.product_name}(${item.size_label})`
      : item.product_name;
    const truncatedName = name.length > columns.itemW
      ? name.slice(0, columns.itemW - 1) + "."
      : name;

    receipt += padRight(truncatedName, columns.itemW);
    receipt += padLeft(String(item.qty), columns.qtyW);
    receipt += padLeft(`Rs${item.subtotal}`, columns.amtW);
    receipt += "\n";

    receipt += `  @Rs${item.price}`;
    if (item.discount_amount > 0) {
      receipt += ` (-Rs${item.discount_amount})`;
    }
    receipt += "\n";
  }

  receipt += "-".repeat(lineWidth) + "\n";

  // ── TOTALS ──
  const totalLabelW = 22;
  const totalValW = 10;

  receipt += padRight("Subtotal:", totalLabelW) + padLeft(`Rs${bill.subtotal}`, totalValW) + "\n";
  if (bill.discount > 0) {
    receipt += padRight("Discount:", totalLabelW) + padLeft(`-Rs${bill.discount}`, totalValW) + "\n";
  }

  receipt += setBold(true);
  receipt += setDoubleSize(true);
  receipt += padRight("TOTAL:", totalLabelW) + padLeft(`Rs${bill.total}`, totalValW) + "\n";
  receipt += setDoubleSize(false);
  receipt += setBold(false);

  receipt += "-".repeat(lineWidth) + "\n";

  // ── PAYMENT ──
  const details = bill.payment_details;
  if (details && details.length > 1) {
    for (const p of details) {
      receipt += `${p.method.toUpperCase()}     Rs${p.amount}\n`;
    }
  } else {
    receipt += `Payment: ${bill.payment_method.toUpperCase()}\n`;
  }

  if (bill.notes) {
    receipt += "\nNotes:\n" + bill.notes + "\n";
  }

  // ── AMOUNT IN WORDS ──
  receipt += "\n";
  receipt += alignLeft();
  receipt += "Amount in words:\n";
  receipt += setBold(true);
  receipt += amountToWords(bill.total).replace(" RUPEES ONLY", " ONLY").replace(" RUPEES AND ", " & ") + "\n";
  receipt += setBold(false);

  receipt += "-".repeat(lineWidth) + "\n";

  // ── FOOTER ──
  receipt += alignCenter();
  receipt += "THANK YOU!\n";

  if (!isNarrow) {
    receipt += "\n";
    receipt += alignLeft();
    receipt += "Auth. Sign: __________________\n";
  }

  receipt += "\n";
  receipt += cutPaper();

  return receipt;
}

// ── BLE connection (delegates to platform abstraction) ──

import {
  connectToPrinter as bleConnect,
  isPrinterConnected as bleIsConnected,
  disconnectPrinter as bleDisconnect,
  printReceipt as blePrint,
  tryReconnect as bleReconnect,
} from "@/lib/printer-ble";

export async function tryReconnect(onStatus?: (msg: string) => void): Promise<boolean> {
  return bleReconnect(onStatus);
}

export async function connectToPrinter(
  onStatus?: (msg: string) => void
): Promise<boolean> {
  return bleConnect(onStatus);
}

export function isPrinterConnected(): boolean {
  return bleIsConnected();
}

export function disconnectPrinter() {
  bleDisconnect();
}

export async function printReceipt(
  receiptText: string,
  onStatus?: (msg: string) => void
): Promise<boolean> {
  return blePrint(receiptText, onStatus);
}

export async function printBillById(
  billId: string,
  onStatus?: (msg: string) => void
): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const [billRes, itemsRes, configRes] = await Promise.all([
      supabase.from("bills").select("*").eq("id", billId).single(),
      supabase.from("bill_items").select("*").eq("bill_id", billId).order("created_at"),
      supabase.from("shop_config").select("key, value"),
    ]);

    if (billRes.error || !billRes.data) {
      onStatus?.("Could not load bill");
      return false;
    }

    const bill = billRes.data;
    const items = (itemsRes.data || []).map((item) => ({
      product_name: item.product_name,
      size_label: item.size_label,
      qty: item.qty,
      price: item.price,
      discount_amount: item.discount_amount,
      subtotal: item.subtotal,
    }));
    const shopConfig = Object.fromEntries((configRes.data || []).map((r: { key: string; value: string }) => [r.key, r.value]));

    const receipt = generateReceipt(bill, items, shopConfig);
    return printReceipt(receipt, onStatus);
  } catch (error) {
    onStatus?.(`Print failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}
