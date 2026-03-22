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

    console.log("Excel Loaded:", data.length);

  } catch (err) {
    alert("Excel file not found. Upload pmbi.xlsx.");
  }
}

loadExcelFromServer();

// START APP (ALLOW WITHOUT DETAILS)
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

// SEARCH
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

// DISPLAY
function displayProducts(items) {
  let html = "";

  items.slice(0, 50).forEach(item => {
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

// PLACE ORDER (BLOCK IF DETAILS MISSING)
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
