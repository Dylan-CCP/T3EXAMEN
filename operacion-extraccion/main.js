import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const escena = new THREE.Scene();
escena.background = new THREE.Color(0xaac9da);

const camara = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.06, 70);
camara.rotation.order = 'YXZ';
escena.add(camara);

const renderer = new THREE.WebGLRenderer({ antialias: false });
let escalaRender = 1;
ajustarPantalla();
document.querySelector('#juego').append(renderer.domElement);

const controles = new PointerLockControls(camara, renderer.domElement);
controles.pointerSpeed = .65;
// Evita que la cámara se ponga completamente vertical y pierda su giro horizontal.
controles.minPolarAngle = THREE.MathUtils.degToRad(8);
controles.maxPolarAngle = THREE.MathUtils.degToRad(172);
const reloj = new THREE.Clock();
const cargador = new GLTFLoader();
const teclas = new Set();
const solidos = [];
const zombis = [];
const suministros = [];
const armas = [
  { nombre: 'Pistola', archivo: 'pistola.glb', inicial: 5, alcance: 20, retroceso: .12 },
  { nombre: 'Carabina', archivo: 'carabina.glb', inicial: 5, alcance: 35, retroceso: .07 }
];

const menu = document.querySelector('#menu');
const titulo = document.querySelector('#titulo');
const mensaje = document.querySelector('#mensaje');
const jugar = document.querySelector('#jugar');
const hud = document.querySelector('#hud');
const mira = document.querySelector('#mira');
const aviso = document.querySelector('#aviso');
const nombreArma = document.querySelector('#arma');
const balas = document.querySelector('#balas');
let tiempoFps = 0;
let cuadros = 0;

const ALTURA = 1.60;
const RADIO = 0.34;
const VELOCIDAD = 4.7;
const ALCANCE_DETECCION = 8;
const posicionArma = new THREE.Vector3(.34, -.31, -.70);
const inicio = new THREE.Vector3(0, ALTURA, 24);
const salida = new THREE.Vector3(0, 0, -25);
const ANCHO_TERRENO = 44;
const LARGO_TERRENO = 64;
const raycaster = new THREE.Raycaster();
const centro = new THREE.Vector2(0, 0);
let armaActual = 0;
let estado = 'cargando';
let empezo = false;
let tiempoAviso = 0;
let tiempoImpacto = 0;

function bloque(ancho, alto, largo, x, y, z, color, padre = escena) {
  const objeto = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, alto, largo),
    new THREE.MeshLambertMaterial({ color })
  );
  objeto.position.set(x, y, z);
  padre.add(objeto);
  return objeto;
}

function obstaculo(x, z, ancho, alto, largo, color) {
  const malla = bloque(ancho, alto, largo, x, alto / 2, z, color);
  malla.updateMatrixWorld();
  solidos.push({ malla, caja: new THREE.Box3().setFromObject(malla) });
  return malla;
}

function cartel(texto, x, z) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 112;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#28392f';
  ctx.fillRect(0, 0, 512, 112);
  ctx.fillStyle = '#fbf5d5';
  ctx.font = 'bold 50px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 256, 57, 475);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const letrero = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.1),
    new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
  );
  letrero.position.set(x, 2.6, z);
  escena.add(letrero);
}

function crearNivel() {
  escena.add(new THREE.AmbientLight(0xffffff, 1.65));
  const luz = new THREE.DirectionalLight(0xffffff, 1.6);
  luz.position.set(-7, 14, 9);
  escena.add(luz);

  bloque(ANCHO_TERRENO, .2, LARGO_TERRENO, 0, -.1, 0, 0x747e4b);

  // Bloques separados que el jugador puede rodear.
  for (const [x, z, ancho, alto, largo] of [
    [-5, 18, 3, 1.4, 3],
    [6, 11, 4, 2, 3],
    [0, 7, 6, 1.8, 2],
    [-7, -2, 4, 1.2, 3],
    [7, -5, 5, 2.1, 2],
    [-3, -11, 4, 1.4, 3],
    [7, -16, 3, 1.5, 3],
    [0, -20, 4, 1.3, 2]
  ]) {
    obstaculo(x, z, ancho, alto, largo, 0x8a7259);
  }

  bloque(4, .03, 4, inicio.x, .015, inicio.z, 0xbaa76c);
  bloque(4, .03, 4, salida.x, .015, salida.z, 0x46884a);
  cartel('EXTRACCIÓN', salida.x, salida.z - 2.1);
}

function crearSuministros() {
  for (const [x, z] of [[3, 18], [-5, 3], [4, -9], [-5, -18]]) {
    const caja = new THREE.Group();
    caja.position.set(x, 0, z);
    bloque(.67, .38, .49, 0, .19, 0, 0x345d3a, caja);
    bloque(.11, .045, .36, 0, .396, 0, 0xf0cf76, caja);
    bloque(.34, .045, .10, 0, .396, 0, 0xf0cf76, caja);
    escena.add(caja);
    suministros.push(caja);
  }
}

