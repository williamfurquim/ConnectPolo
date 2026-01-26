// ===== SERVICE WORKER - CONNECTPOLO =====
const CACHE_NAME = 'connectpolo-v1.0.6'; // Atualize a cada deploy
const urlsToCache = [
  './',
  './index.html',
  './aluno.html',
  './avisos.html',
  './dashboard.html',
  './lider.html',
  './notificacoes.html',
  './perfil-aluno.html',
  './perfil-lider.html',
  './cadastroaluno.html',

  './CSS/aluno.css',
  './CSS/aviso.css',
  './CSS/cadastroaluno.css',
  './CSS/dashboard.css',
  './CSS/lider.css',
  './CSS/login.css',
  './CSS/notificacoes.css',
  './CSS/perfil-lider.css',

  './JS/Avisos/avisos-aluno.js',
  './JS/Avisos/avisos-lider.js',

  './JS/Líder/cadastroaluno.js',
  './JS/Líder/dashboard.js',
  './JS/Líder/grafico-alunos.js',
  './JS/Líder/grafico.js',
  './JS/Líder/lider.js',
  './JS/Líder/notificacoes.js',
  
  './JS/Perfil/buscar-aniver.js',
  './JS/Perfil/dados-aluno.js',
  './JS/Perfil/dados-lider.js',

  './JS/PWA/service-worker.js',

  './JS/Solicitações/solici-lider.js',
  './JS/Solicitações/solici.js',

  './JS/Status/justificativa.js',
  './JS/Status/presenca.js',

  './JS/api-service.js',
  './JS/api.js',
  './JS/auth.js',
  './JS/data.js',
  './JS/firebase.js',
  './JS/guard.js',
  './JS/perfil-aluno.js',
  './JS/upload-service.js',

  './Img/favicon.ico',
  './Img/icon-192.png',
  './Img/icon-512.png'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  console.log('[SW] 🚀 Instalando versão', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        urlsToCache.map(url => cache.add(url).catch(err => {
          console.warn('[SW] ⚠️ Falha ao cachear:', url, err);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  console.log('[SW] 🔄 Ativando versão', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar apenas Firebase e Google APIs
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis')
  ) {
    return; // deixa passar para rede
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cacheia respostas válidas
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Fallback para páginas HTML offline
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ===== UPDATE VIA MESSAGE =====
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
