// Real 3D world for Skyhawk Valley, built on vendored three.js.
// One file, one job: build the scene once from the seeded terrain
// and move the camera, the aircraft, the rings and the storms each
// frame. No network request, every mesh is built from primitives.
import * as THREE from 'three';

export const VIEW_CHASE = 0;
export const VIEW_COCKPIT = 1;

function groundColor(terrain, x, z) {
  const ground = terrain.groundHeight(x, z);
  if (Math.abs(x - terrain.riverX(z)) < 26) return [0.16, 0.42, 0.62];
  if (Math.abs(x - terrain.roadX(z)) < 9) return [0.42, 0.38, 0.34];
  if (ground > 300) return [0.92, 0.93, 0.96];
  if (ground > 220) return [0.55, 0.52, 0.45];
  for (const field of terrain.fields) {
    if (Math.abs(x - field.x) < field.w / 2 && Math.abs(z - field.z) < field.d / 2) {
      return [((field.color >> 16) & 255) / 255, ((field.color >> 8) & 255) / 255, (field.color & 255) / 255];
    }
  }
  const edge = Math.min(1, Math.max(0, (Math.abs(x) - 900) / 900));
  const vary = 0.5 + 0.5 * Math.sin(x * 0.013 + z * 0.007);
  const g = 0.42 + vary * 0.12 - edge * 0.08;
  return [0.22 + vary * 0.06, g, 0.2 + vary * 0.05];
}

function buildTerrainMesh(terrain) {
  const geo = new THREE.PlaneGeometry(5600, 9200, 110, 170);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i) + 4500;
    pos.setY(i, terrain.groundHeight(x, z));
    const c = groundColor(terrain, x, z);
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.position.z = 4500;
  return mesh;
}

function buildAircraft() {
  const group = new THREE.Group();
  const cream = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.5, metalness: 0.15 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.4 });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.1, 13, 12), cream);
  fuselage.rotation.x = Math.PI / 2;
  group.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.2, 12), red);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 8;
  group.add(nose);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), new THREE.MeshStandardMaterial({ color: 0x7ec8e8, roughness: 0.15, metalness: 0.5 }));
  canopy.scale.set(1, 0.75, 1.9);
  canopy.position.set(0, 1.15, 2.2);
  group.add(canopy);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(26, 0.45, 4.2), red);
  wing.position.set(0, -0.2, 1.2);
  group.add(wing);
  const wingTipL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 4.2), cream);
  wingTipL.position.set(-13.4, -0.2, 1.2);
  group.add(wingTipL);
  const wingTipR = wingTipL.clone();
  wingTipR.position.x = 13.4;
  group.add(wingTipR);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 2.6), red);
  tailWing.position.set(0, 0.4, -6);
  group.add(tailWing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.4, 3), red);
  fin.position.set(0, 2, -6);
  group.add(fin);
  const prop = new THREE.Group();
  prop.position.z = 9.8;
  const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.25), dark);
  const bladeB = bladeA.clone();
  bladeB.rotation.z = Math.PI / 2;
  prop.add(bladeA);
  prop.add(bladeB);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), dark);
  prop.add(hub);
  group.add(prop);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.9, 24), new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
  disc.position.z = 9.7;
  group.add(disc);
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
  for (const gx of [-2.2, 2.2]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 8), gearMat);
    leg.position.set(gx, -2.2, 1.5);
    group.add(leg);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.35, 8, 14), gearMat);
    wheel.position.set(gx, -3.4, 1.5);
    group.add(wheel);
  }
  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  navL.position.set(-13.6, 0, 1.2);
  group.add(navL);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0x22ff66 }));
  navR.position.set(13.6, 0, 1.2);
  group.add(navR);
  group.userData.prop = prop;
  group.userData.navL = navL;
  group.userData.navR = navR;
  group.traverse((obj) => { if (obj.isMesh) obj.castShadow = false; });
  return group;
}

