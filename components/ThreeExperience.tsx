"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Expand, Globe2, Mountain, RotateCcw, Sparkles } from "lucide-react";
import { SITES, type LandingSite } from "@/data/sites";
import type { EphemerisPoint } from "@/lib/science";
import { azimuthElevationToEnu, selenographicToGlobe } from "@/lib/lunarCoordinates";

type View = "globe" | "surface" | "sky";
type Props = { site: LandingSite; point: EphemerisPoint | null; mode: "demo" | "real"; status: "ready" | "loading" | "error"; onSelectSite: (id: string) => void };
type Marker = { id: string; mesh: THREE.Mesh; glow: THREE.Mesh };
type SceneObjects = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  markers: Marker[];
  selectedGlow?: THREE.Mesh;
  sun?: THREE.Mesh;
  earth?: THREE.Mesh;
  sunRay?: THREE.Line;
  earthRay?: THREE.Line;
  sunArrow?: THREE.ArrowHelper;
  earthArrow?: THREE.ArrowHelper;
  sunLocal?: THREE.Mesh;
  earthLocal?: THREE.Mesh;
  cameraGoal?: THREE.Vector3;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
};

const rad = (degrees: number) => (degrees * Math.PI) / 180;
const readableLon = (longitude: number) => `${Math.abs(longitude).toFixed(2)}° ${longitude < 0 ? "W" : "E"}`;
const bodyDirection = (az: number, el: number) => {
  const v = azimuthElevationToEnu(az, el);
  return new THREE.Vector3(v.x, v.y, v.z).normalize();
};

function proceduralMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas texture unavailable");
  const image = context.createImageData(canvas.width, canvas.height);
  let seed = 41073;
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < image.data.length; i += 4) {
    const shade = 142 + Math.floor(next() * 25);
    image.data[i] = shade + 5;
    image.data[i + 1] = shade + 3;
    image.data[i + 2] = shade;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  for (let i = 0; i < 850; i += 1) {
    const x = next() * canvas.width;
    const y = next() * canvas.height;
    const radius = 1.5 + Math.pow(next(), 2.2) * 19;
    const shade = 82 + Math.floor(next() * 50);
    const gradient = context.createRadialGradient(x - radius * 0.22, y - radius * 0.22, radius * 0.18, x, y, radius);
    gradient.addColorStop(0, `rgba(${shade},${shade},${shade},0.8)`);
    gradient.addColorStop(0.68, `rgba(${shade + 21},${shade + 20},${shade + 18},0.78)`);
    gradient.addColorStop(0.87, "rgba(184,180,172,0.62)");
    gradient.addColorStop(1, "rgba(71,69,67,0.1)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, radius, radius * (0.72 + next() * 0.5), next() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addStars(scene: THREE.Scene) {
  let seed = 95041;
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const positions = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i += 1) {
    const theta = next() * Math.PI * 2;
    const z = next() * 2 - 1;
    const r = Math.sqrt(1 - z * z) * 24;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = z * 24;
    positions[i * 3 + 2] = Math.sin(theta) * r;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x9fb5c6, size: 0.035, transparent: true, opacity: 0.62 }));
  scene.add(stars);
}

function makeLine(points: THREE.Vector3[], color: number, opacity = 0.7) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function addSceneLabel(scene: THREE.Scene, text: string, position: THREE.Vector3, color: string, width = 0.46) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.font = "600 52px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.shadowColor = "rgba(4, 10, 16, 0.9)";
  context.shadowBlur = 12;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
  label.position.copy(position);
  label.scale.set(width, width * 0.34, 1);
  scene.add(label);
}

