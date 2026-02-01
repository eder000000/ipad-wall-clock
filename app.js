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

  el("temp").innerHTML = "--°C";
  el("cond").innerHTML = "Cargando clima…";
  el("hourly").innerHTML = "Cargando…";

  // Mensaje visible de estado
  el("updated").innerHTML = "Solicitando datos…";

  xhrGet(
    "https://geocoding-api.open-meteo.com/v1/search?name=Zapopan&count=1",
    function (geo) {

      if (!geo || !geo.results || !geo.results.length) {
        el("cond").innerHTML = "Sin geo datos";
        el("updated").innerHTML = "Error geo";
        return;
      }

      var loc = geo.results[0];
      el("city").innerHTML = loc.name + ", " + loc.admin1;
      el("updated").innerHTML = "Geo OK";

      // Construye URL de forecast
      var url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + loc.latitude +
        "&longitude=" + loc.longitude +
        "&current_weather=true" +
        "&hourly=temperature_2m,precipitation_probability";

      el("updated").innerHTML = "Clima en ruta…";

      xhrGet(url, function (data) {

        if (!data || !data.current_weather) {
          el("cond").innerHTML = "Sin clima";
          el("updated").innerHTML = "Clima falló";
          return;
        }

        el("temp").innerHTML =
          Math.round(data.current_weather.temperature) + "°C";

        el("cond").innerHTML =
          "Viento " + Math.round(data.current_weather.windspeed) + " km/h";
        /* ===== Badge de lluvia ===== */

            var rain = data.hourly.precipitation_probability;
            var rainMax = 0;

            for (var i = 0; i < 6; i++) {
            if (rain[i] > rainMax) {
                rainMax = rain[i];
            }
            }

            if (rainMax >= 70) {
            el("cond").innerHTML += " · 🌧️ Alta probabilidad de lluvia";
            } else if (rainMax >= 40) {
            el("cond").innerHTML += " · ☁️ Posible lluvia";
            } else {
            el("cond").innerHTML += " · ☀️ Sin lluvia próxima";
            }
        el("updated").innerHTML = "Datos OK";

        var html = "";
        var times = data.hourly.time;
        var temps = data.hourly.temperature_2m;
        var rain = data.hourly.precipitation_probability;

        var max = Math.min(6, times.length);

        for (var i = 0; i < max; i++) {
          var timeStr = times[i].substr(11, 5);
          html += "<div>" +
            timeStr + " · " +
            Math.round(temps[i]) + "°C · " +
            (rain[i] != null ? rain[i] + "%" : "—") +
            "</div>";
        }

        el("hourly").innerHTML = html;

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
