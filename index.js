require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars') 
const path = require('path');
const bodyParser = require('body-parser')
const { movimientosCaballo, movimientosAlfil, movimientosTorre, movimientosReina, movimientosRey, movimientosPeon } = require('./chess');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const User = require('./models/User');
const session = require('express-session');
const Game = require('./models/Game');
const Invitation = require('./models/Invitation');
const { v4: uuidv4 } = require('uuid');

const app = express()
const port = process.env.PORT || 3000
const usuarios = []

// Conexión a MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessdb';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// VARIABLES DE ESTADO DEL JUEGO
let turnoActual = 'blanca'; 
let estadoJuego = 'en-curso';
let estadoTablero = null;
let ultimoMovimiento = null;
let contadorMovimientos = 0;
let historialMovimientos = [];

// MIDDLEWARE - DEBE IR ANTES QUE LAS RUTAS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// CONFIGURACIÓN DE HANDLEBARS
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        baseUrl: () => '',
        increment: value => value + 1,
        eq: (a, b) => a === b,
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

// FUNCIÓN PARA GENERAR TABLERO
const generarTablero = () => {
    const files = [8, 7, 6, 5, 4, 3, 2, 1];
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const piezas = {
        a8: { tipo: 'torre', color: 'negra' },
        b8: { tipo: 'caballo', color: 'negra' },
        c8: { tipo: 'alfil', color: 'negra' },
        d8: { tipo: 'reina', color: 'negra' },
        e8: { tipo: 'rey', color: 'negra' },
        f8: { tipo: 'alfil', color: 'negra' },
        g8: { tipo: 'caballo', color: 'negra' },
        h8: { tipo: 'torre', color: 'negra' },
        a7: { tipo: 'peon', color: 'negra' },
        b7: { tipo: 'peon', color: 'negra' },
        c7: { tipo: 'peon', color: 'negra' },
        d7: { tipo: 'peon', color: 'negra' },
        e7: { tipo: 'peon', color: 'negra' },
        f7: { tipo: 'peon', color: 'negra' },
        g7: { tipo: 'peon', color: 'negra' },
        h7: { tipo: 'peon', color: 'negra' },
        a2: { tipo: 'peon', color: 'blanca' },
        b2: { tipo: 'peon', color: 'blanca' },
        c2: { tipo: 'peon', color: 'blanca' },
        d2: { tipo: 'peon', color: 'blanca' },
        e2: { tipo: 'peon', color: 'blanca' },
        f2: { tipo: 'peon', color: 'blanca' },
        g2: { tipo: 'peon', color: 'blanca' },
        h2: { tipo: 'peon', color: 'blanca' },
        a1: { tipo: 'torre', color: 'blanca' },
        b1: { tipo: 'caballo', color: 'blanca' },
        c1: { tipo: 'alfil', color: 'blanca' },
        d1: { tipo: 'reina', color: 'blanca' },
        e1: { tipo: 'rey', color: 'blanca' },
        f1: { tipo: 'alfil', color: 'blanca' },
        g1: { tipo: 'caballo', color: 'blanca' },
        h1: { tipo: 'torre', color: 'blanca' }
    };

    const tablero = [];
    for (let i = 0; i < 8; i++) {
        const fila = [];
        for (let j = 0; j < 8; j++) {
            const pos = cols[j] + files[i];
            const color = (i + j) % 2 ? 'negro' : 'blanco';
            const pieza = piezas[pos] ? piezas[pos] : null;
            fila.push({ pos, color, pieza });
        }
        tablero.push(fila);
    }
    return tablero;
};

// Inicializar el estado del tablero
estadoTablero = generarTablero();

