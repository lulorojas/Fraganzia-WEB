// Indica si la app arrancó hidratando el HTML pre-generado (ver main.jsx).
//
// El HTML pre-generado se arma sin datos del visitante. Si durante la
// hidratación un componente lee localStorage (carrito, favoritos), React ve un
// árbol distinto al del HTML, descarta todo y tira errores #418/#423. Los
// proveedores usan esto para arrancar vacíos al hidratar y cargar lo guardado
// recién después de montar.
let hidratando = false;

export const marcarHidratacion = (valor) => {
  hidratando = valor;
};

export const estaHidratando = () => hidratando;
