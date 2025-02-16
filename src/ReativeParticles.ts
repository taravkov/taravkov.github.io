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
   * Для каждой клетки сетки (образованной четырьмя соседними вершинами BoxGeometry)
   * создаём пирамиду (конус с 4 сегментами), вписанную в клетку с отступом.
   */
  createConesFromGrid() {
    const gridWidth = 4096; // общая ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер клетки, например 4096/32 = 128
    const halfGrid = gridWidth / 2; // 2048
    const f = 0.8; // коэффициент заполнения (80% от клетки)
    const s = cellSize * f; // сторона вписанного квадрата, например 102.4
    const coneRadius = (s * Math.SQRT2) / 2; // радиус описанной окружности квадрата: s√2/2, ~72.4
    const coneHeight = s; // высота пирамиды, можно задать по желанию

    // Перебираем все клетки (ячейки) сетки.
    // Количество клеток по горизонтали и вертикали: widthSeg и depthSeg соответственно.
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        // Вычисляем границы клетки:
        const x0 = -halfGrid + j * cellSize;
        const x1 = x0 + cellSize;
        const y0 = -halfGrid + i * cellSize;
        const y1 = y0 + cellSize;
        // Центр клетки:
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;

        // Создаем конус с 4 радиальными сегментами.
        // Используем thetaStart = Math.PI/4, чтобы основание (квадрат) было ориентировано
        // так, что его стороны параллельны границам клетки.
        const coneGeometry = new THREE.ConeGeometry(
          coneRadius,
          coneHeight,
          4, // 4 сегмента – квадратное основание
          1, // один сегмент по высоте
          false, // не открытый (закрытый)
          Math.PI / 4 // смещение угла для правильной ориентации
        );
        const coneMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);

        // По умолчанию ConeGeometry ориентирован вдоль оси Y (база на y=0, апекс на y=height).
        // Нам нужно, чтобы основание лежало в плоскости XY (как и сетка).
        // Поэтому поворачиваем конус вокруг оси X на -90°.
        cone.rotation.x = Math.PI / 2;

        // Позиционируем конус так, чтобы его центр совпадал с центром клетки.
        cone.position.set(centerX, centerY, 0);

        // Добавляем конус в общий контейнер.
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
