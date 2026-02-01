// config.js
window.DASH_CONFIG = {
  locationQuery: "Zapopan, Jalisco, Mexico",
  timezone: "America/Mexico_City",

  // Fondos (archivos dentro de /assets)
  backgrounds: [
    "assets/bg-01.jpg",
    "assets/bg-02.jpg",
    "assets/bg-03.jpg",
    "assets/bg-04.jpg",
    "assets/bg-05.jpg",
  ],

  // Cada cuánto cambia el fondo (ms)
  backgroundRotateMs: 5 * 60 * 1000, // 5 min

  // Cada cuánto refresca el clima (ms)
  weatherRefreshMs: 5 * 60 * 1000, // 5 min

  // Ventana para “próximas horas”
  nextHoursToShow: 6,

  // Umbrales para avisos
  rainProbNotice: 40,  // % (mostrar “posible lluvia”)
  rainProbWarn: 70,    // % (mostrar “alta probabilidad”)
  heavyRainMmPerHr: 3, // mm/h (aprox, para “lluvia fuerte”)
};
