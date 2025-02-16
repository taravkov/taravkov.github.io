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
    // Построим конусы для каждой ячейки сетки
    this.createConesFromGrid();
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
  }

  createBoxMesh() {
    // Задаем число сегментов для сетки
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

    // Обновляем uniform для offsetSize (например, случайное значение)
    this.material.uniforms.offsetSize.value = THREE.MathUtils.randInt(30, 60);
    this.material.needsUpdate = true;

    // Создаем контейнер для Points-меша и поворачиваем его, чтобы сетка оказалась в плоскости XY.
    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 2);
    this.holderObjects.add(this.pointsMesh);

    // Создаем Points-меш на основе геометрии и шейдерного материала
    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);
  }

  /**
   * Для каждой ячейки сетки (образованной четырьмя соседними вершинами) создаем конус,
   * так что базовые вершины конуса совпадают с углами ячейки.
   *
   * Для этого:
   * - Определяем размер ячейки: cellSize = ширина / число сегментов.
   * - Центр ячейки: (x0+x1)/2, (y0+y1)/2, где x0 = -2048 + j*cellSize, x1 = -2048 + (j+1)*cellSize,
   *   y0 = -2048 + i*cellSize, y1 = -2048 + (i+1)*cellSize.
   * - Чтобы конус с 4 сегментами (радиальная сегментация = 4) имел квадратное основание с углами,
   *   задаем thetaStart = π/4. Радиус должен быть равен (cellSize/2)*√2, чтобы расстояние от центра до угла было cellSize/2.
   */
  createConesFromGrid() {
    const gridWidth = 4096; // ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер ячейки, например 4096/32 = 128
    const halfGrid = gridWidth / 2; // 2048
    // Радиус конуса так, чтобы при thetaStart = π/4 базовые вершины были в углах ячейки:
    const coneRadius = (cellSize / 2) * Math.SQRT2; // (cellSize/2)*√2
    const coneHeight = cellSize; // можно задать высоту равной размеру ячейки

    // Перебираем ячейки по i и j (каждая ячейка определяется четырьмя соседними вершинами)
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        // Вычисляем границы ячейки.
        const x0 = -halfGrid + j * cellSize;
        const x1 = -halfGrid + (j + 1) * cellSize;
        const y0 = -halfGrid + i * cellSize;
        const y1 = -halfGrid + (i + 1) * cellSize;
        // Центр ячейки
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;

        // Создаем конус с 4 радиальными сегментами и thetaStart = π/4,
        // чтобы его базовые вершины совпали с углами квадратной ячейки.
        const coneGeometry = new THREE.ConeGeometry(
          coneRadius,
          coneHeight,
          4, // 4 сегмента (квадратное основание)
          1, // один сегмент по высоте
          false, // не открыт
          Math.PI / 4 // смещение угла, чтобы основание было ориентировано как квадрат, выровненный с осями
        );
        const coneMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);

        // По умолчанию ConeGeometry ориентирован вдоль оси Y (база на y=0, апекс на y=height).
        // Нам нужно, чтобы основание лежало в плоскости XY.
        // Для этого поворачиваем конус вокруг оси X на -90°.
        cone.rotation.x = -Math.PI / 2;

        // Позиционируем конус так, чтобы его основание (центр) совпадало с центром ячейки.
        cone.position.set(centerX, centerY, 0);

        // Добавляем конус в контейнер.
        this.holderObjects.add(cone);
      }
    }
  }

  update() {
    // Здесь можно обновлять uniforms или анимировать объект (например, вращать сцену)
    // this.material.uniforms.time.value = this.time;
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      // Очистка геометрии и материала при необходимости:
      // this.pointsMesh.geometry?.dispose();
      // this.pointsMesh.material?.dispose();
      // this.pointsMesh = null;
    }
  }
}
