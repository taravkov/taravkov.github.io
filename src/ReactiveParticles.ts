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
    // После создания канопей отмечаем центры их краёв красными сферами
    this.markEdgeCenters();
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
    this.geometry = new THREE.BoxGeometry(
      4096,
      0,
      4096,
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
   * Создаем канопеи:
   * 1. Вогнутые канопеи на вершинах сетки.
   * 2. Выпуклые канопеи в центрах ячеек.
   *
   * Параметрическая функция для каждой канопеи определяется так, что по краям uv (0 или 1) z = 0,
   * а в центре (u = 0.5, v = 0.5) достигается максимум (для выпуклой) или минимум (для вогнутой).
   * Сохраняем параметры в userData для дальнейших вычислений.
   */
  createCanopiesFromGrid() {
    const gridWidth = 4096;
    const cellSize = gridWidth / this.widthSeg;
    const halfGrid = gridWidth / 2;
    const segmentsU = 20;
    const segmentsV = 20;
    const canopyBase = cellSize / 2; // например, 64

    const upwardHeight = canopyBase * 1.5;
    const downwardDepth = canopyBase * 1.5;

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

    // Вогнутые канопеи (на вершинах)
    for (let i = 0; i <= this.depthSeg; i++) {
      for (let j = 0; j <= this.widthSeg; j++) {
        const cx = -halfGrid + j * cellSize;
        const cy = -halfGrid + i * cellSize;
        const x0 = cx - canopyBase / 2;
        const x1 = cx + canopyBase / 2;
        const y0 = cy - canopyBase / 2;
        const y1 = cy + canopyBase / 2;
        const paramFunc = (u: number, v: number, target: THREE.Vector3) => {
          target.x = (1 - u) * x0 + u * x1;
          target.y = (1 - v) * y0 + v * y1;
          target.z = -downwardDepth * 4 * u * (1 - u) * v * (1 - v);
        };
        const geometry = new ParametricGeometry(
          paramFunc,
          segmentsU,
          segmentsV
        );
        const mesh = new THREE.Mesh(geometry, downwardMaterial);
        mesh.userData = {
          type: 'downward',
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

    // Выпуклые канопеи (в центрах ячеек)
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
        const paramFunc = (u: number, v: number, target: THREE.Vector3) => {
          target.x = (1 - u) * x0 + u * x1;
          target.y = (1 - v) * y0 + v * y1;
          target.z = upwardHeight * 4 * u * (1 - u) * v * (1 - v);
        };
        const geometry = new ParametricGeometry(
          paramFunc,
          segmentsU,
          segmentsV
        );
        const mesh = new THREE.Mesh(geometry, upwardMaterial);
        mesh.userData = {
          type: 'upward',
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

  /**
   * Для каждой канопеи, вычисляем точки-центры её четырех сторон (в параметрическом пространстве):
   * (u=0.5, v=0), (u=1, v=0.5), (u=0.5, v=1) и (u=0, v=0.5),
   * и отмечаем их красными сферами.
   */
  markEdgeCenters() {
    const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereGeom = new THREE.SphereGeometry(5, 8, 8); // маленькая сфера
    // Функция для вычисления точки по параметрам (u, v)
    const computePoint = (
      userData: any,
      type: string,
      u: number,
      v: number
    ) => {
      // x = (1-u)*x0 + u*x1, y = (1-v)*y0 + v*y1.
      const x = (1 - u) * userData.x0 + u * userData.x1;
      const y = (1 - v) * userData.y0 + v * userData.y1;
      let z = 0;
      if (type === 'upward') {
        z = userData.upwardHeight * 4 * u * (1 - u) * v * (1 - v);
      } else if (type === 'downward') {
        z = -userData.downwardDepth * 4 * u * (1 - u) * v * (1 - v);
      }
      return new THREE.Vector3(x, y, z);
    };

    // Перебираем все канопеи
    this.holderObjects.children.forEach((child) => {
      if (child.type === 'Mesh' && child.userData && child.userData.type) {
        const canopy = child as THREE.Mesh;
        const type = canopy.userData.type;
        // Точки: нижняя сторона (u=0.5,v=0), правая (u=1,v=0.5), верхняя (u=0.5,v=1), левая (u=0,v=0.5)
        const pts = [
          computePoint(canopy.userData, type, 0.5, 0),
          computePoint(canopy.userData, type, 1, 0.5),
          computePoint(canopy.userData, type, 0.5, 1),
          computePoint(canopy.userData, type, 0, 0.5),
        ];
        pts.forEach((p) => {
          const sphere = new THREE.Mesh(sphereGeom, redMaterial);
          sphere.position.copy(p);
          this.holderObjects.add(sphere);
        });
      }
    });
  }

  update() {
    this.time += 0.01;
    const factor = 0.5 * (Math.sin(this.time) + 1);
    for (let i = 0; i < this.holderObjects.children.length; i++) {
      const child = this.holderObjects.children[i];
      if (child.type === 'Mesh' && child.userData && child.userData.type) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry as THREE.BufferGeometry;
        const posAttr = geo.attributes.position;
        const count = posAttr.count;
        const { type, upwardHeight, downwardDepth } = mesh.userData;
        for (let j = 0; j < count; j++) {
          const u = geo.attributes.uv.getX(j);
          const v = geo.attributes.uv.getY(j);
          const base = 4 * u * (1 - u) * v * (1 - v);
          let targetZ;
          if (type === 'upward') {
            targetZ = THREE.MathUtils.lerp(
              upwardHeight * base,
              -downwardDepth * base,
              factor
            );
          } else {
            targetZ = THREE.MathUtils.lerp(
              -downwardDepth * base,
              upwardHeight * base,
              factor
            );
          }
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
