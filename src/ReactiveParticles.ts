import * as THREE from 'three';
import vertex from './glsl/vertex.glsl';
import fragment from './glsl/fragment.glsl';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import createBoxMesh from './BoxMesh'; // Импортируем вынесенный код для сетки

export default class ReactiveParticles extends THREE.Object3D {
  time: number;
  properties: {
    startColor: number;
    endColor: number;
    autoMix: boolean;
    autoRotate: boolean;
  };
  holderObjects: THREE.Object3D<THREE.Object3DEventMap>;
  material: THREE.ShaderMaterial;
  // Теперь box-сетка хранится как отдельный объект
  pointsMesh: THREE.Object3D<THREE.Object3DEventMap>;

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

    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects);

    this.init(mainHolder);

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

    this.destroyMesh();
    // Используем вынесенную функцию для создания box-сетки
    this.pointsMesh = createBoxMesh(
      this.widthSeg,
      this.depthSeg,
      this.material
    );
    this.holderObjects.add(this.pointsMesh);
    // Создаем канопеи по двум схемам и отмечаем маркеры
    this.createCanopiesFromGrid();
    this.markEdgeAndCornerMarkers();
    this.properties.autoMix = false;
  }

  init(mainHolder: THREE.Object3D) {
    mainHolder.add(this);
  }

  /**
   * Создаем канопеи:
   * 1. Вогнутые канопеи на вершинах сетки.
   * 2. Выпуклые канопеи в центрах ячеек.
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

    // Вогнутые канопеи на вершинах
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

    // Выпуклые канопеи в центрах ячеек
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
   * Отмечаем красными точками центры краёв (середины каждой стороны) и углы (точки пересечения) каждой канопеи.
   * Центры краёв будут иметь меньший диаметр, чем угловые.
   */
  markEdgeAndCornerMarkers() {
    const markerMaterialEdge = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const markerMaterialCorner = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    const edgeRadius = 2;
    const cornerRadius = 1;

    this.holderObjects.children.forEach((child) => {
      if (
        child.type === 'Mesh' &&
        child.userData &&
        child.userData.x0 !== undefined
      ) {
        const { x0, x1, y0, y1 } = child.userData;
        const leftCenter = new THREE.Vector3(x0, (y0 + y1) / 2, 0);
        const rightCenter = new THREE.Vector3(x1, (y0 + y1) / 2, 0);
        const topCenter = new THREE.Vector3((x0 + x1) / 2, y1, 0);
        const bottomCenter = new THREE.Vector3((x0 + x1) / 2, y0, 0);
        const corner1 = new THREE.Vector3(x0, y0, 0);
        const corner2 = new THREE.Vector3(x1, y0, 0);
        const corner3 = new THREE.Vector3(x0, y1, 0);
        const corner4 = new THREE.Vector3(x1, y1, 0);

        const sphereGeoEdge = new THREE.SphereGeometry(edgeRadius, 8, 8);
        const sphereGeoCorner = new THREE.SphereGeometry(cornerRadius, 8, 8);

        const edgeMarkers = [
          new THREE.Mesh(sphereGeoEdge, markerMaterialEdge),
          new THREE.Mesh(sphereGeoEdge, markerMaterialEdge),
          new THREE.Mesh(sphereGeoEdge, markerMaterialEdge),
          new THREE.Mesh(sphereGeoEdge, markerMaterialEdge),
        ];
        edgeMarkers[0].position.copy(leftCenter);
        edgeMarkers[1].position.copy(rightCenter);
        edgeMarkers[2].position.copy(topCenter);
        edgeMarkers[3].position.copy(bottomCenter);

        const cornerMarkers = [
          new THREE.Mesh(sphereGeoCorner, markerMaterialCorner),
          new THREE.Mesh(sphereGeoCorner, markerMaterialCorner),
          new THREE.Mesh(sphereGeoCorner, markerMaterialCorner),
          new THREE.Mesh(sphereGeoCorner, markerMaterialCorner),
        ];
        cornerMarkers[0].position.copy(corner1);
        cornerMarkers[1].position.copy(corner2);
        cornerMarkers[2].position.copy(corner3);
        cornerMarkers[3].position.copy(corner4);

        edgeMarkers.forEach((marker) => {
          this.holderObjects.add(marker);
        });
        cornerMarkers.forEach((marker) => {
          this.holderObjects.add(marker);
        });
      }
    });
  }

  update() {
    // Убираем изменение геометрии, чтобы path tracing не нарушался.
    // Uniform time можно оставлять неизменным или обновлять, если шейдер использует его для негеометрической анимации.
    // Здесь оставляем его без изменений:
    this.material.uniforms.time.value = this.time;
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
    }
  }
}
