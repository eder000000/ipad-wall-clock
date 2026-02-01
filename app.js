(function () {

  function el(id) {
    return document.getElementById(id);
  }

  var C = window.DASH_CONFIG;

  /* ===== CLOCK ===== */

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function startClock() {
    function tick() {
      var d = new Date();

      el("time").innerHTML =
        pad(d.getHours()) + ":" +
        pad(d.getMinutes()) + ":" +
        pad(d.getSeconds());

      el("date").innerHTML =
        pad(d.getDate()) + "/" +
        pad(d.getMonth() + 1) + "/" +
        d.getFullYear();
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ===== BACKGROUND ===== */

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

  /* ===== XHR ===== */

  function xhrGet(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          cb(JSON.parse(xhr.responseText));
        } catch (e) {
          cb(null);
        }
      }
    };
    xhr.send();
  }

  /* ===== WEATHER ===== */

  function loadWeather() {

    el("temp").innerHTML = "--°C";
    el("cond").innerHTML = "Cargando clima…";
    el("hourly").innerHTML = "Cargando…";
    el("updated").innerHTML = "Actualizando…";

    xhrGet(
      "https://geocoding-api.open-meteo.com/v1/search?name=Zapopan&count=1",
      function (geo) {

        if (!geo || !geo.results || !geo.results.length) {
          el("cond").innerHTML = "Sin datos";
          return;
        }

        var loc = geo.results[0];
        el("city").innerHTML = loc.name + ", " + loc.admin1;

        var url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=" + loc.latitude +
          "&longitude=" + loc.longitude +
          "&current_weather=true" +
          "&hourly=temperature_2m,precipitation_probability" +
          "&timezone=America/Mexico_City";

        xhrGet(url, function (data) {

          if (!data || !data.current_weather || !data.hourly) {
            el("cond").innerHTML = "Sin clima";
            return;
          }

          /* Actual */
          el("temp").innerHTML =
            Math.round(data.current_weather.temperature) + "°C";

          el("cond").innerHTML =
            "Viento " + Math.round(data.current_weather.windspeed) + " km/h";

          /* Badge lluvia */
          var rain = data.hourly.precipitation_probability;
          var rainMax = 0;

          for (var i = 0; i < 6; i++) {
            if (rain[i] > rainMax) rainMax = rain[i];
          }

          if (rainMax >= 70) {
            el("cond").innerHTML += " · 🌧️ Alta prob. lluvia";
          } else if (rainMax >= 40) {
            el("cond").innerHTML += " · ☁️ Posible lluvia";
          } else {
            el("cond").innerHTML += " · ☀️ Sin lluvia";
          }

          /* Próximas horas */
          var html = "";
          var times = data.hourly.time;
          var temps = data.hourly.temperature_2m;

          for (var j = 0; j < 6; j++) {
            html +=
              times[j].substr(11, 5) + " · " +
              Math.round(temps[j]) + "°C · " +
              rain[j] + "%<br>";
          }

          el("hourly").innerHTML = html;
          el("updated").innerHTML = "Datos OK";
        });
      }
    );
  }

  /* ===== MAIN ===== */

  function main() {
    startClock();
    startBackgrounds();
    setTimeout(loadWeather, 2000);
    setInterval(loadWeather, C.weatherRefreshMs);
  }

  document.addEventListener("DOMContentLoaded", function () {
    main();
  });

})();
