import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase preenchida com os dados do projeto do usuário.
const firebaseConfig = {
  apiKey: "AIzaSyAil5kDZST2UOMYR1vWLv425f7PaJ6sxz8",
  authDomain: "treino-e-dieta-b0ba8.firebaseapp.com",
  projectId: "treino-e-dieta-b0ba8",
  storageBucket: "treino-e-dieta-b0ba8.appspot.com",
  messagingSenderId: "48104736431",
  appId: "1:48104736431:web:19c8e5faad1622ce10365a",
  measurementId: "G-VDF2RLSPPE"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que vamos usar no aplicativo
export const auth = getAuth(app);
export const db = getFirestore(app);
