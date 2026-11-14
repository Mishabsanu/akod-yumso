/**
 * YUMSO 3D Supermarket — vanilla three.js engine.
 * First-person walkable store with shelving aisles stocked with YUMSO packs,
 * a shopping cart that follows the player, and pick-to-cart interaction.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type StoreProduct = {
  id: string;
  name: string;
  flavor: string;
  price: number;
  color: string;
  pack: string;
};

export type Rect = { x1: number; z1: number; x2: number; z2: number; kind: "shelf" | "counter" | "display"; color: string };

export type EngineCallbacks = {
  onHover: (p: StoreProduct | null) => void;
  onPick: (p: StoreProduct) => void;
  onLock: (locked: boolean) => void;
  onFrame: (x: number, z: number, yaw: number) => void;
};

export type StoreEngine = {
  enter: () => void;
  exit: () => void;
  setMove: (x: number, y: number) => void;
  look: (dx: number, dy: number) => void;
  pickAt: (clientX: number, clientY: number) => void;
  pickHovered: () => void;
  removeOne: (productId: string) => void;
  resize: () => void;
  setVisible: (v: boolean) => void;
  setActive: (v: boolean) => void;
  dispose: () => void;
  layout: Rect[];
  size: { W: number; D: number };
};

/* ------------------------------------------------------------------ */
const W = 26; // store width  (x: -13 .. 13)
const D = 34; // store depth  (z: -17 .. 17)
const H = 4.2; // ceiling height
const EYE = 1.62;
const PACK_W = 0.28;
const PACK_H = 0.33;
const PACK_D = 0.075;
const SPACING = 0.31;
const LEVELS = [0.13, 0.53, 0.93, 1.33, 1.73];

type Inst = { f: number; i: number; pos: THREE.Vector3; normal: THREE.Vector3; picked: boolean };

