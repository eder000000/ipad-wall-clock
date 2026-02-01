(function () {

  function el(id) {
    return document.getElementById(id);
  }

  var C = window.DASH_CONFIG;

  /* ================= CLOCK ================= */

  function startClock() {
    function tick() {
      var now = new Date();

      el("time").innerHTML = now.toLocaleTimeString("es-MX", {
        hour12: false
      });

      el("date").innerHTML = now.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ================= BACKGROUND ================= */

  function startBackgrounds() {
    var bg = el("bg");
    var list = C.backgrounds;

    function change() {
      var i = Math.floor(Math.random() * list.length);
      bg.style.backgroundImage = 'url("' + list[i] + '")';
    }

    change();
    setInterval(change, C.backgroundRotateMs);
  }

  /* ================= WEATHER ================= */

  function xhrGet(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        cb(JSON.parse(xhr.responseText));
      }
    };
    xhr.send();
  }

  function loadWeather() {

    xhrGet(
      "https://geocoding-api.open-meteo.com/v1/search?name=Zapopan&count=1&language=es",
      function (geo) {

        if (!geo.results || !geo.results.length) return;

        var loc = geo.results[0];
        el("city").innerHTML = loc.name + ", " + loc.admin1;

        var url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=" + loc.latitude +
          "&longitude=" + loc.longitude +
          "&current=temperature_2m" +
          "&timezone=America/Mexico_City";

        xhrGet(url, function (data) {
          el("temp").innerHTML = Math.round(data.current.temperature_2m) + "°C";
          el("cond").innerHTML = "Condiciones actuales";
          el("updated").innerHTML = "Actualizado";
        });

      }
    );
  }

  /* ================= MAIN ================= */

  function main() {
    startClock();
    startBackgrounds();
    loadWeather();
    setInterval(loadWeather, C.weatherRefreshMs);
  }

  document.addEventListener("DOMContentLoaded", function () {
    main();
  });

})();
