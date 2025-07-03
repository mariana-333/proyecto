// document.addEventListener("DOMContentLoaded", function () {
//     let piezaArrastrada = null;
//     let posicionInicial = null;

//     // Cuando empieza a arrastrar una pieza
//     document.querySelectorAll(".pieza").forEach(pieza => {
//         pieza.addEventListener("dragstart", (e) => {
//             piezaArrastrada = pieza;
//             // Obtener la posición inicial desde la clase CSS "pos"
//             posicionInicial = pieza.parentElement.classList.contains('pos')
//                 ? pieza.parentElement.classList[2] // Clase que contiene la posición (ej: "a2")
//                 : null;
//             setTimeout(() => pieza.style.display = "none", 0);
//         });

//         pieza.addEventListener("dragend", (e) => {
//             pieza.style.display = "";
//         });
//     });

//     // Habilita cada casilla como zona de "soltar"
//     document.querySelectorAll(".tablero > div").forEach(casilla => {
//         casilla.addEventListener("dragover", (e) => {
//             e.preventDefault(); // Necesario para permitir drop
//         });

//         casilla.addEventListener("drop", (e) => {
//             e.preventDefault();
//             if (piezaArrastrada) {
//                 // Obtener la posición final desde la clase CSS "pos"
//                 const posicionFinal = casilla.classList.contains('pos')
//                     ? casilla.classList[2] // Clase que contiene la posición (ej: "a3")
//                     : null;

//                 // Validar el movimiento
//                 fetch(`/validar-movimiento`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         pieza: piezaArrastrada.dataset.tipo, // Tipo de pieza (ej: "caballo")
//                         color: piezaArrastrada.classList[1], // Color de la pieza
//                         inicial: posicionInicial,
//                         final: posicionFinal
//                     })
//                 })
//                 .then(res => res.json())
//                 .then(data => {
//                     if (data.valido) {
//                         // Mover la pieza si el movimiento es válido
//                         casilla.innerHTML = "";
//                         casilla.appendChild(piezaArrastrada);
//                     } else {
//                     }
//                     piezaArrastrada = null;
//                 });
//             }
//         });
//     });
// });