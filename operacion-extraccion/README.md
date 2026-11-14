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

