/* SONUN · scripts compartilhados por todas as páginas */
(function () {
  document.documentElement.classList.add('js');

  // ---------- links antigos (site de uma página) → páginas novas ----------
  var ancoras = {
    servicos: '/#solucoes', diferenciais: '/energia-solar/', tecnologia: '/energia-solar/',
    hibridos: '/energia-solar-com-baterias/', 'tutorial-video': '/energia-solar-com-baterias/',
    bess: '/bess/', mercadolivre: '/mercado-livre-de-energia/', municipios: '/bess-municipios/',
    beneficios: '/bess-municipios/', carregador: '/recarga-veicular/', AGRO: '/baterias-agro-plano-safra/',
    projetos: '/projetos/', videos: '/projetos/', contato: '/contato/', 'area-cliente': '/area-do-cliente/'
  };
  if ((location.pathname === '/' || location.pathname === '/index.html') && location.hash) {
    var destino = ancoras[location.hash.slice(1)];
    if (destino && destino.charAt(1) !== '#') { location.replace(destino + location.search); return; }
  }

  // ---------- topo: vidro ao rolar + menu mobile ----------
  var topo = document.querySelector('.topo');
  if (topo) {
    var aoRolar = function () { topo.classList.toggle('rolou', window.scrollY > 30); };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    var botao = topo.querySelector('.abre-menu');
    if (botao) {
      botao.addEventListener('click', function () {
        var aberto = topo.classList.toggle('aberto');
        botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
        botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      });
    }
    // fecha o submenu "Soluções" ao clicar fora (desktop)
    document.addEventListener('click', function (e) {
      topo.querySelectorAll('details[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
    });
  }

  // ---------- revelação suave ao rolar ----------
  var revelar = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) { if (i.isIntersecting) { i.target.classList.add('visivel'); io.unobserve(i.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revelar.forEach(function (el) { io.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add('visivel'); });
  }

  // ---------- carrossel: setas ----------
  document.querySelectorAll('[data-carrossel]').forEach(function (ctrl) {
    var trilho = document.getElementById(ctrl.getAttribute('data-carrossel'));
    if (!trilho) return;
    ctrl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        trilho.scrollBy({ left: (b.dataset.dir === 'prev' ? -1 : 1) * 316, behavior: 'smooth' });
      });
    });
  });

  // ---------- YouTube: só carrega o vídeo quando a pessoa clica ----------
  document.querySelectorAll('.yt[data-id]').forEach(function (box) {
    var abrir = function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.id + '?autoplay=1&rel=0';
      f.title = box.getAttribute('aria-label') || 'Vídeo';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
    };
    box.addEventListener('click', abrir);
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  });

  // ---------- origem do visitante (UTM / Instagram) ----------
  var params = new URLSearchParams(location.search);
  var chaves = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var origem = {};
  try { origem = JSON.parse(sessionStorage.getItem('sonun_lead_source') || '{}'); } catch (e) { origem = {}; }
  chaves.forEach(function (k) { var v = params.get(k); if (v) origem[k] = v; });
  if (!origem.referrer) origem.referrer = document.referrer || '';
  if (!origem.landing_page) origem.landing_page = location.href;
  try { sessionStorage.setItem('sonun_lead_source', JSON.stringify(origem)); } catch (e) {}
  var ref = (origem.referrer || '').toLowerCase();
  var doInstagram = (origem.utm_source || '').toLowerCase().indexOf('instagram') > -1 || ref.indexOf('instagram.com') > -1;
  var rotuloOrigem = doInstagram ? 'Instagram' : (origem.utm_source || 'Direto/Outro');
  // código do anúncio (utm_content), ex.: IG-BAT1 — só no formato combinado, para não injetar texto qualquer
  var codigo = /^[A-Z]{2,3}-[A-Z0-9]{2,12}$/.test(origem.utm_content || '') ? origem.utm_content : '';

  // campos ocultos com a origem em todos os formulários (chegam no e-mail do Formspree)
  document.querySelectorAll('form').forEach(function (form) {
    Object.keys(origem).forEach(function (k) {
      if (!origem[k] || form.querySelector('[name="' + k + '"]')) return;
      var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = origem[k]; form.appendChild(i);
    });
    var o = document.createElement('input'); o.type = 'hidden'; o.name = 'origem_lead'; o.value = rotuloOrigem; form.appendChild(o);
    var p = document.createElement('input'); p.type = 'hidden'; p.name = 'pagina'; p.value = location.pathname; form.appendChild(p);
    if (codigo) { var k = document.createElement('input'); k.type = 'hidden'; k.name = 'codigo_anuncio'; k.value = codigo; form.appendChild(k); }
  });

  // WhatsApp com mensagem conforme a origem
  var msg = doInstagram
    ? 'Olá! Vim do Instagram da SONUN e quero uma simulação gratuita de economia.'
    : 'Olá! Estive no site da SONUN e gostaria de tirar uma dúvida.';
  var link = 'https://wa.me/5547988692568?text=' + encodeURIComponent(msg + (codigo ? ' [' + codigo + ']' : ''));
  // data-whats-msg: mensagem própria da página (o código do anúncio continua indo junto)
  document.querySelectorAll('[data-whats]').forEach(function (a) {
    a.href = a.dataset.whatsMsg
      ? 'https://wa.me/5547988692568?text=' + encodeURIComponent(a.dataset.whatsMsg + (codigo ? ' [' + codigo + ']' : ''))
      : link;
  });

  var banner = document.getElementById('instagram-banner');
  if (banner && doInstagram && !sessionStorage.getItem('sonun_ig_banner_shown')) {
    setTimeout(function () { banner.classList.add('show'); }, 1200);
    try { sessionStorage.setItem('sonun_ig_banner_shown', '1'); } catch (e) {}
  }
  var fechar = document.getElementById('instagram-banner-close');
  if (fechar) fechar.addEventListener('click', function () { banner.classList.remove('show'); });

  // eventos do Google Analytics
  var evento = function (nome) { if (typeof gtag === 'function') gtag('event', nome, { origem_lead: rotuloOrigem, pagina: location.pathname, codigo_anuncio: codigo || '(sem código)' }); };
  document.querySelectorAll('a[href*="wa.me"], [data-whats]').forEach(function (a) {
    a.addEventListener('click', function () { evento('whatsapp_click'); });
  });

  // ---------- reCAPTCHA: só carrega quando a pessoa chega perto do formulário ----------
  var caixas = document.querySelectorAll('.g-recaptcha');
  var carregarCaptcha = function () {
    if (window.__sonunCaptcha) return;
    window.__sonunCaptcha = true;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  };
  if (caixas.length) {
    caixas.forEach(function (c) {
      var f = c.closest('form');
      if (f) ['focusin', 'pointerdown'].forEach(function (ev) { f.addEventListener(ev, carregarCaptcha, { once: true }); });
    });
    if ('IntersectionObserver' in window) {
      var ioCap = new IntersectionObserver(function (itens) {
        if (itens.some(function (i) { return i.isIntersecting; })) { carregarCaptcha(); ioCap.disconnect(); }
      }, { rootMargin: '300px 0px' });
      caixas.forEach(function (c) { ioCap.observe(c); });
    } else { carregarCaptcha(); }
  }

  // ---------- formulários (Formspree + reCAPTCHA) ----------
  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    var status = form.querySelector('.status');
    var btn = form.querySelector('button[type="submit"]');
    var rotulo = btn ? btn.innerHTML : '';
    var aviso = function (txt, tipo) { if (status) { status.textContent = txt; status.className = 'status full ' + (tipo || ''); } };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.querySelector('.g-recaptcha') && !(window.grecaptcha && typeof grecaptcha.getResponse === 'function')) {
        carregarCaptcha();
        aviso('Carregando a verificação "Não sou um robô"… marque a caixa e envie de novo.', 'erro');
        return;
      }
      var temCaptcha = form.querySelector('.g-recaptcha') && window.grecaptcha && typeof grecaptcha.getResponse === 'function';
      if (temCaptcha) {
        try {
          if (grecaptcha.getResponse().length === 0) { aviso('Por favor, confirme que você não é um robô.', 'erro'); return; }
        } catch (err) { /* reCAPTCHA indisponível: segue com a armadilha anti-spam */ }
      }
      aviso('');
      btn.disabled = true;
      btn.textContent = 'Enviando…';
      fetch(form.getAttribute('data-endpoint'), { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('http');
          aviso('Mensagem enviada! Em breve um especialista fala com você.', 'ok');
          evento('generate_lead');
          form.reset();
          if (temCaptcha) { try { grecaptcha.reset(); } catch (err) {} }
          btn.textContent = 'Enviado ✓';
          setTimeout(function () { btn.disabled = false; btn.innerHTML = rotulo; }, 3500);
        })
        .catch(function () {
          aviso('Não foi possível enviar. Tente de novo ou chame no WhatsApp.', 'erro');
          btn.disabled = false; btn.innerHTML = rotulo;
        });
    });
  });
})();
