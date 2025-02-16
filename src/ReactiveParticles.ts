import * as THREE from 'three';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import vertex from './glsl/vertex.glsl';
import fragment from './glsl/fragment.glsl';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

export default class ReactiveParticles extends THREE.Object3D {
  time: number;
  properties: {
    startColor: number;
    endColor: number;
    autoMix: boolean;
    autoRotate: boolean;
  };
  holderObjects: THREE.Object3D<THREE.Object3DEventMap> = null!;
  material: THREE.ShaderMaterial = null!;
  geometry: THREE.BoxGeometry = null!;
  pointsMesh: THREE.Object3D<THREE.Object3DEventMap> = null!;

  // Параметры сетки
  widthSeg: number = 32;
  depthSeg: number = 32;

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
    // Создаем канопии для каждой клетки сетки
    this.createCanopiesFromGrid();
    this.properties.autoMix = false;
  }

  init(mainHolder: THREE.Object3D) {
    mainHolder.add(this);
    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects);

    // Материал для точек оставляем прежним (шейдерный)
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
  }

  createBoxMesh() {
    const widthSeg = Math.floor(this.widthSeg);
    const depthSeg = Math.floor(this.depthSeg);
    // Создаем BoxGeometry размером 4096 x 4096.
    // Геометрия центрирована, поэтому координаты вершин располагаются от -2048 до 2048.
    this.geometry = new THREE.BoxGeometry(
      4096, // ширина
      0, // высота (плоская сетка)
      4096, // глубина
      widthSeg,
      undefined,
      depthSeg
    );
    this.material.uniforms.offsetSize.value = THREE.MathUtils.randInt(30, 60);
    this.material.needsUpdate = true;

    this.pointsMesh = new THREE.Object3D();
    // Разместим сетку в плоскости XY
    this.pointsMesh.rotateX(Math.PI / 2);
    this.holderObjects.add(this.pointsMesh);

    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);
  }

  /**
   * Для каждой клетки сетки создаем канопию – гладкую, выпуклую поверхность,
   * которая создаётся параметрически как bezier-подобная поверхность.
   * Функция поверхности определяется так, что по краям z = 0, а в центре z достигает canopyHeight.
   */
  createCanopiesFromGrid() {
    const gridWidth = 4096; // общая ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер клетки (например, 4096/32 = 128)
    const halfGrid = gridWidth / 2; // 2048
    const f = 0.8; // коэффициент заполнения клетки (80%)
    const s = cellSize * f; // размер вписанного квадрата (например, ~102.4)
    // Задаем высоту канопии – можно взять, например, 0.5 * s
    const canopyHeight = 0.5 * s;
    // Параметры для ParametricBufferGeometry
    const segmentsU = 20;
    const segmentsV = 20;

    // Материал для канопии – металлический
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 1.0,
      roughness: 0.3,
      side: THREE.FrontSide,
    });

    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        const x0 = -halfGrid + j * cellSize;
        const y0 = -halfGrid + i * cellSize;
        const x1 = x0 + cellSize;
        const y1 = y0 + cellSize;
        // Создаем параметрическую поверхность для данной клетки.
        // u, v ∈ [0,1]. По краям (u=0, u=1, v=0, v=1) z=0, а в центре z = canopyHeight.
        const parametricFunction = (
          u: number,
          v: number,
          target: THREE.Vector3
        ) => {
          target.x = (1 - u) * x0 + u * x1;
          target.y = (1 - v) * y0 + v * y1;
          // Можно задать сглаженное распределение по z, например, используя полином:
          // z = canopyHeight * 4 * u * (1 - u) * v * (1 - v)
          target.z = canopyHeight * 4 * u * (1 - u) * v * (1 - v);
        };

        const canopyGeometry = new ParametricGeometry(
          parametricFunction,
          segmentsU,
          segmentsV
        );
        // Создаем меш канопии для этой клетки.
        const canopyMesh = new THREE.Mesh(canopyGeometry, canopyMaterial);
        // Если требуется, можно добавить helper нормалей для отладки:
        const normalsHelper = new VertexNormalsHelper(
          canopyMesh,
          10,
          0x00ff00,
          1
        );
        // this.holderObjects.add(normalsHelper);
        this.holderObjects.add(canopyMesh);
      }
    }
  }

  update() {
    // Здесь можно обновлять uniforms или анимировать объект.
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
    }
  }
}
