import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

loadTransactions();
