const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const path = require("path");
const port = 8000

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
   let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node project",
  });

  con.query("SELECT * FROM products", (err, result) => {
    res.render("pages/index", { result });
  });
});

app.listen(port , () => {
  console.log(`Server listening on ${port}`)
});

