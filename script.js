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


// 🔍 SEARCH
function searchProducts() {
  let q = document.getElementById("search").value.toLowerCase();

  if (!q) return displayProducts(data);

  let res = data.filter(i =>
    i.drug_code?.toLowerCase().includes(q) ||
    i.drug_name?.toLowerCase().includes(q)
  );

  displayProducts(res, q);
}


// 🔄 RESET SEARCH
function resetSearch() {
  document.getElementById("search").value = "";
  displayProducts(data);
}


// 📦 LIST
function displayProducts(items, q = "") {
  let html = "";

  items.slice(0, 100).forEach(i => {
    if (!i.drug_code || !i.drug_name) return;

    html += `
      <div class="product" onclick="showDetails('${i.drug_code}')">
        <b>${i.drug_code}</b> - ${i.drug_name}
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

      Drug Code: ${i.drug_code}<br>
      Batch: ${i.batch}<br>
      Expiry: ${i.expiry}<br>

      <span style="color:red">Stock: ${i.qty}</span><br>
      <span style="color:green">Rate: ₹ ${round2(i.price)}</span><br>
      MRP: ₹ ${round2(i.mrp)}<br><br>

      <input type="number" id="qty" placeholder="Enter Qty"
        min="1" max="${i.qty}" oninput="calc(${i.price})">

      <div id="amt"></div>

      <button onclick="add('${i.drug_code}')">Add</button>

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
  if (q > i.qty) return alert("Exceeds stock");

  let e = cart.find(x => x.drug_code == code);

  if (e) e.order_qty += q;
  else cart.push({ ...i, order_qty: q });

  alert("Added to cart");
}


// 👁 VIEW CART
function openCart() {
  let html = `<div class="product"><button onclick="closeCart()">Close</button><br><br>`;

  let total = 0;

  cart.forEach((i, idx) => {
    let val = i.order_qty * i.price;
    total += val;

    html += `
      <div>
        <b>${i.drug_name}</b><br>

        Qty:
        <input value="${i.order_qty}" type="number"
          onchange="edit(${idx}, this.value)">

        × ₹ ${round2(i.price)} = ₹ ${round2(val)}

        <span onclick="del(${idx})" style="color:red">❌</span>
      </div><hr>
    `;
  });

  html += `<b>Total: ₹ ${round2(total)}</b><br><br>`;
  html += `<button onclick="place()">Place Order</button></div>`;

  document.getElementById("products").innerHTML = html;
}


// ❌ DELETE
function del(i) {
  cart.splice(i, 1);
  openCart();
}


// ✏️ EDIT
function edit(i, q) {
  if (q <= 0) return;
  cart[i].order_qty = parseInt(q);
  openCart();
}


// ❌ CLOSE CART
function closeCart() {
  displayProducts(data);
}


// 📲 ORDER
function place() {
  let msg = "PMBI ORDER\n\n";
  let total = 0;

  cart.forEach((i, idx) => {
    let val = i.order_qty * i.price;
    total += val;

    msg += `${idx+1}. ${i.drug_name}
Qty: ${i.order_qty}
Value: ₹ ${round2(val)}

`;
  });

  msg += `Total: ₹ ${round2(total)}`;

  window.open(`https://wa.me/919324824900?text=${encodeURIComponent(msg)}`);
}
