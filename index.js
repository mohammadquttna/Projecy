const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");
const uri = process.env.URI;
const port = process.env.PORT || 5013;
const bodyParser = require("body-parser");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const upload = require("./middleware/upload.single");
const path = require("path");
const usersRoute = require("./routes/users.routes");
const propertiesRoute = require("./routes/properity.routes");
const appointmentsRoute = require("./routes/appointment.routes");
const uploadRoutes = require("./middleware/upload.single");
const { initialize } = require("passport");
const { dirname } = require("path");
const fs = require("fs");
const uploadPropRoute = require("./middleware/upload.multiple");
var Rollbar = require("rollbar");
const currencyConvert = require("./middleware/currency.conversion");
const app = express();

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Connected to DB!");
});

app.use(cors());
app.use(multer({ dest: "./uploads" }).single("omg"));
app.use(multer({ dest: "./uploads" }).single("avatar"));
app.use("/currencies", currencyConvert);
app.use(
  express.urlencoded({
    extended: true,
    limit: "150mb",
    parameterLimit: 1000000,
  })
);
app.use(express.json({ extended: true, limit: "150mb" }));
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
// include and initialize the rollbar library with your access token
var rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

// record a generic message and send it to Rollbar
// use morgan to log requests to the console
app.use(morgan("dev"));

app.use("/users", usersRoute);
app.use("/upload/avatar", uploadRoutes);
app.use(express.static(path.join(__dirname, "./uploads")));
app.use(express.static(path.join(__dirname, "./public")));
app.use("/properties", propertiesRoute);
app.use("/appointments", appointmentsRoute);

app.get("/uploads/:bin", (req, res) => {
  const bin = req.params.bin;
  res.set("Content-type", "image/jpeg" || "image/png" || "image/jpg");
  var file = "./uploads/" + bin;
  var image = res.sendFile(file, { root: __dirname });
  return image;
});

app.delete("/uploads/:bin", (req, res) => {
  const bin = req.params.bin;
  try {
    fs.unlinkSync("./uploads/" + bin);
    res.status(200).send("Deleted");
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

app.get("/default/avatar", (req, res) => {
  res.sendFile("./profile.png", { root: __dirname });
});

app.get("/default/path", (req, res) => {
  res.sendFile("./making-offer-house.jpg", { root: __dirname });
});
app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static("./client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
