let data = [];
let cart = [];


// 📅 FORMAT DATE
function formatExcelDate(excelDate) {
  if (!excelDate) return "";

  if (typeof excelDate === "number") {
    let date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString("en-GB");
  }

  return excelDate;
}


// 🚀 LOAD EXCEL
async function loadExcelFromServer() {
  try {
    const response = await fetch("pmbi.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows = rows.filter(r => r.length > 3);
    rows.shift();

    data = rows.map(r => ({
      drug_code: r[1]?.toString().trim(),
      drug_name: r[2]?.toString().trim(),
      uom: "Pack",
      batch: r[4] || "",
      expiry: formatExcelDate(r[5]),
      qty: Number(r[6]) || 0,
      price: Number(r[8]) || 0,
      mrp: Number(r[9]) || 0
    }));

    data.sort((a, b) => (a.drug_code || "").localeCompare(b.drug_code || ""));

    displayProducts(data);

  } catch (err) {
    alert("❌ Excel file not found.");
    console.error(err);
  }
}

loadExcelFromServer();


// 🚀 START
function startApp() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
}


// 🔍 SEARCH
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase();

  if (!query) return displayProducts(data);

  let results = data
    .map(item => {
      let score = 0;
      if (item.drug_code?.toLowerCase().includes(query)) score += 2;
      if (item.drug_name?.toLowerCase().includes(query)) score += 3;
      return { ...item, score };
    })
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);

  displayProducts(results, query);
}


// ✨ HIGHLIGHT
function highlight(text, query) {
  if (!text || !query) return text || "";
  return text.replace(new RegExp(`(${query})`, "gi"),
    `<span class="highlight">$1</span>`);
}


// 📦 LIST VIEW
function displayProducts(items, query = "") {
  let html = "";

  items.slice(0, 100).forEach(item => {
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


// 📄 DETAILS
function showDetails(code) {
  let item = data.find(i => i.drug_code == code);

  let html = `
    <div class="product">

      <button class="back-btn" onclick="displayProducts(data)">⬅ Back</button>

      <b>${item.drug_name}</b><br><br>

      <b>Drug Code:</b> ${item.drug_code}<br>
      <b>Pack:</b> ${item.uom}<br>
      <b>Batch:</b> ${item.batch}<br>
      <b>Expiry:</b> ${item.expiry}<br>

      <b style="color:#d9534f">Stock:</b> 
      <span style="color:#d9534f">${item.qty}</span><br>

      <b style="color:#28a745">Rate:</b> 
      <span style="color:#28a745">₹ ${item.price}</span><br>

      <b>MRP:</b> ₹ ${item.mrp}<br><br>

      <input type="number" id="orderQty" placeholder="Enter Qty"
        min="1" max="${item.qty}" oninput="calculateAmount(${item.price})">

      <div id="amountBox" style="margin-top:8px;font-weight:bold;"></div>

      <button onclick="addDetailToCart('${item.drug_code}')">
        Add to Cart
      </button>

    </div>
  `;

  document.getElementById("products").innerHTML = html;
}


// 💰 AMOUNT
function calculateAmount(price) {
  let qty = document.getElementById("orderQty").value;
  if (!qty) return document.getElementById("amountBox").innerHTML = "";

  document.getElementById("amountBox").innerHTML =
    `Amount: ₹ ${qty * price}`;
}


// 🛒 ADD (MERGE IF EXISTS)
function addDetailToCart(code) {
  let item = data.find(i => i.drug_code == code);
  let qty = parseInt(document.getElementById("orderQty").value);

  if (!qty) return alert("Enter qty");
  if (qty > item.qty) return alert("Qty exceeds stock");

  let existing = cart.find(i => i.drug_code == code);

  if (existing) {
    existing.order_qty += qty;
  } else {
    cart.push({ ...item, order_qty: qty });
  }

  updateCart();
}


// ✏️ UPDATE QTY
function updateQty(index, newQty) {
  let item = cart[index];

  if (newQty <= 0) return;
  if (newQty > item.qty) return alert("Exceeds stock");

  item.order_qty = parseInt(newQty);

  updateCart();
}


// ❌ REMOVE ITEM
function removeItem(index) {
  cart.splice(index, 1);
  updateCart();
}


// 🧾 CART UI (EDIT + REMOVE + TOTAL)
function updateCart() {
  let html = "";
  let total = 0;

  cart.forEach((item, i) => {
    let value = item.order_qty * item.price;
    total += value;

    html += `
      <div class="cart-item">

        <b>${item.drug_name}</b><br>

        Qty:
        <input type="number" value="${item.order_qty}" 
          min="1" max="${item.qty}"
          onchange="updateQty(${i}, this.value)"
          style="width:60px; margin:5px;">

        × ₹ ${item.price} = 
        <b>₹ ${value.toFixed(2)}</b>

        <span onclick="removeItem(${i})"
          style="color:red; font-weight:bold; float:right; cursor:pointer;">
          ❌
        </span>

      </div>
    `;
  });

  html += `<hr><b>Total: ₹ ${total.toFixed(2)}</b>`;

  document.getElementById("cartItems").innerHTML = html;
}


// 📲 PLACE ORDER
function placeOrder() {
  if (cart.length === 0) return alert("Cart empty");

  let message = "🧾 PMBI ORDER\n\n";
  let total = 0;

  cart.forEach((item, i) => {
    let value = item.order_qty * item.price;
    total += value;

    message += `${i+1}. ${item.drug_name}
Qty: ${item.order_qty}
Rate: ₹ ${item.price}
Value: ₹ ${value}

`;
  });

  message += `Total: ₹ ${total}`;

  window.open(`https://wa.me/919324824900?text=${encodeURIComponent(message)}`);
}
