"use client";

// ESC/POS commands for thermal printers
const ESC = "\x1b";
const GS = "\x1d";

function initPrinter(): string {
  return `${ESC}@`; // Initialize printer
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

function alignRight(): string {
  return `${ESC}a\x02`;
}

function lineFeed(n = 1): string {
  return `${ESC}d${String.fromCharCode(n + 1)}`;
}

function cutPaper(): string {
  return `${GS}V\x01`; // Full cut
}

function setCodepage(): string {
  return `${ESC}t\x00`; // Use PC437 (USA) character set
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
  notes: string | null;
}

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return " ".repeat(len - str.length) + str;
}

function centerPad(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  const left = Math.floor((len - str.length) / 2);
  const right = len - str.length - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

export function generateReceipt(
  bill: BillData,
  items: BillItem[],
  shopName = "NANDALAYA",
  shopTagline = "SCHOOL UNIFORMS & GARMENTS",
  lineWidth = 32
): string {
  let receipt = "";

  receipt += initPrinter();
  receipt += setCodepage();
  receipt += alignCenter();
  receipt += setBold(true);
  receipt += setDoubleSize(true);
  receipt += shopName + "\n";
  receipt += setDoubleSize(false);
  receipt += setBold(false);
  receipt += shopTagline + "\n";
  receipt += "-".repeat(lineWidth) + "\n";

  // Bill info
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

  // Items header
  receipt += setBold(true);
  receipt += padRight("Item", 18) + padLeft("Qty", 4) + padLeft("Total", 8) + "\n";
  receipt += setBold(false);
  receipt += "-".repeat(lineWidth) + "\n";

  // Items
  for (const item of items) {
    const name = item.size_label
      ? `${item.product_name}(${item.size_label})`
      : item.product_name;
    const truncatedName = name.length > 18 ? name.slice(0, 17) + "." : name;

    receipt += padRight(truncatedName, 18);
    receipt += padLeft(String(item.qty), 4);
    receipt += padLeft(`₹${item.subtotal}`, 8);
    receipt += "\n";

    receipt += `  @₹${item.price}`;
    if (item.discount_amount > 0) {
      receipt += ` (-₹${item.discount_amount})`;
    }
    receipt += "\n";
  }

  receipt += "-".repeat(lineWidth) + "\n";

  // Totals
  receipt += padRight("Subtotal:", 22) + padLeft(`₹${bill.subtotal}`, 10) + "\n";
  if (bill.discount > 0) {
    receipt += padRight("Discount:", 22) + padLeft(`-₹${bill.discount}`, 10) + "\n";
  }

  receipt += setBold(true);
  receipt += setDoubleSize(true);
  receipt += padRight("TOTAL:", 22) + padLeft(`₹${bill.total}`, 10) + "\n";
  receipt += setDoubleSize(false);
  receipt += setBold(false);

  receipt += "-".repeat(lineWidth) + "\n";

  // Payment
  receipt += `Payment: ${bill.payment_method.toUpperCase()}\n`;

  if (bill.notes) {
    receipt += "\nNotes:\n" + bill.notes + "\n";
  }

  receipt += "\n";
  receipt += alignCenter();
  receipt += "THANK YOU!\n";
  receipt += "\n\n\n";

  receipt += cutPaper();

  return receipt;
}

// Bluetooth connection and printing
// Web Bluetooth types are available globally in modern browsers
// but TypeScript needs the DOM.Iterable types or manual declarations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let device: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let characteristic: any = null;

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
        { services: ["000018f0-0000-1000-8000-00805f9b34fb"] }, // Common thermal printer service
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

    // Try common service UUIDs for thermal printers
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

    // Get write characteristic
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

    // Encode text to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);

    // Write in chunks (BLE has max write size)
    const CHUNK_SIZE = 20;
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
