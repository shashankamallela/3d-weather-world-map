import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, Fragment } from "react";

function useRaycastPick(onPick) {
  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  useEffect(() => {
    const onClick = (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => i.object.userData && i.object.userData.lat && i.object.userData.lon);
      if (hit && onPick) {
        onPick({ lat: hit.object.userData.lat, lon: hit.object.userData.lon });
      }
    };
    gl.domElement.addEventListener("pointerdown", onClick);
    return () => gl.domElement.removeEventListener("pointerdown", onClick);
  }, [camera, gl, mouse, onPick, raycaster, scene]);
}
function Buildings({ center = { lat: 40.7128, lon: -74.0060 }, temp = 22, onReady }) {
  const DEG_SCALE = 0.002; 
  const group = useRef();
  const items = useMemo(() => {
    const count = 16 * 12; // 192 buildings
    const gridX = 16, gridZ = 12;
    const spacing = 2.4;
    const arr = [];
    let idx = 0;
    for (let z = 0; z < gridZ; z++) {
      for (let x = 0; x < gridX; x++) {
        const px = (x - (gridX - 1) / 2) * spacing;
        const pz = (z - (gridZ - 1) / 2) * spacing;
        const base = THREE.MathUtils.mapLinear(temp, -10, 45, 1.2, 10);
        const height = Math.max(1.2, base + Math.random() * 3.2);
        const hsl = 0.58 - (temp + 10) / 90; 
        const color = new THREE.Color().setHSL(THREE.MathUtils.clamp(hsl, 0, 1), 0.35, 0.5);
        const lat = center.lat + pz * DEG_SCALE;
        const lon = center.lon + px * DEG_SCALE;

        arr.push({ id: idx++, x: px, z: pz, height, color, lat, lon });
      }
    }
    return arr;
  }, [temp, center.lat, center.lon]);
  useEffect(() => {
    const t = setTimeout(() => onReady && onReady(), 400);
    return () => clearTimeout(t);
  }, [onReady]);
  return (
    <group ref={group}>
      {items.map((b) => (
        <mesh
          key={b.id}
          position={[b.x, b.height / 2, b.z]}
          castShadow
          receiveShadow
          userData={{ lat: b.lat, lon: b.lon }}
        >
          <boxGeometry args={[1.6, b.height, 1.6]} />
          <meshStandardMaterial color={b.color} metalness={0.25} roughness={0.75} />
        </mesh>
      ))}
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={"#0b1220"} />
      </mesh>
    </group>
  );
}
function Rain({ count = 2200, visible }) {
  const ref = useRef();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3 + 0] = (Math.random() - 0.5) * 160;
      a[i * 3 + 1] = Math.random() * 100 + 10;
      a[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [count]);
  useFrame(() => {
    if (!visible || !ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - 1;
      if (y < 0) y = Math.random() * 90 + 10;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  if (!visible) return null;
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.06} transparent opacity={0.7} />
    </points>
  );
}
function Snow({ count = 1600, visible }) {
  const ref = useRef();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3 + 0] = (Math.random() - 0.5) * 160;
      a[i * 3 + 1] = Math.random() * 100 + 10;
      a[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [count]);
  useFrame(() => {
    if (!visible || !ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - 0.3;
      if (y < 0) y = Math.random() * 90 + 10;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  if (!visible) return null;
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.14} transparent opacity={0.95} />
    </points>
  );
}
export default function CityScene({ weather, onPickLatLon, onBootReady }) {
  useRaycastPick(onPickLatLon);
  const condition = weather?.condition || "Clear";
  const temp = weather?.temp ?? 22;
  const now = Math.floor(Date.now() / 1000);
  const sunrise = weather?.sunrise ?? now - 3600;
  const sunset = weather?.sunset ?? now + 3600;
  const isNight = now < sunrise || now > sunset;
  const fogColor =
    isNight ? "#060a12" : ["Rain", "Clouds", "Mist", "Drizzle"].includes(condition) ? "#6a748a" : "#bcd1ff";
  const showRain = ["Rain", "Drizzle", "Thunderstorm"].includes(condition);
  const showSnow = condition === "Snow";
  return (
    <Canvas
      shadows
      camera={{ position: [20, 18, 32], fov: 55, near: 0.1, far: 500 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(new THREE.Color(fogColor));
        scene.fog = new THREE.Fog(fogColor, 40, 260);
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        if (onBootReady) onBootReady();
      }}
    >
      <ambientLight intensity={isNight ? 0.08 : 0.36} />
      <directionalLight
        castShadow
        intensity={isNight ? 0.18 : 0.95}
        position={[30, 40, 25]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset={isNight ? "night" : "sunset"} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={14}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
      />
      <Buildings
        center={{ lat: 40.7128, lon: -74.0060 }}
        temp={temp}
        onReady={onBootReady}
      />
      <Rain visible={showRain} />
      <Snow visible={showSnow} />
    </Canvas>
  );
}
