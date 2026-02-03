#include "stepper/Stepper.h"
#include <ESP32Servo.h>
#include <esp32-hal.h>

#define MOVE_MS 1000
#define DELAY_MS 2000

#define MOVE_PIN 13
#define DIRECTION_PIN 12
#define SPEED_PIN 14
#define DELAY_PIN 27

// Define number of steps per revolution:
const int stepsPerRevolution = 2048;

// Initialize the stepper library on pins 8 through 11:
Stepper myStepper = Stepper(stepsPerRevolution, 5, 18, 19, 21);
Servo myservo;  // create servo object to control a servo

void setup() {
  myStepper.setSpeed(16);

  pinMode(MOVE_PIN, INPUT_PULLUP);
  pinMode(DIRECTION_PIN, INPUT_PULLUP);
  pinMode(SPEED_PIN, INPUT_PULLUP);
  pinMode(DELAY_PIN, INPUT_PULLUP);

}
void loop() {
  int state = digitalRead(MOVE_PIN);
  int delay_ms = digitalRead(DELAY_PIN) == HIGH ? 1000 : 100;

  if (state == HIGH) {
    delay(delay_ms);
    return;
  }
  int direction = digitalRead(DIRECTION_PIN);
  int speed = digitalRead(SPEED_PIN) == HIGH ? 32 : 8;
  if (direction == HIGH) {
    myStepper.step(speed);
  } else {
    myStepper.step(-speed);
  }
  delay(delay_ms);
}