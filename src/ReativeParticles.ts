import * as THREE from 'three';
// import gsap from 'gsap';
import vertex from './glsl/vertex.glsl';
import fragment from './glsl/fragment.glsl';

export default class ReactiveParticles extends THREE.Object3D {
  time: number;
  properties: {
    startColor: number;
    endColor: number;
    autoMix: boolean;
    autoRotate: boolean;
  };
  holderObjects: THREE.Object3D<THREE.Object3DEventMap>;
  material: THREE.ShaderMaterial;
  geometry: THREE.BoxGeometry;
  pointsMesh: THREE.Object3D<THREE.Object3DEventMap>;

  constructor(mainHolder: THREE.Object3D) {
    super();
    this.name = 'ReactiveParticles';
    this.time = 0;
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      autoMix: true,
      autoRotate: true,
    };
    this.init(mainHolder);

    this.destroyMesh();
    this.createBoxMesh();
    this.properties.autoMix = false;
  }

  init(mainHolder: THREE.Object3D) {
    mainHolder.add(this);

    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects);

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 1.1 },
        frequency: { value: 2 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(this.properties.startColor) },
        endColor: { value: new THREE.Color(this.properties.endColor) },
      },
    });

    this.resetMesh();
  }

  createBoxMesh() {
    // Randomly generate segment counts for width, height, and depth to create varied box geometries
    const widthSeg = Math.floor(/*THREE.MathUtils.randInt(5, 20)*/ 5);
    const heightSeg = Math.floor(/*THREE.MathUtils.randInt(1, 40)*/ 8);
    const depthSeg = Math.floor(/*THREE.MathUtils.randInt(5, 80)*/ 10);
    this.geometry = new THREE.BoxGeometry(
      1,
      1,
      1,
      widthSeg,
      heightSeg,
      depthSeg
    );

    // Update shader material uniform for offset size with a random value
    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.needsUpdate = true;

    // Create a container for the points mesh and set its orientation
    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 2); // Rotate the mesh for better visual orientation
    this.holderObjects.add(this.pointsMesh);

    // Create a points mesh using the box geometry and the shader material
    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);

    // // Animate the rotation of the of the container
    // gsap.to(this.pointsMesh.rotation, {
    //   duration: 3,
    //   x: Math.random() * Math.PI,
    //   z: Math.random() * Math.PI * 2,
    //   ease: 'none', // No easing for a linear animation
    // });
    //
    // gsap.to(this.position, {
    //   duration: 0.6,
    //   z: THREE.MathUtils.randInt(9, 11), // Random depth positioning within a range
    //   ease: 'elastic.out(0.8)', // Elastic ease-out for a bouncy effect
    // });
  }

  resetMesh() {
    if (this.properties.autoMix) {
      this.destroyMesh();
      this.createBoxMesh();

      // Animate the position of the mesh for an elastic movement effect

      // // Animate the frequency uniform in the material, syncing with BPM if available
      // gsap.to(this.material.uniforms.frequency, {
      //   duration: App.bpmManager
      //     ? (App.bpmManager.getBPMDuration() / 1000) * 2
      //     : 2,
      //   value: THREE.MathUtils.randFloat(0.5, 3), // Random frequency value for dynamic visual changes
      //   ease: 'expo.easeInOut', // Smooth exponential transition for visual effect
      // });
    }
  }

  update() {
    // this.material.uniforms.frequency.value = 0.8;
    // this.material.uniforms.amplitude.value = 1;
    // this.time += 0.2;
    //
    // this.material.uniforms.time.value = this.time;
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      // this.pointsMesh.geometry?.dispose();
      // this.pointsMesh.material?.dispose();
      // this.pointsMesh = null;
    }
  }
}
