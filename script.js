import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.appspot.com",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const form = document.getElementById('transaction-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const message = document.getElementById('message');
const transactionList = document.getElementById('transaction-items');
const totalIncomeDisplay = document.getElementById('total-income');
const totalExpenseDisplay = document.getElementById('total-expense');
const balanceDisplay = document.getElementById('balance');

// 👤 Auth DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// Auth Handlers
loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Logged in!";
      message.style.color = 'green';
    })
    .catch((error) => {
      message.textContent = "❌ Login failed!";
      message.style.color = 'red';
      console.error(error.message);
    });
});

signupBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      message.textContent = "✅ Signed up!";
      message.style.color = 'green';
    })
    .catch((error) => {
      message.textContent = "❌ Signup failed!";
      message.style.color = 'red';
      console.error(error.message);
    });
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    message.textContent = "👋 Logged out!";
    message.style.color = 'blue';
  });
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    form.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    loadTransactions(); // Load only after login
  } else {
    form.style.display = 'none';
    logoutBtn.style.display = 'none';
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';
  }
});

// Add new transaction
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title || isNaN(amount)) return;

  await addDoc(collection(db, 'transactions'), {
    title,
    amount,
    type,
    timestamp: new Date()
  });

  message.textContent = '✅ Added successfully!';
  message.style.color = 'green';
  titleInput.value = '';
  amountInput.value = '';
});

// Load transactions and calculate totals
function loadTransactions() {
  const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));

  onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.forEach((doc) => {
      const { title, amount, type } = doc.data();
      const li = document.createElement('li');
      li.className = type === 'income' ? 'income' : 'expense';
      li.textContent = `${type === 'income' ? 'Income' : 'Expense'} - ${title}: ₹${amount}`;
      transactionList.appendChild(li);

      if (type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;
    totalIncomeDisplay.textContent = totalIncome;
    totalExpenseDisplay.textContent = totalExpense;
    balanceDisplay.textContent = balance;
  });
}



// POSSIBLE UPDATES



// --- Check if Firebase is initialized or fallback to localStorage ---

let transactions = []; // local copy

// Try to detect if Firebase is connected
const firebaseConnected = !!db; // if db is defined and works

// Load transactions from localStorage on page load
function loadLocalTransactions() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved);
  } else {
    transactions = [];
  }
  renderTransactions();
}

// Save transactions to localStorage
function saveLocalTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Render the transaction list with optional filter
function renderTransactions(filter = 'all') {
  transactionList.innerHTML = '';
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx, index) => {
    if (filter !== 'all' && tx.type !== filter) return;

    const li = document.createElement('li');
    li.className = tx.type === 'income' ? 'income' : 'expense';
    li.innerHTML = `
      ${tx.type === 'income' ? '💰' : '💸'} <strong>${tx.title}</strong>: ₹${tx.amount.toFixed(2)}
      <button class="delete-btn" data-index="${index}" style="margin-left:10px; cursor:pointer; background:none; border:none; color:#e74c3c;">🗑️</button>
    `;
    transactionList.appendChild(li);

    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;
  });

  totalIncomeDisplay.textContent = totalIncome.toFixed(2);
  totalExpenseDisplay.textContent = totalExpense.toFixed(2);
  balanceDisplay.textContent = (totalIncome - totalExpense).toFixed(2);

  // Attach delete button listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.index;
      transactions.splice(idx, 1);
      saveLocalTransactions();
      renderTransactions(currentFilter);
      showMessage('Transaction deleted', 'orange');
    });
  });
}

let currentFilter = 'all';

// Filter buttons dynamically added to UI
const filterDiv = document.createElement('div');
filterDiv.style.marginBottom = '15px';
filterDiv.innerHTML = `
  <button id="filter-all" style="margin-right:5px;">All</button>
  <button id="filter-income" style="margin-right:5px;">Income</button>
  <button id="filter-expense">Expense</button>
`;
document.querySelector('.transactions-list').insertBefore(filterDiv, transactionList);

filterDiv.querySelector('#filter-all').addEventListener('click', () => {
  currentFilter = 'all';
  renderTransactions(currentFilter);
});
filterDiv.querySelector('#filter-income').addEventListener('click', () => {
  currentFilter = 'income';
  renderTransactions(currentFilter);
});
filterDiv.querySelector('#filter-expense').addEventListener('click', () => {
  currentFilter = 'expense';
  renderTransactions(currentFilter);
});

// Enhanced form submit with validation and fallback to localStorage if Firebase is not available
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title) {
    showMessage('❌ Title is required', 'red');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showMessage('❌ Enter a valid positive amount', 'red');
    return;
  }

  if (firebaseConnected) {
    try {
      await addDoc(collection(db, 'transactions'), {
        title,
        amount,
        type,
        timestamp: new Date()
      });
      showMessage('✅ Added successfully via Firebase!', 'green');
    } catch (err) {
      showMessage('❌ Firebase error adding transaction', 'red');
      console.error(err);
    }
  } else {
    // Local fallback
    transactions.unshift({ title, amount, type, timestamp: new Date() });
    saveLocalTransactions();
    renderTransactions(currentFilter);
    showMessage('✅ Added successfully locally!', 'green');
  }

  titleInput.value = '';
  amountInput.value = '';
});

// Custom show message function
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

// On page load, either load from Firebase or localStorage
if (firebaseConnected) {
  // Optionally call loadTransactions here or on login state change (you already do that)
} else {
  form.style.display = 'block';
  logoutBtn.style.display = 'none';
  loadLocalTransactions();
}


