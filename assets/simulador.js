/* Simulador de autonomia de baterias SONUN (mesmo cálculo do site antigo).
   Baterias de lítio LFP, 192 V, 90% de profundidade de descarga (DoD), regra 1C. */
(function () {
  var raiz = document.getElementById('simulador');
  if (!raiz) return;

  // potências médias de consumo contínuo (kW)
  var potCont = { ar: 0.7, gel: 0.2, luz: 0.15, tv: 0.15, wifi: 0.08 };
  // potências das cargas de pico (kW)
  var potTemp = { micro: 1.3, air: 1.8, fog: 2.0, bomb: 0.8 };
  var qtd = { ar: 0, gel: 0, luz: 0, tv: 0, wifi: 0 };

  raiz.querySelectorAll('[data-mudar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.dataset.mudar, d = parseInt(b.dataset.d, 10);
      qtd[item] = Math.max(0, qtd[item] + d);
      document.getElementById('q-' + item).textContent = qtd[item];
    });
  });

  var resultado = document.getElementById('sim-resultado');
  var aviso = document.getElementById('sim-aviso');
  var avisar = function (txt) { resultado.hidden = true; aviso.textContent = txt; aviso.hidden = false; };

  document.getElementById('sim-calcular').addEventListener('click', function () {
    var cap = parseFloat(document.getElementById('cap-bateria').value);
    var capUtil = cap * 0.9;          // 90% DoD
    var limite = cap * 1.0;           // regra 1C (ex.: 5 kWh = 5 kW máx.)
    var consumoTemp = 0, picoTemp = 0;
    for (var i in potTemp) {
      var m = parseFloat(document.getElementById('t-' + i).value) || 0;
      consumoTemp += potTemp[i] * (m / 60);
      if (m > 0) picoTemp += potTemp[i];
    }
    var consumoHora = 0;
    for (var k in qtd) consumoHora += qtd[k] * potCont[k];
    var demanda = consumoHora + picoTemp;

    if (demanda > limite) {
      avisar('Limite técnico: um banco de ' + cap + ' kWh suporta no máximo ' + limite + ' kW de carga ao mesmo tempo. Reduza os equipamentos ligados juntos ou aumente o banco de baterias.');
      return;
    }
    var sobra = capUtil - consumoTemp;
    if (sobra <= 0) { avisar('Atenção: o consumo dos equipamentos de pico esgota a bateria rapidamente. Aumente o banco de baterias.'); return; }

    var potInv = demanda * 1.1, inv;
    if (potInv <= 5) inv = 'Fox ESS 5.0 (Híbrido)';
    else if (potInv <= 6) inv = 'Fox ESS 6.0 (Híbrido)';
    else if (potInv <= 8) inv = 'Fox ESS 8.0 (Híbrido)';
    else if (potInv <= 10) inv = 'Fox ESS H3-10.0 (Híbrido)';
    else if (potInv <= 12) inv = 'Fox ESS H3-12.0 (Híbrido)';
    else inv = 'Sistemas em paralelo (2x H3-10.0)';

    var txt;
    if (consumoHora === 0) txt = 'Check OK';
    else {
      var h = sobra / consumoHora;
      if (h >= 24) txt = (h / 24).toFixed(1).replace('.', ',') + ' dias';
      else if (h < 1) txt = (h * 60).toFixed(0) + ' min';
      else txt = h.toFixed(1).replace('.', ',') + ' horas';
    }
    aviso.hidden = true;
    document.getElementById('sim-autonomia').textContent = txt;
    document.getElementById('sim-inversor').textContent = inv;
    resultado.hidden = false;
    if (typeof gtag === 'function') gtag('event', 'simulador_baterias', { capacidade_kwh: cap });
  });
})();
