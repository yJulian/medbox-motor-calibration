# MedBox Motor Control Web Interface

Diese Web-Schnittstelle ermöglicht die Steuerung des Stepper-Motors über Bluetooth Low Energy (BLE).

## Verwendung

1. Öffnen Sie `index.html` in einem Browser, der Web Bluetooth unterstützt (z.B. Chrome, Edge)
2. Klicken Sie auf "Mit MedBox verbinden"
3. Wählen Sie "MedBox Motor" aus der Liste der verfügbaren Geräte
4. Nach erfolgreicher Verbindung können Sie die Steuerungstasten verwenden

## Steuerungstasten

- **+1, +10, +100**: Motor im Uhrzeigersinn (rechts) drehen
- **-1, -10, -100**: Motor gegen den Uhrzeigersinn (links) drehen

Die Zahlen geben die Anzahl der Schritte an.

## Browser-Kompatibilität

Web Bluetooth wird unterstützt von:
- Chrome (Desktop & Android)
- Edge
- Opera

**Hinweis**: Safari und Firefox unterstützen derzeit kein Web Bluetooth.

## Technische Details

### BLE Protokoll

- **Service UUID**: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- **Characteristic UUID**: `beb5483e-36e1-4688-b7f5-ea07361b26a8`

### Befehlsformat

Die Website sendet Text-Befehle an den ESP32:
- `+1`: 1 Schritt vorwärts
- `+A`: 10 Schritte vorwärts  
- `+B`: 100 Schritte vorwärts
- `-1`: 1 Schritt rückwärts
- `-A`: 10 Schritte rückwärts
- `-B`: 100 Schritte rückwärts

## Lokale Nutzung

Die Datei kann direkt im Browser geöffnet werden (keine Webserver-Installation erforderlich):

```
file:///pfad/zu/web/index.html
```

Oder mit einem lokalen Webserver:

```bash
# Python 3
python -m http.server 8000

# Node.js (mit npx)
npx http-server
```

Dann öffnen Sie `http://localhost:8000` in Ihrem Browser.