function crearZombis(modelo) {
  for (const [x, z] of [[0, 14], [9, 14], [-6, 4], [4, 0], [8, -9], [-7, -13], [4, -18], [-5, -22]]) {
    const cuerpo = modelo.clone();
    cuerpo.position.set(x, 0, z);
    escena.add(cuerpo);
    const zombi = { cuerpo, vida: 2, origen: cuerpo.position.clone() };
    cuerpo.traverse(parte => {
      if (parte.isMesh) parte.userData.zombi = zombi;
    });
    zombis.push(zombi);
  }
}

function libre(x, z, radio) {
  if (Math.abs(x) + radio > ANCHO_TERRENO / 2 ||
      Math.abs(z) + radio > LARGO_TERRENO / 2) return false;
  for (const { caja } of solidos) {
    const cercaX = THREE.MathUtils.clamp(x, caja.min.x, caja.max.x);
    const cercaZ = THREE.MathUtils.clamp(z, caja.min.z, caja.max.z);
    if ((x - cercaX) ** 2 + (z - cercaZ) ** 2 < radio ** 2) return false;
  }
  return true;
}

function mover(pos, dx, dz, radio) {
  if (libre(pos.x + dx, pos.z, radio)) pos.x += dx;
  if (libre(pos.x, pos.z + dz, radio)) pos.z += dz;
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function actualizarJugador(delta) {
  const adelante = Number(teclas.has('KeyW')) - Number(teclas.has('KeyS'));
  const lado = Number(teclas.has('KeyD')) - Number(teclas.has('KeyA'));
  const paso = VELOCIDAD * delta / (Math.hypot(adelante, lado) || 1);
  const giro = camara.rotation.y;
  mover(camara.position, (lado * Math.cos(giro) - adelante * Math.sin(giro)) * paso,
    (-lado * Math.sin(giro) - adelante * Math.cos(giro)) * paso, RADIO);
}

function actualizarZombis(delta) {
  for (const zombi of zombis) {
    if (zombi.vida === 0) continue;
    const pos = zombi.cuerpo.position;
    const d = distancia(pos, camara.position);
    if (d > ALCANCE_DETECCION) continue;
    if (d < .62) {
      terminar('derrota');
      return;
    }
    const dx = camara.position.x - pos.x;
    const dz = camara.position.z - pos.z;
    zombi.cuerpo.rotation.y = Math.atan2(dx, dz);
    const avance = 2.25 * delta / d;
    mover(pos, dx * avance, dz * avance, .46);
    if (distancia(pos, camara.position) < .62) {
      terminar('derrota');
      return;
    }
  }
}

function actualizarSuministros() {
  for (const caja of suministros) {
    if (caja.visible && distancia(caja.position, camara.position) < 1) {
      caja.visible = false;
      armas[0].municion += 3;
      armas[1].municion += 3;
      actualizarHud();
      mostrarAviso('+3 balas para cada arma');
    }
  }
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = false;
  tiempoAviso = 1.5;
}

function actualizarHud() {
  const arma = armas[armaActual];
  nombreArma.textContent = arma.nombre;
  balas.textContent = arma.municion + ' balas';
}

function seleccionarArma(indice) {
  armaActual = indice;
  armas.forEach((arma, i) => { arma.modelo.visible = i === indice; });
  actualizarHud();
}

function disparar() {
  if (estado !== 'jugando' || !controles.isLocked) return;
  const arma = armas[armaActual];
  if (arma.municion === 0) {
    mostrarAviso('Sin munición. Busca una caja verde.');
    return;
  }

  arma.municion--;
  arma.modelo.position.z = posicionArma.z + arma.retroceso;
  actualizarHud();

  // El primer objeto que encuentra el rayo decide si el tiro impacta.
  escena.updateMatrixWorld();
  raycaster.far = arma.alcance;
  raycaster.setFromCamera(centro, camara);
  const objetivos = solidos.map(s => s.malla);
  for (const zombi of zombis) {
    if (zombi.vida > 0) objetivos.push(zombi.cuerpo);
  }
  const [impacto] = raycaster.intersectObjects(objetivos, true);
  const zombi = impacto?.object.userData.zombi;
  if (!zombi) return;

  zombi.vida--;
  mira.classList.add('impacto');
  tiempoImpacto = .15;
  if (zombi.vida === 0) {
    zombi.cuerpo.visible = false;
    mostrarAviso('Zombi eliminado');
  }
}

function reiniciar() {
  camara.position.copy(inicio);
  camara.rotation.set(0, 0, 0, 'YXZ');
  for (const arma of armas) {
    arma.municion = arma.inicial;
    arma.modelo.position.copy(posicionArma);
  }
  for (const zombi of zombis) {
    zombi.vida = 2;
    zombi.cuerpo.visible = true;
    zombi.cuerpo.position.copy(zombi.origen);
    zombi.cuerpo.rotation.y = 0;
  }
  for (const caja of suministros) caja.visible = true;
  aviso.hidden = true;
  mira.classList.remove('impacto');
  tiempoAviso = 0;
  tiempoImpacto = 0;
  seleccionarArma(0);
}

function terminar(resultado) {
  estado = resultado;
  teclas.clear();
  controles.unlock();
  menu.hidden = false;
  mira.hidden = true;
  aviso.hidden = true;
  titulo.textContent = resultado === 'victoria' ? '¡MISIÓN COMPLETADA!' : 'GAME OVER';
  mensaje.textContent = resultado === 'victoria'
    ? 'Has llegado a la zona de extracción.'
    : 'Un zombi te atrapó.';
  jugar.textContent = 'Reiniciar';
}

jugar.addEventListener('click', async () => {
  if (estado === 'victoria' || estado === 'derrota') {
    reiniciar();
    estado = 'listo';
  }
  const lienzo = renderer.domElement;
  try {
    // Usa el movimiento directo del mouse cuando el navegador lo permite.
    await lienzo.requestPointerLock({ unadjustedMovement: true });
  } catch (error) {
    if (error.name === 'NotSupportedError') {
      try {
        await lienzo.requestPointerLock();
      } catch {
        avisarErrorMouse();
      }
    } else {
      avisarErrorMouse();
    }
  }
});

controles.addEventListener('lock', () => {
  estado = 'jugando';
  empezo = true;
  tiempoFps = 0;
  cuadros = 0;
  menu.hidden = true;
  hud.hidden = false;
  mira.hidden = false;
});

controles.addEventListener('unlock', () => {
  teclas.clear();
  if (estado !== 'jugando') return;
  estado = 'listo';
  menu.hidden = false;
  mira.hidden = true;
  titulo.textContent = 'Pausa';
  mensaje.textContent = 'Continúa hacia la zona de extracción.';
  jugar.textContent = 'Continuar';
});

function avisarErrorMouse() {
  if (!empezo || estado === 'listo') {
    mensaje.textContent = 'El navegador no pudo capturar el mouse. Haz clic en el botón para volver a intentar.';
  }
}

document.addEventListener('pointerlockerror', avisarErrorMouse);

window.addEventListener('keydown', evento => {
  if (estado !== 'jugando') return;
  teclas.add(evento.code);
  if (evento.code === 'Digit1') seleccionarArma(0);
  if (evento.code === 'Digit2') seleccionarArma(1);
});
window.addEventListener('keyup', evento => teclas.delete(evento.code));
window.addEventListener('blur', () => teclas.clear());
renderer.domElement.addEventListener('mousedown', evento => {
  if (evento.button === 0) disparar();
});
function ajustarPantalla() {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  const escala = Math.min(1, 1024 / innerWidth, 576 / innerHeight) * escalaRender;
  renderer.setPixelRatio(escala);
  renderer.setSize(innerWidth, innerHeight, false);
}

function actualizarFps(segundos) {
  cuadros++;
  tiempoFps += segundos;
  if (tiempoFps < 1) return;

  const fps = Math.round(cuadros / tiempoFps);
  // Bajamos la resolución si el navegador se acerca a los 30 FPS.
  if (fps < 36 && escalaRender > .55) {
    escalaRender = Math.max(.55, escalaRender * .8);
    ajustarPantalla();
  }
  tiempoFps = 0;
  cuadros = 0;
}

window.addEventListener('resize', () => {
  ajustarPantalla();
  renderer.render(escena, camara);
});

function animar() {
  requestAnimationFrame(animar);
  const segundos = reloj.getDelta();
  if (estado === 'jugando') {
    const delta = Math.min(segundos, .05);
    actualizarFps(segundos);
    actualizarJugador(delta);
    actualizarZombis(delta);
    if (estado === 'jugando') {
      actualizarSuministros();
      if (distancia(salida, camara.position) < 1.85) terminar('victoria');
    }
    const modelo = armas[armaActual].modelo;
    modelo.position.z = THREE.MathUtils.lerp(modelo.position.z, posicionArma.z, Math.min(1, delta * 18));
    if (tiempoAviso > 0 && (tiempoAviso -= delta) <= 0) aviso.hidden = true;
    if (tiempoImpacto > 0 && (tiempoImpacto -= delta) <= 0) mira.classList.remove('impacto');
    renderer.render(escena, camara);
  }
}

async function iniciar() {
  crearNivel();
  crearSuministros();
  try {
    const modelos = await Promise.all(
      [...armas.map(arma => arma.archivo), 'zombi.glb'].map(archivo => cargador.loadAsync('models/' + archivo))
    );
    for (const [i, arma] of armas.entries()) {
      arma.modelo = modelos[i].scene;
      camara.add(arma.modelo);
    }
    crearZombis(modelos[2].scene);
    reiniciar();
    estado = 'listo';
    mensaje.textContent = 'Cruza el terreno y llega a la zona verde de extracción.';
    jugar.disabled = false;
    renderer.render(escena, camara);
    animar();
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'No se pudieron cargar los modelos. Abre el juego desde un servidor local y revisa la carpeta models.';
  }
}

iniciar();
