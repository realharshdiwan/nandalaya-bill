// Web Bluetooth API type declarations
// These are available in modern browsers but not in TypeScript's default lib

interface BluetoothDevice {
  id: string;
  name: string | null;
  gatt: BluetoothRemoteGATTServer | null;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothGATTService>;
}

interface BluetoothGATTService {
  device: BluetoothDevice;
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothGATTService;
  uuid: string;
  properties: Record<string, boolean>;
  writeValue(value: BufferSource): Promise<void>;
  readValue(): Promise<DataView>;
}

interface BluetoothRequestOptions {
  filters?: Array<{
    services?: string[];
    name?: string;
    namePrefix?: string;
  }>;
  optionalServices?: string[];
}

interface Navigator {
  bluetooth: {
    requestDevice(options: BluetoothRequestOptions): Promise<BluetoothDevice>;
  };
}
