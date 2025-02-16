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
    // Построим конусы для каждой клетки сетки с гладкой изогнутой поверхностью граней
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
    const widthSeg = Math.floor(this.widthSeg);
    const depthSeg = Math.floor(this.depthSeg);

    // Создаем BoxGeometry размером 4096 x 4096.
    // Геометрия центрирована, поэтому вершины располагаются от -2048 до 2048.
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
   * Для каждой клетки сетки создаем конус (пирамиду) с квадратным основанием,
   * вписанный в клетку, а затем модифицируем боковые грани так, чтобы они стали гладко изогнутыми.
   */
  createConesFromGrid() {
    const gridWidth = 4096; // общая ширина сетки
    const cellSize = gridWidth / this.widthSeg; // размер клетки (например, 4096/32 = 128)
    const halfGrid = gridWidth / 2; // 2048
    const f = 0.8; // коэффициент заполнения (80% от клетки)
    const s = cellSize * f; // сторона вписанного квадрата (например, ~102.4)
    // Чтобы пирамиды вписывались в клетку:
    const coneRadius = (s * Math.SQRT2) / 2; // ~s√2/2
    const coneHeight = s; // высота пирамиды
    // offset для изгиба (на сколько "вглубь" смещаем центральную точку грани)
    const bendOffset = 0.15 * coneHeight;

    // Для каждой клетки
    for (let i = 0; i < this.depthSeg; i++) {
      for (let j = 0; j < this.widthSeg; j++) {
        const x0 = -halfGrid + j * cellSize;
        const x1 = x0 + cellSize;
        const y0 = -halfGrid + i * cellSize;
        const y1 = y0 + cellSize;
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;

        // Создаем исходную геометрию конуса с 4 сегментами и thetaStart = π/4,
        // чтобы основание было квадратным, ориентированным по осям.
        const coneGeometry = new THREE.ConeGeometry(
          coneRadius,
          coneHeight,
          4, // 4 радиальных сегмента
          1, // 1 сегмент по высоте
          false, // не open-ended
          Math.PI / 4 // смещение угла
        );
        // Поворачиваем конус, чтобы его основание оказалось в плоскости XY.
        coneGeometry.rotateX(Math.PI / 2);

        // Применяем субдивизию и сглаживание для изгиба граней.
        // Зададим число субдивизий (например, 4 или 8).
        const subdivisions = 4;
        const curvedGeom = this.subdivideAndCurveGeometry(
          coneGeometry,
          bendOffset,
          subdivisions
        );

        const coneMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
        });
        const cone = new THREE.Mesh(curvedGeom, coneMaterial);
        cone.position.set(centerX, centerY, 0);

        this.holderObjects.add(cone);
      }
    }
  }

  /**
   * Принимает входную геометрию (BufferGeometry) и для каждой треугольной грани
   * субдивидирует её на маленькие треугольники, а затем сглаживает (изгибает) поверхность,
   * смещая внутренние вершины вдоль нормали на величину, зависящую от расстояния до центра.
   * subdivisions – число субдивизий по каждой стороне исходного треугольника.
   */
  subdivideAndCurveGeometry(
    geom: THREE.BufferGeometry,
    offset: number,
    subdivisions: number
  ): THREE.BufferGeometry {
    // Преобразуем геометрию в неиндексированную (каждая грань отдельно).
    const nonIndexed = geom.toNonIndexed();
    const posAttr = nonIndexed.getAttribute('position');
    const vertexCount = posAttr.count; // должно быть кратно 3
    const positions: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    // Для каждой треугольной грани:
    for (let i = 0; i < vertexCount; i += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
      // Вычисляем нормаль грани
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v1, v0),
          new THREE.Vector3().subVectors(v2, v0)
        )
        .normalize();
      // Субдивидируем эту грань на patch с гладким изгибом.
      const { positions: patchPos, indices: patchIdx } =
        this.subdivideAndCurveTriangle(
          v0,
          v1,
          v2,
          normal,
          offset,
          subdivisions
        );
      // Добавляем полученные вершины и индексы.
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
   * создавая patch из (subdivisions+1) x (subdivisions+1) точек по-барицентрически.
   * Для каждой полученной вершины вычисляет расстояние до центра исходного треугольника
   * и смещает её вдоль нормали так, чтобы в центре смещение было максимальным (offset),
   * а на краях – нулевым.
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
    // Заполняем сетку точек в треугольнике по барицентрическим координатам.
    for (let i = 0; i <= subdivisions; i++) {
      const row: number[] = [];
      for (let j = 0; j <= subdivisions - i; j++) {
        const k = subdivisions - i - j;
        const a = i / subdivisions;
        const b = j / subdivisions;
        const c = k / subdivisions;
        // Позиция без изгиба:
        const pos = new THREE.Vector3()
          .copy(v0)
          .multiplyScalar(a)
          .add(new THREE.Vector3().copy(v1).multiplyScalar(b))
          .add(new THREE.Vector3().copy(v2).multiplyScalar(c));
        // Вычисляем нормализованное расстояние до центра (0 у краёв, 1 в центре)
        const d = pos.distanceTo(centroid);
        const t = 1 - d / maxDist; // чем ближе к центру, тем больше t
        const disp = t * offset;
        // Смещаем точку вдоль отрицательной нормали
        pos.addScaledVector(normal, -disp);
        positions.push(pos.x, pos.y, pos.z);
        row.push(idx);
        idx++;
      }
      vertexIndices.push(row);
    }
    // Формируем индексы для треугольников внутри patch
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
    // Например, вращать сцену или изменять offset со временем.
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      // Опционально: очистка геометрии и материала.
    }
  }
}
