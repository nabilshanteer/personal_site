import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { pointer, power, damp } from '../lib/pointer'
import Callouts from './Callouts'
import PowerUp from './PowerUp'
import Datasheet from './Datasheet'

/* Which hover effect runs. All three are kept; this is the only line to
   change between them.
     'datasheet' — current round his silhouette, copper breaking out to
                   labelled pads. The combination of the two below.
     'powerup'   — the current and breakouts, no labels.
     'callouts'  — the labels in white ink, no current. */
const HOVER_EFFECT = 'datasheet'

/* The portrait.

   One quad, three textures. The depth map displaces the sampling
   position so the face shifts against the shoulders as the cursor
   moves — the parallax is per-pixel rather than a whole layer sliding,
   which is what stops it looking like a sticker waved about.

   No hover state: the photograph is simply the photograph. */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uFace;
  uniform sampler2D uDepth;
  uniform vec2  uMouse;
  uniform float uStrength;
  uniform float uMaxShift;
  uniform float uVibrance;
  varying vec2 vUv;

  void main() {
    // Depth-driven parallax. Sampled once to find the depth, then again
    // at the displaced position — two taps, which is all this needs.
    //
    // The shift is capped: pushed far enough, the sampling position runs
    // off the texture, and clamped edge pixels smear into the long
    // streaks that looked like the face was tearing itself apart.
    float d = texture2D(uDepth, vUv).r;
    vec2 want = uMouse * uStrength * (d - 0.25);
    float reach = length(want);
    vec2 shift = reach > uMaxShift ? want * (uMaxShift / reach) : want;
    vec2 uv = clamp(vUv + shift, vec2(0.004), vec2(0.996));

    vec4 colour = texture2D(uFace, uv);

    // The photograph is cropped at his chest, so the cut-out ends in a
    // straight line. Fade it out instead of letting it stop dead.
    colour.a *= smoothstep(0.0, 0.30, uv.y);

    // Saturation lift, applied in linear space where it belongs.
    float luma = dot(colour.rgb, vec3(0.2126, 0.7152, 0.0722));
    colour.rgb = mix(vec3(luma), colour.rgb, uVibrance);

    gl_FragColor = colour;

    // A raw ShaderMaterial gets none of three's automatic output
    // conversion. Without this the sRGB textures are decoded to linear on
    // sampling and never encoded back, which is why the photograph came
    // out looking like someone had pulled the exposure down.
    #include <colorspace_fragment>
  }
`

export default function Portrait() {
  const host = useRef(null)
  const [meta, setMeta] = useState(null)
  const [over, setOver] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element) return

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()

    const loader = new THREE.TextureLoader()
    const load = (url, srgb) =>
      new Promise((resolve) => {
        loader.load(url, (texture) => {
          if (srgb) texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          resolve(texture)
        })
      })

    const uniforms = {
      uFace: { value: null },
      uDepth: { value: null },
      uMouse: { value: new THREE.Vector2() },
      uStrength: { value: 0.03 },
      uMaxShift: { value: 0.012 },
      uVibrance: { value: 1.14 },
    }

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })
    )
    mesh.frustumCulled = false
    scene.add(mesh)

    let ready = false
    let face = { x: 0.3, y: 0.19, w: 0.39, h: 0.43 }

    Promise.all([
      load('/img/face.webp', true),
      load('/img/face_depth.webp', false),
      fetch('/img/face.json').then((r) => r.json()).catch(() => null),
    ]).then(([face, depth, meta]) => {
      uniforms.uFace.value = face
      uniforms.uDepth.value = depth
      if (meta?.face) face = meta.face
      if (meta?.size) {
        element.style.aspectRatio = `${meta.size[0]} / ${meta.size[1]}`
        setMeta(meta)
      }
      ready = true
      element.dataset.ready = 'true'
    })

    const state = { mx: 0, my: 0, over: false, settle: 4, asleep: false }

    const resize = () => {
      const { width, height } = element.getBoundingClientRect()
      // A hidden panel measures zero. Resizing the renderer to nothing
      // throws the picture away, and since this scene only draws while
      // `settle` is counting down, nothing would ever put it back.
      if (width < 1 || height < 1) return
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      // Any change of size needs a frame drawn at the new one. The
      // observer fires asynchronously, so it can easily land after the
      // frames requested on waking have already been spent.
      state.settle = 3
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)

    let last = performance.now()
    let frame

    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      /* Nothing underneath the about sequence needs drawing: it covers
         the screen completely, and leaving a WebGL portrait running under
         it was most of the cost of having it open.

         Waking up again has to be explicit. This scene only renders while
         `settle` is counting down, and `settle` is only topped up by the
         cursor moving — so after the overlay closed, the canvas sat
         blank (the panel is display:none while it is open, which can
         leave the drawing surface empty) until something happened to move
         the mouse. Asking for a few frames on the way back fixes it. */
      if (document.documentElement.getAttribute('data-overlay') === 'here') {
        state.asleep = true
        return
      }
      if (state.asleep) {
        state.asleep = false
        state.settle = 4
      }


      if (ready) {
        // Hovering him brings the callouts up. React only hears about it
        // when the answer actually changes, not every frame.
        const rect = element.getBoundingClientRect()
        const u = (pointer.x - rect.left) / rect.width
        const v = (pointer.y - rect.top) / rect.height

        // An ellipse over the middle of his face — eyes down to mouth.
        // Hair, shoulders and jacket do not arm it.
        const cx = face.x + face.w * 0.5
        const cy = face.y + face.h * 0.54
        const rx = face.w * 0.42
        const ry = face.h * 0.36
        const dx = (u - cx) / rx
        const dy = (v - cy) / ry
        const inside = pointer.active && dx * dx + dy * dy < 1
        if (inside !== state.over) {
          state.over = inside
          setOver(inside)
        }
        power.amount = damp(power.amount, inside ? 1 : 0, 3, dt)

        // Parallax follows the cursor across the whole panel, damped so
        // it drifts rather than snaps.
        const nx = damp(state.mx, pointer.nx, 3.5, dt)
        const ny = damp(state.my, pointer.ny, 3.5, dt)
        // Nothing in this scene animates on its own, so once the parallax
        // has caught up with the cursor there is nothing to redraw.
        const moved = Math.abs(nx - state.mx) + Math.abs(ny - state.my) > 0.00015
        state.mx = nx
        state.my = ny

        // A few frames are always drawn after the last movement — and at
        // the start, when the cursor has never moved at all and there is
        // still a first frame to put on screen.
        if (moved) state.settle = 3
        if (state.settle > 0) {
          state.settle -= 1
          uniforms.uMouse.value.set(state.mx, -state.my)
          renderer.render(scene, camera)
        }
      }
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      mesh.geometry.dispose()
      mesh.material.dispose()
      Object.values(uniforms).forEach((u) => u.value?.dispose?.())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="portrait" ref={host}>
      {HOVER_EFFECT === 'datasheet' && <Datasheet meta={meta} active={over} />}
      {HOVER_EFFECT === 'powerup' && <PowerUp meta={meta} active={over} />}
      {HOVER_EFFECT === 'callouts' && <Callouts meta={meta} active={over} />}
    </div>
  )
}
