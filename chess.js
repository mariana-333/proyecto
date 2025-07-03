const letras = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const tablero = [];

for (let y = 7; y >= 0; y--) {
  const fila = [];
  for (let x = 0; x < 8; x++) {
    fila.push(letras[x] + (y + 1));
  }
  tablero.push(fila);
}

function crearTablero() {
    const tablero = Array.from({ length: 8 }, () => Array(8).fill(null));
  
    const piezas = ['torre', 'caballo', 'alfil', 'reina', 'rey', 'alfil', 'caballo', 'torre'];
  
    // Blancas
    for (let x = 0; x < 8; x++) {
      tablero[7][x] = { tipo: piezas[x], color: 'blanca' };
      tablero[6][x] = { tipo: 'peon', color: 'blanca' };
    }
  
    // Negras
    for (let x = 0; x < 8; x++) {
      tablero[0][x] = { tipo: piezas[x], color: 'negra' };
      tablero[1][x] = { tipo: 'peon', color: 'negra' };
    }
  
    return tablero;
}

function movimientosCaballo(x, y) {
    const movimientos = [
      [2, 1], [1, 2],
      [-1, 2], [-2, 1],
      [-2, -1], [-1, -2],
      [1, -2], [2, -1]
    ];
  
    const movimientosValidos = [];
  
    for (const [dx, dy] of movimientos) {
      const nx = x + dx;
      const ny = y + dy;
  
      // Verificar si está dentro del tablero
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        movimientosValidos.push([nx, ny]);
      }
    }
  
    return movimientosValidos;
}

function movimientosAlfil(x, y) {
    const movimientos = [];
  
    for (let i = 1; i < 8; i++) {
      if (x + i < 8 && y + i < 8) movimientos.push([x + i, y + i]);
      if (x - i >= 0 && y + i < 8) movimientos.push([x - i, y + i]);
      if (x + i < 8 && y - i >= 0) movimientos.push([x + i, y - i]);
      if (x - i >= 0 && y - i >= 0) movimientos.push([x - i, y - i]);
    }
  
    return movimientos;
}

function movimientosTorre(x, y) {
    const movimientos = [];
  
    for (let i = 0; i < 8; i++) {
      if (i !== x) movimientos.push([i, y]); // Horizontal
      if (i !== y) movimientos.push([x, i]); // Vertical
    }
  
    return movimientos;
}
  
function movimientosReina(x, y) {
    return [...movimientosTorre(x, y), ...movimientosAlfil(x, y)];
}

function movimientosRey(x, y) {
    const movimientos = [];
  
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < 8 && ny < 8) {
          movimientos.push([nx, ny]);
        }
      }
    }
  
    return movimientos;
}

function movimientosPeon(x, y, color = 'blanca') {
    const dir = color === 'blanca' ? -1 : 1;
    const inicioFila = color === 'blanca' ? 6 : 1;
    const movimientos = [];
  
    const ny = y + dir;
    if (ny >= 0 && ny < 8) {
      movimientos.push([x, ny]); // Movimiento normal
      if (y === inicioFila && ny + dir >= 0 && ny + dir < 8) {
        movimientos.push([x, ny + dir]); // Doble avance
      }
    }
  
    // Capturas diagonales (no consideramos piezas enemigas por ahora)
    if (x > 0 && ny >= 0 && ny < 8) movimientos.push([x - 1, ny]);
    if (x < 7 && ny >= 0 && ny < 8) movimientos.push([x + 1, ny]);
  
    return movimientos;
}

// Exportar las funciones
module.exports = {
    movimientosCaballo,
    movimientosAlfil,
    movimientosTorre,
    movimientosReina,
    movimientosRey,
    movimientosPeon,
    crearTablero
};