// Añade esto ANTES de las rutas y DESPUÉS de los middleware básicos
app.use(session({
    secret: process.env.SESSION_SECRET || 'chess-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Cambia a true si usas HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware para variables globales
app.use((req, res, next) => {
    res.locals.isLoggedIn = !!req.session.user;
    res.locals.currentUser = req.session.user;
    next();
});

// ===== RUTAS API =====
app.get('/turno-actual', (req, res) => {
    console.log('Turno actual solicitado:', turnoActual);
    res.json({ turno: turnoActual });
});

app.get('/estado-juego', (req, res) => {
    res.json({
        turnoActual: turnoActual,
        tablero: estadoTablero,
        estadoJuego: estadoJuego
    });
});

app.post('/rendirse', (req, res) => {
    // Debug para ver qué está llegando
    console.log('req.body completo:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { jugador } = req.body;
    
    // Validar que jugador no esté vacío
    if (!jugador) {
        return res.status(400).json({
            success: false,
            mensaje: 'El campo jugador es requerido'
        });
    }
    
    try {
        console.log('Solicitud de rendición recibida:', { 
            jugador, 
            estadoActual: estadoJuego, 
            turnoActual 
        });
        
        if (estadoJuego !== 'en-curso') {
            return res.json({
                success: false,
                mensaje: 'La partida ya ha terminado'
            });
        }
        
        if (jugador !== turnoActual) {
            return res.json({
                success: false,
                mensaje: 'Solo puedes rendirte en tu turno'
            });
        }
        
        const ganador = jugador === 'blanca' ? 'negras' : 'blancas';
        estadoJuego = `${ganador}-ganan`;
        
        console.log(`${jugador} se ha rendido. Ganador: ${ganador}`);
        
        res.json({
            success: true,
            mensaje: `${jugador === 'blanca' ? 'Blancas' : 'Negras'} se han rendido`,
            ganador: ganador,
            estadoJuego: estadoJuego
        });
        
    } catch (error) {
        console.error('Error al procesar rendición:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

app.post('/validar-movimiento', (req, res) => {
    console.log('Datos recibidos:', req.body);
    
    const { pieza, color, inicial, final } = req.body;

    if (!pieza || !color || !inicial || !final) {
        return res.status(400).json({ 
            valido: false, 
            mensaje: 'Datos incompletos' 
        });
    }

    if (color !== turnoActual) {
        return res.json({ 
            valido: false, 
            mensaje: `No es tu turno. Turno actual: ${turnoActual}` 
        });
    }

    const [colInicial, filaInicial] = [inicial[0], parseInt(inicial[1])];
    const [colFinal, filaFinal] = [final[0], parseInt(final[1])];

    const xInicial = colInicial.charCodeAt(0) - 'a'.charCodeAt(0);
    const yInicial = 8 - filaInicial;
    const xFinal = colFinal.charCodeAt(0) - 'a'.charCodeAt(0);
    const yFinal = 8 - filaFinal;

    console.log('Posiciones convertidas:', {
        inicial: [xInicial, yInicial],
        final: [xFinal, yFinal]
    });

    let movimientosValidos = [];

    try {
        switch (pieza) {
            case 'caballo':
                movimientosValidos = movimientosCaballo(xInicial, yInicial);
                break;
            case 'alfil':
                movimientosValidos = movimientosAlfil(xInicial, yInicial);
                break;
            case 'torre':
                movimientosValidos = movimientosTorre(xInicial, yInicial);
                break;
            case 'reina':
                movimientosValidos = movimientosReina(xInicial, yInicial);
                break;
            case 'rey':
                movimientosValidos = movimientosRey(xInicial, yInicial);
                break;
            case 'peon':
                movimientosValidos = movimientosPeon(xInicial, yInicial, color);
                break;
            default:
                return res.json({ 
                    valido: false, 
                    mensaje: 'Tipo de pieza no válido' 
                });
        }

        console.log('Movimientos válidos:', movimientosValidos);

        const esValido = movimientosValidos.some(([x, y]) => x === xFinal && y === yFinal);

        if (esValido) {
            turnoActual = turnoActual === 'blanca' ? 'negra' : 'blanca';
            contadorMovimientos++;
            
            // Almacenar el último movimiento para sincronización
            ultimoMovimiento = {
                id: contadorMovimientos,
                pieza,
                color,
                inicial,
                final,
                timestamp: new Date().getTime()
            };
            
            // Agregar al historial
            historialMovimientos.push(ultimoMovimiento);
            
            console.log('Nuevo turno:', turnoActual);
            console.log('Último movimiento:', ultimoMovimiento);
        }

        res.json({ 
            valido: esValido, 
            mensaje: esValido ? 'Movimiento válido' : 'Movimiento inválido',
            nuevoTurno: turnoActual,
            movimiento: esValido ? ultimoMovimiento : null,
            contadorMovimientos: contadorMovimientos
        });
    } catch (error) {
        console.error('Error en validación:', error);
        res.status(500).json({ 
            valido: false, 
            mensaje: 'Error interno del servidor' 
        });
    }
});

// Endpoint para sincronización de movimientos en tiempo real
app.get('/ultimo-movimiento/:contadorCliente', (req, res) => {
    const contadorCliente = parseInt(req.params.contadorCliente) || 0;
    
    // Si el cliente tiene un contador menor al servidor, hay movimientos nuevos
    if (contadorCliente < contadorMovimientos && ultimoMovimiento) {
        res.json({
            hayNuevoMovimiento: true,
            movimiento: ultimoMovimiento,
            turnoActual: turnoActual,
            contadorMovimientos: contadorMovimientos,
            estadoJuego: estadoJuego
        });
    } else {
        res.json({
            hayNuevoMovimiento: false,
            turnoActual: turnoActual,
            contadorMovimientos: contadorMovimientos,
            estadoJuego: estadoJuego
        });
    }
});

// Endpoint alternativo sin parámetros para inicialización
app.get('/ultimo-movimiento', (req, res) => {
    res.json({
        hayNuevoMovimiento: false,
        turnoActual: turnoActual,
        contadorMovimientos: contadorMovimientos,
        estadoJuego: estadoJuego,
        ultimoMovimiento: ultimoMovimiento
    });
});

app.post('/nueva-partida', (req, res) => {
    try {
        turnoActual = 'blanca';
        estadoJuego = 'en-curso';
        estadoTablero = generarTablero();
        ultimoMovimiento = null;
        contadorMovimientos = 0;
        historialMovimientos = [];
        
        console.log('Nueva partida iniciada - Turno actual:', turnoActual);
        
        res.json({ 
            success: true, 
            mensaje: 'Nueva partida iniciada',
            turnoActual: turnoActual,
            estadoJuego: estadoJuego,
            contadorMovimientos: contadorMovimientos
        });
    } catch (error) {
        console.error('Error al iniciar nueva partida:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error interno del servidor' 
        });
    }
});

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
    res.render('register');
});

// Ruta para procesar el registro
app.post('/register', upload.single('profilepicture'), async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            fecha,
            username,
            email,
            password,
            'confirm-password': confirmPassword
        } = req.body;

        // Verificar si las contraseñas coinciden
        if (password !== confirmPassword) {
            return res.render('register', {
                error: 'Las contraseñas no coinciden'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.render('register', {
                error: 'El usuario o email ya existe'
            });
        }

        // Crear el nuevo usuario
        const newUser = new User({
            nombres,
            apellidos,
            fechaNacimiento: fecha,
            username,
            email,
            password,
            profilePicture: req.file ? `/uploads/${req.file.filename}` : null
        });

        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error en registro:', error);
        res.render('register', {
            error: 'Error al registrar usuario'
        });
    }
});

// Modifica la ruta de login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });

        if (!user) {
            return res.render('login', {
                error: 'Usuario o contraseña incorrectos'
            });
        }

        // Guardar usuario en sesión
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,         
            nombres: user.nombres,        
            apellidos: user.apellidos   
        };

        res.redirect('/');
    } catch (error) {
        console.error('Error en login:', error);
        res.render('login', {
            error: 'Error al iniciar sesión'
        });
    }
});

