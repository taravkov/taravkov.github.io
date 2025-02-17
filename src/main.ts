import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Импортируем path tracing рендерер из сторонней библиотеки
import { WebGLPathTracer } from 'three-gpu-pathtracer'; // убедитесь, что библиотека установлена
// Импортируем вашу сцену/объект (например, ReactiveParticles)
import ReactiveParticles from './ReactiveParticles';

export default class App {
  renderer: THREE.WebGLRenderer = null!;
  camera: THREE.PerspectiveCamera = null!;
  scene: THREE.Scene = null!;
  controls: OrbitControls = null!;
  particles: ReactiveParticles = null!;
  width: number = null!;
  height: number = null!;

  // Экземпляр path tracing рендера
  ptRenderer: WebGLPathTracer = null!;

  constructor() {
    this.init();
  }

  init() {
    // Создаем обычный WebGLRenderer (его мы передадим в path tracing рендерер)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('.content')?.appendChild(this.renderer.domElement);

    // Создаем камеру
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    this.camera.position.set(0, 0, 5000);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.updateProjectionMatrix();

    // Создаем сцену и добавляем камеру
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // Источники света – для path tracing они могут использоваться для первичной и глобальной освещенности
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1000, 1000, 1000);
    this.scene.add(directionalLight);

    // Добавляем объекты в сцену
    const holder = new THREE.Object3D();
    holder.name = 'holder';
    this.scene.add(holder);
    this.particles = new ReactiveParticles(holder);

    // Настраиваем OrbitControls для удобного перемещения
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.addEventListener('change', () => {
      console.log('change');
      this.ptRenderer.updateCamera();
    });

    // Создаем экземпляр path tracing рендера.
    // Параметры (scene, camera, renderer) могут отличаться в зависимости от библиотеки.
    this.ptRenderer = new WebGLPathTracer(this.renderer);
    this.ptRenderer.setScene(this.scene, this.camera);

    // Обработка изменения размера окна
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.update();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  update() {
    requestAnimationFrame(() => this.update());
    this.controls.update();
    this.particles.update();
    // Обновляем path tracing рендер
    this.ptRenderer.renderSample();
  }
}

new App();
