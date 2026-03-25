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
    uom: r[3] || "",
    batch: r[4] || "",
    expiry: formatExcelDate(r[5]),
    qty: Number(r[6]) || 0,
    price: Number(r[8]) || 0,
    mrp: Number(r[9]) || 0
  }));

  displayProducts(data);
}

loadExcelFromServer();


// 🚀 START
function startApp() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
}


// ✨ HIGHLIGHT
function highlight(text, query) {
  if (!text || !query) return text;

  let words = query.split(" ").filter(w => w.length > 1);
  let result = text;

  words.forEach(word => {
    let regex = new RegExp(word, "gi");
    result = result.replace(regex, m => `<span class="highlight">${m}</span>`);
  });

  return result;
}


// 🔍 SEARCH
function searchProducts() {
  let q = document.getElementById("search").value.toLowerCase().trim();

  if (!q) return displayProducts(data);

  let words = q.split(" ").filter(w => w.length > 1);

  let res = data.map(item => {
    let score = 0;
    let text = (item.drug_code + " " + item.drug_name).toLowerCase();

    words.forEach(w => {
      if (text.includes(w)) score += 2;
    });

    return { ...item, score };
  });

  res = res.filter(i => i.score > 0).sort((a, b) => b.score - a.score);

  displayProducts(res, q);
}


// 🔄 RESET
function resetSearch() {
  document.getElementById("search").value = "";
  displayProducts(data);
}


// 📦 LIST
function displayProducts(items, query = "") {
  let html = "";

  items.slice(0, 100).forEach(i => {
    if (!i.drug_code) return;

    html += `
      <div class="product" onclick="showDetails('${i.drug_code}')">
        ${highlight(i.drug_code, query)} - 
        ${highlight(i.drug_name, query)}
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

      Code: ${i.drug_code}<br>
      Pack: ${i.uom}<br>
      Batch: ${i.batch}<br>
      Expiry: ${i.expiry}<br>

      <span style="color:red">Stock: ${i.qty}</span><br>
      <span style="color:green">Rate: ₹ ${round2(i.price)}</span><br><br>

      <input type="number" inputmode="numeric" id="qty"
        placeholder="Enter Qty" min="1" max="${i.qty}"
        oninput="calc(${i.price})">

      <div id="amt"></div>

      <button onclick="add('${i.drug_code}')">Add to Cart</button>

    </div>
  `;

  document.getElementById("products").innerHTML = html;
}


// 💰 AMOUNT
function calc(price) {
  let q = document.getElementById("qty").value;
  if (!q) return document.getElementById("amt").innerHTML = "";

  document.getElementById("amt").innerHTML =
    `Amount: ₹ ${round2(q * price)}`;
}


// 🛒 ADD
function add(code) {
  let i = data.find(x => x.drug_code == code);
  let q = parseInt(document.getElementById("qty").value);

  if (!q) return alert("Enter qty");

  let e = cart.find(x => x.drug_code == code);

  if (e) e.order_qty += q;
  else cart.push({ ...i, order_qty: q });

  alert("Added");
}


// 👁 CART
function openCart() {
  let html = `<div class="product">
    <button onclick="closeCart()">⬅ Back</button><br><br>`;

  let total = 0;

  cart.forEach((i, idx) => {
    let val = i.order_qty * i.price;
    total += val;

    html += `
      ${i.drug_name}<br>
      Qty: <input value="${i.order_qty}" type="number"
      onchange="edit(${idx}, this.value)">
      ₹ ${round2(val)}
      <span onclick="del(${idx})">❌</span><hr>
    `;
  });

  html += `<b>Total: ₹ ${round2(total)}</b><br><br>`;
  html += `<button onclick="showOrderOptions()">Place Order</button>`;

  document.getElementById("products").innerHTML = html;
}


// ❌ DELETE
function del(i) {
  cart.splice(i, 1);
  openCart();
}


// ✏️ EDIT
function edit(i, q) {
  cart[i].order_qty = parseInt(q);
  openCart();
}


// 📦 ORDER OPTIONS SCREEN
function showOrderOptions() {
  let html = `
    <div class="product">

      <button onclick="closeCart()">⬅ Back</button><br><br>

      <h3>Select Order Method</h3>

      <button onclick="downloadExcel()">📥 Download Excel</button><br><br>

      <button onclick="sendWhatsApp()">📲 Send via WhatsApp</button><br><br>

      <button onclick="sendEmail()">📧 Send via Email</button>

    </div>
  `;

  document.getElementById("products").innerHTML = html;
}


// 📥 DOWNLOAD EXCEL
function downloadExcel() {
  let sheetData = [["SAP Code","Item","Qty","Rate","Amount","Batch","Expiry"]];

  cart.forEach(i => {
    sheetData.push([
      i.drug_code,
      i.drug_name,
      i.order_qty,
      i.price,
      round2(i.order_qty * i.price),
      i.batch,
      i.expiry
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order");

  XLSX.writeFile(wb, "PMBI_Order.xlsx");
}


// 📲 WHATSAPP
function sendWhatsApp() {
  let store = document.getElementById("storeCode").value;
  let city = document.getElementById("city").value;
  let mobile = document.getElementById("mobile").value;

  let msg = `PMBI ORDER\nStore: ${store}\nCity: ${city}\nMobile: ${mobile}\n\n`;

  cart.forEach((i, idx) => {
    msg += `${i.drug_name} (${i.drug_code})\nQty: ${i.order_qty}\n\n`;
  });

  window.open(`https://wa.me/919324824900?text=${encodeURIComponent(msg)}`);
}


// 📧 EMAIL
function sendEmail() {
  let msg = "PMBI Order Attached";
  window.location.href = `mailto:?subject=PMBI Order&body=${encodeURIComponent(msg)}`;
}


// ❌ CLOSE
function closeCart() {
  displayProducts(data);
}
