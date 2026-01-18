const CACHE_NAME = 'connectpolo-v1.0.4'; // Atualize a cada deploy

const urlsToCache = [
  '/',
  '/index.html',
  '/aluno.html',
  '/avisos.html',
  '/dashboard.html',
  '/lider.html',
  '/notificacoes.html',
  '/perfil-lider.html',
  '/cadastroaluno.html',

  '/CSS/aluno.css',
  '/CSS/aviso.css',
  '/CSS/cadastroaluno.css', //
  '/CSS/dashboard.css',
  '/CSS/lider.css',
  '/CSS/login.css',
  '/CSS/notificacoes.css',
  '/CSS/perfil-lider.css',

  '/JS/api.js',
  '/JS/auth.js',
  '/JS/data.js',
  '/JS/firebase.js',
  '/JS/guard.js',
  '/JS/perfil-aluno.js',
  '/JS/api-service.js',
  '/JS/upload-service.js', 
   

  '/JS/Avisos/avisos-aluno.js',
  '/JS/Avisos/avisos-lider.js',

  '/JS/Líder/cadastroalunos.js',
  '/JS/Líder/dashboard.js',
  '/JS/Líder/grafico.js',
  '/JS/Líder/lider.js',
  '/JS/Líder/notificacoes.js',

  '/JS/Solicitações/solici-lider.js',
  '/JS/Solicitações/solici.js',

  '/JS/Status/justificativa.js',
  '/JS/Status/presenca.js',
  '/JS/Status/verificacao.js',

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

  if (
    url.hostname.includes('firebasestorage') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('firestore')
  ) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).then(res => {
        if (event.request.method === 'GET' && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
        }
        return res;
      });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
