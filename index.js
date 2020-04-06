const Gpio = require('pigpio').Gpio;
var io = require('socket.io');
var http = require('http');
var server = http.createServer();
server.listen(8000, '0.0.0.0');
var socket = io.listen(server);

let sequenceNumberByClient = new Map();

// event fired every time a new client connects:
socket.on("connection", (socketClient) => {
  console.info(`Client connected [id=${socketClient.id}]`);
  // initialize this client's sequence number
  sequenceNumberByClient.set(socketClient, 1);

  // when socket disconnects, remove it from the list:
  socketClient.on("disconnect", () => {
    sequenceNumberByClient.delete(socketClient);
    console.info(`Client gone [id=${socketClient.id}]`);
  });
});


// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
const MICROSECDONDS_PER_CM = 1e6/34321;

const trigger = new Gpio(23, {mode: Gpio.OUTPUT});
const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});

trigger.digitalWrite(0); // Make sure trigger is low

const watchHCSR04 = () => {
  let startTick;

  echo.on('alert', (level, tick) => {
    if (level == 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      let distance = (diff / 2 / MICROSECDONDS_PER_CM);
      for (const [client, sequenceNumber] of sequenceNumberByClient.entries()) {
        client.emit("distance", distance);
      }
    }
  });
};

watchHCSR04();

// Trigger a distance measurement once per second
setInterval(() => {
  trigger.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);
