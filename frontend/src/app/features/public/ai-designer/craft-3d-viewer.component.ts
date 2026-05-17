import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DesignSpec, DesignThreeDParameters } from '../../../core/models/ai-design.model';

export interface Craft3DCapture {
  imageBase64: string;
  mimeType: string;
  source: 'threejs';
}

interface Normalized3D {
  template: string;
  materialPreset: string;
  texture: string;
  ornament: string;
  height: number;
  radius: number;
  curvature: number;
  taper: number;
  repeatCount: number;
  baseColor: string;
  accentColor: string;
  detailLevel: string;
  cameraPreset: string;
}

@Component({
  selector: 'app-craft-3d-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './craft-3d-viewer.component.html',
  styleUrl: './craft-3d-viewer.component.scss'
})
export class Craft3DViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() spec: DesignSpec | null = null;
  @Output() captured = new EventEmitter<Craft3DCapture>();
  @ViewChild('stage') private readonly stageRef?: ElementRef<HTMLDivElement>;

  protected webglFailed = false;
  protected autoRotateEnabled = true;

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private craft?: THREE.Group;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private animationFrame = 0;
  private resizeFrame = 0;
  private lastCanvasWidth = 0;
  private lastCanvasHeight = 0;
  private lastPixelRatio = 0;
  private visible = true;
  private ready = false;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly gltfLoader = new GLTFLoader();

  constructor(
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.autoRotateEnabled = !this.reducedMotion;
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.zone.runOutsideAngular(() => this.initScene()));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['spec'] && this.ready) {
      this.rebuildCraft();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.resizeFrame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.controls?.dispose();
    if (this.craft) this.disposeObject(this.craft);
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  }

  protected resetCamera(): void {
    if (!this.camera || !this.controls) return;
    this.frameCamera(this.normalizeSpec());
  }

  protected toggleAutoRotate(): void {
    this.autoRotateEnabled = !this.autoRotateEnabled;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotateEnabled && !this.reducedMotion;
    }
  }

  protected captureCurrentModel(): void {
    const capture = this.captureDataUrl();
    if (capture) {
      this.captured.emit(capture);
    }
  }

  captureDataUrl(): Craft3DCapture | null {
    if (!this.renderer || !this.scene || !this.camera) return null;
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const imageBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    return { imageBase64, mimeType: 'image/png', source: 'threejs' };
  }

  private initScene(): void {
    const host = this.stageRef?.nativeElement;
    if (!host || !this.webglAvailable()) {
      this.zone.run(() => {
        this.webglFailed = true;
        this.cdr.markForCheck();
      });
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf3eadc, 0.045);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isMobile();
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.maxWidth = '100%';
    this.renderer.domElement.style.maxHeight = '100%';
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 7.2;
    this.controls.autoRotate = this.autoRotateEnabled && !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.85;

    this.addLighting();
    this.addStudioFloor();
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? true;
    }, { threshold: 0.08 });
    this.intersectionObserver.observe(host);

    this.ready = true;
    this.resize();
    this.rebuildCraft();
    this.animate();
  }

  private webglAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }

  private resize(): void {
    const host = this.stageRef?.nativeElement;
    if (!host || !this.renderer || !this.camera) return;
    const width = Math.max(280, host.clientWidth);
    const height = Math.max(320, host.clientHeight);
    const maxDpr = this.isMobile() ? 1.45 : 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr);
    if (width === this.lastCanvasWidth && height === this.lastCanvasHeight && pixelRatio === this.lastPixelRatio) {
      return;
    }
    this.lastCanvasWidth = width;
    this.lastCanvasHeight = height;
    this.lastPixelRatio = pixelRatio;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private scheduleResize(): void {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => this.resize());
  }

  private animate(): void {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    if (!this.visible || !this.renderer || !this.scene || !this.camera) return;
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  private addLighting(): void {
    if (!this.scene) return;
    const ambient = new THREE.HemisphereLight(0xfff6e5, 0x4a3328, 1.95);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffedd0, 3.8);
    key.position.set(-3.6, 5.4, 4.2);
    key.castShadow = !this.isMobile();
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 14;
    this.scene.add(key);

    const rim = new THREE.PointLight(0xc9a253, 28, 7.5, 2.2);
    rim.position.set(2.8, 2.2, -2.4);
    this.scene.add(rim);
  }

  private addStudioFloor(): void {
    if (!this.scene) return;
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 96),
      new THREE.MeshStandardMaterial({
        color: 0xf1e7d7,
        roughness: 0.86,
        metalness: 0,
        transparent: true,
        opacity: 0.78
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.05;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private rebuildCraft(): void {
    if (!this.scene || !this.camera) return;
    if (this.craft) {
      this.scene.remove(this.craft);
      this.disposeObject(this.craft);
    }

    const params = this.normalizeSpec();
    const group = new THREE.Group();
    group.name = 'RebeccaCraft3D';
    switch (params.template) {
      case 'lamp':
        this.buildLamp(group, params);
        break;
      case 'tray':
        this.buildTray(group, params);
        break;
      case 'planter':
        this.buildPlanter(group, params);
        break;
      case 'clock':
        this.buildClock(group, params);
        break;
      default:
        this.buildVase(group, params);
        break;
    }
    this.applyCraftPresence(group);
    this.craft = group;
    this.scene.add(group);
    this.frameCamera(params);
  }

  private buildLamp(group: THREE.Group, params: Normalized3D): void {
    const bodyMat = this.createMaterial(params, params.baseColor);
    const accentMat = this.createMaterial(params, params.accentColor, true);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(params.radius * 0.92, params.radius * 0.62, params.height * 0.78, 72, 5, true),
      bodyMat
    );
    shade.position.y = 0.28;
    shade.castShadow = true;
    shade.receiveShadow = true;
    group.add(shade);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.46, 24), accentMat);
    stem.position.y = -0.45;
    stem.castShadow = true;
    group.add(stem);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(params.radius * 0.58, params.radius * 0.72, 0.18, 64), bodyMat);
    base.position.y = -1.18;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    this.addHorizontalBands(group, params.radius * 0.79, 0.06, params.height * 0.68, 3, accentMat);
    this.addRadialWeave(group, params.radius * 0.86, params.height * 0.72, Math.max(10, params.repeatCount), accentMat, 0.55);
    this.addSurfaceOrnaments(group, params, params.radius * 0.96, 0.16, accentMat);
  }

  private buildVase(group: THREE.Group, params: Normalized3D): void {
    const bodyMat = this.createMaterial(params, params.baseColor);
    const accentMat = this.createMaterial(params, params.accentColor, true);
    const points: THREE.Vector2[] = [];
    const h = params.height;
    const r = params.radius;
    points.push(new THREE.Vector2(r * 0.34, -h * 0.52));
    points.push(new THREE.Vector2(r * 0.55, -h * 0.46));
    points.push(new THREE.Vector2(r * (0.9 + params.curvature * 0.24), -h * 0.14));
    points.push(new THREE.Vector2(r * (0.82 - params.taper * 0.18), h * 0.20));
    points.push(new THREE.Vector2(r * 0.48, h * 0.48));
    points.push(new THREE.Vector2(r * 0.58, h * 0.54));
    const body = new THREE.Mesh(new THREE.LatheGeometry(points, 96), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.56, 0.028, 16, 96), accentMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = h * 0.54;
    lip.castShadow = true;
    group.add(lip);

    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.46, r * 0.42, 0.035, 72), this.darkInteriorMaterial());
    mouth.position.y = h * 0.555;
    group.add(mouth);
    this.addHorizontalBands(group, r * 0.82, -h * 0.16, h * 0.52, Math.max(2, Math.min(5, Math.round(params.repeatCount / 3))), accentMat);
    this.addSurfaceOrnaments(group, params, r * 0.93, 0.02, accentMat);
  }

  private buildPlanter(group: THREE.Group, params: Normalized3D): void {
    this.buildVase(group, { ...params, radius: params.radius * 0.95, height: params.height * 0.88 });
    const accentMat = this.createMaterial(params, params.accentColor, true);
    const legGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.45, 16);
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const leg = new THREE.Mesh(legGeo.clone(), accentMat);
      leg.position.set(Math.cos(angle) * params.radius * 0.48, -params.height * 0.68, Math.sin(angle) * params.radius * 0.48);
      leg.rotation.z = Math.cos(angle) * 0.12;
      leg.rotation.x = Math.sin(angle) * 0.12;
      leg.castShadow = true;
      group.add(leg);
    }
  }

  private buildTray(group: THREE.Group, params: Normalized3D): void {
    const bodyMat = this.createMaterial(params, params.baseColor);
    const accentMat = this.createMaterial(params, params.accentColor, true);
    const shape = this.roundedRectShape(1.95, 1.08, 0.18);
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 6
    });
    bodyGeo.center();
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const rimShape = this.roundedRectShape(2.16, 1.26, 0.22);
    const rimGeo = new THREE.ExtrudeGeometry(rimShape, { depth: 0.075, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 4 });
    rimGeo.center();
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.position.y = 0.13;
    rim.castShadow = true;
    group.add(rim);

    this.addTrayHandles(group, accentMat);
    this.addTrayWeave(group, accentMat, Math.max(8, params.repeatCount));
    group.rotation.x = -0.08;
  }

  private buildClock(group: THREE.Group, params: Normalized3D): void {
    const bodyMat = this.createMaterial(params, params.baseColor);
    const accentMat = this.createMaterial(params, params.accentColor, true);
    const faceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f5f0e8'),
      roughness: 0.82,
      metalness: 0.01,
      map: this.createTexture(params.texture, '#f5f0e8', params.baseColor)
    });
    const radius = Math.max(0.58, params.radius);

    const back = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, 0.12, 96), bodyMat);
    back.rotation.x = Math.PI / 2;
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    const face = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.045, 96), faceMat);
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.075;
    face.castShadow = true;
    face.receiveShadow = true;
    group.add(face);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, 0.035, 18, 112), accentMat);
    rim.position.z = 0.11;
    rim.castShadow = true;
    group.add(rim);

    const markerGeo = new THREE.BoxGeometry(0.035, 0.13, 0.018);
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const marker = new THREE.Mesh(markerGeo.clone(), accentMat);
      const longMarker = i % 3 === 0;
      marker.scale.set(longMarker ? 1.35 : 0.82, longMarker ? 1.25 : 0.82, 1);
      marker.position.set(Math.sin(angle) * radius * 0.68, Math.cos(angle) * radius * 0.68, 0.14);
      marker.rotation.z = -angle;
      marker.castShadow = true;
      group.add(marker);
    }

    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.042, radius * 0.42, 0.02), accentMat);
    hourHand.position.set(radius * 0.11, radius * 0.15, 0.165);
    hourHand.rotation.z = -0.62;
    hourHand.castShadow = true;
    group.add(hourHand);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.026, radius * 0.58, 0.018), this.darkInteriorMaterial());
    minuteHand.position.set(-radius * 0.09, radius * 0.24, 0.18);
    minuteHand.rotation.z = 0.34;
    minuteHand.castShadow = true;
    group.add(minuteHand);

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 14), accentMat);
    pin.position.z = 0.205;
    pin.castShadow = true;
    group.add(pin);

    if (params.detailLevel.includes('alta')) {
      this.addSurfaceOrnaments(group, { ...params, ornament: 'geometria_cafetera' }, radius * 0.48, 0, accentMat);
    }
    group.position.y = 0.04;
  }

  private roundedRectShape(width: number, depth: number, radius: number): THREE.Shape {
    const x = -width / 2;
    const y = -depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + depth - radius);
    shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
    shape.lineTo(x + radius, y + depth);
    shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  private addTrayHandles(group: THREE.Group, material: THREE.Material): void {
    [-1, 1].forEach(side => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.1, 0.12, -0.25),
        new THREE.Vector3(side * 1.32, 0.22, 0),
        new THREE.Vector3(side * 1.1, 0.12, 0.25)
      ]);
      const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.026, 10, false), material);
      handle.castShadow = true;
      group.add(handle);
    });
  }

  private addTrayWeave(group: THREE.Group, material: THREE.Material, count: number): void {
    const geo = new THREE.CylinderGeometry(0.008, 0.008, 1.78, 8);
    const mesh = new THREE.InstancedMesh(geo, material, count * 2);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      const z = -0.42 + i * (0.84 / Math.max(1, count - 1));
      matrix.compose(new THREE.Vector3(0, 0.18, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, matrix);
      const x = -0.82 + i * (1.64 / Math.max(1, count - 1));
      matrix.compose(new THREE.Vector3(x, 0.185, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i + count, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  private addHorizontalBands(group: THREE.Group, radius: number, centerY: number, span: number, count: number, material: THREE.Material): void {
    for (let i = 0; i < count; i += 1) {
      const y = centerY - span / 2 + ((i + 1) * span) / (count + 1);
      const band = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 12, 96), material);
      band.rotation.x = Math.PI / 2;
      band.position.y = y;
      band.castShadow = true;
      group.add(band);
    }
  }

  private addRadialWeave(group: THREE.Group, radius: number, height: number, count: number, material: THREE.Material, opacityScale: number): void {
    const geo = new THREE.CylinderGeometry(0.008 * opacityScale, 0.008 * opacityScale, height, 8);
    const mesh = new THREE.InstancedMesh(geo, material, count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      matrix.compose(
        new THREE.Vector3(Math.cos(angle) * radius, 0.12, Math.sin(angle) * radius),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05 * Math.sin(angle), 0, -0.05 * Math.cos(angle))),
        new THREE.Vector3(1, 1, 1)
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  private addSurfaceOrnaments(group: THREE.Group, params: Normalized3D, radius: number, centerY: number, material: THREE.Material): void {
    if (!params.ornament.includes('circular') && !params.ornament.includes('palma') && !params.ornament.includes('geometr')) return;
    const count = Math.max(6, Math.min(18, params.repeatCount));
    const geo = params.ornament.includes('palma')
      ? new THREE.ConeGeometry(0.035, 0.12, 5)
      : new THREE.SphereGeometry(0.035, 16, 10);
    const mesh = new THREE.InstancedMesh(geo, material, count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const y = centerY + Math.sin(i * 1.7) * params.height * 0.14;
      matrix.compose(
        new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -angle, 0)),
        new THREE.Vector3(1, 1, 1)
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  private createMaterial(params: Normalized3D, color: string, accent = false): THREE.MeshStandardMaterial {
    const texture = this.createTexture(params.texture, color, params.accentColor);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(accent ? 1.4 : 2.6, accent ? 1.4 : 2.2);
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      map: texture,
      roughness: accent ? 0.62 : 0.88,
      metalness: accent && color.toLowerCase() === '#c9a253' ? 0.18 : 0.02,
      envMapIntensity: 0.6
    });
  }

  private darkInteriorMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.95 });
  }

  private createTexture(style: string, baseColor: string, accentColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = style === 'tejido' ? 2 : 1;
    const strokes = style === 'liso' ? 24 : 76;
    for (let i = 0; i < strokes; i += 1) {
      const x = (i * 37) % canvas.width;
      const y = (i * 53) % canvas.height;
      ctx.beginPath();
      if (style === 'tejido') {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + ((i % 2) * 12 - 6));
        ctx.moveTo(x, 0);
        ctx.lineTo(x + ((i % 2) * 10 - 5), canvas.height);
      } else if (style === 'veta' || style === 'fibra') {
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 18, 58, x - 22, 112, x + 8, canvas.height);
      } else {
        ctx.arc(x, y, 1 + (i % 4), 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 120; i += 1) {
      ctx.fillRect((i * 29) % canvas.width, (i * 71) % canvas.height, 1, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }

  private normalizeSpec(): Normalized3D {
    const threeD = this.spec?.threeD;
    const template = this.normalizeTemplate(threeD?.template ?? this.spec?.productType ?? 'vase');
    const baseColor = this.safeColor(threeD?.materialColor ?? this.spec?.colorPalette?.[0] ?? '#704A2E');
    const accentColor = this.safeColor(threeD?.accentColor ?? this.spec?.colorPalette?.[1] ?? '#C9A253');
    const materialPreset = this.normalizeToken(threeD?.materialPreset ?? this.spec?.primaryMaterial ?? 'barro', 'barro');
    return {
      template,
      materialPreset,
      texture: this.normalizeToken(threeD?.surfaceTexture ?? this.textureFromMaterial(materialPreset), 'barro'),
      ornament: this.normalizeToken(threeD?.ornamentStyle ?? threeD?.patternStyle ?? this.spec?.pattern ?? 'territorio_sutil', 'territorio_sutil'),
      height: this.clamp((threeD?.height ?? 1) * 1.18, 0.82, 2.25),
      radius: this.clamp((threeD?.radius ?? 0.6) * 0.86, 0.34, 1.05),
      curvature: this.clamp(threeD?.curvature ?? 0.2, 0.08, 0.55),
      taper: this.clamp(threeD?.taper ?? 0.2, 0.04, 0.48),
      repeatCount: Math.round(this.clamp(threeD?.repeatCount ?? 8, 4, 24)),
      baseColor,
      accentColor,
      detailLevel: this.normalizeToken(threeD?.detailLevel ?? this.spec?.complexity ?? 'media', 'media'),
      cameraPreset: this.normalizeToken(threeD?.cameraPreset ?? 'studio_three_quarter', 'studio_three_quarter')
    };
  }

  private normalizeTemplate(template: string): string {
    const value = this.normalizeToken(template, 'vase');
    if (value.includes('lamp')) return 'lamp';
    if (value.includes('tray')) return 'tray';
    if (value.includes('planter') || value.includes('matera')) return 'planter';
    if (value.includes('clock') || value.includes('reloj')) return 'clock';
    return 'vase';
  }

  private textureFromMaterial(material: string): string {
    if (material.includes('madera')) return 'veta';
    if (material.includes('fique') || material.includes('iraca') || material.includes('guadua') || material.includes('lana')) return 'fibra';
    if (material.includes('ceram')) return 'esmaltado';
    return 'barro';
  }

  private safeColor(value: string): string {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : '#704A2E';
  }

  private normalizeToken(value: string, fallback: string): string {
    return value
      ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '_')
      : fallback;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }

  private frameCamera(params: Normalized3D): void {
    if (!this.camera || !this.controls) return;
    const tall = params.template === 'lamp';
    const tray = params.template === 'tray' || params.cameraPreset === 'top_oblique';
    const clock = params.template === 'clock' || params.cameraPreset === 'studio_front';
    this.camera.position.set(tray ? 2.7 : 2.35, tall ? 1.6 : 1.2, tray ? 2.8 : 3.15);
    if (params.cameraPreset === 'hero_tall') this.camera.position.set(2.15, 1.95, 3.35);
    if (clock) this.camera.position.set(0.2, 0.42, 3.2);
    this.controls.target.set(0, tray ? 0.02 : 0, 0);
    this.controls.update();
  }

  private applyCraftPresence(group: THREE.Group): void {
    group.rotation.y = -0.28;
    group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse(child => {
      if (!(child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh)) return;
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        Object.values(material).forEach(value => {
          if (value instanceof THREE.Texture) value.dispose();
        });
        material.dispose();
      });
    });
  }

  private isMobile(): boolean {
    return window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  }

  // Kept as an integration point for future Blender-made GLB artisan modules.
  private getPreparedGltfLoader(): GLTFLoader {
    return this.gltfLoader;
  }
}
