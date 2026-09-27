// Convierte los <link rel="preload" as="style"> de Google Fonts a
// stylesheet una vez que terminan de descargar, para que no bloqueen el
// primer render. Vive en un archivo externo (no inline) porque la CSP del
// sitio usa script-src 'self' sin 'unsafe-inline'.
(function () {
  var links = document.querySelectorAll('link[rel="preload"][as="style"]');
  links.forEach(function (link) {
    link.addEventListener('load', function () {
      link.rel = 'stylesheet';
    });
  });
})();
