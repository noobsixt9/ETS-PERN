import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyBREpzQztdND9MdoUGoRFJZj3VAcf0gciU",
  authDomain: "ets-pern.firebaseapp.com",
  projectId: "ets-pern",
  storageBucket: "ets-pern.firebasestorage.app",
  messagingSenderId: "395238064970",
  appId: "1:395238064970:web:dc8ec2cae5347287c9b7b3",
  measurementId: "G-8H8C3TJ75C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, app };
