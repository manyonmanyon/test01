// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGF8hfa74hhgpkpO6Jz6Onj7rjZjFcUFE",
  authDomain: "movingestimation-ab54a.firebaseapp.com",
  projectId: "movingestimation-ab54a",
  storageBucket: "movingestimation-ab54a.appspot.com",
  messagingSenderId: "202959956990",
  appId: "1:202959956990:web:4b6934513dfaac4a3baeaf",
  measurementId: "G-TY6GWHY6H9"
};

// Initialize Firebase
// We are using the CDN version, so we access the functions via the global `firebase` object.
const app = firebase.initializeApp(firebaseConfig);
const storage = firebase.getStorage(app);
