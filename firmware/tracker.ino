#include "AssetTracker/AssetTracker.h"

// Enable to deactivate GPS if the tracker is idle for IDLE_INTERVAL minutes
// Currently not working: https://goo.gl/h3SxEQ
// #define ENERGY_SAVING

// Event intervals
#define MINUTES(x) (x * 60 * 1000)
#define SECONDS(x) (x * 1000)

#define ALARM_INTERVAL MINUTES(10)
#define GPS_INTERVAL SECONDS(5)
#define BATTERY_INTERVAL MINUTES(60)
#define IDLE_INTERVAL MINUTES(10)

// Minimum movement to detect by the accelerometer
#define MOVEMENT 9000

// Outlier detection
#define DEG_PER_KM (0.1f / 11.1f)
#define MAX_PER_SEC (360.0f / 3600)
#define MAX_DEG(interval) (interval * MAX_PER_SEC * DEG_PER_KM)


AssetTracker tracker = AssetTracker();
FuelGauge fuel = FuelGauge();

// Use "gps" from the Asset Tracker library to get coords in a usable format
extern Adafruit_GPS gps;

float lastLat, lastLon;
unsigned long tsAcc, tsGps, tsAlarm, tsBattery, now;

bool gpsOn = 1, alarmOn, alarmPending;


int setAlarm(String command) {
  bool alarm = command == "1";

  if (alarm != alarmOn) {
    alarmOn = alarm;
    EEPROM.update(0, alarmOn);

    return 1;
  } else {
    return 0;
  }
}

bool checkInterval(unsigned long ts, unsigned long interval) {
  if (ts == 0 || now - ts > interval) {
    return 1;
  } else {
    return 0;
  }
}

bool shouldDiscard(float lat, float lon, unsigned long interval) {
  // Don't consider initial values outliers
  if (fabs(lastLat) < 0.0001 || fabs(lastLon) < 0.0001) {
    return 0;
  }

  float latDelta = fabs(lat - lastLat);
  float lonDelta = fabs(lon - lastLon);

  // Discard small movements
  if (latDelta < 0.00002 && lonDelta < 0.00002) {
    return 1;
  }

  // Discard movements that are too fast
  if (latDelta > MAX_DEG(interval) || lonDelta > MAX_DEG(interval)) {
    return 1;
  } else {
    return 0;
  }
}

void setup() {
  tracker.begin();
  tracker.gpsOn();

  Particle.function("setAlarm", setAlarm);
  alarmOn = EEPROM.read(0);

  Serial.begin(9600);
}

void loop() {
  now = millis();

  if (gpsOn) {
    tracker.updateGPS();
  }

  // Check accelerometer movement
  int acc = tracker.readXYZmagnitude();

  if (acc > MOVEMENT) {
    tsAcc = now;

    // Send alarm
    if (alarmPending || (alarmOn && checkInterval(tsAlarm, ALARM_INTERVAL))) {
      tsAlarm = now;
      alarmPending = 0;

      if (! Particle.publish("A", NULL, 60, PRIVATE)) {
        alarmPending = 1;
      } else {
        Serial.println("Alarm sent");
      }
    }

    // Update location
    if (gpsOn && checkInterval(tsGps, GPS_INTERVAL)) {
      tsGps = now;

      if (tracker.gpsFix()) {
        float lat = gps.latitudeDegrees;
        float lon = gps.longitudeDegrees;

        if (! shouldDiscard(lat, lon, 5)) {
          String location = String::format("%f:%f", lat, lon);

          Serial.println(location);
          Particle.publish("L", location, 60, PRIVATE);
        } else {
          Serial.println(String::format("Discarding %f:%f", lat, lon));
        }

        lastLat = lat;
        lastLon = lon;
      } else {
        Serial.println("Tracker moved but no GPS fix");
      }
    }

    // Activate GPS
    if (! gpsOn) {
      gpsOn = 1;
      tracker.gpsOn();

      Serial.println("Activating GPS");
    }
  } else {
    if (now - tsAcc > IDLE_INTERVAL) {
      #ifdef ENERGY_SAVING
      if (gpsOn) {
        gpsOn = 0;
        tracker.gpsOff();

        Serial.println("Deactivating GPS");
      }
      #endif
    }
  }

  // Update battery status
  if (checkInterval(tsBattery, BATTERY_INTERVAL)) {
    tsBattery = now;
    float battery = fuel.getSoC();

    Serial.println(battery);
    Particle.publish("B", String(battery), 60, PRIVATE);
  }
}
