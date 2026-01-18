const CACHE_NAME = 'connectpolo-v1.0.5'; // Atualize a cada deploy

const urlsToCache = [
  '/',
  '/index.html',
  '/aluno.html',
  '/avisos.html',
  '/dashboard.html',
  '/lider.html',
  '/notificacoes.html',
  '/perfil.html',
  '/cadastroaluno.html',

  '/CSS/aluno.css',
  '/CSS/aviso.css',
  '/CSS/cadastroaluno.css',
  '/CSS/dashboard.css',
  '/CSS/lider.css',
  '/CSS/login.css',
  '/CSS/notificacoes.css',
  '/CSS/perfil-lider.css',

  '/Img/favicon.ico',
  '/Img/icon-192.png',
  '/Img/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] 🚀 Instalando versão', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        urlsToCache.map(url => cache.add(url).catch(err => {
          console.warn('[SW] ⚠️ Falha ao cachear:', url, err);
        }))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] 🔄 Ativando versão', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca tocar em Firebase, APIs ou JS
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    event.request.destination === 'script'
  ) {
    return;
  }

  // Cache apenas HTML, CSS e imagens
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
