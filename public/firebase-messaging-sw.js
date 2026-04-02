importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyARydj8s92tvoOKHuP-EGXkNRaLFwwbLhk",
  authDomain: "qstgympro.firebaseapp.com",
  projectId: "qstgympro",
  storageBucket: "qstgympro.firebasestorage.app",
  messagingSenderId: "727162484723",
  appId: "1:727162484723:web:7abc0380b7f65d0cc70486"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});