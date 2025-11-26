# 🗼 Lycorecobot
**Lycorecobot un bot de X que publica frames random del anime Lycoris Recoil cada 2 horas mientras la PC host esté encendida**  
¡Visitá su cuenta oficial de X [@lycoris_peak](https://x.com/lycoris_peak)!  
¿Querés adaptarlo a cualquier otra serie? Seguí los pasos a continuación...

## 🛠️ Instalación
1. Creá una cuenta de X para el bot y [solicitá acceso a la API de X](https://developer.x.com/).
2. Rellená el archivo `.env` con la información que X te dé para usar su API.

    ```env
    API_KEY = twitter_api_key
    API_SECRET = twitter_api_secret
    BEARER_TOKEN = twitter_bearer_token
    ACCESS_TOKEN = twitter_access_token
    ACCESS_SECRET = twitter_access_secret
    ```
3. Cambiá a tu gusto los paths asignados a las variables `carpetaResources`, `carpetaVideos` y `carpetaFramesOutput` en `index.js`.
    Por ejemplo:

    ```js
    const carpetaResources = 'C:/Mis cosas/dependencias/LycoRecoResources' // Carpeta general de resources para mejor organización
    const carpetaVideos = `${carpetaResources}/videos` // Carpeta de donde se conseguirán los videos
    const carpetaFramesOutput = `${carpetaResources}/frames` // Carpeta en la que se guardarán los frames que el bot vaya subiendo
    ```
4. Si tus videos no están en `.mkv` o `.mp4` podés agregar más extensiones válidas a la variable `extensionesValidas`:

    ```js
    const extensionesValidas = ['.mkv', '.mp4' /*, tu_extensión */ ]
    ```
5. Guardá los videos que necesites en la carpeta correspondiente al path de la variable `carpetaVideos`.
6. Instalá [Node.js](https://nodejs.org/) si no lo tenés.
7. Instalá las dependencias del proyecto:

    ```bash
    npm i
    ```
8. Instalá `pm2` (un administrador de procesos) globalmente:

    ```bash
    npm install -g pm2
    ```
    El comando lo instala globalmente porque no es una dependencia del proyecto, sino una herramienta CLI que permite que el bot se inicie junto con Windows.
9. Configurá PM2 para que se inicie junto con Windows:

    ```bash
    npm install -g pm2-windows-startup
    pm2-startup install
    ```
## 🚀 Ejecución
Ejecutá y guardá el proyecto en PM2:

```bash
pm2 start index.js --name nombre-del-bot
pm2 save
```
- `pm2 start` ejecuta el index.js y lo registra como un proceso en PM2.  
- `pm2 save` guarda la lista de procesos para que PM2 los restaure automáticamente cuando se inicie Windows.
### ¡Ahora tu bot ya está corriendo y en la próxima hora par publicará su primer frame! 🥳🥳
## ⚙️ Últimos consejos para el uso y desarrollo del bot
1. Si querés ejecutar un post manual, podés usar `pm2 trigger nombre-del-bot postNow`
2. Si querés ver los últimos logs del bot, podés usar `pm2 logs nombre-del-bot --lines 1000`
3. Si querés eliminar el proceso PM2 del bot, podés usar `pm2 delete nombre-del-bot`
4. Si querés modificar el tiempo entre posteo:
    - Vas a tener que modificar el intervalo asignado a la variable `postInterval`.
    - Aún así no recomiendo reducir mucho el tiempo, porque si tenés el plan básico de la API de X vas a hacer más requests de las máximas permitidas, y si esto sucede seguido te pueden sacar el acceso a la API.

---

### Te invito a compartirme a mi cuenta personal [@DamiCy_2009](https://x.com/DamiCy_2009) cualquier error, sugerencia u observación que tengas sobre el código o proyecto en general