export async function createStore(
  container: HTMLElement,
  products: StoreProduct[],
  cb: EngineCallbacks,
): Promise<StoreEngine> {
  if (document.fonts?.ready) await document.fonts.ready;
  const css = getComputedStyle(document.documentElement);
  const DISPLAY = css.getPropertyValue("--font-bangers").trim() || "Impact, sans-serif";
  const SANS = css.getPropertyValue("--font-poppins").trim() || "Arial, sans-serif";

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia("(pointer: coarse)").matches ? 1.25 : 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#cfe3f5");
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.05, 90);
  camera.rotation.order = "YXZ";

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8f877b, 0.35));
  const sun = new THREE.DirectionalLight(0xfff3e2, 1.25);
  sun.position.set(5, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 20, bottom: -20, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const warm = new THREE.PointLight(0xffc46b, 6, 9, 1.6);
  warm.position.set(6.5, 3, 9.5);
  scene.add(warm);

  /* ---------- helpers ---------- */
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
  const std = (color: string, roughness = 0.6, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    track(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));

  const boxGeo = track(new THREE.BoxGeometry(1, 1, 1));
  function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) {
    const mesh = new THREE.Mesh(boxGeo, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = track(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  }

  const loader = new THREE.TextureLoader();
  const loadTex = (url: string) =>
    new Promise<THREE.Texture>((res) =>
      loader.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        track(t);
        res(t);
      }),
    );

  const colliders: Rect[] = [];
  const addCollider = (x1: number, z1: number, x2: number, z2: number, kind: Rect["kind"], color: string) =>
    colliders.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), kind, color });

  /* ---------- floor ---------- */
  const floorTex = canvasTex(512, 512, (c) => {
    const n = 4;
    const s = 512 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const v = 212 + Math.floor(Math.random() * 12);
        c.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        c.fillRect(i * s, j * s, s, s);
        for (let k = 0; k < 160; k++) {
          c.fillStyle = `rgba(120,110,100,${Math.random() * 0.06})`;
          c.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 2, 2);
        }
      }
    c.strokeStyle = "#a9a397";
    c.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      c.beginPath();
      c.moveTo(i * s, 0);
      c.lineTo(i * s, 512);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i * s);
      c.lineTo(512, i * s);
      c.stroke();
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(W / 2.4, D / 2.4);
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), std("#ffffff", 0.28, 0, { map: floorTex, envMapIntensity: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- ceiling + light panels ---------- */
  const ceil = new THREE.Mesh(track(new THREE.PlaneGeometry(W, D)), std("#f4f4f2", 0.95));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);
  const panelMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.1) }));
  const panelPos: [number, number][] = [];
  for (let x = -10.5; x <= 10.5; x += 3.5) for (let z = -15; z <= 15; z += 3) panelPos.push([x, z]);
  const panels = new THREE.InstancedMesh(boxGeo, panelMat, panelPos.length);
  const m4 = new THREE.Matrix4();
  panelPos.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x, H - 0.03, z), new THREE.Quaternion(), new THREE.Vector3(1.5, 0.05, 0.32));
    panels.setMatrixAt(i, m4);
  });
  scene.add(panels);

  /* ---------- walls ---------- */
  const wallMat = std("#e9e3d6", 0.9);
  const skirtMat = std("#2a2a2a", 0.5);
  const wall = (w: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, H)), wallMat);
    m.position.set(x, H / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    scene.add(m);
  };
  wall(D, -W / 2, 0, Math.PI / 2);
  wall(D, W / 2, 0, -Math.PI / 2);
  wall(W, 0, -D / 2, 0);
  box(0.02, 0.15, D, skirtMat, -W / 2 + 0.01, 0.075, 0, false);
  box(0.02, 0.15, D, skirtMat, W / 2 - 0.01, 0.075, 0, false);
  box(W, 0.15, 0.02, skirtMat, 0, 0.075, -D / 2 + 0.01, false);

  // brand band
  const bandTex = canvasTex(2048, 128, (c) => {
    c.fillStyle = "#fdb913";
    c.fillRect(0, 0, 2048, 128);
    c.fillStyle = "#0b0b0b";
    c.font = `86px ${DISPLAY}`;
    c.textBaseline = "middle";
    let x = 20;
    const words = ["YUMSO", "•", "BIGGER CRUNCH", "•", "BETTER FUN", "•"];
    while (x < 2048)
      for (const wd of words) {
        c.fillText(wd, x, 68);
        x += c.measureText(wd).width + 34;
      }
  });
  bandTex.wrapS = THREE.RepeatWrapping;
  const band = (len: number, x: number, z: number, ry: number) => {
    const t = bandTex.clone();
    t.needsUpdate = true;
    t.repeat.set(len / 12, 1);
    track(t);
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(len, 0.75)), std("#ffffff", 0.7, 0, { map: t }));
    m.position.set(x, 3.15, z);
    m.rotation.y = ry;
    scene.add(m);
  };
  band(D, -W / 2 + 0.02, 0, Math.PI / 2);
  band(D, W / 2 - 0.02, 0, -Math.PI / 2);

  // back wall logo
  const logoTex = await loadTex("/logo-dark.jpeg");
  const logo = new THREE.Mesh(track(new THREE.PlaneGeometry(4.4, 3.3)), std("#ffffff", 0.6, 0, { map: logoTex }));
  logo.position.set(0, 2.85, -D / 2 + 0.03);
  scene.add(logo);
  box(4.6, 3.5, 0.04, std("#000000", 0.4), 0, 2.85, -D / 2 + 0.01, false);

  /* ---------- glass front + automatic doors ---------- */
  const glass = std("#cfeaff", 0.05, 0.1, { transparent: true, opacity: 0.2, depthWrite: false });
  const alu = std("#9aa1a8", 0.3, 0.9);
  const FZ = D / 2;
  for (let x = -W / 2; x < W / 2; x += 2) {
    if (x >= -2 && x < 2) continue;
    box(2, H, 0.03, glass, x + 1, H / 2, FZ, false);
    box(0.08, H, 0.1, alu, x, H / 2, FZ, false);
  }
  box(W, 0.12, 0.14, alu, 0, H - 0.06, FZ, false);
  box(4, 0.5, 0.16, alu, 0, 2.75, FZ, false);
  const doorL = box(2, 2.5, 0.04, glass, -1, 1.25, FZ, false);
  const doorR = box(2, 2.5, 0.04, glass, 1, 1.25, FZ, false);
  box(0.06, 2.5, 0.07, alu, -2, 1.25, FZ, false);
  box(0.06, 2.5, 0.07, alu, 2, 1.25, FZ, false);
  let doorOpen = 0;

  // welcome mat
  const mat = new THREE.Mesh(track(new THREE.PlaneGeometry(3.2, 2.2)), std("#ffffff", 0.95, 0, { map: logoTex }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.006, FZ - 1.6);
  mat.receiveShadow = true;
  scene.add(mat);

  /* ---------- packs (instanced) ---------- */
  const packTex = await Promise.all(products.map((p) => loadTex(p.pack)));
  const packGeo = track(new THREE.BoxGeometry(PACK_W, PACK_H, PACK_D, 6, 6, 1));
  {
    const pos = packGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const fx = 1 - Math.pow(Math.abs(x) / (PACK_W / 2), 4);
      const fy = 1 - Math.pow(Math.abs(y) / (PACK_H / 2), 6);
      const f = Math.max(0.07, Math.sqrt(Math.max(0, fx * fy)));
      pos.setZ(i, z * f);
    }
    packGeo.computeVertexNormals();
  }
  const packMats = products.map((p, i) => {
    const foil = std(p.color, 0.3, 0.35);
    const front = std("#ffffff", 0.3, 0.12, { map: packTex[i], alphaTest: 0.45 });
    return [foil, foil, foil, foil, front, foil];
  });

  const inst: Inst[] = [];
  const perFlavour: THREE.Matrix4[][] = products.map(() => []);
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler(0, 0, 0, "YXZ");
  const ONE = new THREE.Vector3(1, 1, 1);

  function addPack(f: number, x: number, y: number, z: number, yaw: number, lean = -0.06) {
    tmpE.set(lean, yaw, 0, "YXZ");
    tmpQ.setFromEuler(tmpE);
    const mtx = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), tmpQ, ONE);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
    inst.push({ f, i: perFlavour[f].length, pos: new THREE.Vector3(x, y, z), normal, picked: false });
    perFlavour[f].push(mtx);
  }

  /* ---------- shelving ---------- */
  const steel = std("#3b3f45", 0.45, 0.7);
  const shelfMat = std("#f7f7f5", 0.5, 0.05);
  const backMat = std("#e4e6ea", 0.7, 0.1);

  const priceTex = products.map((p) =>
    canvasTex(512, 64, (c) => {
      c.fillStyle = p.color;
      c.fillRect(0, 0, 512, 64);
      c.fillStyle = "#ffffff";
      c.fillRect(8, 8, 150, 48);
      c.fillStyle = "#0b0b0b";
      c.font = `bold 34px ${SANS}`;
      c.textBaseline = "middle";
      c.fillText(`$${p.price.toFixed(2)}`, 16, 34);
      c.fillStyle = "#ffffff";
      c.font = `30px ${DISPLAY}`;
      c.fillText(`YUMSO ${p.name.toUpperCase()}`, 176, 36);
    }),
  );
  priceTex.forEach((t) => (t.wrapS = THREE.RepeatWrapping));

  const signTex = (title: string, sub: string, color: string, dark = false) =>
    canvasTex(1024, 256, (c) => {
      c.fillStyle = color;
      c.fillRect(0, 0, 1024, 256);
      c.fillStyle = dark ? "#0b0b0b" : "#ffffff";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = `110px ${DISPLAY}`;
      c.fillText(title, 512, 105);
      c.font = `600 44px ${SANS}`;
      c.fillText(sub, 512, 200);
    });

  /** Shelf run along z. sides: +1 faces +x, -1 faces -x. flavourAt picks the product per level/slot. */
  function shelfRun(cx: number, z1: number, z2: number, sides: (1 | -1)[], flavourAt: (side: number, level: number, slot: number) => number, header?: { title: string; color: string; dark?: boolean }) {
    const L = z2 - z1;
    const zc = (z1 + z2) / 2;
    const two = sides.length === 2;
    const depth = two ? 1.0 : 0.52;
    const off = two ? 0 : sides[0] * -0.24; // single-sided: back panel against wall
    const bx = cx + off;
    box(depth, 0.1, L, steel, cx + (two ? 0 : sides[0] * 0.02), 0.05, zc);
    box(0.05, 2.05, L, backMat, bx, 1.07, zc);
    for (let z = z1; z <= z2 + 0.001; z += L / Math.max(1, Math.round(L / 1.33))) box(depth, 2.1, 0.05, steel, cx + (two ? 0 : sides[0] * 0.02), 1.05, z);
    for (const s of sides) {
      for (let lv = 0; lv < LEVELS.length; lv++) {
        const h = LEVELS[lv];
        box(0.46, 0.025, L, shelfMat, bx + s * 0.255, h, zc);
        const slots = Math.floor((L - 0.1) / SPACING);
        const start = zc - ((slots - 1) * SPACING) / 2;
        let stripF = 0;
        for (let k = 0; k < slots; k++) {
          const f = flavourAt(s, lv, k);
          if (k === 0) stripF = f;
          addPack(f, bx + s * 0.3, h + 0.0125 + PACK_H / 2, start + k * SPACING, s > 0 ? Math.PI / 2 : -Math.PI / 2);
        }
        const t = priceTex[stripF].clone();
        t.needsUpdate = true;
        t.repeat.set(L / 1.6, 1);
        track(t);
        box(0.012, 0.055, L, std("#ffffff", 0.5, 0, { map: t }), bx + s * 0.49, h - 0.012, zc, false);
      }
      if (header) {
        const tex = signTex(header.title, "YUMSO · Bigger Crunch, Better Fun", header.color, header.dark);
        const m = new THREE.Mesh(track(new THREE.PlaneGeometry(Math.min(L * 0.7, 6), 0.42)), std("#ffffff", 0.6, 0, { map: tex }));
        m.position.set(bx + s * 0.03, 2.35, zc);
        m.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(m);
      }
    }
    box(0.05, 0.46, Math.min(L * 0.7, 6) + 0.08, steel, bx, 2.35, zc, false);
    addCollider(cx - depth / 2 - 0.02 + (two ? 0 : sides[0] * 0.02), z1 - 0.05, cx + depth / 2 + 0.02 + (two ? 0 : sides[0] * 0.02), z2 + 0.05, "shelf", products[flavourAt(sides[0], 0, 0)].color);
  }

  // four double-sided gondolas, one flavour each
  const AISLE_X = [-7.5, -2.5, 2.5, 7.5];
  AISLE_X.forEach((x, a) => {
    const f = a % products.length;
    const p = products[f];
    shelfRun(x, -12, 4, [1, -1], () => f, { title: `${p.name} · ${p.flavor}`, color: p.color, dark: f === 0 });
    // hanging aisle sign
    const tex = signTex(`AISLE ${a + 1}`, `${p.name} — ${p.flavor}`, p.color, f === 0);
    const sign = new THREE.Mesh(track(new THREE.BoxGeometry(2.4, 0.6, 0.05)), [
      steel, steel, steel, steel,
      std("#ffffff", 0.5, 0, { map: tex, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.12 }),
      std("#ffffff", 0.5, 0, { map: tex, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.12 }),
    ]);
    sign.position.set(x, 3.25, 5.3);
    scene.add(sign);
    box(0.01, H - 3.55, 0.01, steel, x - 1, (H + 3.55) / 2, 5.3, false);
    box(0.01, H - 3.55, 0.01, steel, x + 1, (H + 3.55) / 2, 5.3, false);
  });

  // wall shelving: left = chips/nachos, right = puff/popcorn, back = mixed blocks
  shelfRun(-W / 2 + 0.3, -14.5, 6, [1], (_s, lv) => (lv % 2 === 0 ? 0 : 1), { title: "Chips & Nachos", color: "#0b0b0b" });
  shelfRun(W / 2 - 0.3, -14.5, 6, [-1], (_s, lv) => (lv % 2 === 0 ? 2 : 3), { title: "Puffs & Popcorn", color: "#0b0b0b" });
  // back wall (runs along x), either side of the logo
  function backRun(x1: number, x2: number) {
    const L = x2 - x1;
    const xc = (x1 + x2) / 2;
    const z = -D / 2 + 0.3;
    box(L, 0.1, 0.52, steel, xc, 0.05, z + 0.02);
    box(L, 2.05, 0.05, backMat, xc, 1.07, z - 0.24);
    for (let lv = 0; lv < LEVELS.length; lv++) {
      const h = LEVELS[lv];
      box(L, 0.025, 0.46, shelfMat, xc, h, z + 0.015);
      const slots = Math.floor((L - 0.1) / SPACING);
      const start = xc - ((slots - 1) * SPACING) / 2;
      for (let k = 0; k < slots; k++) addPack(Math.floor((k / slots) * products.length), start + k * SPACING, h + 0.0125 + PACK_H / 2, z + 0.06, 0);
      box(L, 0.055, 0.012, std("#fdb913", 0.5), xc, h - 0.012, z + 0.25, false);
    }
    addCollider(x1, z - 0.3, x2, z + 0.3, "shelf", "#0b0b0b");
  }
  backRun(-11.5, -2.6);
  backRun(2.6, 11.5);

  /* ---------- promo display ---------- */
  const PX = 6.5;
  const PZ = 9.5;
  const promoMat = std("#fdb913", 0.35, 0.2);
  const plat = new THREE.Mesh(track(new THREE.CylinderGeometry(1.15, 1.2, 0.25, 48)), promoMat);
  plat.position.set(PX, 0.125, PZ);
  plat.castShadow = plat.receiveShadow = true;
  scene.add(plat);
  [
    { r: 0.9, n: 18, y: 0.25 },
    { r: 0.62, n: 12, y: 0.62 },
    { r: 0.34, n: 7, y: 0.99 },
  ].forEach((tier, t) => {
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(tier.r + 0.12, tier.r + 0.12, 0.03, 40)), shelfMat);
    disc.position.set(PX, tier.y, PZ);
    disc.receiveShadow = true;
    scene.add(disc);
    for (let k = 0; k < tier.n; k++) {
      const a = (k / tier.n) * Math.PI * 2 + t * 0.2;
      addPack((k + t) % products.length, PX + Math.sin(a) * tier.r, tier.y + 0.015 + PACK_H / 2, PZ + Math.cos(a) * tier.r, a, -0.1);
    }
  });
  const promoTex = canvasTex(768, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#ff2a1f");
    g.addColorStop(1, "#7a0000");
    c.fillStyle = g;
    c.fillRect(0, 0, 768, 512);
    c.fillStyle = "#fdb913";
    c.textAlign = "center";
    c.font = `150px ${DISPLAY}`;
    c.fillText("NEW!", 384, 170);
    c.fillStyle = "#ffffff";
    c.font = `92px ${DISPLAY}`;
    c.fillText("HOT & SPICY", 384, 290);
    c.fillText("NACHOS", 384, 390);
    c.font = `600 34px ${SANS}`;
    c.fillText("Grab a bag • Bigger crunch", 384, 465);
  });
  const standee = new THREE.Mesh(track(new THREE.PlaneGeometry(1.35, 0.9)), std("#ffffff", 0.5, 0, { map: promoTex, side: THREE.DoubleSide }));
  standee.position.set(PX, 1.95, PZ);
  scene.add(standee);
  box(0.04, 1.5, 0.04, steel, PX, 1.0, PZ - 0.02);
  addCollider(PX - 1.25, PZ - 1.25, PX + 1.25, PZ + 1.25, "display", "#fdb913");

  /* ---------- checkout lanes ---------- */
  const counterMat = std("#2c3036", 0.4, 0.4);
  const topMat = std("#f2f2f2", 0.25, 0.1);
  const beltMat = std("#111111", 0.8);
  [-10, -6.5, -3].forEach((x, i) => {
    const z = 11.2;
    box(0.85, 0.85, 2.6, counterMat, x, 0.425, z);
    box(0.9, 0.04, 2.65, topMat, x, 0.87, z);
    box(0.5, 0.02, 1.7, beltMat, x, 0.9, z - 0.35);
    const scr = canvasTex(256, 160, (c) => {
      c.fillStyle = "#0b0b0b";
      c.fillRect(0, 0, 256, 160);
      c.fillStyle = "#fdb913";
      c.font = `64px ${DISPLAY}`;
      c.textAlign = "center";
      c.fillText("YUMSO", 128, 90);
      c.fillStyle = "#25D366";
      c.font = `600 22px ${SANS}`;
      c.fillText("Pay on WhatsApp", 128, 135);
    });
    const screen = box(0.36, 0.24, 0.03, std("#ffffff", 0.3, 0, { map: scr, emissive: new THREE.Color("#ffffff"), emissiveMap: scr, emissiveIntensity: 0.6 }), x + 0.2, 1.15, z + 0.9, false);
    screen.rotation.y = Math.PI;
    box(0.05, 0.28, 0.05, steel, x + 0.2, 0.98, z + 0.9, false);
    // lane number light
    const num = canvasTex(128, 128, (c) => {
      c.fillStyle = "#25D366";
      c.fillRect(0, 0, 128, 128);
      c.fillStyle = "#fff";
      c.font = `96px ${DISPLAY}`;
      c.textAlign = "center";
      c.fillText(String(i + 1), 64, 100);
    });
    box(0.04, 2.3, 0.04, steel, x - 0.38, 1.15, z - 1.25, false);
    box(0.3, 0.3, 0.3, std("#ffffff", 0.4, 0, { map: num, emissive: new THREE.Color("#ffffff"), emissiveMap: num, emissiveIntensity: 0.8 }), x - 0.38, 2.4, z - 1.25, false);
    addCollider(x - 0.45, z - 1.32, x + 0.45, z + 1.32, "counter", "#2c3036");
  });

  /* ---------- shopping cart (follows the player) ---------- */
  const cart = new THREE.Group();
  scene.add(cart);
  const chrome = std("#d4d7dc", 0.22, 0.95);
  const gridTex = canvasTex(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 7;
    for (let i = 0; i <= 256; i += 32) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, 256);
      c.stroke();
      c.beginPath();
      c.moveTo(0, i);
      c.lineTo(256, i);
      c.stroke();
    }
  });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  const wireMat = (w: number, h: number) => {
    const t = gridTex.clone();
    t.needsUpdate = true;
    t.repeat.set(w / 0.09, h / 0.09);
    track(t);
    return std("#dfe2e6", 0.25, 0.9, { map: t, alphaTest: 0.5, side: THREE.DoubleSide });
  };
  const addPlane = (w: number, h: number, x: number, y: number, z: number, rx: number, ry: number) => {
    const p = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), wireMat(w, h));
    p.position.set(x, y, z);
    p.rotation.set(rx, ry, 0);
    p.castShadow = true;
    cart.add(p);
  };
  const BW = 0.54;
  const BD = 0.84;
  const BY = 0.56;
  const BH = 0.34;
  addPlane(BW, BD, 0, BY, 0, -Math.PI / 2, 0); // bottom
  addPlane(BD, BH, -BW / 2, BY + BH / 2, 0, 0, Math.PI / 2); // left
  addPlane(BD, BH, BW / 2, BY + BH / 2, 0, 0, Math.PI / 2); // right
  addPlane(BW, BH, 0, BY + BH / 2, -BD / 2, 0, 0); // front
  addPlane(BW, BH, 0, BY + BH / 2, BD / 2, 0, 0); // back
  const tube = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material = chrome) => {
    const t = new THREE.Mesh(boxGeo, m);
    t.scale.set(w, h, d);
    t.position.set(x, y, z);
    t.castShadow = true;
    cart.add(t);
    return t;
  };
  const T = 0.016;
  tube(BW + T, T, T, 0, BY + BH, -BD / 2);
  tube(BW + T, T, T, 0, BY + BH, BD / 2);
  tube(T, T, BD + T, -BW / 2, BY + BH, 0);
  tube(T, T, BD + T, BW / 2, BY + BH, 0);
  tube(T, T, BD, -BW / 2, BY, 0);
  tube(T, T, BD, BW / 2, BY, 0);
  // handle
  const handleArmL = tube(T, 0.22, T, -BW / 2 + 0.02, BY + BH + 0.1, BD / 2 + 0.06);
  const handleArmR = tube(T, 0.22, T, BW / 2 - 0.02, BY + BH + 0.1, BD / 2 + 0.06);
  handleArmL.rotation.x = handleArmR.rotation.x = -0.5;
  const grip = new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.02, BW - 0.02, 16)), std("#e2231a", 0.45, 0.1));
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, BY + BH + 0.19, BD / 2 + 0.12);
  cart.add(grip);
  // chassis + wheels
  tube(T, T, BD + 0.1, -0.2, 0.16, 0.04);
  tube(T, T, BD + 0.1, 0.2, 0.16, 0.04);
  tube(T, BY - 0.14, T, -0.22, (BY + 0.16) / 2, BD / 2 - 0.02);
  tube(T, BY - 0.14, T, 0.22, (BY + 0.16) / 2, BD / 2 - 0.02);
  tube(T, BY - 0.14, T, -0.22, (BY + 0.16) / 2, -BD / 2 + 0.06);
  tube(T, BY - 0.14, T, 0.22, (BY + 0.16) / 2, -BD / 2 + 0.06);
  addPlane(0.42, BD - 0.1, 0, 0.17, 0.02, -Math.PI / 2, 0);
  const wheelGeo = track(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20));
  const rubber = std("#111111", 0.8);
  for (const [x, z] of [[-0.22, -0.36], [0.22, -0.36], [-0.22, 0.42], [0.22, 0.42]] as const) {
    const w = new THREE.Mesh(wheelGeo, rubber);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.056, z);
    w.castShadow = true;
    cart.add(w);
  }
  // brand plate
  const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(0.3, 0.2)), std("#ffffff", 0.4, 0, { map: logoTex }));
  plate.position.set(0, BY + BH * 0.55, -BD / 2 - 0.005);
  plate.rotation.y = Math.PI;
  cart.add(plate);
  const basket = new THREE.Group();
  cart.add(basket);
  const cartItems: { mesh: THREE.Mesh; f: number }[] = [];
  const slotLocal = (n: number) => {
    const layer = Math.floor(n / 12);
    const k = n % 12;
    const col = k % 3;
    const row = Math.floor(k / 3);
    return new THREE.Vector3((col - 1) * 0.16, BY + 0.05 + layer * 0.07, (row - 1.5) * 0.19);
  };

  /* ---------- build instanced meshes ---------- */
  const packMeshes = products.map((_, f) => {
    const im = new THREE.InstancedMesh(packGeo, packMats[f], perFlavour[f].length);
    perFlavour[f].forEach((mtx, i) => im.setMatrixAt(i, mtx));
    im.castShadow = false; // thousands of packs: skip shadow pass for performance
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);
    return im;
  });

  // hover outline
  const outlineMat = track(new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.BackSide, transparent: true, opacity: 0.95 }));
  const outline = new THREE.Mesh(packGeo, outlineMat);
  outline.matrixAutoUpdate = false;
  outline.visible = false;
  scene.add(outline);

  /* ---------- player / input ---------- */
  const player = new THREE.Vector3(0, 0, FZ - 2.6);
  let yaw = 0;
  let pitch = -0.12;
  const vel = new THREE.Vector2();
  const keys = new Set<string>();
  const joy = new THREE.Vector2();
  let active = false; // receives input
  let visible = true;
  let locked = false;
  let bob = 0;
  let hovered: Inst | null = null;
  const flying: { mesh: THREE.Mesh; from: THREE.Vector3; fromQ: THREE.Quaternion; slot: number; f: number; t: number }[] = [];

  const R = 0.38;
  const hit = (x: number, z: number, r: number) => {
    if (x < -W / 2 + r || x > W / 2 - r || z < -D / 2 + r || z > FZ - 0.4) return true;
    for (const c of colliders) {
      const cx = Math.max(c.x1, Math.min(x, c.x2));
      const cz = Math.max(c.z1, Math.min(z, c.z2));
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    }
    return false;
  };
  const cartPos = (x: number, z: number) => [x - Math.sin(yaw) * 0.95, z - Math.cos(yaw) * 0.95] as const;
  const blocked = (x: number, z: number) => {
    const [cx, cz] = cartPos(x, z);
    return hit(x, z, R) || hit(cx, cz, 0.3);
  };

  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", " "].includes(k)) e.preventDefault();
    if (down) keys.add(k);
    else keys.delete(k);
    if (down && k === "e") pickHovered();
  };
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);

  const look = (dx: number, dy: number) => {
    yaw -= dx * 0.0024;
    pitch = Math.max(-1.1, Math.min(0.9, pitch - dy * 0.0024));
  };
  const onMouse = (e: MouseEvent) => {
    if (locked) look(e.movementX, e.movementY);
  };
  const onClick = () => {
    if (locked) pickHovered();
  };
  const onLockChange = () => {
    locked = document.pointerLockElement === renderer.domElement;
    active = locked || active;
    if (!locked) keys.clear();
    cb.onLock(locked);
  };
  document.addEventListener("mousemove", onMouse);
  renderer.domElement.addEventListener("click", onClick);
  document.addEventListener("pointerlockchange", onLockChange);

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster();
  const toCam = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  function findPack(origin: THREE.Vector3, dir: THREE.Vector3): Inst | null {
    let best: Inst | null = null;
    let bestT = 3.4;
    for (const it of inst) {
      if (it.picked) continue;
      toCam.subVectors(origin, it.pos);
      if (toCam.lengthSq() > 12) continue;
      if (toCam.dot(it.normal) <= 0) continue; // only packs facing us
      tmpV.subVectors(it.pos, origin);
      const t = tmpV.dot(dir);
      if (t <= 0 || t >= bestT) continue;
      const d2 = tmpV.lengthSq() - t * t;
      if (d2 < 0.17 * 0.17) {
        bestT = t;
        best = it;
      }
    }
    return best;
  }

  function pick(it: Inst | null) {
    if (!it || it.picked) return;
    it.picked = true;
    const im = packMeshes[it.f];
    const mtx = new THREE.Matrix4();
    im.getMatrixAt(it.i, mtx);
    im.setMatrixAt(it.i, new THREE.Matrix4().makeScale(0, 0, 0));
    im.instanceMatrix.needsUpdate = true;
    const m = new THREE.Mesh(packGeo, packMats[it.f]);
    m.castShadow = true;
    const from = new THREE.Vector3();
    const fromQ = new THREE.Quaternion();
    mtx.decompose(from, fromQ, new THREE.Vector3());
    m.position.copy(from);
    m.quaternion.copy(fromQ);
    scene.add(m);
    flying.push({ mesh: m, from, fromQ, slot: cartItems.length + flying.length, f: it.f, t: 0 });
    hovered = null;
    outline.visible = false;
    cb.onHover(null);
    cb.onPick(products[it.f]);
  }
  function pickHovered() {
    pick(hovered);
  }
  function pickAt(clientX: number, clientY: number) {
    const r = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    pick(findPack(ray.ray.origin, ray.ray.direction));
  }

  function removeOne(productId: string) {
    const f = products.findIndex((p) => p.id === productId);
    for (let i = cartItems.length - 1; i >= 0; i--)
      if (cartItems[i].f === f) {
        basket.remove(cartItems[i].mesh);
        cartItems.splice(i, 1);
        break;
      }
    cartItems.forEach((c, i) => c.mesh.position.copy(slotLocal(i)));
  }

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const fwd = new THREE.Vector3();
  const slotW = new THREE.Vector3();
  const endQ = new THREE.Quaternion();
  let raf = 0;
  let frameN = 0;
  let idleT = 0;

  function update(dt: number) {
    // movement
    const run = keys.has("shift") ? 1.75 : 1;
    let mx = joy.x;
    let mz = -joy.y;
    if (keys.has("w") || keys.has("arrowup")) mz -= 1;
    if (keys.has("s") || keys.has("arrowdown")) mz += 1;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const speed = 3.1 * run;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    const tx = (mx * cos + mz * sin) * speed;
    const tz = (-mx * sin + mz * cos) * speed;
    vel.x += (tx - vel.x) * Math.min(1, dt * 9);
    vel.y += (tz - vel.y) * Math.min(1, dt * 9);
    const nx = player.x + vel.x * dt;
    const nz = player.z + vel.y * dt;
    if (!blocked(nx, player.z)) player.x = nx;
    else vel.x = 0;
    if (!blocked(player.x, nz)) player.z = nz;
    else vel.y = 0;

    const moving = Math.hypot(vel.x, vel.y);
    bob += dt * moving * 2.6;
    if (!active) {
      idleT += dt;
      yaw = Math.sin(idleT * 0.15) * 0.35;
    }
    camera.position.set(player.x, EYE + Math.sin(bob) * 0.022 * Math.min(1, moving / 3), player.z);
    camera.rotation.set(pitch, yaw, Math.sin(bob * 0.5) * 0.004 * Math.min(1, moving / 3));

    // cart follows
    const [cx, cz] = cartPos(player.x, player.z);
    cart.position.set(cx, 0, cz);
    cart.rotation.y = yaw;

    // doors
    const near = Math.hypot(player.x, player.z - FZ) < 5 ? 1 : 0;
    doorOpen += (near - doorOpen) * Math.min(1, dt * 3);
    doorL.position.x = -1 - doorOpen * 1.8;
    doorR.position.x = 1 + doorOpen * 1.8;

    // hover (every other frame)
    if (active && frameN % 2 === 0) {
      camera.getWorldDirection(fwd);
      const h = findPack(camera.position, fwd);
      if (h !== hovered) {
        hovered = h;
        cb.onHover(h ? products[h.f] : null);
      }
    }
    if (hovered) {
      const mtx = new THREE.Matrix4();
      packMeshes[hovered.f].getMatrixAt(hovered.i, mtx);
      const s = 1.09 + Math.sin(clock.elapsedTime * 6) * 0.015;
      outline.matrix.copy(mtx).multiply(new THREE.Matrix4().makeScale(s, s, 1.6));
      outlineMat.color.set(products[hovered.f].color);
      outline.visible = true;
    } else outline.visible = false;

    // flying packs → cart
    for (let i = flying.length - 1; i >= 0; i--) {
      const fl = flying[i];
      fl.t = Math.min(1, fl.t + dt / 0.55);
      const e = fl.t * fl.t * (3 - 2 * fl.t);
      slotW.copy(slotLocal(fl.slot));
      cart.localToWorld(slotW);
      const mid = fl.from.clone().lerp(slotW, 0.5);
      mid.y = Math.max(fl.from.y, slotW.y) + 0.45;
      const a = fl.from.clone().lerp(mid, e);
      const b = mid.clone().lerp(slotW, e);
      fl.mesh.position.copy(a.lerp(b, e));
      endQ.setFromEuler(new THREE.Euler(-Math.PI / 2, yaw + (fl.slot % 2 ? 0.2 : -0.15), 0, "YXZ"));
      fl.mesh.quaternion.slerpQuaternions(fl.fromQ, endQ, e);
      if (fl.t >= 1) {
        scene.remove(fl.mesh);
        basket.add(fl.mesh);
        fl.mesh.position.copy(slotLocal(cartItems.length));
        fl.mesh.rotation.set(-Math.PI / 2, 0, (cartItems.length % 3) * 0.25 - 0.25);
        cartItems.push({ mesh: fl.mesh, f: fl.f });
        flying.splice(i, 1);
      }
    }

    if (frameN % 4 === 0) cb.onFrame(player.x, player.z, yaw);
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    if (!visible) return;
    frameN++;
    update(dt);
    renderer.render(scene, camera);
  }
  loop();

  /* ---------- api ---------- */
  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  return {
    enter: () => {
      active = true;
      if (!matchMedia("(pointer: coarse)").matches)
        Promise.resolve(renderer.domElement.requestPointerLock?.()).catch(() => {
          /* pointer lock unavailable (e.g. iframe) – drag-to-look still works */
        });
    },
    exit: () => {
      active = false;
      keys.clear();
      joy.set(0, 0);
      if (document.pointerLockElement) document.exitPointerLock();
      hovered = null;
      cb.onHover(null);
    },
    setMove: (x, y) => joy.set(x, y),
    look,
    pickAt,
    pickHovered,
    removeOne,
    resize,
    setVisible: (v) => {
      visible = v;
      clock.getDelta();
    },
    setActive: (v) => {
      active = v;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      document.removeEventListener("mousemove", onMouse);
      document.removeEventListener("pointerlockchange", onLockChange);
      renderer.domElement.removeEventListener("click", onClick);
      if (document.pointerLockElement) document.exitPointerLock();
      packMeshes.forEach((m) => m.dispose());
      panels.dispose();
      disposables.forEach((d) => d.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
    layout: colliders,
    size: { W, D },
  };
}
