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

    // 1️⃣ Geocode Zapopan
    xhrGet(
      "https://geocoding-api.open-meteo.com/v1/search?name=Zapopan&count=1&language=es",
      function (geo) {

        if (!geo.results || !geo.results.length) return;

        var loc = geo.results[0];
        el("city").innerHTML = loc.name + ", " + loc.admin1;

        // 2️⃣ WEATHER (LEGACY, STABLE)
        var url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=" + loc.latitude +
          "&longitude=" + loc.longitude +
          "&current_weather=true" +
          "&timezone=America/Mexico_City";

        xhrGet(url, function (data) {

          if (!data.current_weather) return;

          el("temp").innerHTML =
            Math.round(data.current_weather.temperature) + "°C";

          el("cond").innerHTML = "Viento " +
            Math.round(data.current_weather.windspeed) + " km/h";

          el("updated").innerHTML = "Actualizado";
        });
      }
    );
  }

  /* ================= MAIN ================= */

  function main() {
    startClock();
    startBackgrounds();

    // Delay prevents race condition on iOS 12
    setTimeout(loadWeather, 1200);
    setInterval(loadWeather, C.weatherRefreshMs);
  }

  document.addEventListener("DOMContentLoaded", function () {
    main();
  });

})();
