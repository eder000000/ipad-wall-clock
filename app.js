(function () {

  function el(id) {
    return document.getElementById(id);
  }

  function setHtml(id, value) {
    var node = el(id);
    if (node) node.innerHTML = value;
  }

  var C = window.DASH_CONFIG;

  /* ===== CLOCK ===== */

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function startClock() {
    function tick() {
      var d = new Date();

      setHtml(
        "time",
        pad(d.getHours()) + ":" +
        pad(d.getMinutes()) + ":" +
        pad(d.getSeconds())
      );

      var months = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];

      setHtml(
        "date",
        d.getDate() + " de " +
        months[d.getMonth()] + " de " +
        d.getFullYear()
      );
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ===== BACKGROUND ===== */

  function startBackgrounds() {
    var bg = el("bg");
    var list = C.backgrounds;

    if (!bg || !list || !list.length) return;

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
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            cb(JSON.parse(xhr.responseText));
          } catch (e) {
            cb(null);
          }
        } else {
          cb(null);
        }
      }
    };

    xhr.onerror = function () {
      cb(null);
    };

    xhr.send();
  }

  /* ===== WEATHER ===== */

  function getWeatherIcon(rainVal, cloudVal, hourNum) {
    var isDay = hourNum >= 6 && hourNum < 18;

    if (rainVal >= 60) return "🌧️";
    if (cloudVal <= 20) return isDay ? "☀️" : "🌙";
    if (cloudVal <= 60) return isDay ? "⛅" : "🌙☁️";
    return "☁️";
  }

  function loadWeather() {
    setHtml("temp", "--°C");
    setHtml("cond", "Cargando clima…");
    setHtml("hourly", "Cargando…");
    setHtml("updated", "Actualizando…");

    var lat = 20.7214;
    var lon = -103.3918;

    setHtml("city", "Zapopan, Jalisco");

    var url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat +
      "&longitude=" + lon +
      "&current_weather=true" +
      "&hourly=temperature_2m,precipitation_probability,cloudcover" +
      "&forecast_days=2" +
      "&timezone=America/Mexico_City";

    xhrGet(url, function (data) {

      if (!data || !data.hourly || !data.current_weather) {
        setHtml("cond", "Sin clima");
        setHtml("hourly", "Sin datos horarios");
        return;
      }

      var times = data.hourly.time;
      var temps = data.hourly.temperature_2m;
      var rain = data.hourly.precipitation_probability;
      var clouds = data.hourly.cloudcover;

      if (!times || !temps || !rain || !clouds) {
        setHtml("hourly", "Sin datos horarios");
        return;
      }

      var now = new Date();
      var currentHour = now.getHours();
      var idxNow = 0;

      for (var i = 0; i < times.length; i++) {
        var h = parseInt(times[i].substr(11, 2), 10);

        if (h === currentHour) {
          idxNow = i;
          break;
        }
      }

      var rainNow = rain[idxNow];
      var cloudNow = clouds[idxNow];
      var iconNow = getWeatherIcon(rainNow, cloudNow, currentHour);

      setHtml(
        "temp",
        Math.round(data.current_weather.temperature) + "°C"
      );

      setHtml(
        "cond",
        iconNow +
        " · Viento " +
        Math.round(data.current_weather.windspeed) +
        " km/h"
      );

      var html = "";

      for (var j = 0; j < 6; j++) {
        var idx = idxNow + j;
        if (!times[idx]) break;

        var hourNum = parseInt(times[idx].substr(11, 2), 10);
        var label = j === 0 ? "Ahora" : times[idx].substr(11, 5);

        var tempVal = Math.round(temps[idx]);
        var rainVal = rain[idx];
        var cloudVal = clouds[idx];
        var icon = getWeatherIcon(rainVal, cloudVal, hourNum);

        var rowClass = rainVal >= 50 ? "rain-high" : "";

        html +=
          "<div class='hour-row " + rowClass + "'>" +
          label + " · " +
          tempVal + "°C · " +
          icon + " " +
          rainVal + "%" +
          "</div>";
      }

      setHtml("hourly", html);
      setHtml("updated", "Datos OK");
    });
  }

  /* ===== CATECHISM ===== */

  function loadCatechism() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var dayOfYear = Math.floor(diff / 86400000);
    var index = Math.floor(dayOfYear / 3);

    xhrGet("./data/westminster-meta.json", function (meta) {
      if (!meta || !meta.files || !meta.files.length) return;

      var fileIndex = index % meta.files.length;
      var file = "./data/" + meta.files[fileIndex];

      xhrGet(file, function (block) {
        if (!block || !block.items || !block.items.length) return;

        var itemIndex = index % block.items.length;
        var item = block.items[itemIndex];

        setHtml(
          "cate-q",
          "Pregunta " + item.id + ": " + item.q
        );

        setHtml(
          "cate-a",
          "“" + item.a + "”"
        );
      });
    });
  }

  /* ===== WORLD CUP ===== */

  function formatMatchDate(dateStr) {
    if (!dateStr) return "";

    var parts = dateStr.split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);

    var date = new Date(y, m, d);

    var days = [
      "Domingo", "Lunes", "Martes", "Miércoles",
      "Jueves", "Viernes", "Sábado"
    ];

    var months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return days[date.getDay()] + " " + d + " " + months[m];
  }

  function flagFromCode(code) {
    if (!code || code.length !== 2 || !String.fromCodePoint) {
      return code || "";
    }

    code = code.toUpperCase();

    var first = code.charCodeAt(0) - 65 + 127462;
    var second = code.charCodeAt(1) - 65 + 127462;

    return String.fromCodePoint(first) + String.fromCodePoint(second);
  }

  function renderFlag(value) {
    if (!value) return "";

    var clean = String(value).toUpperCase();

    if (/^[A-Z]{2}$/.test(clean)) {
      return flagFromCode(clean);
    }

    return value;
  }

  function loadWorldCupWidget() {
    xhrGet("./data/worldcup-2026.json", function (data) {

      if (!data || !data.items || !data.items.length) {
        setHtml("wc-title", "Sin calendario");
        setHtml("wc-games", "");
        return;
      }

      var now = new Date();

      var today =
        now.getFullYear() + "-" +
        pad(now.getMonth() + 1) + "-" +
        pad(now.getDate());

      var todayGames = [];
      var nextGames = [];

      for (var i = 0; i < data.items.length; i++) {
        var g = data.items[i];
        var gameDate = g.date_mx || g.date;

        if (gameDate === today) {
          todayGames.push(g);
        } else if (gameDate > today) {
          nextGames.push(g);
        }
      }

      var list;
      var title;

      if (todayGames.length > 0) {
        list = todayGames;
        title = "Hoy";
      } else {
        list = nextGames;
        title = "Próximos partidos";
      }

      setHtml("wc-title", title);

      var html = "";
      var max = list.length < 3 ? list.length : 3;

      if (max === 0) {
        setHtml("wc-games", "No hay partidos próximos");
        return;
      }

      for (var j = 0; j < max; j++) {
        var game = list[j];

        var date = game.date_mx || game.date;
        var time = game.time_mx || game.time || "";
        var homeFlag = renderFlag(game.home_flag || game.home_code);
        var awayFlag = renderFlag(game.away_flag || game.away_code);

        html +=
          "<div class='wc-game'>" +
          "<span class='wc-time'>" +
          formatMatchDate(date) + " · " + time +
          "</span><br>" +
          homeFlag + " " + game.home +
          " vs " +
          awayFlag + " " + game.away +
          "<br><span class='wc-venue'>" +
          game.venue + " · " + game.city +
          "</span>" +
          "</div>";
      }

      setHtml("wc-games", html);
    });
  }

  /* ===== NIGHT MODE ===== */

  function applyNightMode() {
    var h = new Date().getHours();

    document.body.className =
      h >= 20 || h < 6
        ? "night"
        : "";
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
    setInterval(loadCatechism, 24 * 60 * 60 * 1000);

    loadWorldCupWidget();
    setInterval(loadWorldCupWidget, 60 * 60 * 1000);
  }

  document.addEventListener("DOMContentLoaded", main);

})();