// Añade la ruta de logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

// Middleware de autenticación
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// ===== RUTAS DE VISTAS =====
app.get('/', (req, res) => {
    res.render('index', {
        titulo: 'Hello World!',
        mensaje: 'Bienvenido a mi app usando Handlebars 😎'
    })
})

app.get('/play', (req, res) => {
    res.render('play')
})

app.get('/chessboard', (req, res) => {
    res.render('chessboard', { filas: generarTablero() });
});

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/publicgameplay', (req, res) => {
    res.render('publicgameplay')
})

app.get('/creategame', (req, res) => {
    res.render('creategame')
})

// Ruta POST para procesar la creación de partida
app.post('/creategame', requireLogin, async (req, res) => {
    try {
        const { color, email } = req.body;
        const userId = req.session.user.id;

        // Generar IDs únicos
        const gameId = uuidv4().substring(0, 8);
        const invitationId = uuidv4();

        // Crear nueva invitación
        const newInvitation = new Invitation({
            invitationId,
            gameId,
            owner: userId,
            ownerColor: color,
            invitedEmail: email || null
        });

        await newInvitation.save();

        // Generar enlace de invitación
        const invitationLink = `${req.protocol}://${req.get('host')}/join-game/${invitationId}`;

        console.log('Partida creada:', {
            gameId,
            invitationId,
            owner: userId,
            ownerColor: color,
            invitationLink
        });

        // Mostrar el enlace al usuario
        res.render('creategame', {
            success: true,
            invitationLink,
            gameId,
            ownerColor: color,
            message: email ? 
                `Partida creada. Enlace de invitación generado para ${email}` : 
                'Partida creada. Comparte el enlace para que alguien se una'
        });

    } catch (error) {
        console.error('Error al crear partida:', error);
        res.render('creategame', {
            error: 'Error al crear la partida. Inténtalo de nuevo.'
        });
    }
});

