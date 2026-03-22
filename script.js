let data = [];
let cart = [];

fetch('data.json')
  .then(res => res.json())
  .then(json => data = json);

// START APP
function startApp() {
  let store = document.getElementById("storeCode").value;
  let mobile = document.getElementById("mobile").value;

  if (!store || !mobile) {
    alert("Please fill details");
    return;
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
}

// SEARCH
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase();

  let results = data.filter(item =>
    item.drug_code.toLowerCase() === query ||
    item.drug_name.toLowerCase().includes(query)
  );

  displayProducts(results);
}

// DISPLAY PRODUCTS
function displayProducts(items) {
  let html = "";

  items.forEach(item => {
    html += `
      <div class="product">
        <b>${item.drug_name}</b><br>
        Code: ${item.drug_code}<br>
        Batch: ${item.batch}<br>
        Expiry: ${item.expiry}<br>
        Stock: ${item.qty}<br>
        Price: ₹${item.price}<br><br>

        <input type="number" placeholder="Qty" id="qty-${item.drug_code}">
        <button onclick="addToCart('${item.drug_code}')">Add</button>
      </div>
    `;
  });

  document.getElementById("products").innerHTML = html;
}

// ADD TO CART
function addToCart(code) {
  let item = data.find(i => i.drug_code === code);
  let qty = document.getElementById(`qty-${code}`).value;

  if (!qty) return alert("Enter qty");

  cart.push({ ...item, order_qty: qty });

  updateCart();
}

// UPDATE CART
function updateCart() {
  let html = "";

  cart.forEach(item => {
    html += `<div class="cart-item">${item.drug_name} x ${item.order_qty}</div>`;
  });

  document.getElementById("cartItems").innerHTML = html;
}

// PLACE ORDER
function placeOrder() {
  let store = document.getElementById("storeCode").value;
  let city = document.getElementById("city").value;
  let mobile = document.getElementById("mobile").value;

  let message = `PMBI ORDER\nStore: ${store}\nCity: ${city}\nMobile: ${mobile}\n\n`;

  cart.forEach(item => {
    message += `${item.drug_name} - ${item.order_qty}\n`;
  });

  let url = `https://wa.me/919324824900?text=${encodeURIComponent(message)}`;
  window.open(url);
}
