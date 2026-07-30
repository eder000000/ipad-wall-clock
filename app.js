(function () {

  function el(id) {
    return document.getElementById(id);
  }

  function setHtml(id, value) {
    var node = el(id);
    if (node) node.innerHTML = value;
  }

  var C = window.DASH_CONFIG;

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function startClock() {
    function tick() {
      var d = new Date();

      setHtml("time", pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()));

      var months = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];

      setHtml("date", d.getDate() + " de " + months[d.getMonth()] + " de " + d.getFullYear());
    }

    tick();
    setInterval(tick, 1000);
  }

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

      setHtml("temp", Math.round(data.current_weather.temperature) + "°C");

      setHtml(
        "cond",
        iconNow + " · Viento " + Math.round(data.current_weather.windspeed) + " km/h"
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

        setHtml("cate-q", "Pregunta " + item.id + ": " + item.q);
        setHtml("cate-a", "“" + item.a + "”");
      });
    });
  }

  function escapeHtml(value) {
    return String(value === null || typeof value === "undefined" ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeCategory(value) {
    return String(value || "general")
      .toLowerCase()
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "general";
  }

  function parseLocalDate(dateString, timeString) {
    var dateParts = String(dateString || "").split("-");
    var timeParts = String(timeString || "00:00").split(":");

    if (dateParts.length !== 3) return null;

    return new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10),
      parseInt(timeParts[0], 10) || 0,
      parseInt(timeParts[1], 10) || 0,
      0
    );
  }

  function dateKey(date) {
    return date.getFullYear() + "-" +
      pad(date.getMonth() + 1) + "-" +
      pad(date.getDate());
  }

  function normalizeEventsPayload(payload) {
    var source = payload && payload.events ? payload.events : [];
    var events = [];

    for (var i = 0; i < source.length; i++) {
      var raw = source[i] || {};
      var activeValue =
        typeof raw.active === "undefined" ? raw.activo : raw.active;
      var inactive =
        activeValue === false ||
        String(activeValue).toLowerCase() === "no" ||
        String(activeValue).toLowerCase() === "false" ||
        String(activeValue) === "0";
      var event = {
        id: raw.id || "event-" + i,
        date: String(raw.date || raw.fecha || "").substr(0, 10),
        time: String(raw.time || raw.hora || "").substr(0, 5),
        title: raw.title || raw.titulo || "Evento",
        category: raw.category || raw.categoria || "General"
      };

      if (!inactive && event.date && event.title) events.push(event);
    }

    events.sort(function (left, right) {
      return parseLocalDate(left.date, left.time).getTime() -
        parseLocalDate(right.date, right.time).getTime();
    });

    return {
      updatedAt: payload && payload.updatedAt ? payload.updatedAt : "",
      events: events
    };
  }

  function saveEventsCache(payload) {
    try {
      window.localStorage.setItem(
        C.eventsCacheKey || "ipadWallClockEventsV1",
        JSON.stringify(payload)
      );
    } catch (e) {
      /* localStorage may be unavailable in private browsing. */
    }
  }

  function readEventsCache() {
    try {
      var value = window.localStorage.getItem(
        C.eventsCacheKey || "ipadWallClockEventsV1"
      );
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  }

  function renderCalendar(payload, status) {
    var now = new Date();
    var events = payload.events || [];
    var eventsByDate = {};
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var offset = (firstDay.getDay() + 6) % 7;
    var months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    var days = [
      "Domingo", "Lunes", "Martes", "Miércoles",
      "Jueves", "Viernes", "Sábado"
    ];
    var html = "";
    var i;

    for (i = 0; i < events.length; i++) {
      eventsByDate[events[i].date] = true;
    }

    setHtml("calendar-month", months[month] + " " + year);

    for (i = 0; i < offset; i++) {
      html += '<div class="calendar-day empty">0</div>';
    }

    for (i = 1; i <= daysInMonth; i++) {
      var key = year + "-" + pad(month + 1) + "-" + pad(i);
      var className = "calendar-day";
      if (key === dateKey(now)) className += " today";
      if (eventsByDate[key]) className += " has-event";
      html += '<div class="' + className + '">' + i + "</div>";
    }

    setHtml("calendar-grid", html);

    html = "";
    var beginningOfToday = new Date(year, month, now.getDate());
    var shown = 0;
    var max = C.maxUpcomingEvents || 3;

    for (i = 0; i < events.length && shown < max; i++) {
      var eventDate = parseLocalDate(events[i].date, events[i].time);

      if (eventDate && eventDate >= beginningOfToday) {
        var label = days[eventDate.getDay()] + " " +
          eventDate.getDate() + " " + months[eventDate.getMonth()];
        if (events[i].time) label += " · " + events[i].time;

        html +=
          '<div class="calendar-event category-' +
          escapeHtml(normalizeCategory(events[i].category)) + '">' +
          '<span class="event-dot"></span>' +
          '<div><div class="event-title">' +
          escapeHtml(events[i].title) +
          '</div><div class="event-meta">' +
          escapeHtml(label) +
          "</div></div></div>";
        shown++;
      }
    }

    setHtml(
      "calendar-events",
      html || '<div class="calendar-empty">No hay eventos próximos</div>'
    );
    setHtml("calendar-status", escapeHtml(status));
  }

  function loadCalendarFallback(status) {
    var fallbackUrl = C.eventsFallbackUrl || "./data/events-fallback.json";
    var separator = fallbackUrl.indexOf("?") === -1 ? "?" : "&";

    xhrGet(fallbackUrl + separator + "_=" + new Date().getTime(), function (data) {
      if (data && data.events) {
        var normalized = normalizeEventsPayload(data);
        saveEventsCache(normalized);
        renderCalendar(normalized, status);
        return;
      }

      var cached = readEventsCache();
      if (cached && cached.events) {
        renderCalendar(
          normalizeEventsPayload(cached),
          "Mostrando la última agenda guardada"
        );
        return;
      }

      renderCalendar({ events: [] }, "No se pudo cargar la agenda");
    });
  }

  function loadCalendar() {
    var remoteUrl = String(C.eventsUrl || "").replace(/^\s+|\s+$/g, "");
    setHtml("calendar-status", "Actualizando agenda…");

    if (!remoteUrl) {
      loadCalendarFallback("Agenda local");
      return;
    }

    var separator = remoteUrl.indexOf("?") === -1 ? "?" : "&";

    xhrGet(remoteUrl + separator + "_=" + new Date().getTime(), function (data) {
      if (data && data.events) {
        var normalized = normalizeEventsPayload(data);
        saveEventsCache(normalized);
        renderCalendar(normalized, "Agenda actualizada");
        return;
      }

      var cached = readEventsCache();
      if (cached && cached.events) {
        renderCalendar(
          normalizeEventsPayload(cached),
          "Mostrando la última agenda guardada"
        );
        return;
      }

      loadCalendarFallback("Agenda de respaldo");
    });
  }

  function applyNightMode() {
    var h = new Date().getHours();

    document.body.className =
      h >= 20 || h < 6
        ? "night"
        : "";
  }

  function main() {
    startClock();
    startBackgrounds();

    applyNightMode();
    setInterval(applyNightMode, 60000);

    setTimeout(loadWeather, 2000);
    setInterval(loadWeather, C.weatherRefreshMs);

    loadCatechism();
    setInterval(loadCatechism, 24 * 60 * 60 * 1000);

    loadCalendar();
    setInterval(loadCalendar, C.eventsRefreshMs || (15 * 60 * 1000));
  }

  document.addEventListener("DOMContentLoaded", main);

})();
