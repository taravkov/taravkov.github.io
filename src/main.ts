import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ReactiveParticles from './ReactiveParticles';

export default class App {
  renderer: THREE.WebGLRenderer = null!;
  camera: THREE.PerspectiveCamera = null!;
  scene: THREE.Scene = null!;
  particles: ReactiveParticles = null!;
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

    // Камера с адекватным FOV, near и far
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    this.camera.position.set(0, 0, 5000);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.updateProjectionMatrix();
    this.camera.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // Добавляем источники света
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1000, 1000, 1000);
    this.scene.add(directionalLight);

    // Контейнер для объектов
    const holder = new THREE.Object3D();
    holder.name = 'holder';
    this.scene.add(holder);

    this.particles = new ReactiveParticles(holder);

    // OrbitControls для управления камерой мышью (опционально)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
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
    this.controls.update();
    this.particles.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new App();
