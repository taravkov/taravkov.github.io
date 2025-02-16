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

  // Параметры сетки (например, 32 ячейки по ширине и глубине)
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
    // Создаем чередующиеся канопии:
    // – на точках сетки (вершинах) – канопии, уходящие вглубь (вогнутые),
    // – между ними (в центрах ячеек) – канопии, уходящие вверх (выпуклые)
    this.createCanopiesFromGrid();
    this.properties.autoMix = false;
  }

  init(mainHolder: THREE.Object3D) {
    mainHolder.add(this);
    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects);

    // Шейдерный материал для точек (сетка)
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
    // Создаем плоскую сетку BoxGeometry размером 4096 x 4096.
    // Координаты вершин располагаются от -2048 до 2048.
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
    // Размещаем сетку в плоскости XY
    this.pointsMesh.rotateX(Math.PI / 2);
    this.holderObjects.add(this.pointsMesh);

    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);
  }

  /**
   * Создаем канопии по двум схемам:
   * 1. На точках сетки (вершинах) – канопии с вогнутой формой (их центр опущен вниз).
   * 2. В центрах ячеек – канопии с выпуклой формой (их центр поднят вверх).
   *
   * Для каждой канопии по краям (u=0 или 1, v=0 или 1) z = 0, а в центре (u = 0.5, v = 0.5)
   * достигается максимум (для выпуклой) или минимум (для вогнутой).
   */
  createCanopiesFromGrid() {
    const gridWidth = 4096;
    const cellSize = gridWidth / this.widthSeg; // например, 4096/32 = 128
    const halfGrid = gridWidth / 2;
    const segmentsU = 20;
    const segmentsV = 20;

    // Для удобства зададим базовый размер для каждой канопии – пусть будет половина от cellSize
    const canopyBase = cellSize / 2; // то есть 64, чтобы между соседними канопиями не было полного слияния
    // Определяем высоту для выпуклой канопии и глубину для вогнутой (можно настроить)
    const upwardHeight = canopyBase * 1.5; // например, 32
    const downwardDepth = canopyBase * 1.5; // например, 32

    // Материал для канопий, уходящих вверх (выпуклых)
    const upwardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 1.0,
      roughness: 0.3,
      side: THREE.FrontSide,
    });

    // Материал для канопий, уходящих вниз (вогнутых)
    const downwardMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 1.0,
      roughness: 0.3,
      side: THREE.FrontSide,
    });

    // 1. Канопии на точках сетки (вершинах) – вогнутые (центр опущен вниз)
    for (let i = 0; i <= this.depthSeg; i++) {
      for (let j = 0; j <= this.widthSeg; j++) {
        // Координаты вершины сетки
        const cx = -halfGrid + j * cellSize;
        const cy = -halfGrid + i * cellSize;
        // Определяем квадрат для канопии вокруг вершины: от (cx - canopyBase/2, cy - canopyBase/2) до (cx + canopyBase/2, cy + canopyBase/2)
        const x0 = cx - canopyBase / 2;
        const x1 = cx + canopyBase / 2;
        const y0 = cy - canopyBase / 2;
        const y1 = cy + canopyBase / 2;

        const parametricFunction = (
          u: number,
          v: number,
          target: THREE.Vector3
        ) => {
          target.x = (1 - u) * x0 + u * x1;
          target.y = (1 - v) * y0 + v * y1;
          // Форма вогнутой поверхности: по краям z = 0, в центре (u=0.5, v=0.5) z = -downwardDepth
          target.z = -downwardDepth * 4 * u * (1 - u) * v * (1 - v);
        };

        const geometry = new ParametricGeometry(
          parametricFunction,
          segmentsU,
          segmentsV
        );
        const mesh = new THREE.Mesh(geometry, downwardMaterial);
        this.holderObjects.add(mesh);
      }
    }

    // 2. Канопии в центрах ячеек – выпуклые (центр поднят вверх)
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        // Границы текущей ячейки
        const x0_cell = -halfGrid + j * cellSize;
        const x1_cell = x0_cell + cellSize;
        const y0_cell = -halfGrid + i * cellSize;
        const y1_cell = y0_cell + cellSize;
        // Центр ячейки
        const cx = (x0_cell + x1_cell) / 2;
        const cy = (y0_cell + y1_cell) / 2;
        // Определяем квадрат для канопии вокруг центра ячейки
        const x0 = cx - canopyBase / 2;
        const x1 = cx + canopyBase / 2;
        const y0 = cy - canopyBase / 2;
        const y1 = cy + canopyBase / 2;

        const parametricFunction = (
          u: number,
          v: number,
          target: THREE.Vector3
        ) => {
          target.x = (1 - u) * x0 + u * x1;
          target.y = (1 - v) * y0 + v * y1;
          // Форма выпуклой поверхности: по краям z = 0, в центре (u=0.5, v=0.5) z = upwardHeight
          target.z = upwardHeight * 4 * u * (1 - u) * v * (1 - v);
        };

        const geometry = new ParametricGeometry(
          parametricFunction,
          segmentsU,
          segmentsV
        );
        const mesh = new THREE.Mesh(geometry, upwardMaterial);
        this.holderObjects.add(mesh);
      }
    }
  }

  update() {
    // Здесь можно обновлять uniforms или анимировать объект
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
    }
  }
}
