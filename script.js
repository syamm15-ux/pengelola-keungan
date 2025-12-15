class Transaction {
  constructor(type, amount, description) {
    this.type = type;                
    this.amount = amount;            
    this.description = description;  
    this.date = new Date().toLocaleString(); 
    this.timestamp = Date.now();     
  }
}
class BaseManager {
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  }
}

class FinanceManager extends BaseManager {
  constructor() {
    super(); 
    this.key = "data";
    this.transactions = this.load(this.key);
  }

  addTransaction(transaction) {
    this.transactions.push(transaction);
    this.save(this.key, this.transactions);
  }

  updateTransaction(index, transaction) {
    this.transactions[index] = transaction;
    this.save(this.key, this.transactions);
  }

  deleteTransaction(index) {
    this.transactions.splice(index, 1);
    this.save(this.key, this.transactions);
  }

  clearAll() {
    this.transactions = [];
    this.save(this.key, this.transactions);
  }

  getBalance() {
    return this.transactions.reduce((total, t) => {
      return total + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
  }

  getTotalIncome() {
    return this.transactions
      .filter(t => t.type === "income")
      .reduce((total, t) => total + t.amount, 0);
  }

  getTotalExpense() {
    return this.transactions
      .filter(t => t.type === "expense")
      .reduce((total, t) => total + t.amount, 0);
  }
}

const manager = new FinanceManager();

const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const list = document.getElementById("list");
const balance = document.getElementById("balance");
const addBtn = document.getElementById("addBtn");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");

const filterTypeSelect = document.getElementById("filterType");
const sortTypeSelect = document.getElementById("sortType");
const clearAllBtn = document.getElementById("clearAll");
const themeBtn = document.getElementById("toggleTheme");

const exportMonthSelect = document.getElementById("exportMonth");
const exportYearInput = document.getElementById("exportYear");
const exportPdfBtn = document.getElementById("exportPdfBtn");


let editingIndex = null;

function formatRupiah(num) {
  return "Rp" + num.toLocaleString("id-ID");
}

addBtn.onclick = () => {
  const desc = descInput.value.trim();
  const amount = parseInt(amountInput.value.replace(/\D/g, ""));
  const type = typeInput.value;

  if (!desc || isNaN(amount)) {
    alert("Harap isi deskripsi dan nominal dengan benar!");
    return;
  }

  const transaction = new Transaction(type, amount, desc);

  if (editingIndex === null) {
    
    manager.addTransaction(transaction);
  } else {
    
    transaction.timestamp =
      manager.transactions[editingIndex].timestamp || transaction.timestamp;

    manager.updateTransaction(editingIndex, transaction);
    editingIndex = null;
    addBtn.textContent = "Tambah";
    addBtn.classList.remove("editing");
  }
 
  descInput.value = "";
  amountInput.value = "";

  render();
};


function render() {
  list.innerHTML = "";

  
  const bal = manager.getBalance();
  balance.textContent = formatRupiah(bal);
  balance.style.color = bal >= 0 ? "black" : "red";

  
  const totalIncome = manager.getTotalIncome();
  const totalExpense = manager.getTotalExpense();
  if (totalIncomeEl) totalIncomeEl.textContent = formatRupiah(totalIncome);
  if (totalExpenseEl) totalExpenseEl.textContent = formatRupiah(totalExpense);

  const filterType = filterTypeSelect ? filterTypeSelect.value : "all";
  const sortType = sortTypeSelect ? sortTypeSelect.value : "date_desc";

  let items = manager.transactions.map((t, index) => ({
    ...t,
    originalIndex: index
  }));

  if (filterType !== "all") {
    items = items.filter(item => item.type === filterType);
  }

  items.sort((a, b) => {
    switch (sortType) {
      case "date_asc":
        return (a.timestamp || 0) - (b.timestamp || 0);
      case "date_desc":
        return (b.timestamp || 0) - (a.timestamp || 0);
      case "amount_asc":
        return a.amount - b.amount;
      case "amount_desc":
        return b.amount - a.amount;
      default:
        return 0;
    }
  });

  items.forEach(item => {
    const li = document.createElement("li");
    li.className = item.type === "expense" ? "expense" : "income";

    li.innerHTML = `
      <div class="item-main">
        <span>${item.description} - ${formatRupiah(item.amount)}</span>
        <small>${item.date}</small>
      </div>
      <div class="actions">
  <span class="edit-btn" title="Edit"
        onclick="startEdit(${item.originalIndex})">✏️</span>

  <span class="delete-btn" title="Hapus"
        onclick="deleteItem(${item.originalIndex})">🗑️</span>
</div>

      </div>
    `;

    list.appendChild(li);
  });
}

window.startEdit = function (index) {
  const t = manager.transactions[index];
  if (!t) return;

  descInput.value = t.description;
  amountInput.value = t.amount;
  typeInput.value = t.type;
  editingIndex = index;

  addBtn.textContent = "Simpan Perubahan";
  addBtn.classList.add("editing");
  descInput.focus();
};

window.deleteItem = function (index) {
  if (confirm("Yakin ingin menghapus transaksi ini?")) {
    manager.deleteTransaction(index);

    
    if (editingIndex === index) {
      editingIndex = null;
      addBtn.textContent = "Tambah";
      addBtn.classList.remove("editing");
    }

    render();
  }
};


if (filterTypeSelect) {
  filterTypeSelect.addEventListener("change", render);
}

if (sortTypeSelect) {
  sortTypeSelect.addEventListener("change", render);
}



if (themeBtn) {
  let savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️ Mode Terang";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      themeBtn.textContent = "☀️ Mode Terang";
      localStorage.setItem("theme", "dark");
    } else {
      themeBtn.textContent = "🌙 Mode Gelap";
      localStorage.setItem("theme", "light");
    }
  });
}
function exportPDF() {
  const month = exportMonthSelect.value;
  const year = exportYearInput.value;

  const filtered = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 == month &&
           date.getFullYear() == year;
  });

  if (filtered.length === 0) {
    alert("Tidak ada data pada bulan ini");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text(`Laporan Keuangan`, 14, 10);
  doc.text(`Bulan: ${month} / ${year}`, 14, 18);

  const tableData = filtered.map(t => [
    new Date(t.date).toLocaleDateString("id-ID"),
    t.desc,
    t.type === "income" ? "Pemasukan" : "Pengeluaran",
    formatRupiah(t.amount)
  ]);

  doc.autoTable({
    head: [["Tanggal", "Deskripsi", "Tipe", "Nominal"]],
    body: tableData,
    startY: 25
  });

  doc.save(`laporan-keuangan-${month}-${year}.pdf`);
}
if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", () => {
    const month = exportMonthSelect.value;
    const year = exportYearInput.value;

    if (!month || !year) {
      alert("Pilih bulan dan tahun terlebih dahulu!");
      return;
    }

    const filteredData = manager.transactions.filter(t => {
      const date = new Date(t.timestamp);
      return (
        date.getFullYear() == year &&
        date.getMonth() + 1 == parseInt(month)
      );
    });

    if (filteredData.length === 0) {
      alert("Tidak ada data pada periode tersebut.");
      return;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    filteredData.forEach(t => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    let reportHtml = `
      <h2 style="text-align:center;">Laporan Keuangan Bulanan</h2>
      <p><strong>Periode:</strong> ${month}/${year}</p>
      <hr>
      <table border="1" cellspacing="0" cellpadding="6" width="100%">
        <tr>
          <th>No</th>
          <th>Tanggal</th>
          <th>Deskripsi</th>
          <th>Tipe</th>
          <th>Nominal</th>
        </tr>
    `;

    filteredData.forEach((t, i) => {
      reportHtml += `
        <tr>
          <td>${i + 1}</td>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td>${t.type === "income" ? "Pemasukan" : "Pengeluaran"}</td>
          <td>${formatRupiah(t.amount)}</td>
        </tr>
      `;
    });

    reportHtml += `
        <tr>
          <td colspan="4"><strong>Total Pemasukan</strong></td>
          <td><strong>${formatRupiah(totalIncome)}</strong></td>
        </tr>
        <tr>
          <td colspan="4"><strong>Total Pengeluaran</strong></td>
          <td><strong>${formatRupiah(totalExpense)}</strong></td>
        </tr>
      </table>
    `;

    const printWindow = window.open("", "", "width=900,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Keuangan</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { border-collapse: collapse; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          ${reportHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });
}

render();
