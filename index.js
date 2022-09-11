const connectToMongo = require("./db");
var cors = require("cors");
// var bodyParser = require('body-parser')


connectToMongo();

const express = require('express')
const app = express()
const port = 5000
// app.use(bodyParser.urlencoded({ extended: false }))  // for form-encode
app.use(cors());
// to use request.body we need to use below middileware
app.use(express.json());
// available routes
app.use("/api/user",require('./routes/user'));
app.use("/api/blog",require('./routes/blog'));
app.use("/api/welcome",require('./routes/welcome'));
app.use("/api/temple",require('./routes/temple'));




app.listen(port, () => {
    console.log(`mandhiram listening on port http://localhost:${port}`)
  })