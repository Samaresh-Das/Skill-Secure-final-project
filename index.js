const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const port = 8000;
var session = require("express-session");

mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "node project",
});

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret" }));

function isProductInCart(cart, id) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }

  return false;
}

function calculateTotal(cart, req) {
  total = 0;
  for (let i = 0; i < cart.length; i++) {
    //if we're offering a discounted price
    if (cart[i].sale_price) {
      total = total + cart[i].sale_price * cart[i].quantity;
    } else {
      total = total + cart[i].price * cart[i].quantity;
    }
  }
  req.session.total = total;
  return total;
}

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

app.get("/cart", function (req, res) {
  var cart = req.session.cart;
  var total = req.session.total;

  res.render("pages/cart", { cart, total });
});

app.post("/add_to_cart", function (req, res) {
  const { id, name, price, sale_price, quantity, image } = req.body;
  var product = {
    id: id,
    name: name,
    price: price,
    sale_price: sale_price,
    quantity: quantity,
    image: image,
  };

  if (req.session.cart) {
    var cart = req.session.cart;

    if (!isProductInCart(cart, id)) {
      cart.push(product);
    }
  } else {
    req.session.cart = [product];
    var cart = req.session.cart;
  }
  //calculate total
  calculateTotal(cart, req);

  //return to cart page
  res.redirect("/cart");
});

app.post("/remove_product", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(cart.indexOf(i), 1);
    }
  }

  //re-calculate
  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.post("/edit_product_quantity", (req, res) => {
  const {
    id,
    quantity,
    increase_product_quantity: increase_btn,
    decrease_product_quantity: decrease_btn,
  } = req.body;

  const cart = req.session.cart;

  if (increase_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 0) {
          cart[i].quantity = parseInt(cart[i].quantity) + 1;
        }
      }
    }
  }

  if (decrease_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 1) {
          cart[i].quantity = parseInt(cart[i].quantity) - 1;
        }
      }
    }
  }
  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.get("/checkout", (req, res) => {
  const total = req.session.total;
  res.render("pages/checkout", { total });
});

app.post("/place_order", (req, res) => {
  const { name, email, phone, city, address } = req.body;
  const cost = req.session.total;
  const status = "not paid";
  const date = new Date();
  let products_ids = "";

  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node project",
  });

  let cart = req.session.cart;
  for (let i = 0; i < cart.length; i++) {
    products_ids = products_ids + "," + cart[i].id;
  }

  con.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      const query =
        "INSERT INTO orders(cost, name, email, status, city, address, phone, date, products_ids) VALUES ?";
      const values = [
        [cost, name, email, status, city, address, phone, date, products_ids],
      ];
      con.query(query, [values], (err, result) => {
        for (let i = 0; i < cart.length; i++) {
          const query =
            "INSERT INTO order_items (order_id,product_id,product_name,product_price,product_image,product_quantity,order_date) VALUES ?";
          const values = [
            [
              id,
              cart[i].id,
              cart[i].name,
              cart[i].price,
              cart[i].image,
              cart[i].quantity,
              new Date(),
            ],
          ];
          con.query(query, [values], (err, result) => {});
        }
        res.redirect("/payment");
      });
    }
  });
});

app.get("/payment", (req, res) => {
  const total = req.session.total
  res.render("pages/payment", {total});
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
