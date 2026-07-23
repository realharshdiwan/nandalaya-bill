// Web Bluetooth API type declarations

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
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothGATTService>;
}

interface BluetoothGATTService {
  device: BluetoothDevice;
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  readValue(): Promise<DataView>;
}

interface BluetoothCharacteristicProperties {
  write: boolean;
  writeWithoutResponse: boolean;
  read: boolean;
  notify: boolean;
}

interface BluetoothRequestOptions {
  filters?: Array<{
    services?: string[];
    name?: string;
    namePrefix?: string;
  }>;
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

type BluetoothServiceUUID = string;

interface Bluetooth {
  requestDevice(options: BluetoothRequestOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}

interface Navigator {
  bluetooth: Bluetooth;
}
