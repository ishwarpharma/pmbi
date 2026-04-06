const DATA_URL = "SWSA.csv";

let fullData=[], filteredData=[], currentUser, chartInstance;
let selectedParty="", selectedItem="";

const formatK = v => Math.round(v/1000)+"K";

// LOGIN
function login(){
  const u=username.value.trim();
  const p=password.value.trim();
  const user=USERS.find(x=>x.username===u && x.password===p);
  if(!user) return alert("Invalid Login");
  localStorage.setItem("user",JSON.stringify(user));
  init();
}

// INIT
async function init(){
  currentUser=JSON.parse(localStorage.getItem("user"));
  loginPage.style.display="none";
  dashboard.style.display="block";

  dashboardTitle.innerText=currentUser.companies.join(" + ")+" DASHBOARD";

  fullData=await loadData();
  populateArea();
  applyFilters();

  partySearch.oninput=()=>showDropdown("party");
  itemSearch.oninput=()=>showDropdown("item");

  document.addEventListener("click",()=>hideDropdowns());
}

// LOAD
async function loadData(){
  const t=await (await fetch(DATA_URL)).text();
  let [h,...rows]=t.split("\n").map(r=>r.split(","));
  return rows.map(r=>{
    let o={}; h.forEach((x,i)=>o[x.trim()]=r[i]); return o;
  });
}

// FILTER
function applyFilters(){
  filteredData=fullData.filter(d=>{
    if(!currentUser.companies.includes(d["Company Name"])) return false;
    if(selectedParty && d["Party Name"]!==selectedParty) return false;
    if(selectedItem && d["Item Name"]!==selectedItem) return false;
    return true;
  });
  render();
}

// DROPDOWN
function showDropdown(type){
  let input=(type==="party"?partySearch:itemSearch).value.toLowerCase();
  let key=type==="party"?"Party Name":"Item Name";
  let box=document.getElementById(type+"Dropdown");

  let list=[...new Set(fullData.map(d=>d[key]).filter(Boolean))];

  let filtered=list.filter(n=>
    input.split(" ").every(w=>n.toLowerCase().includes(w))
  ).slice(0,10);

  box.innerHTML=filtered.map(n=>
    `<div onclick="select('${type}','${n}')">${highlight(n,input)}</div>`
  ).join("");

  box.style.display=filtered.length?"block":"none";
}

// SELECT FROM DROPDOWN
function select(type,val){
  if(type==="party"){selectedParty=val; partySearch.value=val;}
  if(type==="item"){selectedItem=val; itemSearch.value=val;}
  hideDropdowns();
  applyFilters();
}

// CLICK FROM TABLE 🔥
function selectFromTable(type,val){
  if(type==="party"){
    selectedParty=val;
    partySearch.value=val;
  }
  if(type==="item"){
    selectedItem=val;
    itemSearch.value=val;
  }
  applyFilters();
}

// HIDE
function hideDropdowns(){
  document.querySelectorAll(".dropdown").forEach(d=>d.style.display="none");
}

// RESET
function resetParty(){selectedParty=""; partySearch.value=""; applyFilters();}
function resetItem(){selectedItem=""; itemSearch.value=""; applyFilters();}

// HIGHLIGHT
function highlight(t,s){
  if(!s) return t;
  return t.replace(new RegExp(`(${s})`,"gi"),"<span style='background:yellow'>$1</span>");
}

// AREA
function populateArea(){
  let a=[...new Set(fullData.map(d=>d["Area Name"]))];
  area.innerHTML=`<option value="">All Areas</option>`+a.map(x=>`<option>${x}</option>`).join("");
}

// RENDER
function render(){
  let total=filteredData.reduce((s,d)=>s+Number(d["Amount"]||0),0);
  totalSales.innerText="Total Sales ₹ "+formatK(total);

  drawChart();
  drawTables();
}

// CHART
function drawChart(){
  let map={};
  filteredData.forEach(d=>{
    let dt=new Date(d["Date"].split("-").reverse().join("-"));
    let k=dt.getFullYear()+"-"+(dt.getMonth()+1);
    map[k]=(map[k]||0)+Number(d["Amount"]||0);
  });

  let keys=Object.keys(map).sort((a,b)=>new Date(a)-new Date(b));

  if(chartInstance) chartInstance.destroy();

  chartInstance=new Chart(monthChart,{
    type:"bar",
    data:{
      labels:keys,
      datasets:[{data:keys.map(k=>map[k])}]
    }
  });
}

// TABLES (CLICK ENABLED 🔥)
function drawTables(){

  let partyMap={}, itemMap={};

  filteredData.forEach(d=>{
    let p=d["Party Name"], i=d["Item Name"], a=Number(d["Amount"]||0);
    partyMap[p]=(partyMap[p]||0)+a;
    itemMap[i]=(itemMap[i]||0)+a;
  });

  let partyList=Object.entries(partyMap).sort((a,b)=>b[1]-a[1]);
  let itemList=Object.entries(itemMap).sort((a,b)=>b[1]-a[1]);

  partyPreview.innerHTML = partyList.map((p,i)=>
    `<div class="row" onclick="selectFromTable('party','${p[0]}')">
      <span>${i+1}</span>
      <span>${p[0]}</span>
      <span>₹ ${formatK(p[1])}</span>
    </div>`
  ).join("");

  itemPreview.innerHTML = itemList.map((i,x)=>
    `<div class="row" onclick="selectFromTable('item','${i[0]}')">
      <span>${x+1}</span>
      <span>${i[0]}</span>
      <span>₹ ${formatK(i[1])}</span>
    </div>`
  ).join("");
}

if(localStorage.getItem("user")) init();