// Ruta para unirse a una partida usando el enlace de invitación
app.get('/join-game/:invitationId', requireLogin, async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.session.user.id;

        // Buscar la invitación
        const invitation = await Invitation.findOne({ 
            invitationId, 
            status: 'pending' 
        }).populate('owner');

        if (!invitation) {
            return res.render('invitation-status', {
                error: 'Invitación no encontrada o ya expirada'
            });
        }

        // Verificar que no sea el propietario de la partida
        if (invitation.owner._id.toString() === userId) {
            return res.render('invitation-status', {
                error: 'No puedes unirte a tu propia partida',
                gameId: invitation.gameId,
                ownerColor: invitation.ownerColor
            });
        }

        // Aceptar la invitación
        invitation.status = 'accepted';
        invitation.acceptedBy = userId;
        await invitation.save();

        // Crear el juego en la base de datos
        const newGame = new Game({
            gameId: invitation.gameId,
            owner: invitation.owner._id,
            opponent: userId,
            status: 'playing'
        });

        await newGame.save();

        console.log('Jugador se unió a la partida:', {
            gameId: invitation.gameId,
            owner: invitation.owner.username,
            opponent: req.session.user.username,
            ownerColor: invitation.ownerColor
        });

        // Mostrar página de éxito
        res.render('invitation-status', {
            success: true,
            gameId: invitation.gameId,
            opponentName: invitation.owner.username,
            playerColor: invitation.ownerColor === 'blanca' ? 'negra' : 'blanca'
        });

    } catch (error) {
        console.error('Error al unirse a la partida:', error);
        res.render('invitation-status', {
            error: 'Error al unirse a la partida. Inténtalo de nuevo.'
        });
    }
});

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/rulesandhistory', (req, res) => {
    res.render('rulesandhistory')
})

app.get('/developers', (req, res) => {
    res.render('developers')
})

app.get('/privategame', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Buscar invitaciones pendientes dirigidas al usuario
        const pendingInvitations = await Invitation.find({
            $or: [
                { invitedEmail: req.session.user.email, status: 'pending' },
                { invitedEmail: null, status: 'pending', owner: { $ne: userId } }
            ]
        }).populate('owner');

        // Buscar partidas activas donde el usuario participa
        const activeGames = await Game.find({
            $or: [
                { owner: userId, status: 'playing' },
                { opponent: userId, status: 'playing' }
            ]
        }).populate('owner').populate('opponent');

        // Formatear invitaciones pendientes
        const formattedInvitations = pendingInvitations.map(inv => ({
            invitationId: inv.invitationId,
            ownerName: inv.owner.username,
            ownerColor: inv.ownerColor,
            createdDate: new Date(inv.createdAt).toLocaleDateString()
        }));

        // Formatear partidas activas
        const formattedGames = activeGames.map(game => {
            const isOwner = game.owner._id.toString() === userId;
            const opponent = isOwner ? game.opponent : game.owner;
            
            return {
                gameId: game.gameId,
                opponentName: opponent?.username || 'Esperando oponente',
                status: game.status === 'playing' ? 'En curso' : 'Esperando',
                userColor: isOwner ? 'Propietario' : 'Invitado',
                startDate: new Date(game.createdAt).toLocaleDateString()
            };
        });

        console.log('Invitaciones pendientes:', formattedInvitations);
        console.log('Partidas activas:', formattedGames);

        res.render('privategame', {
            pendingInvitations: formattedInvitations,
            activeGames: formattedGames
        });

    } catch (error) {
        console.error('Error al cargar partidas privadas:', error);
        res.render('privategame', {
            error: 'Error al cargar las partidas privadas'
        });
    }
})

