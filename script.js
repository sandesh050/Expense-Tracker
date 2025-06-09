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
const mainApp = document.getElementById('main-app');
const authSection = document.querySelector('.auth-section'); // 👈 New line

// Auth DOM Elements
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
    authSection.style.display = 'none';         // 👈 Hide auth form
    logoutBtn.style.display = 'inline-block';
    mainApp.style.display = 'block';
    loadTransactions();
  } else {
    authSection.style.display = 'block';        // 👈 Show auth form
    logoutBtn.style.display = 'none';
    mainApp.style.display = 'none';
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