function addGlobe(scene: THREE.Scene, site: LandingSite, onSelect: (id: string) => void, onHover: (site: LandingSite | null) => void, objects: SceneObjects) {
  const texture = proceduralMoonTexture();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 80, 56),
    new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: 0.028, roughness: 1, metalness: 0 }),
  );
  moon.name = "procedural-moon";
  scene.add(moon);

  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x99afbb, transparent: true, opacity: 0.13 });
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    if (latitude === 0) continue;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i += 1) {
      const p = selenographicToGlobe(latitude, (i / 96) * 360, 1.505);
      points.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial.clone()));
  }
  for (let longitude = 0; longitude < 360; longitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i += 1) {
      const p = selenographicToGlobe(-90 + (i / 48) * 180, longitude, 1.505);
      points.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial.clone()));
  }

  const polarPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i += 1) {
    const p = selenographicToGlobe(-80, (i / 120) * 360, 1.52);
    polarPoints.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  scene.add(makeLine(polarPoints, 0xe6bc69, 0.86));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), new THREE.MeshBasicMaterial({ color: 0xe6bc69, transparent: true, opacity: 0.075, depthWrite: false }));
  cap.position.set(0, -1.31, 0);
  cap.scale.set(1, 0.23, 1);
  scene.add(cap);

  const allSites = SITES.some((candidate) => candidate.id === site.id) ? SITES : [...SITES, site];
  objects.markers = allSites.map((candidate) => {
    const pos = selenographicToGlobe(candidate.latitude, candidate.longitude, 1.53);
    const selected = candidate.id === site.id;
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(selected ? 0.085 : 0.047, 12, 10),
      new THREE.MeshBasicMaterial({ color: selected ? 0xf2bd5f : 0x61bfdb, transparent: true, opacity: selected ? 0.22 : 0.11, depthWrite: false }),
    );
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(selected ? 0.039 : 0.026, 16, 12),
      new THREE.MeshStandardMaterial({ color: selected ? 0xffd17a : 0x65c3df, emissive: selected ? 0x9c6d24 : 0x16495a, emissiveIntensity: selected ? 0.85 : 0.48, roughness: 0.45 }),
    );
    glow.position.set(pos.x * 1.01, pos.y * 1.01, pos.z * 1.01);
    marker.position.set(pos.x, pos.y, pos.z);
    marker.userData.siteId = candidate.id;
    scene.add(glow, marker);
    return { id: candidate.id, mesh: marker, glow };
  });

  let down: { x: number; y: number } | undefined;
  const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
  const markerAtPointer = (event: PointerEvent) => {
    const rect = objects.renderer.domElement.getBoundingClientRect();
    objects.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    objects.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    objects.raycaster.setFromCamera(objects.pointer, objects.camera);
    const intersections = objects.raycaster.intersectObjects(objects.markers.map((marker) => marker.mesh), false);
    if (!intersections.length) return undefined;
    const moonHit = objects.raycaster.intersectObject(moon, false)[0];
    if (moonHit && moonHit.distance + 0.02 < intersections[0].distance) return undefined;
    return intersections[0].object.userData.siteId as string | undefined;
  };
  const hoverSite = (event: PointerEvent) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { onHover(null); return; }
    const id = markerAtPointer(event);
    objects.renderer.domElement.style.cursor = id ? "pointer" : "grab";
    onHover(id ? (allSites.find((candidate) => candidate.id === id) ?? null) : null);
  };
  const clearHover = () => onHover(null);
  const clickSite = (event: PointerEvent) => {
    if (event.button !== 0 || !down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = undefined; return; }
    down = undefined;
    const id = markerAtPointer(event);
    if (id) onSelect(id);
  };
  objects.renderer.domElement.addEventListener("pointerdown", pointerDown);
  objects.renderer.domElement.addEventListener("pointerup", clickSite);
  objects.renderer.domElement.addEventListener("pointermove", hoverSite);
  objects.renderer.domElement.addEventListener("pointerleave", clearHover);
  scene.userData.cleanup = () => {
    objects.renderer.domElement.removeEventListener("pointerdown", pointerDown);
    objects.renderer.domElement.removeEventListener("pointerup", clickSite);
    objects.renderer.domElement.removeEventListener("pointermove", hoverSite);
    objects.renderer.domElement.removeEventListener("pointerleave", clearHover);
    objects.renderer.domElement.style.cursor = "";
  };
}

