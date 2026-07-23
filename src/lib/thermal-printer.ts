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
  let receipt = "";

  receipt += initPrinter();
  receipt += setCodepage();
  receipt += alignCenter();
  receipt += setBold(true);
  receipt += setDoubleSize(true);
  receipt += "BILL OF SUPPLY\n";
  receipt += setDoubleSize(false);
  receipt += setBold(false);
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

  receipt += alignLeft();
  receipt += `Bill: ${bill.bill_number}\n`;

  const date = new Date(bill.created_at);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  receipt += `Date: ${dateStr} ${timeStr}\n`;

  if (bill.customer_name) {
    receipt += `Customer: ${bill.customer_name}\n`;
  }
  if (bill.customer_phone) {
    receipt += `Phone: ${bill.customer_phone}\n`;
  }

  receipt += "-".repeat(lineWidth) + "\n";

  receipt += setBold(true);
  const itemW = lineWidth - 12;
  receipt += padRight("Item", itemW) + padLeft("Qty", 4) + padLeft("Total", 8) + "\n";
  receipt += setBold(false);
  receipt += "-".repeat(lineWidth) + "\n";

  for (const item of items) {
    const name = item.size_label
      ? `${item.product_name}(${item.size_label})`
      : item.product_name;
    const truncatedName = name.length > itemW ? name.slice(0, itemW - 1) + "." : name;

    receipt += padRight(truncatedName, itemW);
    receipt += padLeft(String(item.qty), 4);
    receipt += padLeft(`\u20b9${item.subtotal}`, 8);
    receipt += "\n";

    receipt += `  @\u20b9${item.price}`;
    if (item.discount_amount > 0) {
      receipt += ` (-\u20b9${item.discount_amount})`;
    }
    receipt += "\n";
  }

  receipt += "-".repeat(lineWidth) + "\n";

  receipt += padRight("Subtotal:", 22) + padLeft(`\u20b9${bill.subtotal}`, 10) + "\n";
  if (bill.discount > 0) {
    receipt += padRight("Discount:", 22) + padLeft(`-\u20b9${bill.discount}`, 10) + "\n";
  }

  receipt += setBold(true);
  receipt += setDoubleSize(true);
  receipt += padRight("TOTAL:", 22) + padLeft(`\u20b9${bill.total}`, 10) + "\n";
  receipt += setDoubleSize(false);
  receipt += setBold(false);

  receipt += "-".repeat(lineWidth) + "\n";

  // Payment — show breakdown if split
  const details = bill.payment_details;
  if (details && details.length > 1) {
    for (const p of details) {
      receipt += `${p.method.toUpperCase()}     \u20b9${p.amount}\n`;
    }
  } else {
    receipt += `Payment: ${bill.payment_method.toUpperCase()}\n`;
  }

  if (bill.notes) {
    receipt += "\nNotes:\n" + bill.notes + "\n";
  }

  receipt += "\n";
  receipt += alignLeft();
  receipt += "Amount in words:\n";
  receipt += setBold(true);
  receipt += amountToWords(bill.total) + "\n";
  receipt += setBold(false);

  receipt += "-".repeat(lineWidth) + "\n";

  receipt += alignCenter();
  receipt += "THANK YOU!\n";
  receipt += "\n";
  receipt += alignLeft();
  receipt += "Auth. Sign: __________________\n";
  receipt += "\n\n";

  receipt += cutPaper();

  return receipt;
}

let device: BluetoothDevice | null = null;
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
let reconnectAttempted = false;

export async function tryReconnect(onStatus?: (msg: string) => void): Promise<boolean> {
  if (reconnectAttempted) return isPrinterConnected();
  reconnectAttempted = true;

  if (!navigator.bluetooth) return false;

  try {
    const devices = await navigator.bluetooth.getDevices();
    if (devices.length === 0) return false;

    for (const d of devices) {
      try {
        device = d;
        const server = await d.gatt?.connect();
        if (!server) continue;

        for (const uuid of [
          "000018f0-0000-1000-8000-00805f9b34fb",
          "0000fee7-0000-1000-8000-00805f9b34fb",
        ]) {
          try {
            const service = await server.getPrimaryService(uuid);
            const chars = await service.getCharacteristics();
            const writeChar = chars.find((c) => c.properties.write);
            if (writeChar) {
              characteristic = writeChar;
              onStatus?.(`Reconnected to ${d.name || "printer"}`);
              return true;
            }
          } catch {
            // Try next UUID
          }
        }
      } catch {
        // Try next device
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function connectToPrinter(
  onStatus?: (msg: string) => void
): Promise<boolean> {
  try {
    if (!navigator.bluetooth) {
      onStatus?.("Bluetooth not supported in this browser");
      return false;
    }

    onStatus?.("Searching for printer...");

    device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ["000018f0-0000-1000-8000-00805f9b34fb"] },
      ],
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "0000fee7-0000-1000-8000-00805f9b34fb",
      ],
    });

    onStatus?.(`Connecting to ${device.name || "printer"}...`);

    const server = await device.gatt?.connect();
    if (!server) {
      onStatus?.("Failed to connect");
      return false;
    }

    let service: BluetoothGATTService | null = null;
    const serviceUUIDs = [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000fee7-0000-1000-8000-00805f9b34fb",
    ];

    for (const uuid of serviceUUIDs) {
      try {
        service = await server.getPrimaryService(uuid);
        if (service) break;
      } catch {
        // Try next UUID
      }
    }

    if (!service) {
      onStatus?.("Could not find printer service");
      return false;
    }

    const characteristics = await service.getCharacteristics();
    characteristic = characteristics.find((c) => c.properties.write) || null;

    if (!characteristic) {
      onStatus?.("Could not find write characteristic");
      return false;
    }

    onStatus?.(`Connected to ${device.name || "printer"}!`);
    return true;
  } catch (error) {
    onStatus?.(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

export function isPrinterConnected(): boolean {
  return device?.gatt?.connected === true && characteristic !== null;
}

export function disconnectPrinter() {
  if (device?.gatt?.connected) {
    device.gatt.disconnect();
  }
  device = null;
  characteristic = null;
}

export async function printReceipt(
  receiptText: string,
  onStatus?: (msg: string) => void
): Promise<boolean> {
  if (!characteristic) {
    onStatus?.("Printer not connected");
    return false;
  }

  try {
    onStatus?.("Printing...");

    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);

    const CHUNK_SIZE = 200;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    onStatus?.("Printed!");
    return true;
  } catch (error) {
    onStatus?.(`Print failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
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
