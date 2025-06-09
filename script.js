import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.appspot.com",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

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
const authSection = document.getElementById('auth-section');

// Auth elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// Filter element
const filterSelect = document.getElementById('filter');

// Edit mode vars
let editMode = false;
let editDocId = null;

function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    showMessage('Please enter email and password', 'red');
    return;
  }
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("✅ Logged in!");
      emailInput.value = '';
      passwordInput.value = '';
    })
    .catch((error) => {
      showMessage("❌ Login failed: " + error.message, 'red');
    });
});

signupBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    showMessage('Please enter email and password', 'red');
    return;
  }
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("✅ Signed up!");
      emailInput.value = '';
      passwordInput.value = '';
    })
    .catch((error) => {
      showMessage("❌ Signup failed: " + error.message, 'red');
    });
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    showMessage("👋 Logged out!", 'blue');
  });
});

const cancelEditBtn = document.getElementById('cancel-edit-btn');
cancelEditBtn.addEventListener('click', () => {
  exitEditMode();
});

function enterEditMode(docId, data) {
  editMode = true;
  editDocId = docId;
  titleInput.value = data.title;
  amountInput.value = data.amount;
  typeInput.value = data.type;
  document.getElementById('submit-btn').textContent = 'Update';
  cancelEditBtn.style.display = 'inline-block';
}

function exitEditMode() {
  editMode = false;
  editDocId = null;
  titleInput.value = '';
  amountInput.value = '';
  typeInput.value = 'expense';
  document.getElementById('submit-btn').textContent = 'Add';
  cancelEditBtn.style.display = 'none';
}

let unsubscribeTransactions = null;
let currentFilter = 'all';

onAuthStateChanged(auth, (user) => {
  if (user) {
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authSection.style.display = 'none';
    if (unsubscribeTransactions) unsubscribeTransactions();
    unsubscribeTransactions = loadTransactions(user.uid);
  } else {
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';
    exitEditMode();
    if (unsubscribeTransactions) {
      unsubscribeTransactions();
      unsubscribeTransactions = null;
    }
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;
  const user = auth.currentUser;

  if (!title || isNaN(amount) || amount <= 0 || !user) {
    showMessage('Please fill all fields correctly.', 'red');
    return;
  }

  try {
    const ref = collection(db, `users/${user.uid}/transactions`);
    if (editMode && editDocId) {
      await updateDoc(doc(db, `users/${user.uid}/transactions`, editDocId), {
        title,
        amount,
        type,
        timestamp: new Date()
      });
      showMessage('✅ Transaction updated!');
      exitEditMode();
    } else {
      await addDoc(ref, {
        title,
        amount,
        type,
        timestamp: new Date()
      });
      showMessage('✅ Transaction added!');
    }
    form.reset();
  } catch (error) {
    showMessage('❌ Failed to save transaction: ' + error.message, 'red');
  }
});

function loadTransactions(uid) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    const transactions = [];
    snapshot.forEach((doc) => transactions.push({ id: doc.id, ...doc.data() }));

    const filtered = currentFilter === 'all' ? transactions :
      transactions.filter(t => t.type === currentFilter);

    filtered.forEach(tx => {
      const li = document.createElement('li');
      li.classList.add(tx.type);
      li.innerHTML = `
        <span>${tx.title} - ₹${tx.amount.toFixed(2)}</span>
        <div class="transaction-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;
      li.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(tx.id, tx));
      li.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm('Delete this transaction?')) {
          await deleteDoc(doc(db, `users/${uid}/transactions`, tx.id));
          showMessage('✅ Transaction deleted!');
          if (editMode && editDocId === tx.id) exitEditMode();
        }
      });

      transactionList.appendChild(li);
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;
    });

    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = (totalIncome - totalExpense).toFixed(2);
  });
}

filterSelect.addEventListener('change', () => {
  currentFilter = filterSelect.value;
  const user = auth.currentUser;
  if (user && unsubscribeTransactions) unsubscribeTransactions();
  if (user) unsubscribeTransactions = loadTransactions(user.uid);
});
