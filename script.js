let data = [];
let cart = [];

// 🚀 LOAD EXCEL
async function loadExcelFromServer() {
  try {
    const response = await fetch("pmbi.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    // 🔥 CLEAN + SAFE MAPPING
    data = json.map(row => {
      let cleaned = {};

      Object.keys(row).forEach(key => {
        cleaned[key.trim().toLowerCase()] = row[key];
      });

      return {
        drug_code: cleaned["drug code"]?.toString().trim() || "",
        drug_name: cleaned["drug name"]?.toString().trim() || "",
        uom: cleaned["uom name"] || "",
        batch: cleaned["batch no"] || "",
        expiry: cleaned["exp date"] || "",
        qty: Number(cleaned["qty"]) || 0,
        price: Number(cleaned["sales rate"]) || 0,
        mrp: Number(cleaned["mrp"]) || 0
      };
    });

    // SORT
    data.sort((a, b) => (a.drug_code || "").localeCompare(b.drug_code || ""));

    console.log("✅ Loaded:", data.length);

    displayProducts(data);

  } catch (err) {
    alert("❌ Excel file not found. Upload pmbi.xlsx in repo.");
    console.error(err);
  }
}

loadExcelFromServer();


// 🚀 START APP
function startApp() {
  let store = document.getElementById("storeCode").value;
  let city = document.getElementById("city").value;
  let mobile = document.getElementById("mobile").value;

  if (!store || !city || !mobile) {
    alert("⚠️ You can browse, but order will NOT be processed without full details.");
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
}


// 🔍 SEARCH
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase();

  if (!query) {
    displayProducts(data);
    return;
  }

  let results = data.map(item => {
    let score = 0;

    if (item.drug_code.toLowerCase().includes(query)) score += 2;
    if (item.drug_name.toLowerCase().includes(query)) score += 3;

    return { ...item, score };
  });

  results = results
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  displayProducts(results, query);
}


// ✨ HIGHLIGHT (FIXED)
function highlight(text, query) {
  if (!text) return "";

  let regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}


// 📦 LIST VIEW (FIXED BLANK ROWS)
function displayProducts(items, query = "") {
  let html = "";

  items.slice(0, 100).forEach(item => {

    // 🔥 FIX: skip invalid rows
    if (!item.drug_code || !item.drug_name) return;

    html += `
      <div class="product" onclick="showDetails('${item.drug_code}')">
        <b>${highlight(item.drug_code, query)}</b> - 
        ${highlight(item.drug_name, query)}
      </div>
    `;
  });

  document.getElementById("products").innerHTML = html;
}


// 📄 DETAIL VIEW (FIXED BACK BUTTON + STOCK)
function showDetails(code) {
  let item = data.find(i => i.drug_code == code);
  if (!item) return;

  let html = `
    <div class="product">

      <button class="back-btn" onclick="displayProducts(data)">⬅ Back</button>

      <b>${item.drug_name}</b><br><br>

      <b>Drug Code:</b> ${item.drug_code}<br>
      <b>Drug Name:</b> ${item.drug_name}<br>
      <b>UOM:</b> ${item.uom}<br>
      <b>Batch No:</b> ${item.batch}<br>
      <b>Exp Date:</b> ${item.expiry}<br>
      <b>Stock (QTY):</b> ${item.qty}<br>
      <b>Sales Rate:</b> ₹${item.price}<br>
      <b>MRP:</b> ₹${item.mrp}<br><br>

      <input type="number" id="orderQty" placeholder="Enter Qty"
      min="1" max="${item.qty}" oninput="calculateAmount(${item.price})">

      <div id="amountBox" style="margin-top:8px; font-weight:bold;"></div>

      <button onclick="addDetailToCart('${item.drug_code}')"
        ${item.qty === 0 ? "disabled" : ""}>
        ${item.qty === 0 ? "Out of Stock" : "Add to Cart"}
      </button>

    </div>
  `;

  document.getElementById("products").innerHTML = html;
}


// 💰 CALCULATE AMOUNT
function calculateAmount(price) {
  let qty = document.getElementById("orderQty").value;

  if (!qty) {
    document.getElementById("amountBox").innerHTML = "";
    return;
  }

  let amount = qty * price;
  document.getElementById("amountBox").innerHTML = `Amount: ₹${amount}`;
}


// 🛒 ADD TO CART
function addDetailToCart(code) {
  let item = data.find(i => i.drug_code == code);
  let qty = parseInt(document.getElementById("orderQty").value);

  if (!qty) return alert("Enter quantity");

  if (qty > item.qty) {
    return alert("❌ Order qty cannot exceed stock");
  }

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
    html += `${i+1}. ${item.drug_name} × ${item.order_qty}<br>`;
  });

  document.getElementById("cartItems").innerHTML = html;
}


// 📲 PLACE ORDER
function placeOrder() {
  let store = document.getElementById("storeCode").value;
  let city = document.getElementById("city").value;
  let mobile = document.getElementById("mobile").value;

  if (!store || !city || !mobile) {
    alert("❌ Please fill Store Code, City, and Mobile before placing order.");
    return;
  }

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
