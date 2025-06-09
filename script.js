// script.js
import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "./firebase.js";

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const transactionForm = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const totalDisplay = document.getElementById("total");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const totalsSection = document.querySelector(".totals");

let currentUser = null;

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showApp();
    loadTransactions();
  } else {
    currentUser = null;
    hideApp();
  }
});

function showApp() {
  logoutBtn.style.display = "block";
  transactionForm.style.display = "block";
  totalsSection.style.display = "block";
  loginForm.style.display = "none";
  signupForm.style.display = "none";
}

function hideApp() {
  logoutBtn.style.display = "none";
  transactionForm.style.display = "none";
  totalsSection.style.display = "none";
  loginForm.style.display = "block";
  signupForm.style.display = "block";
  transactionList.innerHTML = "";
}

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Signup Error: " + error.message);
  }
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const password = loginForm["login-password"].value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Login Error: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

transactionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;

  try {
    await addDoc(collection(db, "transactions"), {
      userId: currentUser.uid,
      description,
      amount,
      type,
      createdAt: Date.now()
    });
    transactionForm.reset();
    loadTransactions();
  } catch (error) {
    alert("Transaction Error: " + error.message);
  }
});

async function loadTransactions() {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", currentUser.uid)
  );
  const querySnapshot = await getDocs(q);

  let income = 0;
  let expense = 0;
  transactionList.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const { description, amount, type } = docSnap.data();

    const li = document.createElement("li");
    li.textContent = `${description}: $${amount.toFixed(2)} (${type})`;

    transactionList.appendChild(li);

    if (type === "income") income += amount;
    else expense += amount;
  });

  totalDisplay.textContent = (income - expense).toFixed(2);
  incomeDisplay.textContent = income.toFixed(2);
  expenseDisplay.textContent = expense.toFixed(2);
}
