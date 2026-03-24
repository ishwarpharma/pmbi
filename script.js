let data = [];
let cart = [];


// 📅 DATE FIX
function formatExcelDate(excelDate) {
  if (!excelDate) return "";

  if (typeof excelDate === "number") {
    let date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString("en-GB");
  }

  return excelDate;
}

// 💰 ROUND
function round2(num) {
  return Number(num).toFixed(2);
}


// 🚀 LOAD EXCEL
async function loadExcelFromServer() {
  try {
    const res = await fetch("pmbi.xlsx");
    const buffer = await res.arrayBuffer();

    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];

    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows = rows.filter(r => r.length > 3);
    rows.shift();

    data = rows.map(r => ({
      drug_code: r[1]?.toString().trim(),
      drug_name: r[2]?.toString().trim(),
      uom: r[3] || "",   // ✅ Pack column restored
      batch: r[4] || "",
      expiry: formatExcelDate(r[5]),
      qty: Number(r[6]) || 0,
      price: Number(r[8]) || 0,
      mrp: Number(r[9]) || 0
    }));

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


// ✨ MULTI WORD HIGHLIGHT
function highlight(text, query) {
  if (!text || !query) return text || "";

  let words = query.split(" ").filter(w => w);
  let result = text;

  words.forEach(word => {
    let escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex = new RegExp(`(${escaped})`, "gi");
    result = result.replace(regex, `<span class="highlight">$1</span>`);
  });

  return result;
}


// 🔍 SMART SEARCH (MULTI WORD + RANKING)
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase().trim();

  if (!query) return displayProducts(data);

  let words = query.split(" ").filter(w => w);

  let results = data.map(item => {
    let score = 0;

    let text = (item.drug_code + " " + item.drug_name).toLowerCase();

    words.forEach(word => {
      if (text.includes(word)) score += 2;
    });

    return { ...item, score };
  });

  results = results
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);

  displayProducts(results, query);
}


// 🔄 RESET
function resetSearch() {
  document.getElementById("search").value = "";
  displayProducts(data);
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
  let i = data.find(x => x.drug_code == code);

  let html = `
    <div class="product">

      <button class="back-btn" onclick="displayProducts(data)">⬅ Back</button>

      <b>${i.drug_name}</b><br><br>

      <b>Drug Code:</b> ${i.drug_code}<br>
      <b>Pack:</b> ${i.uom}<br>

      <b>Batch:</b> ${i.batch}<br>
      <b>Expiry:</b> ${i.expiry}<br>

      <span style="color:red"><b>Stock:</b> ${i.qty}</span><br>
      <span style="color:green"><b>Rate:</b> ₹ ${round2(i.price)}</span><br>
      <b>MRP:</b> ₹ ${round2(i.mrp)}<br><br>

      <input type="number" id="qty" placeholder="Enter Qty"
        min="1" max="${i.qty}" oninput="calc(${i.price})">

      <div id="amt" style="margin-top:8px;font-weight:bold;"></div>

      <button onclick="add('${i.drug_code}')">Add to Cart</button>

    </div>
  `;

  document.getElementById("products").innerHTML = html;
}


// 💰 AMOUNT
function calc(price) {
  let q = document.getElementById("qty").value;

  if (!q) {
    document.getElementById("amt").innerHTML = "";
    return;
  }

  document.getElementById("amt").innerHTML =
    `Amount: ₹ ${round2(q * price)}`;
}


// 🛒 ADD
function add(code) {
  let i = data.find(x => x.drug_code == code);
  let q = parseInt(document.getElementById("qty").value);

  if (!q) return alert("Enter qty");
  if (q > i.qty) return alert("Exceeds stock");

  let existing = cart.find(x => x.drug_code == code);

  if (existing) existing.order_qty += q;
  else cart.push({ ...i, order_qty: q });

  alert("✅ Added to cart");
}


// 👁 VIEW CART
function openCart() {
  let html = `<div class="product">
    <button class="back-btn" onclick="closeCart()">⬅ Back</button><br><br>`;

  let total = 0;

  cart.forEach((i, idx) => {
    let val = i.order_qty * i.price;
    total += val;

    html += `
      <div class="cart-item">
        <b>${i.drug_name}</b><br>

        Qty:
        <input type="number" value="${i.order_qty}" 
          onchange="edit(${idx}, this.value)">

        × ₹ ${round2(i.price)} = 
        <b>₹ ${round2(val)}</b>

        <span onclick="del(${idx})" style="color:red; float:right; cursor:pointer;">❌</span>
      </div><hr>
    `;
  });

  html += `<b>Total: ₹ ${round2(total)}</b><br><br>`;
  html += `<button onclick="place()">Place Order</button></div>`;

  document.getElementById("products").innerHTML = html;
}


// ✏️ EDIT
function edit(index, qty) {
  if (qty <= 0) return;
  cart[index].order_qty = parseInt(qty);
  openCart();
}


// ❌ DELETE
function del(index) {
  cart.splice(index, 1);
  openCart();
}


// ❌ CLOSE CART
function closeCart() {
  displayProducts(data);
}


// 📲 ORDER
function place() {
  let msg = "🧾 PMBI ORDER\n\n";
  let total = 0;

  cart.forEach((i, idx) => {
    let val = i.order_qty * i.price;
    total += val;

    msg += `${idx+1}. ${i.drug_name}
Qty: ${i.order_qty}
Pack: ${i.uom}
Value: ₹ ${round2(val)}

`;
  });

  msg += `Total: ₹ ${round2(total)}`;

  window.open(`https://wa.me/919324824900?text=${encodeURIComponent(msg)}`);
}