function addLocalSurface(scene: THREE.Scene, objects: SceneObjects) {
  const segments = 84;
  const size = 7;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const lowColor = new THREE.Color(0x4e5357);
  const highColor = new THREE.Color(0x92918a);
  const height = (x: number, z: number) => {
    const rolling = 0.055 * Math.sin(x * 1.55) * Math.cos(z * 1.4) + 0.025 * Math.sin((x + z) * 3.1);
    const craters = [[-1.6, 0.8, 0.75], [1.3, -1.3, 0.9], [0.2, 1.9, 0.52], [-2.2, -1.8, 0.4]];
    const bowls = craters.reduce((sum, [cx, cz, r]) => sum - 0.16 * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r * 0.58)), 0);
    return rolling + bowls;
  };
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    const sample = height(x, z);
    position.setXYZ(i, x, sample, z);
    const color = lowColor.clone().lerp(highColor, THREE.MathUtils.clamp((sample + 0.22) / 0.30, 0, 1));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  position.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
  terrain.name = "illustrative-surface-not-dem";
  scene.add(terrain);

  const siteMarker = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 8, 36), new THREE.MeshBasicMaterial({ color: 0xf0bd5d }));
  siteMarker.rotation.x = -Math.PI / 2;
  siteMarker.position.set(0, height(0, 0) + 0.022, 0);
  scene.add(siteMarker);
  const siteCenter = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd17a }));
  siteCenter.position.set(0, height(0, 0) + 0.045, 0);
  scene.add(siteCenter);

  const compassOrigin = new THREE.Vector3(-3.15, height(-3.15, 3.15) + 0.09, 3.15);
  const east = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), compassOrigin, 0.72, 0x57badd, 0.16, 0.10);
  const north = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), compassOrigin, 0.72, 0xd7c18f, 0.16, 0.10);
  scene.add(east, north);
  addSceneLabel(scene, "E", compassOrigin.clone().add(new THREE.Vector3(0.82, 0.06, 0)), "#74c9e3", 0.25);
  addSceneLabel(scene, "N", compassOrigin.clone().add(new THREE.Vector3(0, 0.06, 0.86)), "#e4d2aa", 0.25);

  const arrow = (color: number) => new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.16, 0), 3.3, color, 0.32, 0.18);
  objects.sunArrow = arrow(0xf3b744);
  objects.earthArrow = arrow(0x57bde0);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffc459 }));
  const earthBall = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), new THREE.MeshStandardMaterial({ color: 0x55b8d6, emissive: 0x0a3547, emissiveIntensity: 0.8 }));
  objects.sunLocal = sunBall;
  objects.earthLocal = earthBall;
  scene.add(objects.sunArrow, objects.earthArrow, sunBall, earthBall);
}

