// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYM_JtHXl4GC3e49GZAwuj4iQeFWYw_yc",
  authDomain: "azzahraly-motion-v2.firebaseapp.com",
  projectId: "azzahraly-motion-v2",
  storageBucket: "azzahraly-motion-v2.appspot.com",
  messagingSenderId: "1003674415820",
  appId: "1:1003674415820:web:0a1789e778c1c7c753c869"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };
