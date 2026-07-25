"use client";

type Platform = "capacitor" | "web" | "none";

interface Connection {
  platform: Platform;
  deviceId: string;
  deviceName: string;
  // Web Bluetooth state
  device?: any;
  characteristic?: any;
  // Capacitor state
  service?: string;
  writeChar?: string;
}

let connection: Connection | null = null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "none";
  if (typeof (window as any).Capacitor?.isPluginAvailable !== "undefined") return "capacitor";
  if (typeof (navigator as any).bluetooth !== "undefined") return "web";
  return "none";
}

function toBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

const SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
];

export async function connectToPrinter(
  onStatus?: (msg: string) => void
): Promise<boolean> {
  const platform = detectPlatform();

  if (platform === "none") {
    onStatus?.("Bluetooth not supported");
    return false;
  }

  if (platform === "capacitor") {
    try {
      const { BluetoothLe } = await import("@capacitor-community/bluetooth-le");
      await BluetoothLe.initialize();
      onStatus?.("Searching for printer...");
      const device = await BluetoothLe.requestDevice({
        services: [SERVICE_UUIDS[0]],
        optionalServices: SERVICE_UUIDS,
      });
      onStatus?.(`Connecting to ${device.name || "printer"}...`);
      await BluetoothLe.connect({ deviceId: device.deviceId });
      await BluetoothLe.discoverServices({ deviceId: device.deviceId });
      const { services } = await BluetoothLe.getServices({ deviceId: device.deviceId });
      let writeChar: string | null = null;
      let foundService: string | null = null;
      for (const svcUuid of SERVICE_UUIDS) {
        const svc = services.find((s: any) => s.uuid === svcUuid);
        if (!svc) continue;
        const char = svc.characteristics?.find(
          (c: any) => c.properties.write || c.properties.writeWithoutResponse
        );
        if (char) {
          writeChar = char.uuid;
          foundService = svcUuid;
          break;
        }
      }
      if (!writeChar) {
        onStatus?.("Could not find write characteristic");
        await BluetoothLe.disconnect({ deviceId: device.deviceId });
        return false;
      }
      connection = {
        platform: "capacitor",
        deviceId: device.deviceId,
        deviceName: device.name || "",
        service: foundService!,
        writeChar,
      };
      onStatus?.(`Connected to ${device.name || "printer"}!`);
      return true;
    } catch (error: any) {
      onStatus?.(`Connection failed: ${error?.message || "Unknown error"}`);
      return false;
    }
  }

  // Web Bluetooth
  try {
    if (!navigator.bluetooth) {
      onStatus?.("Bluetooth not supported in this browser");
      return false;
    }
    onStatus?.("Searching for printer...");
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUIDS[0]] }],
      optionalServices: SERVICE_UUIDS,
    });
    onStatus?.(`Connecting to ${device.name || "printer"}...`);
    const server = await device.gatt?.connect();
    if (!server) {
      onStatus?.("Failed to connect");
      return false;
    }
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    for (const uuid of SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(uuid);
        const chars = await service.getCharacteristics();
        const writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
        if (writeChar) {
          characteristic = writeChar;
          break;
        }
      } catch {
        // try next
      }
    }
    if (!characteristic) {
      onStatus?.("Could not find write characteristic");
      return false;
    }
    connection = {
      platform: "web",
      deviceId: device.id,
      deviceName: device.name || "",
      device,
      characteristic,
    };
    onStatus?.(`Connected to ${device.name || "printer"}!`);
    return true;
  } catch (error: any) {
    onStatus?.(`Connection failed: ${error?.message || "Unknown error"}`);
    return false;
  }
}

export function isPrinterConnected(): boolean {
  if (!connection) return false;
  if (connection.platform === "capacitor") return true;
  return connection.device?.gatt?.connected === true && connection.characteristic !== null;
}

export function disconnectPrinter() {
  if (!connection) return;
  if (connection.platform === "capacitor") {
    import("@capacitor-community/bluetooth-le").then(({ BluetoothLe }) => {
      BluetoothLe.disconnect({ deviceId: connection!.deviceId });
    });
  } else if (connection.device?.gatt?.connected) {
    connection.device.gatt.disconnect();
  }
  connection = null;
}

export async function printReceipt(
  receiptText: string,
  onStatus?: (msg: string) => void
): Promise<boolean> {
  if (!connection) {
    onStatus?.("Printer not connected");
    return false;
  }

  try {
    onStatus?.("Printing...");
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);
    const CHUNK_SIZE = 200;

    if (connection.platform === "capacitor") {
      const { BluetoothLe } = await import("@capacitor-community/bluetooth-le");
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await BluetoothLe.write({
          deviceId: connection.deviceId,
          service: connection.service!,
          characteristic: connection.writeChar!,
          value: toBase64(chunk),
        });
      }
    } else {
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await connection.characteristic.writeValue(chunk);
      }
    }

    onStatus?.("Printed!");
    return true;
  } catch (error: any) {
    onStatus?.(`Print failed: ${error?.message || "Unknown error"}`);
    return false;
  }
}

export async function tryReconnect(onStatus?: (msg: string) => void): Promise<boolean> {
  if (isPrinterConnected()) return true;

  const platform = detectPlatform();
  if (platform === "capacitor" || platform === "none") return false;

  // Web Bluetooth: try to reconnect to previously paired devices
  try {
    if (!navigator.bluetooth) return false;
    const devices = await navigator.bluetooth.getDevices();
    for (const d of devices) {
      try {
        await connectToPrinter(onStatus);
        return true;
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }
  return false;
}
