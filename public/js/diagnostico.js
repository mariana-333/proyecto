// Script de diagnóstico para el botón de rendirse
console.log('🔍 DIAGNÓSTICO - Verificando elementos del tablero');

// Verificar que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarElementos);
} else {
    verificarElementos();
}

function verificarElementos() {
    console.log('📋 Estado del DOM:', document.readyState);
    
    // Verificar botón de rendirse
    const botonRendirse = document.getElementById('rendirse');
    console.log('🔴 Botón de rendirse:', botonRendirse);
    
    if (botonRendirse) {
        console.log('✅ Botón encontrado - Verificando event listeners...');
        
        // Agregar event listener de prueba
        botonRendirse.addEventListener('click', function(e) {
            console.log('🖱️ CLICK DETECTADO en botón de rendirse!');
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar modal
            const modal = document.getElementById('surrender-modal');
            console.log('📋 Modal de rendición:', modal);
            
            if (modal) {
                console.log('✅ Modal encontrado - Mostrando...');
                modal.classList.add('show');
                console.log('📄 Clases del modal:', modal.className);
            } else {
                console.error('❌ Modal no encontrado');
            }
        });
        
        console.log('✅ Event listener de prueba agregado');
    } else {
        console.error('❌ No se encontró el botón con ID "rendirse"');
        
        // Buscar todos los botones para debugging
        const botones = document.querySelectorAll('button');
        console.log('🔍 Todos los botones encontrados:', botones);
    }
    
    // Verificar modal
    const modal = document.getElementById('surrender-modal');
    console.log('📋 Modal de rendición:', modal);
    
    // Verificar TableroAjedrez
    setTimeout(() => {
        console.log('🎯 Verificando instancia de TableroAjedrez...');
        if (window.tablero) {
            console.log('✅ Instancia encontrada:', window.tablero);
        } else {
            console.log('❌ No se encontró instancia global de TableroAjedrez');
        }
    }, 1000);
}