function addSky(scene: THREE.Scene, objects: SceneObjects) {
  const horizonPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 180; i += 1) {
    const az = rad(i * 2);
    horizonPoints.push(new THREE.Vector3(Math.sin(az) * 3.25, 0, Math.cos(az) * 3.25));
  }
  scene.add(makeLine(horizonPoints, 0x9baab4, 0.9));

  for (const elevation of [30, 60]) {
    const points: THREE.Vector3[] = [];
    const radius = 3.25 * Math.cos(rad(elevation));
    const y = 3.25 * Math.sin(rad(elevation));
    for (let i = 0; i <= 120; i += 1) {
      const az = rad(i * 3);
      points.push(new THREE.Vector3(Math.sin(az) * radius, y, Math.cos(az) * radius));
    }
    scene.add(makeLine(points, 0x506271, 0.42));
    const labelAzimuth = rad(42);
    addSceneLabel(scene, `${elevation}°`, new THREE.Vector3(Math.sin(labelAzimuth) * radius + 0.18, y + 0.08, Math.cos(labelAzimuth) * radius), "#aab8c3", 0.31);
  }

  for (const azimuth of [0, 90, 180, 270]) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i += 1) {
      const elevation = rad((i / 48) * 90);
      const horizontal = 3.25 * Math.cos(elevation);
      const az = rad(azimuth);
      points.push(new THREE.Vector3(Math.sin(az) * horizontal, 3.25 * Math.sin(elevation), Math.cos(az) * horizontal));
    }
    scene.add(makeLine(points, 0x718493, 0.22));
  }

  const tickMaterial = new THREE.LineBasicMaterial({ color: 0x82939f, transparent: true, opacity: 0.56 });
  for (let az = 0; az < 360; az += 15) {
    const a = rad(az);
    const r1 = az % 45 === 0 ? 3.12 : 3.19;
    const r2 = 3.31;
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.sin(a) * r1, 0, Math.cos(a) * r1),
      new THREE.Vector3(Math.sin(a) * r2, 0, Math.cos(a) * r2),
    ]), tickMaterial.clone()));
  }

  addSceneLabel(scene, "N · 000°", new THREE.Vector3(0, 0.08, 3.62), "#d0dce4", 0.62);
  addSceneLabel(scene, "E · 090°", new THREE.Vector3(3.62, 0.08, 0), "#b7dceb", 0.62);
  addSceneLabel(scene, "S · 180°", new THREE.Vector3(0, 0.08, -3.62), "#d0dce4", 0.62);
  addSceneLabel(scene, "W · 270°", new THREE.Vector3(-3.62, 0.08, 0), "#b7dceb", 0.62);
  const zenith = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc9d7df }));
  zenith.position.set(0, 3.25, 0);
  scene.add(zenith);
  addSceneLabel(scene, "ZENITH", new THREE.Vector3(0, 3.58, 0), "#aab8c3", 0.54);

  const origin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: 0xdbe2e5, emissive: 0x708596, emissiveIntensity: 0.28 }));
  scene.add(origin);
  const body = (color: number, radius: number) => new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.15, roughness: 0.55 }));
  objects.sun = body(0xffbd4b, 0.145);
  objects.earth = body(0x55bfe2, 0.19);
  objects.sunRay = makeLine([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)], 0xf1b74f, 0.76);
  objects.earthRay = makeLine([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)], 0x5bbbdc, 0.76);
  scene.add(objects.sunRay, objects.earthRay, objects.sun, objects.earth);
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Sprite) {
      const material = object.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();
      return;
    }
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      });
    }
  });
}

