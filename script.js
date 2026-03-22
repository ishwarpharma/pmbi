let data = [];
let cart = [];

// 🚀 LOAD EXCEL AUTOMATICALLY FROM GITHUB
async function loadExcelFromServer() {
  try {
    const response = await fetch("pmbi.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    // ✅ EXACT MAPPING BASED ON YOUR FILE
    data = json.map(row => ({
      drug_code: row["Drug Code"]?.toString().trim(),
      drug_name: row["Drug Name"]?.toString().trim(),
      batch: row["Batch No"]?.toString().trim(),
      expiry: row["Exp Date"]?.toString().trim(),
      qty: Number(row["QTY"]) || 0,
      price: Number(row["Sales Rate"]) || 0
    }));

    console.log("✅ Excel Loaded:", data.length, "items");

  } catch (error) {
    alert("Error loading Excel file. Make sure pmbi.xlsx is uploaded.");
    console.error(error);
  }
}

// Load automatically
loadExcelFromServer();


// 🚀 START APP
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


// 🔍 SEARCH (IMPROVED)
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase();

  if (!query) {
    document.getElementById("products").innerHTML = "";
    return;
  }

  let results = data.filter(item =>
    item.drug_code?.toLowerCase().includes(query) ||
    item.drug_name?.toLowerCase().includes(query)
  );

  displayProducts(results);
}


// 📦 DISPLAY PRODUCTS
function displayProducts(items) {
  let html = "";

  items.slice(0, 50).forEach(item => {  // limit for performance
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


// 🛒 ADD TO CART (FIXED DUPLICATES)
function addToCart(code) {
  let item = data.find(i => i.drug_code == code);
  let qty = parseInt(document.getElementById(`qty-${code}`).value);

  if (!qty) return alert("Enter qty");

  let existing = cart.find(i => i.drug_code == code);

  if (existing) {
    existing.order_qty += qty;
  } else {
    cart.push({ ...item, order_qty: qty });
  }

  updateCart();
}


// 🔄 UPDATE CART
function updateCart() {
  let html = "";

  cart.forEach((item, i) => {
    html += `
      <div class="cart-item">
        ${i+1}. ${item.drug_name} × ${item.order_qty}
      </div>
    `;
  });

  document.getElementById("cartItems").innerHTML = html;
}


// 📲 PLACE ORDER (CLEAN FORMAT)
function placeOrder() {
  let store = document.getElementById("storeCode").value;
  let city = document.getElementById("city").value;
  let mobile = document.getElementById("mobile").value;

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  let message = `🧾 PMBI ORDER\n\nStore: ${store}\nCity: ${city}\nMobile: ${mobile}\n\n`;

  cart.forEach((item, i) => {
    message += `${i+1}. ${item.drug_name}\nQty: ${item.order_qty}\n\n`;
  });

  let url = `https://wa.me/919324824900?text=${encodeURIComponent(message)}`;
  window.open(url);
}
