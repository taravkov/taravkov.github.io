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

  // Сохраним параметры сетки для последующего использования
  widthSeg: number = 20;
  depthSeg: number = 20;

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
    // После создания сетки точек, можно построить пирамиды
    this.createPyramidsFromGrid();
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

    // Если потребуется обновлять что-либо
    // this.resetMesh();
  }

  createBoxMesh() {
    // Здесь создаем сетку точек
    const widthSeg = this.widthSeg; // например, 20
    const depthSeg = this.depthSeg; // например, 20

    // Создаем "плоскую" BoxGeometry; размеры 1x1, сегменты задают количество делений
    this.geometry = new THREE.BoxGeometry(
      1,
      0,
      1,
      widthSeg,
      undefined,
      depthSeg
    );

    // Обновляем uniform для offsetSize случайным значением (если требуется)
    this.material.uniforms.offsetSize.value = THREE.MathUtils.randInt(30, 60);
    this.material.needsUpdate = true;

    // Создаем контейнер для точечного меша и задаем его ориентацию
    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 2); // поворачиваем, чтобы сетка лежала в XY
    this.holderObjects.add(this.pointsMesh);

    // Создаем Points-объект на основе геометрии и шейдерного материала
    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);
  }

  /**
   * Для каждой ячейки, образованной сеткой точек (BoxGeometry),
   * строим пирамиду, основание которой — четырехугольник из четырех соседних вершин,
   * а апекс находится над центром с заданной высотой.
   */
  createPyramidsFromGrid() {
    // Высота пирамиды (можно регулировать)
    const pyramidHeight = 0.2;

    // Количество вершин по каждой оси
    const gridCols = this.widthSeg + 1;
    const gridRows = this.depthSeg + 1;

    // Доступ к позиции вершин из BoxGeometry (уже в локальных координатах)
    const posAttr = this.geometry.getAttribute('position');

    // Для каждой ячейки (каждая ячейка определяется четырьмя соседними точками)
    for (let i = 0; i < gridRows - 1; i++) {
      for (let j = 0; j < gridCols - 1; j++) {
        // Вычисляем индексы вершин ячейки
        const indexA = i * gridCols + j; // A: нижний левый угол
        const indexB = indexA + 1; // B: нижний правый угол
        const indexD = (i + 1) * gridCols + j; // D: верхний левый угол
        const indexC = indexD + 1; // C: верхний правый угол

        // Извлекаем координаты вершин
        const A = new THREE.Vector3().fromBufferAttribute(posAttr, indexA);
        const B = new THREE.Vector3().fromBufferAttribute(posAttr, indexB);
        const C = new THREE.Vector3().fromBufferAttribute(posAttr, indexC);
        const D = new THREE.Vector3().fromBufferAttribute(posAttr, indexD);

        console.log(
          `[A, B, C, D] = [ [${A.toArray()}], [${B.toArray()}], [${C.toArray()}], [${D.toArray()}]] ]`
        );

        // Вычисляем центр основания ячейки
        const center = new THREE.Vector3()
          .add(A)
          .add(B)
          .add(C)
          .add(D)
          .multiplyScalar(0.25);

        // Апекс пирамиды — центр плюс смещение по оси Z (т.к. после поворота плоскость лежит в XY)
        const apex = center.clone();
        apex.z += pyramidHeight;

        // Формируем массив вершин для пирамидальной геометрии:
        // Первые 4 вершины — основание (A, B, C, D), пятая — апекс.
        const vertices = new Float32Array([
          A.x,
          A.y,
          A.z, // 0: A
          B.x,
          B.y,
          B.z, // 1: B
          C.x,
          C.y,
          C.z, // 2: C
          D.x,
          D.y,
          D.z, // 3: D
          apex.x,
          apex.y,
          apex.z, // 4: Апекс
        ]);

        // Задаем индексы для граней:
        // Основание (два треугольника): [A, B, C] и [A, C, D]
        // Боковые грани (4 треугольника): [A, B, Апекс], [B, C, Апекс], [C, D, Апекс], [D, A, Апекс]
        const indices = [
          // Основание
          0, 1, 2, 0, 2, 3,
          // Боковые грани
          0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4,
        ];

        // Создаем BufferGeometry для пирамиды
        const pyramidGeo = new THREE.BufferGeometry();
        pyramidGeo.setAttribute(
          'position',
          new THREE.BufferAttribute(vertices, 3)
        );
        pyramidGeo.setIndex(indices);
        pyramidGeo.computeVertexNormals();

        // Для наглядности можно задать отдельный материал (например, MeshBasicMaterial)
        const pyramidMat = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          side: THREE.DoubleSide,
          wireframe: false,
        });

        // Создаем меш пирамиды и добавляем его в контейнер (например, в holderObjects)
        const pyramidMesh = new THREE.Mesh(pyramidGeo, pyramidMat);
        this.holderObjects.add(pyramidMesh);
      }
    }
  }

  update() {
    // Обновления, если необходимы, например, анимация шейдера
    // this.material.uniforms.time.value = this.time;
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      // Очистка геометрии и материала, если требуется
      // this.pointsMesh.geometry?.dispose();
      // this.pointsMesh.material?.dispose();
      // this.pointsMesh = null;
    }
  }
}
