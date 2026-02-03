#include "stepper/Stepper.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Define number of steps per revolution:
const int stepsPerRevolution = 2048;

// Initialize the stepper library on pins 5, 18, 19, 21:
Stepper myStepper = Stepper(stepsPerRevolution, 5, 18, 19, 21);

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected");
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();

      if (value.length() > 0) {
        Serial.print("Received value: ");
        for (int i = 0; i < value.length(); i++) {
          Serial.print(value[i]);
        }
        Serial.println();

        // Parse the command: format is a single character representing the step command
        // '+' = positive, '-' = negative
        // '1', 'A', 'B' for 1, 10, 100
        char cmd = value[0];
        int steps = 0;
        
        if (cmd == '+' && value.length() >= 2) {
          char magnitude = value[1];
          if (magnitude == '1') steps = 1;
          else if (magnitude == 'A') steps = 10;
          else if (magnitude == 'B') steps = 100;
        } else if (cmd == '-' && value.length() >= 2) {
          char magnitude = value[1];
          if (magnitude == '1') steps = -1;
          else if (magnitude == 'A') steps = -10;
          else if (magnitude == 'B') steps = -100;
        }

        if (steps != 0) {
          Serial.print("Moving motor: ");
          Serial.print(steps);
          Serial.println(" steps");
          myStepper.step(steps);
        }
      }
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Motor Control");

  myStepper.setSpeed(16);

  // Create the BLE Device
  BLEDevice::init("MedBox Motor");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting for a client connection to notify...");
}

void loop() {
  // Disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // Connecting
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  delay(10);
}