// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.firebasestorage.app",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const form = document.getElementById('expense-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const message = document.getElementById('message');
const expenseList = document.getElementById('expense-items');
const totalDisplay = document.getElementById('total');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!title || isNaN(amount)) return;

  await db.collection('expenses').add({
    title,
    amount,
    timestamp: new Date()
  });

  message.textContent = '✅ Expense added!';
  message.style.color = 'green';
  titleInput.value = '';
  amountInput.value = '';
});

// Fetch and display expenses
function loadExpenses() {
  db.collection('expenses').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
    expenseList.innerHTML = '';
    let total = 0;

    snapshot.forEach((doc) => {
      const { title, amount } = doc.data();
      total += amount;

      const li = document.createElement('li');
      li.textContent = `${title}: ₹${amount}`;
      expenseList.appendChild(li);
    });

    totalDisplay.textContent = total;
  });
}

// Load on start
loadExpenses();
