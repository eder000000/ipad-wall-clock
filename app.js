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

      var months = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];

      el("date").innerHTML =
        d.getDate() + " de " +
        months[d.getMonth()] + " de " +
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

          /* Datos hourly */
          var times = data.hourly.time;
          var temps = data.hourly.temperature_2m;
          var rain = data.hourly.precipitation_probability;

          if (!times || !temps || !rain) {
            el("hourly").innerHTML = "Sin datos horarios";
            return;
          }

          /* ===== Próximas horas dinámicas PRO ===== */

          var html = "";
          var now = new Date();
          var currentHour = now.getHours();

          var startIndex = 0;

          for (var k = 0; k < times.length; k++) {

            var hourStr = times[k].substr(11, 2);
            var hourNum = parseInt(hourStr, 10);

            if (hourNum === currentHour) {
              startIndex = k;
              break;
            }
          }

          var rainMax = 0;

          for (var r = 0; r < 6; r++) {
            if (rain[startIndex + r] > rainMax) {
              rainMax = rain[startIndex + r];
            }
          }

          if (rainMax >= 70) {
            el("cond").innerHTML += " · 🌧️ Alta prob. lluvia";
          } else if (rainMax >= 40) {
            el("cond").innerHTML += " · ☁️ Posible lluvia";
          } else {
            el("cond").innerHTML += " · ☀️ Sin lluvia";
          }

          for (var j = 0; j < 6; j++) {

            var idx = startIndex + j;
            if (!times[idx]) break;

            var hourNum2 =
              parseInt(times[idx].substr(11, 2), 10);

            var hourLabel =
              (j === 0)
                ? "Ahora"
                : times[idx].substr(11, 5);

            var tempVal = Math.round(temps[idx]);
            var rainVal = rain[idx];

            var icon =
              (hourNum2 >= 6 && hourNum2 < 18)
                ? "☀️"
                : "🌙";

            var rainBadge = "";
            var rowClass = "";

            if (rainVal >= 50) {
              rainBadge = " 🌧️";
              rowClass = "rain-high";
            }

            html +=
              "<div class='hour-row " + rowClass + "'>" +
              hourLabel + " · " +
              tempVal + "°C · " +
              icon + " " +
              rainVal + "%" +
              rainBadge +
              "</div>";
          }

          el("hourly").innerHTML = html;
          el("updated").innerHTML = "Datos OK";
        });
      }
    );
  }

  /* ===== CATECHISM ===== */

  function loadCatechism() {

    function xhrGetLocal(url, cb) {
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

    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var dayOfYear = Math.floor(diff / 86400000);

    var index = Math.floor(dayOfYear / 3);

    xhrGetLocal("data/westminster-meta.json", function (meta) {
      if (!meta) return;

      var fileIndex = index % meta.files.length;
      var file = "data/" + meta.files[fileIndex];

      xhrGetLocal(file, function (block) {
        if (!block || !block.items || !block.items.length) return;

        var itemIndex = index % block.items.length;
        var item = block.items[itemIndex];

        el("cate-q").innerHTML =
          "Pregunta " + item.id + ": " + item.q;

        el("cate-a").innerHTML =
          "“" + item.a + "”";
      });
    });
  }

  /* ===== NIGHT MODE ===== */

  function applyNightMode() {
    var h = new Date().getHours();

    if (h >= 20 || h < 6) {
      document.body.className = "night";
    } else {
      document.body.className = "";
    }
  }

  /* ===== MAIN ===== */

  function main() {
    startClock();
    startBackgrounds();

    applyNightMode();
    setInterval(applyNightMode, 60000);

    setTimeout(loadWeather, 2000);
    setInterval(loadWeather, C.weatherRefreshMs);

    loadCatechism();
  }

  document.addEventListener("DOMContentLoaded", main);

})();
