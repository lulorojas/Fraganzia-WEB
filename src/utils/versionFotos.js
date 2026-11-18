// Versión de las copias locales de las fotos (public/img/p/<hash>-400.webp y -800.webp).
//
// El hosting las guarda en el navegador 30 días bajo el mismo nombre de archivo. Cuando cambia el CONTENIDO de una foto
// sin cambiar su nombre (por ejemplo, al aplicar fotos con caja en lugar de las de solo frasco), quien ya la vio seguiría
// viendo la vieja. Subir este número agrega `?v=N` al enlace y todos los navegadores la bajan de nuevo.
//
// Subirla cada vez que se regeneren fotos que ya estaban publicadas (tools/aplicar-fotos-alternativas.mjs).
// Las fotos NUEVAS no la necesitan: nadie las tiene en caché.
export const VERSION_FOTOS = 4;