// Ruta para rechazar una invitación
app.post('/decline-invitation/:invitationId', requireLogin, async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.session.user.id;

        const invitation = await Invitation.findOne({
            invitationId,
            status: 'pending'
        });

        if (!invitation) {
            return res.json({
                success: false,
                message: 'Invitación no encontrada'
            });
        }

        // Verificar que la invitación es para este usuario
        if (invitation.invitedEmail && invitation.invitedEmail !== req.session.user.email) {
            return res.json({
                success: false,
                message: 'No tienes permiso para rechazar esta invitación'
            });
        }

        // Marcar como expirada (es como rechazarla)
        invitation.status = 'expired';
        await invitation.save();

        res.json({
            success: true,
            message: 'Invitación rechazada exitosamente'
        });

    } catch (error) {
        console.error('Error al rechazar invitación:', error);
        res.json({
            success: false,
            message: 'Error al rechazar la invitación'
        });
    }
});

// Ruta para eliminar una partida (solo el creador)
app.delete('/delete-game/:gameId', requireLogin, async (req, res) => {
    try {
        const { gameId } = req.params;
        const userId = req.session.user.id;

        console.log('Solicitud de eliminación de partida:', { gameId, userId });

        // Buscar la invitación asociada al gameId
        const invitation = await Invitation.findOne({ gameId }).populate('owner');

        if (!invitation) {
            return res.json({
                success: false,
                message: 'Partida no encontrada'
            });
        }

        // Verificar que el usuario es el creador de la partida
        if (invitation.owner._id.toString() !== userId) {
            return res.json({
                success: false,
                message: 'Solo el creador puede eliminar la partida'
            });
        }

        // Verificar que la partida no esté en curso con oponente activo
        const game = await Game.findOne({ gameId });
        if (game && game.opponent && game.status === 'playing') {
            return res.json({
                success: false,
                message: 'No puedes eliminar una partida en curso con oponente'
            });
        }

        // Eliminar la invitación
        await Invitation.deleteOne({ gameId });

        // Eliminar el juego si existe
        if (game) {
            await Game.deleteOne({ gameId });
        }

        console.log('Partida eliminada exitosamente:', gameId);

        res.json({
            success: true,
            message: 'Partida eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar partida:', error);
        res.json({
            success: false,
            message: 'Error al eliminar la partida'
        });
    }
});

// Ruta para ver las partidas creadas por el usuario
app.get('/my-games', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Buscar invitaciones creadas por el usuario
        const myInvitations = await Invitation.find({
            owner: userId
        }).populate('acceptedBy').sort({ createdAt: -1 });

        // Buscar partidas donde el usuario es el propietario
        const myGames = await Game.find({
            owner: userId
        }).populate('opponent').sort({ createdAt: -1 });

        // Formatear invitaciones
        const formattedInvitations = myInvitations.map(inv => ({
            invitationId: inv.invitationId,
            gameId: inv.gameId,
            status: inv.status,
            ownerColor: inv.ownerColor,
            invitedEmail: inv.invitedEmail,
            acceptedByName: inv.acceptedBy?.username,
            createdDate: new Date(inv.createdAt).toLocaleDateString(),
            invitationLink: `${req.protocol}://${req.get('host')}/join-game/${inv.invitationId}`,
            isExpired: inv.status === 'expired' || inv.expiresAt < new Date()
        }));

        // Formatear partidas
        const formattedGames = myGames.map(game => ({
            gameId: game.gameId,
            opponentName: game.opponent?.username || 'Sin oponente',
            status: game.status,
            result: game.result,
            createdDate: new Date(game.createdAt).toLocaleDateString(),
            finishedDate: game.finishedAt ? new Date(game.finishedAt).toLocaleDateString() : null
        }));

        res.render('my-games', {
            invitations: formattedInvitations,
            games: formattedGames
        });

    } catch (error) {
        console.error('Error al cargar mis partidas:', error);
        res.render('my-games', {
            error: 'Error al cargar las partidas'
        });
    }
});

