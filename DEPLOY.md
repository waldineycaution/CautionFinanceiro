# 🚀 Deploy no Firebase — Passo a Passo

## 1. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Criar um projeto"**
3. Dê um nome (ex: `gestaopro`) → Continuar
4. Desative o Google Analytics (opcional) → Criar projeto

## 2. Configurar o Firestore

1. No menu lateral: **Firestore Database → Criar banco de dados**
2. Selecione **"Iniciar no modo de produção"**
3. Região: **southamerica-east1 (São Paulo)** → Ativar
4. Vá em **Regras** e substitua por:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gestaopro/{document} {
      allow read, write: if true;
    }
  }
}
```
5. Clique em **Publicar**

> ⚠️ Essas regras são abertas. Quando quiser adicionar login, avise que configuramos o Firebase Auth.

## 3. Pegar o firebaseConfig

1. No menu lateral: **Configurações do projeto** (engrenagem) → **Geral**
2. Role até **"Seus apps"** → clique em **"</>  Web"**
3. Nome do app: `gestaopro-web` → Registrar app
4. Copie o objeto `firebaseConfig`
5. Cole no arquivo **`js/firebase-config.js`** substituindo os "COLE_AQUI"

## 4. Atualizar o .firebaserc

Abra `.firebaserc` e substitua `SEU-PROJECT-ID-AQUI` pelo **Project ID** 
que aparece em Configurações do projeto.

## 5. Instalar o Firebase CLI

No terminal:
```bash
npm install -g firebase-tools
```

## 6. Login e deploy

```bash
# Na pasta do projeto (gestaopro/)
firebase login
firebase deploy --only hosting
```

Ao final vai aparecer:
```
✅ Deploy complete!
Hosting URL: https://gestaopro.web.app
```

## 7. Pronto!

Acesse a URL e seu app estará online. 
Os dados são salvos automaticamente no Firestore a cada ação.

---

## Comandos úteis

```bash
firebase deploy          # Deploy completo
firebase serve           # Testar localmente (http://localhost:5000)
firebase open hosting:site  # Abre o app no browser
```
