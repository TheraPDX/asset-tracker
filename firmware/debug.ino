unsigned long lastGps = 0, lastBat = 0;

float lat = 52.070498, lon = 4.3007;
float delta = 0.001;

int battery = 100;

String json;

void setup() {
  Serial.begin(9600);
  randomSeed(analogRead(0));

  json.reserve(64);
}

void loop() {
  if (millis() - lastGps > 4000) {
    lastGps = millis();

    lat += delta * (random(-100, 100) / 100.0f);
    lon += delta;

    json = "loc:";
    json += String(lat, 5);
    json += ":";
    json += String(lon, 5);

    Serial.println(json);
  }

  if (millis() - lastBat > 5000) {
    lastBat = millis();

    battery -= 1;

    if (battery < 0) {
      battery = 100;
    }

    json = "bat:";
    json += battery;

    Serial.println(json);
  }
}
