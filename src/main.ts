import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ReativeParticles from './ReativeParticles';

export default class App {
  renderer: THREE.WebGLRenderer = null!;
  camera: THREE.PerspectiveCamera = null!;
  scene: THREE.Scene = null!;
  particles: ReativeParticles = null!;
  controls: OrbitControls = null!;
  width: number = null!;
  height: number = null!;

  constructor() {
    this.init();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    document.querySelector('.content')?.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      50, // более широкое поле зрения
      window.innerWidth / window.innerHeight,
      0.1, // near
      10000 // far – увеличено, чтобы покрыть всю сцену
    );
    this.camera.position.set(0, 0, 5000); // позиция, позволяющая видеть всю сетку
    // Отказываемся от zoom или устанавливаем его в 1 (по умолчанию)
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.camera.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    const holder = new THREE.Object3D();
    holder.name = 'holder';
    this.scene.add(holder);

    this.particles = new ReativeParticles(holder);

    // Создаем OrbitControls для управления камерой мышью
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // плавное замедление
    this.controls.dampingFactor = 0.05;

    this.update();
    this.resize();
    window.addEventListener('resize', () => this.resize());
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

    this.particles.update();
    this.controls.update(); // Обновляем OrbitControls
    this.renderer.render(this.scene, this.camera);
  }
}

new App();
