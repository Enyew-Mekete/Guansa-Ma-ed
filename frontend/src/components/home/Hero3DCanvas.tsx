import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BRAND_ASSETS } from '../../config/branding';
import { Sparkles, RotateCcw, Camera, Box } from 'lucide-react';

interface Hero3DCanvasProps {
  onInteract?: () => void;
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'photo' | 'webgl'>('photo');
  const [isLidOpen, setIsLidOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(BRAND_ASSETS.mesobHero || '/Ethiopian _Mesob.png');
  
  // 3D Parallax & Tilt State for Photo Mode
  const [photoRotation, setPhotoRotation] = useState({ x: 0, y: 0 });
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingPhoto = useRef(false);
  const photoDragStart = useRef({ x: 0, y: 0 });

  // 3D WebGL Three.js Refs
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);
  const lidGroupRef = useRef<THREE.Group | null>(null);
  const mesobRootRef = useRef<THREE.Group | null>(null);

  // Initialize Three.js WebGL Scene (running in background or when webgl mode active)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0.4, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting System (Warm Ethiopian Sunset & Dramatic Rim Light)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 1.3);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff3d1, 2.4);
    mainKeyLight.position.set(5, 8, 5);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x7c9bf5, 1.0);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const warmAccentLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
    warmAccentLight.position.set(0, 2, 2);
    scene.add(warmAccentLight);

    // 4. Texture Generation & Real Ethiopian Mesob Texture Loading
    const createMesobPatternTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Base woven straw tan
      ctx.fillStyle = '#C89D66';
      ctx.fillRect(0, 0, 512, 512);

      // Horizontal woven ribs
      ctx.strokeStyle = '#996C33';
      ctx.lineWidth = 4;
      for (let y = 0; y < 512; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Traditional Ethiopian diamond bands (Red, Gold, Green, Deep Blue)
      const colors = ['#C0392B', '#D4AF37', '#e4eee8', '#344BC2'];
      const bandHeight = 48;
      const yOffset = 180;

      for (let b = 0; b < 3; b++) {
        const by = yOffset + b * bandHeight;
        ctx.fillStyle = colors[b % colors.length];
        ctx.fillRect(0, by, 512, bandHeight - 6);

        // Chevron zig-zag pattern
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        for (let x = 0; x < 512; x += 32) {
          ctx.moveTo(x, by + bandHeight - 6);
          ctx.lineTo(x + 16, by + 4);
          ctx.lineTo(x + 32, by + bandHeight - 6);
        }
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 1);
      return texture;
    };

    const patternTexture = createMesobPatternTexture();

    // Mesob Material (flared pedestal and lid)
    const baseMat = new THREE.MeshStandardMaterial({
      map: patternTexture,
      roughness: 0.65,
      metalness: 0.05,
    });

    // Load real Ethiopian Mesob image texture into 3D material
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/Ethiopian _Mesob.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 1);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        baseMat.map = tex;
        baseMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to secondary image path if spacing differs
        textureLoader.load('/Ethiopian_Mesob.png', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.RepeatWrapping;
          fallbackTex.repeat.set(2, 1);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          baseMat.map = fallbackTex;
          baseMat.needsUpdate = true;
        });
      }
    );

    // 5. Construct 3D Mesob Assembly
    const mesobRoot = new THREE.Group();
    mesobRootRef.current = mesobRoot;
    scene.add(mesobRoot);

    // Lower pedestal stand
    const standGeo = new THREE.CylinderGeometry(1.4, 1.8, 1.1, 36);
    const standMesh = new THREE.Mesh(standGeo, baseMat);
    standMesh.position.y = -0.55;
    standMesh.castShadow = true;
    standMesh.receiveShadow = true;
    mesobRoot.add(standMesh);

    // Decorative ring collar
    const collarGeo = new THREE.TorusGeometry(1.42, 0.09, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.8,
      roughness: 0.25,
    });
    const collarMesh = new THREE.Mesh(collarGeo, goldMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.02;
    mesobRoot.add(collarMesh);

    // Platter Bowl (Upper Table Top)
    const bowlGeo = new THREE.CylinderGeometry(2.2, 1.4, 0.7, 36);
    const bowlMesh = new THREE.Mesh(bowlGeo, baseMat);
    bowlMesh.position.y = 0.35;
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    mesobRoot.add(bowlMesh);

    // Interior Golden Serving Gebeta Platter (where food rests)
    const platterGeo = new THREE.CylinderGeometry(2.05, 1.8, 0.12, 36);
    const platterMat = new THREE.MeshStandardMaterial({
      color: 0xcd7f32,
      metalness: 0.6,
      roughness: 0.3,
    });
    const platterMesh = new THREE.Mesh(platterGeo, platterMat);
    platterMesh.position.y = 0.68;
    platterMesh.receiveShadow = true;
    mesobRoot.add(platterMesh);

    // Teff Injera base spread inside
    const injeraGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.05, 36);
    const injeraMat = new THREE.MeshStandardMaterial({
      color: 0xc8b293, // Warm porous sourdough teff
      roughness: 0.9,
      metalness: 0.0,
    });
    const injeraMesh = new THREE.Mesh(injeraGeo, injeraMat);
    injeraMesh.position.y = 0.74;
    mesobRoot.add(injeraMesh);

    // Food morsels: Sizzling Doro Wat center + colorful mounds
    const foodGroup = new THREE.Group();
    foodGroup.position.y = 0.77;

    // Doro Wat berbere center stew
    const watCenterGeo = new THREE.SphereGeometry(0.55, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const watCenterMat = new THREE.MeshStandardMaterial({
      color: 0x8a1c14, // Deep berbere red
      roughness: 0.4,
      metalness: 0.1,
    });
    const watCenter = new THREE.Mesh(watCenterGeo, watCenterMat);
    watCenter.position.set(0, 0, 0);
    foodGroup.add(watCenter);

    // Boiled egg on top of Doro Wat
    const eggGeo = new THREE.SphereGeometry(0.18, 16, 16);
    eggGeo.scale(1, 1.3, 1);
    const eggMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c4,
      roughness: 0.3,
    });
    const egg = new THREE.Mesh(eggGeo, eggMat);
    egg.position.set(0.1, 0.2, 0.05);
    foodGroup.add(egg);

    // Surrounding Ethiopian vegetable mounds (Gomen, Misir, Kik, Shiro)
    const moundColors = [0x228b22, 0xc0392b, 0xe67e22, 0xf1c40f, 0x8e44ad];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const moundGeo = new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
      const moundMat = new THREE.MeshStandardMaterial({
        color: moundColors[i % moundColors.length],
        roughness: 0.6,
      });
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.position.set(Math.cos(angle) * 1.15, 0, Math.sin(angle) * 1.15);
      foodGroup.add(mound);
    }

    // Rolled teff injera sides
    for (let j = 0; j < 4; j++) {
      const injeraRollGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16);
      const rollMesh = new THREE.Mesh(injeraRollGeo, injeraMat);
      const angle = (j / 4) * Math.PI * 2 + 0.4;
      rollMesh.position.set(Math.cos(angle) * 1.55, 0.1, Math.sin(angle) * 1.55);
      rollMesh.rotation.z = Math.PI / 2;
      rollMesh.rotation.y = angle;
      foodGroup.add(rollMesh);
    }
    mesobRoot.add(foodGroup);

    // 6. Conical Stepped Mesob Lid (Handcrafted hat with finial knob)
    const lidGroup = new THREE.Group();
    lidGroupRef.current = lidGroup;
    lidGroup.position.y = 0.72; // resting atop bowl

    // Conical hat
    const lidConeGeo = new THREE.ConeGeometry(2.3, 2.2, 36, 1, true);
    const lidConeMesh = new THREE.Mesh(lidConeGeo, baseMat);
    lidConeMesh.position.y = 1.1;
    lidConeMesh.castShadow = true;
    lidGroup.add(lidConeMesh);

    // Lid lower lip rim
    const lidRimGeo = new THREE.TorusGeometry(2.28, 0.1, 16, 48);
    const lidRimMesh = new THREE.Mesh(lidRimGeo, goldMat);
    lidRimMesh.rotation.x = Math.PI / 2;
    lidRimMesh.position.y = 0.05;
    lidGroup.add(lidRimMesh);

    // Top ornamental finial knob (handle)
    const knobGeo = new THREE.SphereGeometry(0.26, 20, 20);
    const knobMesh = new THREE.Mesh(knobGeo, goldMat);
    knobMesh.position.y = 2.3;
    lidGroup.add(knobMesh);

    const knobSpireGeo = new THREE.ConeGeometry(0.12, 0.4, 16);
    const knobSpire = new THREE.Mesh(knobSpireGeo, goldMat);
    knobSpire.position.y = 2.6;
    lidGroup.add(knobSpire);

    mesobRoot.add(lidGroup);

    // 7. Rising Culinary Steam Particle System
    const steamParticleCount = 45;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamParticleCount * 3);
    const steamAlphas = new Float32Array(steamParticleCount);
    const steamVelocities: { x: number; y: number; z: number }[] = [];

    for (let p = 0; p < steamParticleCount; p++) {
      steamPositions[p * 3] = (Math.random() - 0.5) * 1.2;
      steamPositions[p * 3 + 1] = 0.8 + Math.random() * 2.0;
      steamPositions[p * 3 + 2] = (Math.random() - 0.5) * 1.2;
      steamAlphas[p] = Math.random();
      steamVelocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: 0.008 + Math.random() * 0.012,
        z: (Math.random() - 0.5) * 0.005,
      });
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    steamGeo.setAttribute('alpha', new THREE.BufferAttribute(steamAlphas, 1));

    const steamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    mesobRoot.add(steamParticles);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating breathing animation
      if (mesobRoot) {
        mesobRoot.position.y = Math.sin(elapsedTime * 1.2) * 0.08;
      }

      // Smooth lid opening transition based on scroll / user toggle
      if (lidGroup) {
        const targetLidY = 0.72 + scrollProgressRef.current * 1.6;
        lidGroup.position.y += (targetLidY - lidGroup.position.y) * 0.1;
        lidGroup.rotation.z = Math.sin(elapsedTime * 2.0) * (scrollProgressRef.current * 0.05);
      }

      // Rising steam dynamics when lid is open
      if (steamParticles && scrollProgressRef.current > 0.1) {
        const positions = steamGeo.attributes.position.array as Float32Array;
        for (let p = 0; p < steamParticleCount; p++) {
          positions[p * 3 + 1] += steamVelocities[p].y;
          positions[p * 3] += steamVelocities[p].x;
          positions[p * 3 + 2] += steamVelocities[p].z;

          if (positions[p * 3 + 1] > 3.2) {
            positions[p * 3 + 1] = 0.8;
            positions[p * 3] = (Math.random() - 0.5) * 1.2;
            positions[p * 3 + 2] = (Math.random() - 0.5) * 1.2;
          }
        }
        steamGeo.attributes.position.needsUpdate = true;
        steamMat.opacity = Math.min(0.45, scrollProgressRef.current * 0.5);
      } else {
        steamMat.opacity = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Interactive Drag & Scroll Listeners
    const domElement = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !mesobRoot) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      mesobRoot.rotation.y += deltaX * 0.01;
      mesobRoot.rotation.x = Math.max(-0.4, Math.min(0.4, mesobRoot.rotation.x + deltaY * 0.005));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !mesobRoot || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

      mesobRoot.rotation.y += deltaX * 0.01;
      mesobRoot.rotation.x = Math.max(-0.4, Math.min(0.4, mesobRoot.rotation.x + deltaY * 0.005));

      previousMousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update lid state in 3D scene whenever isLidOpen changes
  useEffect(() => {
    scrollProgressRef.current = isLidOpen ? 0.85 : 0;
  }, [isLidOpen]);

  const toggleManualLid = () => {
    setIsLidOpen((prev) => !prev);
  };

  const resetView = () => {
    if (mesobRootRef.current) {
      mesobRootRef.current.rotation.set(0, 0, 0);
    }
    setPhotoRotation({ x: 0, y: 0 });
  };

  // Photo Mode 3D Tilt handlers
  const handlePhotoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    if (isDraggingPhoto.current) {
      const deltaX = e.clientX - photoDragStart.current.x;
      const deltaY = e.clientY - photoDragStart.current.y;
      setPhotoRotation((prev) => ({
        x: Math.max(-25, Math.min(25, prev.x - deltaY * 0.2)),
        y: Math.max(-35, Math.min(35, prev.y + deltaX * 0.2)),
      }));
      photoDragStart.current = { x: e.clientX, y: e.clientY };
    } else {
      // Gentle parallax hover
      setPhotoRotation({
        x: -y * 14,
        y: x * 18,
      });
    }
  };

  const handlePhotoMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingPhoto.current = true;
    photoDragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePhotoMouseUp = () => {
    isDraggingPhoto.current = false;
  };

  const handlePhotoMouseLeave = () => {
    isDraggingPhoto.current = false;
    setIsHovered(false);
    // Smoothly return toward center
    setPhotoRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      className="relative w-full h-[460px] md:h-[540px] lg:h-[620px] flex items-center justify-center select-none rounded-2xl overflow-hidden bg-[#159E37]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handlePhotoMouseLeave}
    >
      {/* Background Cultural Glow & Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.18)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* VIEW MODE 1: Real Ethiopian Mesob Image (Uploaded from Project Folder) */}
      {viewMode === 'photo' && (
        <div
          ref={photoContainerRef}
          onMouseMove={handlePhotoMouseMove}
          onMouseDown={handlePhotoMouseDown}
          onMouseUp={handlePhotoMouseUp}
          className="relative w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing p-4"
          style={{ perspective: 1200 }}
        >
          {/* 3D Depth Card for Real Mesob */}
          <div
            className="relative transition-transform duration-150 ease-out flex flex-col items-center justify-center max-w-full max-h-full"
            style={{
              transform: `rotateX(${photoRotation.x}deg) rotateY(${photoRotation.y}deg) scale(${isHovered ? 1.02 : 1})`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Real Ethiopian Mesob Photo */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#159E37] group">
              <img
                src={imgSrc}
                alt="Authentic Handcrafted Ethiopian Mesob - Guansa Ma'ed"
                className="w-full max-w-[420px] md:max-w-[480px] h-[340px] md:h-[420px] object-cover object-center rounded-2xl transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={() => {
                  // Fallback to alternate filenames in public or assets
                  if (imgSrc === '/Ethiopian _Mesob.png') {
                    setImgSrc('/Ethiopian_Mesob.png');
                  } else if (imgSrc === '/Ethiopian_Mesob.png') {
                    setImgSrc('/Ethiopian%20_Mesob.png');
                  } else {
                    setImgSrc('/src/assets/images/ethiopian_mesob_hero_1792129029834.jpg');
                  }
                }}
              />

              {/* Sizzling Feast Reveal Overlay when "Reveal Feast" is toggled */}
              {isLidOpen && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end p-5 animate-fade-in text-white backdrop-blur-[2px]">
                  <div className="space-y-1.5 transform transition-all duration-300 translate-y-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mesob Feast Unveiled · የጓንሳ ድግስ</span>
                    </div>
                    <h3 className="text-base md:text-lg font-serif font-bold text-amber-200">
                      Royal Doro Wat, Sizzling Tibs & Beyaynetu
                    </h3>
                    <p className="text-xs text-white/85 line-clamp-2">
                      Served atop warm 100% teff sourdough injera inside this ceremonial handcrafted Mesob table.
                    </p>
                  </div>
                </div>
              )}

              {/* Subtle Ethiopian Rim Shine Effect */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
            </div>

            {/* Simulated 3D Base Shadow */}
            <div 
              className="w-64 h-8 bg-black/60 rounded-full blur-xl -mt-2 pointer-events-none"
              style={{
                transform: `translateX(${photoRotation.y * 1.5}px) scale(${isHovered ? 1.1 : 0.95})`,
              }}
            />
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Three.js WebGL Interactive 3D Canvas */}
      <div 
        ref={mountRef} 
        className={`w-full h-full cursor-grab active:cursor-grabbing ${viewMode === 'webgl' ? 'block' : 'hidden'}`} 
      />

      {/* Top Left Cultural Badge */}
      <div className="absolute top-4 left-4 pointer-events-none z-20">
        <div className="flex items-center gap-1.5 bg-[#344BC2]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30 text-xs text-amber-300 font-semibold shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Handcrafted Mesob · 100% Traditional</span>
        </div>
      </div>

      {/* Top Right Watermark / Mode Badge */}
      <div className="absolute top-4 right-4 pointer-events-none z-20">
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-400/20 shadow-md">
          {viewMode === 'photo' ? 'Real Ethiopian Mesob · ጓንሳ ማዕድ' : '3D WebGL Canvas · 60 FPS'}
        </span>
      </div>

      {/* Bottom Floating Interaction HUD Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        <div className="flex items-center gap-2 bg-[#344BC2]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs text-white/90 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Interactive 3D Mesob (Scroll or Drag to inspect)</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Reveal / Cover Feast Button */}
          <button
            onClick={toggleManualLid}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Open or close ceremonial Mesob lid"
          >
            <span>{isLidOpen ? 'Cover Mesob' : 'Reveal Feast'}</span>
          </button>

          {/* Reset Angle Button */}
          <button
            onClick={resetView}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-sm active:scale-95 cursor-pointer flex items-center gap-1"
            title="Reset rotation angle"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* View Mode Toggle: Real Mesob Photo vs 3D Model */}
          <button
            onClick={() => setViewMode(prev => prev === 'photo' ? 'webgl' : 'photo')}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-400/40 transition-all backdrop-blur-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Toggle between Real Mesob photography and 3D WebGL Model"
          >
            {viewMode === 'photo' ? (
              <>
                <Box className="w-3 h-3 text-amber-400" />
                <span>3D Model</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 text-amber-400" />
                <span>Real Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero3DCanvas;
