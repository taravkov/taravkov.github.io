import * as THREE from 'three';
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
    // Создаем канопеи по двум схемам:
    // – на точках сетки (вершинах) – вогнутые (центр опущен вниз),
    // – в центрах ячеек – выпуклые (центр поднят вверх)
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
   * Создаем канопеи по двум схемам:
   * 1. На точках сетки (вершинах) – вогнутые (их центр опущен вниз).
   * 2. В центрах ячеек – выпуклые (их центр поднят вверх).
   *
   * Для каждой канопеи по краям (u=0 или 1, v=0 или 1) z = 0, а в центре (u = 0.5, v = 0.5)
   * достигается максимум (для выпуклой) или минимум (для вогнутой).
   *
   * В дополнение мы сохраняем в userData параметры канопеи для дальнейшей анимации.
   */
  createCanopiesFromGrid() {
    const gridWidth = 4096;
    const cellSize = gridWidth / this.widthSeg; // например, 4096/32 = 128
    const halfGrid = gridWidth / 2;
    const segmentsU = 20;
    const segmentsV = 20;

    // Базовый размер для канопеи – чтобы они не сливались полностью
    const canopyBase = cellSize / 2; // например, 64

    // Определяем высоту для выпуклой канопеи и глубину для вогнутой
    const upwardHeight = canopyBase * 1.5;
    const downwardDepth = canopyBase * 1.5;

    // Материалы для канопей (просто стандартные, без шейдерной анимации)
    const upwardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 1.0,
      roughness: 0.3,
      side: THREE.FrontSide,
    });

    const downwardMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 1.0,
      roughness: 0.3,
      side: THREE.FrontSide,
    });

    // 1. Вогнутые канопеи на точках сетки (вершинах)
    for (let i = 0; i <= this.depthSeg; i++) {
      for (let j = 0; j <= this.widthSeg; j++) {
        const cx = -halfGrid + j * cellSize;
        const cy = -halfGrid + i * cellSize;
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
          // Исходная вогнутая форма
          target.z = -downwardDepth * 4 * u * (1 - u) * v * (1 - v);
        };

        const geometry = new ParametricGeometry(
          parametricFunction,
          segmentsU,
          segmentsV
        );
        // Сохраним параметры для анимации:
        const mesh = new THREE.Mesh(geometry, downwardMaterial);
        mesh.userData = {
          type: 'downward', // исходное состояние вогнутости
          x0,
          x1,
          y0,
          y1,
          upwardHeight,
          downwardDepth,
          segmentsU,
          segmentsV,
        };
        this.holderObjects.add(mesh);
      }
    }

    // 2. Выпуклые канопеи в центрах ячеек
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        const x0_cell = -halfGrid + j * cellSize;
        const x1_cell = x0_cell + cellSize;
        const y0_cell = -halfGrid + i * cellSize;
        const y1_cell = y0_cell + cellSize;
        const cx = (x0_cell + x1_cell) / 2;
        const cy = (y0_cell + y1_cell) / 2;
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
          // Исходная выпуклая форма
          target.z = upwardHeight * 4 * u * (1 - u) * v * (1 - v);
        };

        const geometry = new ParametricGeometry(
          parametricFunction,
          segmentsU,
          segmentsV
        );
        const mesh = new THREE.Mesh(geometry, upwardMaterial);
        mesh.userData = {
          type: 'upward', // исходное состояние выпуклости
          x0,
          x1,
          y0,
          y1,
          upwardHeight,
          downwardDepth,
          segmentsU,
          segmentsV,
        };
        this.holderObjects.add(mesh);
      }
    }
  }

  update() {
    // Обновляем общее время анимации
    this.time += 0.01;
    // Вычисляем анимационный фактор, циклически меняющийся от 0 до 1 и обратно.
    // Например, используя синус:
    const factor = 0.5 * (Math.sin(this.time) + 1); // factor = 0 => исходное состояние, factor = 1 => обмен

    // Перебираем все канопеи (исключая pointsMesh)
    for (let i = 0; i < this.holderObjects.children.length; i++) {
      const child = this.holderObjects.children[i];
      // Обновляем только меши, у которых есть userData.type (то есть канопеи)
      if (child.type === 'Mesh' && child.userData && child.userData.type) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry as THREE.BufferGeometry;
        const posAttr = geo.attributes.position;
        const uvAttr = geo.attributes.uv;
        const count = posAttr.count;
        // Извлекаем параметры, сохраненные при создании канопеи
        const { type, upwardHeight, downwardDepth } = mesh.userData;

        // Для каждой вершины пересчитываем координату z
        for (let j = 0; j < count; j++) {
          // Получаем u и v из uv-атрибута
          const u = uvAttr.getX(j);
          const v = uvAttr.getY(j);
          // Базовое значение формы: 4 * u * (1 - u) * v * (1 - v)
          const base = 4 * u * (1 - u) * v * (1 - v);
          let targetZ;
          if (type === 'upward') {
            // Для исходно выпуклой канопеи: при factor=0 z = upward, при factor=1 z = -downwardDepth
            targetZ = THREE.MathUtils.lerp(
              upwardHeight * base,
              -downwardDepth * base,
              factor
            );
          } else {
            // Для исходно вогнутой канопеи: при factor=0 z = -downwardDepth, при factor=1 z = upwardHeight
            targetZ = THREE.MathUtils.lerp(
              -downwardDepth * base,
              upwardHeight * base,
              factor
            );
          }
          // Обновляем только z, x и y остаются прежними
          posAttr.setZ(j, targetZ);
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
    }
  }
}
