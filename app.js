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
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
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
      bg.style.backgroundImage =
        'url("' + list[i] + '")';
    }

    change();
    setInterval(change,
      C.backgroundRotateMs);
  }

  /* ===== XHR ===== */

  function xhrGet(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 &&
          xhr.status === 200) {
        try {
          cb(JSON.parse(
            xhr.responseText));
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
    el("cond").innerHTML =
      "Cargando clima…";
    el("hourly").innerHTML =
      "Cargando…";
    el("updated").innerHTML =
      "Actualizando…";

    var lat = 20.6505244;
    var lon = -103.4429582;

    el("city").innerHTML =
      "Zapopan, Jalisco";

    var url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat +
      "&longitude=" + lon +
      "&current_weather=true" +
      "&hourly=temperature_2m,precipitation_probability,cloudcover" +
      "&forecast_days=1" +
      "&timezone=America/Mexico_City";

    xhrGet(url, function (data) {

      if (!data ||
          !data.hourly ||
          !data.current_weather) {
        el("cond").innerHTML =
          "Sin clima";
        return;
      }

      /* Temp actual */
      el("temp").innerHTML =
        Math.round(
          data.current_weather.temperature
        ) + "°C";

      /* Arrays */
      var times =
        data.hourly.time;
      var temps =
        data.hourly.temperature_2m;
      var rain =
        data.hourly.precipitation_probability;
      var clouds =
        data.hourly.cloudcover;

      /* Hora actual index */
      var now =
        new Date();
      var currentHour =
        now.getHours();
      var idxNow = 0;

      for (var i = 0;
           i < times.length;
           i++) {

        var h =
          parseInt(
            times[i].substr(11,2),
            10
          );

        if (h === currentHour) {
          idxNow = i;
          break;
        }
      }

      /* Icono actual */
      var rainNow = rain[idxNow];
      var cloudNow = clouds[idxNow];

      var isDayNow =
        (currentHour >= 6 &&
        currentHour < 18);

      var iconNow;

      if (rainNow >= 60) {
        iconNow = "🌧️";
      }
      else if (cloudNow <= 20) {
        iconNow =
          isDayNow
          ? "☀️"
          : "🌙";
      }
      else if (cloudNow <= 60) {
        iconNow =
          isDayNow
          ? "⛅"
          : "🌙☁️";
      }
      else {
        iconNow = "☁️";
      }

      el("cond").innerHTML =
        iconNow +
        " · Viento " +
        Math.round(
          data.current_weather.windspeed
        ) +
        " km/h";

      /* ===== Próximas horas CONTINUAS ===== */

      var html = "";

      /* Always show next 6 hours */
      for (var j = 0; j < 6; j++) {

        /* Wrap across midnight */
        var idx =
          (idxNow + j) % times.length;

        var hourNum =
          parseInt(
            times[idx].substr(11,2),
            10
          );

        var label =
          (j === 0)
            ? "Ahora"
            : times[idx].substr(11,5);

        var tempVal =
          Math.round(temps[idx]);

        var rainVal =
          rain[idx];

        var cloudVal =
          clouds[idx];

        var isDay =
          (hourNum >= 6 &&
          hourNum < 18);

        /* ===== ICON LOGIC FINAL ===== */

        var icon;

        if (rainVal >= 60) {
          icon = "🌧️";
        }
        else if (cloudVal <= 20) {
          icon =
            isDay
            ? "☀️"
            : "🌙";
        }
        else if (cloudVal <= 60) {
          icon =
            isDay
            ? "⛅"
            : "🌙☁️";
        }
        else {
          icon = "☁️";
        }

        var rowClass =
          (rainVal >= 50)
            ? "rain-high"
            : "";

        html +=
          "<div class='hour-row " +
          rowClass +
          "'>" +
          label + " · " +
          tempVal +
          "°C · " +
          icon +
          " " +
          rainVal +
          "%" +
          "</div>";
      }

      el("hourly").innerHTML =
        html;

      el("updated").innerHTML =
        "Datos OK";
    });
  }

  /* ===== CATECHISM ===== */

  function loadCatechism() {

    function xhrGetLocal(url, cb) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 &&
            xhr.status === 200) {
          try {
            cb(JSON.parse(
              xhr.responseText));
          } catch (e) {
            cb(null);
          }
        }
      };
      xhr.send();
    }

    var now = new Date();
    var start =
      new Date(now.getFullYear(),0,0);
    var diff =
      now - start;
    var dayOfYear =
      Math.floor(diff/86400000);

    var index =
      Math.floor(dayOfYear/3);

    xhrGetLocal(
      "data/westminster-meta.json",
      function (meta) {

      if (!meta) return;

      var fileIndex =
        index % meta.files.length;

      var file =
        "data/" +
        meta.files[fileIndex];

      xhrGetLocal(file,
        function (block) {

        if (!block ||
            !block.items.length)
          return;

        var itemIndex =
          index %
          block.items.length;

        var item =
          block.items[itemIndex];

        el("cate-q").innerHTML =
          "Pregunta " +
          item.id +
          ": " +
          item.q;

        el("cate-a").innerHTML =
          "“" +
          item.a +
          "”";
      });
    });
  }

  /* ===== NIGHT MODE ===== */

  function applyNightMode() {
    var h =
      new Date().getHours();

    document.body.className =
      (h >= 20 || h < 6)
        ? "night"
        : "";
  }

  /* ===== MAIN ===== */

  function main() {

    startClock();
    startBackgrounds();

    applyNightMode();
    setInterval(
      applyNightMode,
      60000
    );

    setTimeout(
      loadWeather,
      2000
    );

    setInterval(
      loadWeather,
      C.weatherRefreshMs
    );

    loadCatechism();
  }

  document.addEventListener(
    "DOMContentLoaded",
    main
  );

})();
