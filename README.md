# medbox-motor-calibration

Stepper-Motor-Kalibrierungsprogramm für ESP32 mit BLE-Steuerung.

## Beschreibung

Dieses Projekt ermöglicht die Steuerung eines Stepper-Motors über Bluetooth Low Energy (BLE). Der Motor kann über eine Web-Schnittstelle um 1, 10 oder 100 Schritte in beide Richtungen gedreht werden.

## Hardware

- ESP32 Entwicklungsboard
- Stepper-Motor (2048 Schritte pro Umdrehung)
- Motor-Treiber an Pins 5, 18, 19, 21

## Software-Komponenten

### ESP32 Firmware (PlatformIO)

Die Firmware läuft auf dem ESP32 und bietet:
- BLE Server mit dem Namen "MedBox Motor"
- Stepper-Motor-Steuerung
- Empfang von Schritt-Befehlen über BLE

### Web-Interface

Die Web-Schnittstelle (`web/index.html`) bietet:
- Verbindung zum ESP32 über Web Bluetooth
- 6 Steuerungstasten für Motorsteuerung (+/-1, +/-10, +/-100 Schritte)
- Visuelles Feedback über Verbindungsstatus

Siehe [web/README.md](web/README.md) für weitere Details.

## Installation

1. Öffnen Sie das Projekt in PlatformIO
2. Flashen Sie die Firmware auf den ESP32:
   ```bash
   platformio run --target upload
   ```
3. Öffnen Sie `web/index.html` in einem Browser mit Web Bluetooth Unterstützung

## Verwendung

1. Stellen Sie sicher, dass der ESP32 eingeschaltet ist
2. Öffnen Sie die Web-Schnittstelle
3. Klicken Sie auf "Mit MedBox verbinden"
4. Wählen Sie "MedBox Motor" aus der Geräteliste
5. Verwenden Sie die Steuerungstasten zum Drehen des Motors

## BLE Protokoll

- **Service UUID**: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Characteristic UUID**: `beb5483e-36e1-4688-b7f5-ea07361b26a8`

### Befehlsformat

- `+1`: 1 Schritt vorwärts
- `+A`: 10 Schritte vorwärts
- `+B`: 100 Schritte vorwärts
- `-1`: 1 Schritt rückwärts
- `-A`: 10 Schritte rückwärts
- `-B`: 100 Schritte rückwärts