function SceneCanvas({ view, site, point, onSelectSite }: { view: View; site: LandingSite; point: EphemerisPoint | null; onSelectSite: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const objects = useRef<SceneObjects | null>(null);
  const selectRef = useRef(onSelectSite);
  const [hoveredSite, setHoveredSite] = useState<LandingSite | null>(null);
  const [webglError, setWebglError] = useState(false);
  useEffect(() => { selectRef.current = onSelectSite; }, [onSelectSite]);

  // These are imperative mutations of a Three.js scene held in a ref; React does not render this state.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08111a, view === "globe" ? 0.012 : 0.02);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
    if (view === "globe") camera.position.set(0.1, 1.8, 4.7);
    else if (view === "surface") camera.position.set(0.2, 5.2, 7.2);
    else camera.position.set(0.1, 5.3, 6.2);
    const renderer = (() => {
      try { return new THREE.WebGLRenderer({ antialias: window.devicePixelRatio <= 1.5, alpha: true }); }
      catch { return null; }
    })();
    if (!renderer) {
      const fallbackTimer = window.setTimeout(() => setWebglError(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.className = "three-canvas";
    renderer.domElement.setAttribute("aria-label", view === "globe" ? "Interactive procedural lunar globe. Drag to rotate; scroll to zoom; click a site marker to select it." : view === "surface" ? "Generic illustrative terrain concept, not a site-specific elevation model. Drag to orbit; scroll to zoom." : "Three-dimensional local sky using the selected Sun and Earth azimuth and elevation.");
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = view === "globe" ? 2.1 : 3.8;
    controls.maxDistance = view === "globe" ? 8.8 : 14;
    controls.maxPolarAngle = view === "surface" ? Math.PI * 0.48 : Math.PI * 0.94;
    controls.target.set(0, view === "surface" ? 0 : 0, 0);

    scene.add(new THREE.HemisphereLight(0xaac4d8, 0x2c3033, view === "globe" ? 1.3 : 1.65));
    const keyLight = new THREE.DirectionalLight(0xffe3b0, view === "globe" ? 2.7 : 1.45);
    keyLight.position.set(4.6, 3.2, 5.5);
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0x5e89a6, 0.66);
    fill.position.set(-4, 0.6, -3.5);
    scene.add(fill);
    if (view !== "surface") addStars(scene);

    const shared: SceneObjects = { scene, camera, controls, renderer, markers: [], raycaster: new THREE.Raycaster(), pointer: new THREE.Vector2() };
    if (view === "globe") addGlobe(scene, site, (id) => selectRef.current(id), setHoveredSite, shared);
    else if (view === "surface") addLocalSurface(scene, shared);
    else addSky(scene, shared);
    objects.current = shared;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (shared.cameraGoal) {
        camera.position.lerp(shared.cameraGoal, 0.065);
        camera.lookAt(0, 0, 0);
        if (camera.position.distanceTo(shared.cameraGoal) < 0.012) shared.cameraGoal = undefined;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      const cleanup = scene.userData.cleanup as (() => void) | undefined;
      cleanup?.();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
      objects.current = null;
    };
  // Scene topology changes only when the view changes. Site and time changes are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const current = objects.current;
    if (!current || view === "globe") return;
    const directionalObjects = [current.sun, current.earth, current.sunRay, current.earthRay, current.sunArrow, current.earthArrow, current.sunLocal, current.earthLocal];
    if (!point) {
      directionalObjects.forEach((object) => { if (object) object.visible = false; });
      return;
    }
    directionalObjects.forEach((object) => { if (object) object.visible = true; });
    if (view === "sky") {
      const sunDirection = bodyDirection(point.sunAz, point.sunEl);
      const earthDirection = bodyDirection(point.earthAz, point.earthEl);
      const sunEnd = sunDirection.clone().multiplyScalar(3.1);
      const earthEnd = earthDirection.clone().multiplyScalar(3.1);
      current.sun?.position.copy(sunEnd);
      current.earth?.position.copy(earthEnd);
      current.sunRay?.geometry.dispose();
      current.earthRay?.geometry.dispose();
      if (current.sunRay) { current.sunRay.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), sunEnd]); current.sunRay.computeLineDistances(); }
      if (current.earthRay) current.earthRay.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), earthEnd]);
    } else {
      const sunDirection = bodyDirection(point.sunAz, point.sunEl);
      const earthDirection = bodyDirection(point.earthAz, point.earthEl);
      current.sunArrow?.setDirection(sunDirection);
      current.earthArrow?.setDirection(earthDirection);
      current.sunLocal?.position.set(sunDirection.x * 3.3, sunDirection.y * 3.3 + 0.16, sunDirection.z * 3.3);
      current.earthLocal?.position.set(earthDirection.x * 3.3, earthDirection.y * 3.3 + 0.16, earthDirection.z * 3.3);
    }
    const styleDirection = (body: THREE.Mesh | undefined, ray: THREE.Line | undefined, elevation: number) => {
      if (!body) return;
      const material = body.material as THREE.MeshStandardMaterial;
      material.transparent = elevation < 0;
      material.opacity = elevation < 0 ? 0.32 : 1;
      material.wireframe = elevation < 0;
      if (ray) (ray.material as THREE.LineBasicMaterial).opacity = elevation < 0 ? 0.24 : 0.76;
    };
    styleDirection(view === "sky" ? current.sun : current.sunLocal, view === "sky" ? current.sunRay : undefined, point.sunEl);
    styleDirection(view === "sky" ? current.earth : current.earthLocal, view === "sky" ? current.earthRay : undefined, point.earthEl);
  }, [view, point]);

  useEffect(() => {
    const current = objects.current;
    if (!current || view !== "globe") return;
    if (!current.markers.some((marker) => marker.id === site.id)) {
      const pos = selenographicToGlobe(site.latitude, site.longitude, 1.53);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), new THREE.MeshBasicMaterial({ color: 0xf2bd5f, transparent: true, opacity: 0.25, depthWrite: false }));
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.039, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd17a, emissive: 0x9c6d24, emissiveIntensity: 0.85, roughness: 0.45 }));
      glow.position.set(pos.x * 1.01, pos.y * 1.01, pos.z * 1.01);
      marker.position.set(pos.x, pos.y, pos.z);
      marker.userData.siteId = site.id;
      current.scene.add(glow, marker);
      current.markers.push({ id: site.id, mesh: marker, glow });
    }
    for (const marker of current.markers) {
      const selected = marker.id === site.id;
      const glowMaterial = marker.glow.material as THREE.MeshBasicMaterial;
      glowMaterial.color.set(selected ? 0xf2bd5f : 0x61bfdb);
      glowMaterial.opacity = selected ? 0.25 : 0.1;
      const markerMaterial = marker.mesh.material as THREE.MeshStandardMaterial;
      markerMaterial.color.set(selected ? 0xffd17a : 0x65c3df);
      markerMaterial.emissive.set(selected ? 0x9c6d24 : 0x16495a);
      marker.mesh.scale.setScalar(selected ? 1.24 : 1);
    }
    const direction = selenographicToGlobe(site.latitude, site.longitude, 4.6);
    current.cameraGoal = new THREE.Vector3(direction.x, direction.y, direction.z);
  }, [view, site]);
  /* eslint-enable react-hooks/immutability */

  return <div className={`three-viewport three-${view}`} ref={container}>
    {view === "globe" && hoveredSite && <div className="marker-tooltip"><span>{hoveredSite.code}</span><strong>{hoveredSite.name}</strong><small>{hoveredSite.latitude.toFixed(4)}° · {readableLon(hoveredSite.longitude)}</small></div>}
    {webglError && <div className="webgl-fallback"><Globe2 size={26}/><strong>3D rendering unavailable</strong><span>WebGL could not start in this browser. The 2D lunar sky and mission analysis remain available below.</span></div>}
  </div>;
}

