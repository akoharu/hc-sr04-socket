const
    io = require("socket.io-client"),
    ioClient = io.connect("http://192.168.1.3:8000");

ioClient.on("distance", (msg) => console.info(msg));