import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const app = initializeApp({
  apiKey: "AIzaSyBn8Z6ZloYGJsQ4DTAxT5z7Re0lYetyxZM",
  authDomain: "mathate-8cd62.firebaseapp.com",
  projectId: "mathate-8cd62",
  storageBucket: "mathate-8cd62.firebasestorage.app",
  messagingSenderId: "358997412946",
  appId: "1:358997412946:web:cfcdc2e77c44fa788d638b",
  measurementId: "G-H4932FV4L8",
});
// Analytics is deliberately opt-in for a children's product.
export const auth = getAuth(app);