export default function ThreeExperience({ site, point, mode, onSelectSite }: Props) {
  const [view, setView] = useState<View>("globe");
  const [resetVersion, setResetVersion] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const availableSites = site.id === "custom" ? [...SITES, site] : SITES;
  const canRender = typeof window !== "undefined";
  useEffect(() => {
    const update = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggleFullscreen = async () => {
    if (!panel.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await panel.current.requestFullscreen();
  };

  const resetView = () => { setView("globe"); setResetVersion((version) => version + 1); };
  const sunVisible = point !== null && point.sunEl >= 0;
  const earthVisible = point !== null && point.earthEl >= 0;
  const sourceLabel = mode === "demo" ? "SAMPLE PREVIEW" : status === "ready" ? "NASA POSITIONS LOADED" : status === "loading" ? "GETTING NASA POSITIONS" : "NASA DATA UNAVAILABLE";

  return <section className={`experience-panel ${fullScreen ? "is-fullscreen" : ""}`} id="lunar-explorer" ref={panel}>
    <div className="experience-head">
      <div><span className="panel-kicker">OPTIONAL VISUAL EXPLORER</span><h2>Explore the Moon</h2><p>Look around an illustration of the Moon and see where the reference places are located.</p></div>
      <div className="experience-head-actions"><span className={`experience-source ${mode} ${status}`}>{sourceLabel}</span><button className="experience-icon" onClick={toggleFullscreen} aria-label={fullScreen ? "Exit fullscreen" : "Open fullscreen"}><Expand size={15}/></button></div>
    </div>
    <div className="experience-toolbar">
      <div className="experience-tabs" role="tablist" aria-label="Moon explorer views">
        <button className={view === "globe" ? "active" : ""} role="tab" aria-selected={view === "globe"} onClick={() => setView("globe")}><Globe2 size={14}/> Moon view</button>
        <button className={view === "surface" ? "active" : ""} role="tab" aria-selected={view === "surface"} onClick={() => setView("surface")}><Mountain size={14}/> Surface illustration</button>
        <button className={view === "sky" ? "active" : ""} role="tab" aria-selected={view === "sky"} onClick={() => setView("sky")}><Sparkles size={14}/> Sky directions</button>
      </div>
      <button className="experience-reset" onClick={resetView}><RotateCcw size={12}/> Reset view</button>
    </div>
    <div className="experience-stage">
      <div className="experience-canvas-wrap">
        {canRender && <SceneCanvas key={`${view}-${resetVersion}`} view={view} site={site} point={point} onSelectSite={onSelectSite}/>}
        <div className="canvas-vignette" aria-hidden="true"/>
        <div className="canvas-caption">
          {view === "globe" && <><span>ILLUSTRATION · NOT A PHOTOGRAPH OR MAP</span><b>Reference places are marked near the south pole.</b></>}
          {view === "surface" && <><span>GENERIC SURFACE ILLUSTRATION · NOT LOCAL TERRAIN</span><b>This view does not show measured hills or shadows at the selected place.</b></>}
          {view === "sky" && <><span>SKY DIRECTIONS · AZIMUTH MEASURED FROM NORTH</span><b>{point?`Sun ${point.sunAz.toFixed(1)}° / ${point.sunEl.toFixed(1)}° · Earth ${point.earthAz.toFixed(1)}° / ${point.earthEl.toFixed(1)}°`:status==="loading"?"Getting sky positions from NASA…":"Sky positions are not available yet."} · direction markers are not to scale</b></>}
        </div>
        <div className="canvas-controls-hint">DRAG TO ROTATE <i/> SCROLL TO ZOOM</div>
      </div>
      <aside className="experience-telemetry">
        <div className="telemetry-site"><span>PLACE SELECTED</span><strong>{site.name}</strong><small>{site.latitude.toFixed(4)}° · {readableLon(site.longitude)}</small></div>
        {view === "globe" ? <div className="site-picker-3d"><span>REFERENCE PLACES</span>{availableSites.map((candidate) => <button key={candidate.id} className={candidate.id === site.id ? "selected" : ""} onClick={() => onSelectSite(candidate.id)}><i/>{candidate.name}<small>{candidate.code}</small></button>)}</div> : point ? <div className="telemetry-bodies">
          <span>{mode==="real"?"NASA SKY POSITIONS":"SAMPLE SKY POSITIONS"}</span>
          <div><i className="telemetry-sun"/><b>Sun</b><strong>{point.sunAz.toFixed(1)}° AZ</strong><small>{point.sunEl.toFixed(1)}° EL · {sunVisible ? "ABOVE HORIZON" : "BELOW HORIZON"}</small></div>
          <div><i className="telemetry-earth"/><b>Earth</b><strong>{point.earthAz.toFixed(1)}° AZ</strong><small>{point.earthEl.toFixed(1)}° EL · {earthVisible ? "CENTER LINE OF SIGHT" : "CENTER BELOW HORIZON"}</small></div>
          <p>Positions update when you move the time slider. Rotating this view does not change the calculations.</p>
        </div> : <div className="telemetry-bodies telemetry-empty"><span>{status==="loading"?"REQUESTING EPHEMERIS":"NO CELESTIAL SAMPLE"}</span><p>{status==="error"?"JPL returned no sample. No zero-angle position is shown.":"Celestial markers appear after the selected time has an ephemeris sample."}</p></div>}
        <div className="telemetry-foot"><span>{point?(point.source === "JPL Horizons" ? "JPL SAMPLE" : "ILLUSTRATIVE SAMPLE"):"NO SAMPLE"}</span><small>{point?new Date(point.time).toISOString().replace("T", " ").slice(0, 16)+" UTC":status==="loading"?"Awaiting response":"—"}</small></div>
      </aside>
    </div>
  </section>;
}