app.get('/publicgamever', (req, res) => {
    res.render('publicgamever')
})

app.get('/edit', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        res.render('edit', {
            currentUser: user
        });
    } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
        res.status(500).render('error', {
            error: 'Error al cargar datos de usuario'
        });
    }
});

// Ruta para procesar la edición
app.post('/edit', requireLogin, upload.single('profilepicture'), async (req, res) => {
    try {
        const { nombres, apellidos, fecha, email, password, 'confirm-password': confirmPassword } = req.body;
        const userId = req.session.user.id;

        // Debug para ver los datos
        console.log('Datos recibidos:', req.body);
        console.log('Usuario actual:', req.session.user);

        // Solo verificar si el email ha cambiado
        const currentUser = await User.findById(userId);
        if (email !== currentUser.email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.render('edit', {
                    error: 'El email ya está en uso por otro usuario',
                    currentUser: currentUser
                });
            }
        }

        // Preparar datos actualizados
        const updateData = {
            nombres,
            apellidos,
            fechaNacimiento: fecha,
            email
        };

        if (req.file) {
            updateData.profilePicture = `/uploads/${req.file.filename}`;
        }

        if (password) {
            if (password !== confirmPassword) {
                return res.render('edit', {
                    error: 'Las contraseñas no coinciden',
                    currentUser: currentUser
                });
            }
            updateData.password = password;
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        // Actualizar sesión
        req.session.user = {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            nombres: updatedUser.nombres,
            apellidos: updatedUser.apellidos
        };

        res.redirect('/profile');
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        const user = await User.findById(req.session.user.id);
        res.render('edit', {
            error: 'Error al actualizar datos',
            currentUser: user
        });
    }
});

app.post('/game/finish', requireLogin, async (req, res) => {
    try {
        const { ganador, estadoJuego } = req.body;
        const userId = req.session.user.id;

        console.log('Finalizando partida:', { ganador, estadoJuego, userId });

        // Crear nueva partida con el resultado
        const newGame = new Game({
            gameId: uuidv4().substring(0, 8),
            owner: userId,
            status: 'finished',
            result: estadoJuego === 'empate' ? 'draw' : 
                   ganador === 'blanca' ? 'victory' : 'defeat',
            winner: estadoJuego === 'empate' ? null : userId,
            finishedAt: new Date()
        });

        await newGame.save();
        console.log('Partida guardada:', newGame);

        res.json({ 
            success: true,
            message: 'Partida guardada correctamente'
        });
    } catch (error) {
        console.error('Error al finalizar partida:', error);
        res.status(500).json({ 
            error: 'Error al guardar la partida',
            details: error.message 
        });
    }
});

app.get('/profile', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        
        // Obtener partidas donde el usuario participó
        const games = await Game.find({
            $or: [
                { owner: user._id },
                { opponent: user._id }
            ]
        }).sort({ finishedAt: -1, createdAt: -1 });

        console.log('Partidas encontradas:', games);

        // Calcular estadísticas
        const stats = {
            wins: games.filter(g => g.result === 'victory').length,
            losses: games.filter(g => g.result === 'defeat').length,
            draws: games.filter(g => g.result === 'draw').length
        };

        // Formatear historial
        const gameHistory = games.map(game => ({
            opponent: 'Oponente',  // Por ahora dejamos un valor fijo
            result: game.result,
            date: game.finishedAt ? 
                  new Date(game.finishedAt).toLocaleDateString() : 
                  new Date(game.createdAt).toLocaleDateString(),
            gameId: game.gameId
        }));

        console.log('Estadísticas:', stats);
        console.log('Historial formateado:', gameHistory);

        res.render('profile', {
            currentUser: {
                ...user.toObject(),
                stats
            },
            gameHistory
        });
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        res.status(500).render('error', {
            error: 'Error al cargar el perfil'
        });
    }
});
// app.listen()

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${port}`)
    
    // Mostrar rutas después de que el servidor esté corriendo
    setTimeout(() => {
        console.log('\nRutas disponibles después del inicio:');
        if (app._router && app._router.stack) {
            app._router.stack.forEach(function(r){
                if (r.route && r.route.path){
                    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
                }
            });
        }
    }, 100);
});