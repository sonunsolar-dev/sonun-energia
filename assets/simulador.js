/* Simulador de autonomia de baterias SONUN, com o mesmo cálculo do gerador de propostas:
   baterias de lítio LFP, 90% de profundidade de descarga (DoD), cerca de 10% de perdas na
   conversão (autonomia = energia útil × 0,9 ÷ kW) e regra 1C.
   Os inversores sugeridos são os híbridos do catálogo para rede 127/220 V. */
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
    var capUtil = cap * 0.9 * 0.9;    // 90% DoD e ~10% de perdas na conversão (igual às propostas)
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

    // inversores híbridos do catálogo (rede 127/220 V), com 10% de folga sobre a demanda
    var potInv = demanda * 1.1, inv;
    if (potInv <= 5.5) inv = 'Híbrido de 5,5 kW (Hoymiles HYS-5.5LV)';
    else if (potInv <= 7.5) inv = 'Híbrido de 7,5 kW (FOX ESS alta tensão ou Hoymiles HYS-7.5LV)';
    else if (potInv <= 10.5) inv = 'Híbrido de 10,5 kW (Hoymiles HYS-10.5LV)';
    else inv = 'Acima de 10,5 kW: inversores em paralelo, definidos no projeto';

    var txt;
    if (consumoHora === 0) txt = 'Check OK';
    else {
      var h = sobra / consumoHora;
      if (h >= 24) txt = (h / 24).toFixed(1).replace('.', ',') + ' dias';
      else {
        var min = Math.round(h * 60), hh = Math.floor(min / 60), mm = min % 60;
        txt = hh === 0 ? mm + ' min' : hh + ' h' + (mm ? ' ' + String(mm).padStart(2, '0') + ' min' : '');
      }
    }
    aviso.hidden = true;
    document.getElementById('sim-autonomia').textContent = txt;
    document.getElementById('sim-inversor').textContent = inv;
    resultado.hidden = false;
    if (typeof gtag === 'function') gtag('event', 'simulador_baterias', { capacidade_kwh: cap });
  });
})();
