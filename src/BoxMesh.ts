import * as THREE from 'three';

/**
 * Создаёт плоскую box-сетку (4096x4096) с заданным количеством сегментов и шейдерным материалом.
 * @param widthSeg Количество сегментов по ширине.
 * @param depthSeg Количество сегментов по глубине.
 * @param material Шейдерный материал.
 * @returns Контейнер с сеткой (Points).
 */
export default function createBoxMesh(
  widthSeg: number,
  depthSeg: number,
  material: THREE.ShaderMaterial
): THREE.Object3D<THREE.Object3DEventMap> {
  const wSeg = Math.floor(widthSeg);
  const dSeg = Math.floor(depthSeg);
  // Создаем плоскую сетку BoxGeometry размером 4096 x 4096.
  const geometry = new THREE.BoxGeometry(4096, 0, 4096, wSeg, undefined, dSeg);

  // Задаем случайное значение offsetSize в uniforms материала
  material.uniforms.offsetSize.value = THREE.MathUtils.randInt(30, 60);
  material.needsUpdate = true;

  const container = new THREE.Object3D();
  container.rotateX(Math.PI / 2);

  const pointsMesh = new THREE.Points(geometry, material);
  container.add(pointsMesh);

  return container;
}
