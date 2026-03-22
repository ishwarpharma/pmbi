let data = [];
let cart = [];

// LOAD EXCEL
async function loadExcelFromServer() {
  try {
    const response = await fetch("pmbi.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    // SAFE MAPPING
    data = json.map(row => {
      const keys = Object.keys(row);

      const get = (name) => {
        let key = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
        return key ? row[key] : "";
      };

      return {
        drug_code: get("Drug Code")?.toString().trim(),
        drug_name: get("Drug Name")?.toString().trim(),
        batch: get("Batch No"),
        expiry: get("Exp Date"),
        qty: Number(get("QTY")) || 0,
        price: Number(get("Sales Rate")) || 0
      };
    });

    // 🔥 SORT BY DRUG CODE
    data.sort((a, b) => (a.drug_code || "").localeCompare(b.drug_code || ""));

    console.log("Loaded:", data.length);

    // 👉 SHOW ALL BY DEFAULT
    displayProducts(data);

  } catch (err) {
    alert("Excel file not found. Upload pmbi.xlsx.");
  }
}

loadExcelFromServer();


// START APP
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


// 🔍 SEARCH WITH RANKING + HIGHLIGHT
function searchProducts() {
  let query = document.getElementById("search").value.toLowerCase();

  if (!query) {
    displayProducts(data);
    return;
  }

  let results = data.map(item => {
    let score = 0;

    if (item.drug_code?.toLowerCase().includes(query)) score += 2;
    if (item.drug_name?.toLowerCase().includes(query)) score += 3;

    return { ...item, score };
  });

  // FILTER + SORT BY BEST MATCH
  results = results
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  displayProducts(results, query);
}


// ✨ HIGHLIGHT FUNCTION
function highlight(text, query) {
  if (!text) return "";

  let regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, `<span style="background:yellow">$1</span>`);
}


// DISPLAY PRODUCTS
function displayProducts(items, query = "") {
  let html = "";

  items.slice(0, 100).forEach(item => {
    html += `
      <div class="product">
        <b>${highlight(item.drug_name, query)}</b><br>
        Code: ${highlight(item.drug_code, query)}<br>
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


// UPDATE CART
function updateCart() {
  let html = "";

  cart.forEach((item, i) => {
    html += `${i+1}. ${item.drug_name} × ${item.order_qty}<br>`;
  });

  document.getElementById("cartItems").innerHTML = html;
}


// PLACE ORDER
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