export function createScene(canvas, terrain) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbfd9ee, 900, 5200);
  const camera = new THREE.PerspectiveCamera(62, 1, 1, 12000);
  const skyGeo = new THREE.SphereGeometry(9000, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0x2f6fb8) }, mid: { value: new THREE.Color(0x9cc8e8) }, low: { value: new THREE.Color(0xe8f2f8) } },
    vertexShader: 'varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vPos; uniform vec3 top; uniform vec3 mid; uniform vec3 low; void main(){ float h = normalize(vPos).y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.7, h)) : mix(low, mid, smoothstep(-0.1, 0.12, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.6);
  sun.position.set(-1800, 2600, 1200);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x5a7a4a, 0.9));
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(180, 24), new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false }));
  sunDisc.position.set(-2600, 1900, 2600);
  sunDisc.lookAt(0, 0, 4500);
  scene.add(sunDisc);
  scene.add(buildTerrainMesh(terrain));
  const treeGeo = new THREE.ConeGeometry(1, 3, 7);
  const treeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, terrain.trees.length);
  const dummy = new THREE.Object3D();
  const treeColor = new THREE.Color();
  terrain.trees.forEach((tree, i) => {
    const gy = terrain.groundHeight(tree.x, tree.z);
    dummy.position.set(tree.x, gy + tree.size * 1.4, tree.z);
    dummy.scale.set(tree.size, tree.size, tree.size);
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
    trees.setColorAt(i, treeColor.setHex(tree.shade));
  });
  scene.add(trees);
  for (const barn of terrain.barns) {
    const gy = terrain.groundHeight(barn.x, barn.z);
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 16), new THREE.MeshLambertMaterial({ color: barn.red ? 0xa03028 : 0x8a6a3a }));
    body.position.y = 6;
    b.add(body);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 11, 18, 4, 1), new THREE.MeshLambertMaterial({ color: 0x5a3a28 }));
    roof.rotation.z = Math.PI / 4;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.9);
    roof.position.y = 15;
    b.add(roof);
    b.position.set(barn.x, gy, barn.z);
    scene.add(b);
  }
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (const cloud of terrain.clouds) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(cloud.size * (0.5 + i * 0.22), 10, 8), cloudMat);
      puff.position.set((i - 1) * cloud.size * 0.7, (i % 2) * cloud.size * 0.18, 0);
      puff.scale.y = 0.45;
      g.add(puff);
    }
    g.position.set(cloud.x, cloud.y, cloud.z);
    g.userData.drift = cloud.drift;
    scene.add(g);
    clouds.push(g);
  }
  const runway = terrain.runway;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(runway.width, runway.length), new THREE.MeshStandardMaterial({ color: 0x2e3138, roughness: 0.9 }));
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(runway.x, 21.5, runway.z - runway.length / 2 + 60);
  scene.add(strip);
  for (let i = 0; i < 9; i += 1) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 26), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(runway.x, 21.8, runway.z - runway.length + 90 + i * 70);
    scene.add(dash);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe27a });
  for (let i = 0; i < 10; i += 1) {
    for (const side of [-1, 1]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), lightMat);
      lamp.position.set(runway.x + side * (runway.width / 2 + 4), 23, runway.z - runway.length + 40 + i * 72);
      scene.add(lamp);
    }
  }
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xffb020, emissive: 0xaa6600, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.6 });
  const ringGeo = new THREE.TorusGeometry(34, 2.6, 12, 40);
  const ringMeshes = [];
  for (let i = 0; i < 8; i += 1) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.visible = false;
    scene.add(ring);
    ringMeshes.push(ring);
  }
  const stormMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 1, transparent: true, opacity: 0.92, emissive: 0x222233, emissiveIntensity: 0.4 });
  const stormMeshes = [];
  for (let i = 0; i < 8; i += 1) {
    const g = new THREE.Group();
    for (let j = 0; j < 4; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(55, 10, 8), stormMat);
      puff.position.set((j - 1.5) * 55, (j % 2) * 22, (j % 3) * 30 - 30);
      puff.scale.y = 0.6;
      g.add(puff);
    }
    g.visible = false;
    scene.add(g);
    stormMeshes.push(g);
  }
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.7 });
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6611, transparent: true, opacity: 0.9 });
  const particles = [];
  for (let i = 0; i < 26; i += 1) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), i < 8 ? fireMat.clone() : smokeMat.clone());
    p.visible = false;
    scene.add(p);
    particles.push({ mesh: p, life: 0 });
  }
  const aircraft = buildAircraft();
  scene.add(aircraft);
  const camPos = new THREE.Vector3(0, 440, -40);
  const camTarget = new THREE.Vector3(0, 420, 100);
  let view = VIEW_CHASE;
  let smokeTimer = 0;
  return {
    view() { return view; },
    toggleView() { view = view === VIEW_CHASE ? VIEW_COCKPIT : VIEW_CHASE; return view; },
    setView(v) { view = v; },
    snap(state) {
      const plane = state.plane;
      const forward = new THREE.Vector3(Math.sin(plane.heading), 0, Math.cos(plane.heading));
      if (view === VIEW_COCKPIT) {
        camPos.set(plane.x, plane.alt + 1.6, plane.z).addScaledVector(forward, 3);
        camTarget.set(plane.x, plane.alt, plane.z).addScaledVector(forward, 120);
      } else {
        camPos.set(plane.x, plane.alt + 11, plane.z).addScaledVector(forward, -42);
        camTarget.set(plane.x, plane.alt + 2, plane.z).addScaledVector(forward, 90);
      }
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
    },
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    burst(x, y, z, fiery) {
      let made = 0;
      for (const p of particles) {
        if (p.life > 0) continue;
        p.mesh.visible = true;
        p.mesh.position.set(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 6, z + (Math.random() - 0.5) * 12);
        p.mesh.material.opacity = fiery ? 0.95 : 0.7;
        p.life = 1;
        made += 1;
        if (made >= 10) break;
      }
    },
    draw(state, dt, time) {
      const plane = state.plane;
      const shake = plane.buffet * 0.7;
      aircraft.position.set(plane.x + (Math.random() - 0.5) * shake, plane.alt + (Math.random() - 0.5) * shake, plane.z);
      aircraft.rotation.order = 'YXZ';
      aircraft.rotation.y = plane.heading;
      aircraft.rotation.x = plane.pitch;
      aircraft.rotation.z = -plane.roll;
      aircraft.userData.prop.rotation.z += dt * (4 + plane.speed * 0.35);
      const blink = Math.floor(time * 2) % 2 === 0;
      aircraft.userData.navL.visible = blink;
      aircraft.userData.navR.visible = blink;
      sky.position.set(plane.x, 0, plane.z);
      sunDisc.position.set(plane.x - 2600, 1900, plane.z + 2600);
      for (const cloud of clouds) {
        cloud.position.x += cloud.userData.drift * dt;
        if (cloud.position.x > 2400) cloud.position.x = -2400;
      }
      state.missions.rings.forEach((ring, i) => {
        const mesh = ringMeshes[i];
        if (!mesh) return;
        mesh.visible = !ring.passed;
        mesh.position.set(ring.x, ring.y, ring.z);
        mesh.rotation.y = time * 0.4;
        const pulse = 1 + Math.sin(time * 3 + i) * 0.04;
        mesh.scale.set(pulse, pulse, pulse);
      });
      for (let i = ringMeshes.length - 1; i >= state.missions.rings.length; i -= 1) ringMeshes[i].visible = false;
      state.missions.storms.forEach((storm, i) => {
        const mesh = stormMeshes[i];
        if (!mesh) return;
        mesh.visible = !storm.hit;
        mesh.position.set(storm.x, storm.y, storm.z);
        mesh.rotation.y = time * 0.2;
        const near = Math.abs(storm.z - plane.z) < 500;
        mesh.children.forEach((child) => { child.material.emissiveIntensity = near && Math.random() < 0.06 ? 1.6 : 0.4; });
      });
      for (let i = stormMeshes.length - 1; i >= state.missions.storms.length; i -= 1) stormMeshes[i].visible = false;
      smokeTimer -= dt;
      if ((state.screen === 'over' || plane.hull < 40) && smokeTimer <= 0) {
        this.burst(plane.x, plane.alt, plane.z, state.screen === 'over');
        smokeTimer = 0.25;
      }
      for (const p of particles) {
        if (p.life <= 0) continue;
        p.life -= dt * 0.7;
        p.mesh.position.y += dt * 14;
        p.mesh.scale.setScalar(1 + (1 - p.life) * 2);
        p.mesh.material.opacity = Math.max(0, p.life * 0.8);
        if (p.life <= 0) p.mesh.visible = false;
      }
      const forward = new THREE.Vector3(Math.sin(plane.heading), 0, Math.cos(plane.heading));
      const up = new THREE.Vector3(0, 1, 0);
      if (view === VIEW_COCKPIT) {
        const eye = new THREE.Vector3(plane.x, plane.alt + 1.6, plane.z).addScaledVector(forward, 3);
        camPos.lerp(eye, 0.6);
        const look = new THREE.Vector3(plane.x, plane.alt - plane.pitch * 40, plane.z).addScaledVector(forward, 120);
        look.y += plane.alt * 0;
        camTarget.lerp(look, 0.6);
        camera.position.copy(camPos);
        camera.up.set(0, 1, 0);
        camera.lookAt(camTarget);
        aircraft.visible = false;
      } else {
        const behind = new THREE.Vector3(plane.x, plane.alt + 11, plane.z).addScaledVector(forward, -42);
        behind.y = Math.max(behind.y, terrain.groundHeight(behind.x, behind.z) + 8);
        camPos.lerp(behind, 1 - Math.pow(0.001, dt));
        const look = new THREE.Vector3(plane.x, plane.alt + 2, plane.z).addScaledVector(forward, 90);
        camTarget.lerp(look, 1 - Math.pow(0.0005, dt));
        camera.position.copy(camPos);
        camera.up.set(0, 1, 0);
        camera.lookAt(camTarget);
        aircraft.visible = true;
      }
      renderer.render(scene, camera);
    },
  };
}
