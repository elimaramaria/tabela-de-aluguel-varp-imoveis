import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- INSTRUÇÕES DE CONFIGURAÇÃO ---
// 1. Vá para https://console.firebase.google.com/
// 2. Copie as chaves do seu projeto e cole abaixo em 'firebaseConfig'.
//
// --- COMO CORRIGIR O ERRO "Missing or insufficient permissions" ---
// 1. No console do Firebase, vá em "Firestore Database" > aba "Regras" (Rules).
// 2. Apague o código existente e cole o seguinte para permitir acesso público (modo desenvolvimento):
//
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/
// 3. Clique em "Publicar".

const firebaseConfig = {
  // Substitua os valores abaixo pelos do seu projeto Firebase
  apiKey: "AIzaSyBg8yP8TQrT6m34EGlkExa5yhou4833U80",
  authDomain: "tabela-de-aluguel.firebaseapp.com",
  projectId: "tabela-de-aluguel",
  storageBucket: "tabela-de-aluguel.firebasestorage.app",
  messagingSenderId: "1083451634894",
  appId: "1:1083451634894:web:655c0791b3cd57751c8c9f"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);