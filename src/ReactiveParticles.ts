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
    this.pointsMesh.rotateX(Math.PI / 2);
    this.holderObjects.add(this.pointsMesh);

    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);
  }

  /**
   * Для каждой клетки сетки (образованной четырьмя соседними вершинами)
   * создаем пирамиду (конус с 4 сегментами), вписанную в клетку с отступом,
   * а затем применяем субдивизию и сглаживание граней для получения ровной, закругленной поверхности.
   * Обновленный материал – MeshStandardMaterial с металлическим эффектом.
   */
  createConesFromGrid() {
    const gridWidth = 4096; // общая ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер клетки (например, 4096/32 = 128)
    const halfGrid = gridWidth / 2; // 2048
    const f = 0.8; // коэффициент заполнения (80% от клетки)
    const s = cellSize * f; // сторона вписанного квадрата (например, ~102.4)
    const coneRadius = (s * Math.SQRT2) / 2; // радиус описанной окружности квадрата
    const coneHeight = s; // высота пирамиды
    const bendOffset = 0.15 * coneHeight; // величина изгиба граней

    // Устанавливаем число субдивизий для гладкости поверхности (16)
    const subdivisions = 16;

    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        const x0 = -halfGrid + j * cellSize;
        const x1 = x0 + cellSize;
        const y0 = -halfGrid + i * cellSize;
        const y1 = y0 + cellSize;
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;

        const coneGeometry = new THREE.ConeGeometry(
          coneRadius,
          coneHeight,
          4, // 4 радиальных сегмента
          1, // 1 сегмент по высоте
          false, // не open-ended
          Math.PI / 4 // смещение угла для правильной ориентации основания
        );
        // Поворачиваем конус, чтобы его основание оказалось в плоскости XY.
        coneGeometry.rotateX(Math.PI / 2);

        // Применяем субдивизию и сглаживание для изгиба граней.
        const curvedGeom = this.subdivideAndCurveGeometry(
          coneGeometry,
          bendOffset,
          subdivisions
        );

        // Используем MeshStandardMaterial с металлическим видом.
        const coneMaterial = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          metalness: 1.0,
          roughness: 0.3,
          // Не прозрачный материал.
          transparent: false,
          opacity: 1,
        });
        const cone = new THREE.Mesh(curvedGeom, coneMaterial);
        cone.position.set(centerX, centerY, 0);
        this.holderObjects.add(cone);
      }
    }
  }

  /**
   * Принимает BufferGeometry и для каждой треугольной грани
   * субдивидирует её на маленькие треугольники, а затем сглаживает поверхность,
   * смещая внутренние вершины вдоль нормали на величину, зависящую от расстояния до центра.
   * subdivisions – число субдивизий по каждой стороне исходного треугольника.
   */
  subdivideAndCurveGeometry(
    geom: THREE.BufferGeometry,
    offset: number,
    subdivisions: number
  ): THREE.BufferGeometry {
    const nonIndexed = geom.toNonIndexed();
    const posAttr = nonIndexed.getAttribute('position');
    const vertexCount = posAttr.count;
    const positions: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    for (let i = 0; i < vertexCount; i += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v1, v0),
          new THREE.Vector3().subVectors(v2, v0)
        )
        .normalize();
      const { positions: patchPos, indices: patchIdx } =
        this.subdivideAndCurveTriangle(
          v0,
          v1,
          v2,
          normal,
          offset,
          subdivisions
        );
      positions.push(...patchPos);
      patchIdx.forEach((idx) => indices.push(idx + indexOffset));
      indexOffset += patchPos.length / 3;
    }

    const newGeom = new THREE.BufferGeometry();
    newGeom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    newGeom.setIndex(indices);
    newGeom.computeVertexNormals();
    return newGeom;
  }

  /**
   * Субдивидирует треугольную грань, заданную вершинами v0, v1, v2,
   * создавая патч из (subdivisions+1) x (subdivisions+1) точек по барицентрическим координатам.
   * Для каждой вершины вычисляет расстояние до центра исходного треугольника
   * и смещает её вдоль нормали так, чтобы в центре смещение было максимальным (offset), а на краях – нулевым.
   */
  subdivideAndCurveTriangle(
    v0: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    normal: THREE.Vector3,
    offset: number,
    subdivisions: number
  ): { positions: number[]; indices: number[] } {
    const positions: number[] = [];
    const indices: number[] = [];
    const vertexIndices: number[][] = [];
    const centroid = new THREE.Vector3()
      .addVectors(v0, v1)
      .add(v2)
      .multiplyScalar(1 / 3);
    const maxDist = Math.max(
      centroid.distanceTo(v0),
      centroid.distanceTo(v1),
      centroid.distanceTo(v2)
    );
    let idx = 0;
    for (let i = 0; i <= subdivisions; i++) {
      const row: number[] = [];
      for (let j = 0; j <= subdivisions - i; j++) {
        const k = subdivisions - i - j;
        const a = i / subdivisions;
        const b = j / subdivisions;
        const c = k / subdivisions;
        const pos = new THREE.Vector3()
          .copy(v0)
          .multiplyScalar(a)
          .add(new THREE.Vector3().copy(v1).multiplyScalar(b))
          .add(new THREE.Vector3().copy(v2).multiplyScalar(c));
        const d = pos.distanceTo(centroid);
        const t = 1 - d / maxDist;
        const disp = t * offset;
        pos.addScaledVector(normal, -disp);
        positions.push(pos.x, pos.y, pos.z);
        row.push(idx);
        idx++;
      }
      vertexIndices.push(row);
    }
    for (let i = 0; i < vertexIndices.length - 1; i++) {
      for (let j = 0; j < vertexIndices[i].length - 1; j++) {
        const a = vertexIndices[i][j];
        const b = vertexIndices[i][j + 1];
        const c = vertexIndices[i + 1][j];
        indices.push(a, b, c);
        if (j < vertexIndices[i + 1].length - 1) {
          const d = vertexIndices[i + 1][j + 1];
          indices.push(b, d, c);
        }
      }
    }
    return { positions, indices };
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
