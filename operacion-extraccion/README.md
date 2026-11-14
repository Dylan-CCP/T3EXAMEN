# Operación Extracción

T3 de Computación Gráfica y Visual. FPS 3D en un terreno abierto. El objetivo es llegar a la zona de extracción al otro lado del terreno. Las cajas verdes dan munición. Si un zombi te alcanza, termina la partida.

## Ejecutar en Windows

1. Descomprime el ZIP y abre la carpeta `operacion-extraccion`.
2. Abre una terminal de PowerShell en esa carpeta. Necesitas Python 3 para iniciar el servidor local.
3. Ejecuta este comando y deja la terminal abierta.

   ```powershell
   py -m http.server 8000
   ```

   Si tu instalación usa el comando `python`, ejecuta `python -m http.server 8000`.

4. Abre [http://localhost:8000/](http://localhost:8000/) en Chrome o Edge de escritorio y pulsa **Jugar**.

El juego está escrito en JavaScript y usa Three.js. La biblioteca viene incluida, así que el juego funciona sin npm ni conexión a Internet. Abre el juego desde la dirección del servidor local.

## Rendimiento

El juego limita la resolución interna a un máximo de 1024 × 576 y la reduce automáticamente si baja de 36 FPS. Se recomienda mantener la aceleración gráfica habilitada en el navegador.

## Controles

| Tecla o botón | Acción |
| --- | --- |
| W / A / S / D | Avanzar, ir a la izquierda, retroceder o ir a la derecha |
| Mouse | Orientar la cámara |
| Clic izquierdo | Hacer un disparo |
| 1 / 2 | Cambiar entre pistola y carabina |
| Esc | Liberar el mouse y pausar |

Pasa cerca de una caja verde para recogerla. Empiezas con cinco balas por arma y cada caja suma tres a cada una. Busca el cartel de extracción al otro lado del terreno. Usa el botón **Reiniciar** al terminar.

## Rúbrica y pruebas

| Requisito | Dónde se implementa en `main.js` | Cómo probarlo |
| --- | --- | --- |
| RF01. Armas | `iniciar`, `seleccionarArma`, evento `mousedown` | Cambia con 1 y 2. Mantén el clic apretado y comprueba que baja una sola bala. |
| RF02. Munición | `disparar`, `actualizarHud`, `actualizarSuministros` | Vacía un arma, prueba disparar de nuevo, cambia de arma y recoge una caja. |
| RF03. Escenario | `crearNivel` | Parte de la zona inicial, rodea los bloques y ubica el cartel de Extracción. |
| RF04. Zombis GLB | `iniciar`, `crearZombis` | Acércate a los enemigos para ver los modelos cargados desde `models/zombi.glb`. |
| RF05. Comportamiento | `actualizarZombis`, `ALCANCE_DETECCION` | Observa un zombi desde lejos, acércate y comprueba que se mueve hacia ti. |
| RF06. Cámara y controles | `PointerLockControls`, `actualizarJugador`, `mover` | Mira con el mouse, camina con WASD y prueba avanzar contra un obstáculo. Observa que el arma acompaña la vista. |
| RF07. Disparos e impactos | `disparar` | Apunta al torso o a la cabeza. El primer impacto deja vivo al zombi y el segundo lo elimina. Prueba también disparar con un obstáculo alto en medio. |
| RF08. Extracción | `crearNivel`, `animar`, `terminar` | Sigue la ruta hasta pisar la zona verde de Extracción. Aparece el mensaje de victoria. |
| RF09. Game Over | `actualizarZombis`, `terminar` | Deja que un zombi te alcance. Comprueba que aparece GAME OVER y que WASD deja de mover al jugador. |
| RF10. Coleccionables | `crearSuministros`, `actualizarSuministros` | Pasa por una caja. Debe desaparecer y aumentar la munición una vez. |
| RF11. Dificultad | `armas`, `crearZombis`, `crearSuministros` | Haz el recorrido administrando las balas. Hay ocho zombis, cuatro cajas y obstáculos que se pueden rodear. |
| RF12. Entrega | Este README, código, modelos y carpeta `vendor` | Publica el contenido de la carpeta en GitHub. Verifica que se ejecute desde una copia del repositorio. Graba el video y entrega ambos enlaces en el aula. |

## Fuentes y licencias

- Three.js 0.180.0, `GLTFLoader` y `PointerLockControls` se incluyen en `vendor/` bajo licencia MIT. [Proyecto Three.js](https://github.com/mrdoob/three.js/tree/r180)
- Los tres modelos low-poly fueron creados para este proyecto con geometría simple. Los archivos GLB están en `models/`.
- Referencia del curso. Semana 08, diapositivas 21 a 27, «Mini FPS con arma 3D».

## Guion sugerido para el video

**0:00–0:30.** «Esta es Operación Extracción. Me muevo con WASD, miro con el mouse y debo atravesar el terreno hasta la zona verde». Muestra la cámara, el choque con un obstáculo y el cambio de arma con 1 y 2.

**0:30–1:25.** «En la función `disparar`, cada clic resta una bala. El `Raycaster` lanza un rayo desde el centro de la cámara. El primer objeto intersectado decide el resultado. Si es un zombi, le resto un punto de vida y al llegar a cero retiro su modelo». Muestra esa parte del código y los dos disparos al mismo zombi.

**1:25–2:40.** Muestra un zombi quieto que empieza a seguirte al acercarte, la recogida de una caja de munición y la extracción. Cierra con una toma de **GAME OVER** en otro intento. Puedes recortar los desplazamientos entre obstáculos para que el video dure menos de tres minutos.
