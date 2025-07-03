# ♟️ Proyecto de Ajedrez Online

Una aplicación web completa de ajedrez desarrollada con Node.js, Express y MongoDB que permite a los usuarios jugar partidas de ajedrez en línea.

## 🚀 Características

- **Juego de ajedrez completo** con validación de movimientos
- **Sistema de usuarios** con registro, login y perfiles
- **Partidas públicas y privadas**
- **Sistema de invitaciones** para partidas privadas
- **Historial de partidas** y estadísticas de usuario
- **Interfaz responsiva** y moderna

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Base de Datos:** MongoDB con Mongoose
- **Plantillas:** Handlebars
- **Frontend:** HTML5, CSS3, JavaScript
- **Autenticación:** Express Sessions
- **Subida de archivos:** Multer

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/mariana-333/proyecto.git
cd proyecto
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
# Crea un archivo .env en la raíz del proyecto
MONGODB_URI=mongodb://localhost:27017/chessdb
SESSION_SECRET=tu-clave-secreta-aqui
PORT=3000
```

4. Inicia el servidor:
```bash
npm start
```

5. Abre tu navegador en `http://localhost:3000`

## 📋 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo (si tienes nodemon)

## 🎮 Funcionalidades del Juego

### Sistema de Usuarios
- Registro con foto de perfil
- Login y logout
- Edición de perfil
- Estadísticas personales

### Partidas de Ajedrez
- Validación completa de movimientos para todas las piezas
- Turnos alternados automáticos
- Sistema de rendición
- Partidas públicas para práctica
- Partidas privadas con invitaciones por enlace

### Gestión de Partidas
- Crear partidas privadas con enlace de invitación
- Ver partidas pendientes y activas
- Historial completo de partidas jugadas
- Estadísticas de victorias, derrotas y empates

## 🗂️ Estructura del Proyecto

```
proyecto/
├── models/             # Modelos de MongoDB
│   ├── User.js
│   ├── Game.js
│   └── Invitation.js
├── views/              # Plantillas Handlebars
│   ├── layouts/
│   ├── partials/
│   └── *.handlebars
├── public/             # Archivos estáticos
│   ├── css/
│   ├── js/
│   ├── img/
│   └── uploads/
├── chess.js            # Lógica de movimientos del ajedrez
├── index.js            # Servidor principal
└── package.json
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Mariana** - *Desarrollo inicial* - [mariana-333](https://github.com/mariana-333)

## 🙏 Agradecimientos

- Inspirado en el juego clásico de ajedrez
- Comunidad de desarrolladores de Node.js
- Contribuidores de las librerías utilizadas
