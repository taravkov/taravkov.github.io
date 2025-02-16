import './style.css';
import * as THREE from 'three';
import ReativeParticles from './ReativeParticles';

export default class App {
  renderer: THREE.WebGLRenderer = null!;
  camera: THREE.PerspectiveCamera = null!;
  scene: THREE.Scene = null!;
  particles: ReativeParticles = null!;
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
      10,
      window.innerWidth / window.innerHeight,
      0.0001,
      1000
    );
    // this.camera = new THREE.OrthographicCamera(100, 100, 100, 1000, 100, 1000);
    // this.camera.position.x = -17;
    // this.camera.lookAt(new THREE.Vector3(1, 1, 17));

    // this.camera.position.x = 0.05;
    this.camera.position.z = 1600;
    this.camera.zoom = 0.05;
    console.log('camera X', this.camera.position.x);
    console.log('camera Y', this.camera.position.y);
    console.log('camera Z', this.camera.position.z);
    this.camera.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    const holder = new THREE.Object3D();
    holder.name = 'holder';
    this.scene.add(holder);
    // holder.sortObjects = false

    this.particles = new ReativeParticles(holder);
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

    this.renderer.render(this.scene, this.camera);
  }
}

new App();
