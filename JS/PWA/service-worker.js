const CACHE_NAME = 'meu-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/aluno.html',
  './avisos.html',
  './dashboard.html',
  './lider.html',
  './notificacoes.html',

    './CSS/aluno.css',
    './CSS/aviso.css',
    './CSS/dashboard.css',
    './CSS/lider.css',
    './CSS/login.css',
    './CSS/notificacoes.css',

    './JS/api.js',
    './JS/auth.js',
    './JS/data.js',
    './JS/firebase.js',
    './JS/guard.js',
    './JS/perfil-aluno.js',

    './JS/Avisos/avisos-aluno.js',
    './JS/Avisos/avisos-lider.js',

    './JS/Líder/dashboard.js',
    './JS/Líder/grafico.js',
    './JS/Líder/lider.js',
    './JS/Líder/notificacoes.js',

    './JS/Mock/mock-service.js',
    './JS/Mock/mock.js',

    './JS/Solicitações/solici-lider.js',
    './JS/Solicitações/solici.js',

    './Status/justificativa.js',
    './Status/presenca.js',
    './Status/verificacao.js',

    './Img/Amanda.jpeg',
    './Img/Bruno.jpeg',
    './Img/Eduarda.jpeg',
    './Img/favicon.ico',
    './Img/Gustavo.jpeg',
    './Img/Gustavo2.jpeg',
    './Img/Lucas.jpeg',
    './Img/Olavo.jpeg',
    './Img/William.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
