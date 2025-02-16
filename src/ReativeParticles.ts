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
    // Построим конусы для каждой клетки сетки
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
   * Для каждой клетки сетки (образованной четырьмя соседними вершинами)
   * создаем пирамиду (конус с 4 сегментами), вписанную в клетку с отступом,
   * а затем модифицируем её боковые грани, сгибая их внутрь в центральной точке.
   */
  createConesFromGrid() {
    const gridWidth = 4096; // общая ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер клетки, например 4096/32 = 128
    const halfGrid = gridWidth / 2; // 2048
    const f = 0.8; // коэффициент заполнения (80% от клетки)
    const s = cellSize * f; // сторона вписанного квадрата, например 102.4
    // Для того чтобы пирамиды (с квадратным основанием) были вписаны в клетку:
    const coneRadius = (s * Math.SQRT2) / 2; // радиус описанной окружности квадрата
    const coneHeight = s; // высота пирамиды
    const bendOffset = 0.1 * coneHeight; // величина, на которую сгибаем грань

    // Перебираем все клетки (ячейки) сетки.
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        // Границы клетки:
        const x0 = -halfGrid + j * cellSize;
        const x1 = x0 + cellSize;
        const y0 = -halfGrid + i * cellSize;
        const y1 = y0 + cellSize;
        // Центр клетки:
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;

        // Создаем конус с 4 сегментами и смещением угла, чтобы основание было квадратным.
        const coneGeometry = new THREE.ConeGeometry(
          coneRadius,
          coneHeight,
          4, // 4 радиальных сегмента
          1, // 1 сегмент по высоте (одиночный треугольник на каждую грань)
          false, // не open-ended
          Math.PI / 4 // поворот, чтобы квадрат был ориентирован по осям
        );
        // Поворачиваем конус, чтобы его основание лежало в плоскости XY.
        coneGeometry.rotateX(Math.PI / 2);

        // Модифицируем геометрию: для каждой треугольной боковой грани
        // добавляем центральную точку и смещаем её внутрь (вдоль нормали)
        const bentGeometry = this.bendGeometryFaces(coneGeometry, bendOffset);

        const coneMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
        });
        const cone = new THREE.Mesh(bentGeometry, coneMaterial);

        // Позиционируем конус так, чтобы его центр совпадал с центром клетки.
        cone.position.set(centerX, centerY, 0);

        this.holderObjects.add(cone);
      }
    }
  }

  /**
   * Принимает BufferGeometry и для каждой треугольной грани
   * добавляет центральную точку, смещенную внутрь на offset,
   * затем разбивает грань на 3 треугольника.
   * Это создает эффект "изгиба" грани.
   */
  bendGeometryFaces(
    geom: THREE.BufferGeometry,
    offset: number
  ): THREE.BufferGeometry {
    // Преобразуем в неиндексированную геометрию, чтобы каждая грань была отдельной.
    const nonIndexedGeom = geom.toNonIndexed();
    const posAttr = nonIndexedGeom.getAttribute('position');
    const vertexCount = posAttr.count; // должно быть кратно 3
    const newPositions: number[] = [];

    for (let i = 0; i < vertexCount; i += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);

      // Вычисляем центр грани.
      const centroid = new THREE.Vector3()
        .add(v0)
        .add(v1)
        .add(v2)
        .divideScalar(3);

      // Вычисляем нормаль грани.
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // Смещаем центр грани внутрь (вдоль обратного направления нормали).
      const displacedCentroid = centroid
        .clone()
        .addScaledVector(normal, -offset);

      // Разбиваем грань на 3 треугольника:
      // (v0, v1, displacedCentroid), (v1, v2, displacedCentroid), (v2, v0, displacedCentroid)
      newPositions.push(...v0.toArray());
      newPositions.push(...v1.toArray());
      newPositions.push(...displacedCentroid.toArray());

      newPositions.push(...v1.toArray());
      newPositions.push(...v2.toArray());
      newPositions.push(...displacedCentroid.toArray());

      newPositions.push(...v2.toArray());
      newPositions.push(...v0.toArray());
      newPositions.push(...displacedCentroid.toArray());
    }

    const newGeom = new THREE.BufferGeometry();
    newGeom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    newGeom.computeVertexNormals();
    return newGeom;
  }

  update() {
    // Здесь можно обновлять uniforms или анимировать объект
    // this.material.uniforms.time.value = this.time;
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      // Опционально: очистка геометрии и материала
      // this.pointsMesh.geometry?.dispose();
      // this.pointsMesh.material?.dispose();
      // this.pointsMesh = null;
    }
  }
}
