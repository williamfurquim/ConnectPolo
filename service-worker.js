const CACHE_NAME = 'connectpolo-v1.0.7'; // Atualize a cada deploy
const urlsToCache = [
  './',
  './index.html',
  './aluno.html',
  './lider.html',

  './Pages/LiderPags/avisos.html',
  './Pages/LiderPags/dashboard.html',
  './Pages/LiderPags/notificacoes.html',
  './Pages/LiderPags/perfil-lider.html',
  './Pages/LiderPags/cadastroaluno.html',
  './Pages/LiderPags/gerenciar-senhas.html',

  './Pages/AlunoPags/perfil-aluno.html',
  './Pages/AlunoPags/calendario-aluno.html',

  './CSS/aluno.css',
  './CSS/aviso.css',
  './CSS/cadastroaluno.css',
  './CSS/calendario-aluno.css',
  './CSS/dashboard.css',
  './CSS/lider.css',
  './CSS/login.css',
  './CSS/notificacoes.css',
  './CSS/perfil-lider.css',

  './JS/Avisos/avisos-aluno.js',
  './JS/Avisos/avisos-lider.js',

  './JS/Líder/badge.js',
  './JS/Líder/cadastroaluno.js',
  './JS/Líder/dashboard.js',
  './JS/Líder/export.js',
  './JS/Líder/grafico-alunos.js',
  './JS/Líder/grafico.js',
  './JS/Líder/lider.js',
  './JS/Líder/notificacoes.js',

  './JS/Perfil/buscar-aniver.js',
  './JS/Perfil/dados-aluno.js',
  './JS/Perfil/dados-lider.js',

  './service-worker.js',

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
  './JS/upload-service.js',

  './JS/Aluno/perfil-aluno.js',
  './JS/Aluno/puxar-cursos.js',
  './JS/Aluno/calendario.js',

  './Img/favicon.ico',
  './Img/icon-192.png',
  './Img/icon-512.png'
];



// =========== INSTALL =====
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



// =========== ACTIVATE =====
self.addEventListener('activate', event => {
  console.log('[SW] 🔄 Ativando versão', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});



// =========== FETCH =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});



// =========== UPDATE VIA MESSAGE =====
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});