import gsap from '../node_modules/gsap/index.js'

const imagePool = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=85'
]

const defaultScene = {
  image: imagePool[0],
  label: 'pause study / morning / clear',
  title: 'Leave A Little Sky',
  body: 'Stand up, soften your shoulders, and let your eyes rest on a farther point.',
  meta: 'Mouse interaction study'
}

const stage = document.querySelector('.wallpaper-stage')
const image = document.querySelector('.scene-image')
const grain = document.querySelector('.grain')
const lightSweep = document.querySelector('.light-sweep')
const focusRing = document.querySelector('.focus-ring')
const railLines = document.querySelector('.rail-lines')
const paperPanel = document.querySelector('.paper-panel')
const copy = document.querySelector('.poster-copy')
const label = document.querySelector('.poster-label')
const title = document.querySelector('.poster-title')
const body = document.querySelector('.poster-body')
const meta = document.querySelector('.poster-meta')
const loopButtons = [...document.querySelectorAll('.loop-button')]
const progress = document.querySelector('.progress-bar')
const time = document.querySelector('.progress-time')

let activeLoopIndex = 0
let activeLoopTimeline = null
let activeScrubState = { x: 0, y: 0, progress: 0 }
let progressTween = null

function prefersReducedMotion () {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function splitTitle (text) {
  title.textContent = ''
  text.split(' ').forEach((word, index, words) => {
    const span = document.createElement('span')
    span.textContent = index === words.length - 1 ? word : `${word} `
    title.appendChild(span)
  })
}

function updateCopy (scene) {
  label.textContent = scene.label
  splitTitle(scene.title)
  body.textContent = scene.body
  meta.textContent = scene.meta
  stage.style.setProperty('--scene-image', `url("${scene.image}")`)
}

function resetScene () {
  if (activeLoopTimeline) {
    gsap.killTweensOf(activeLoopTimeline)
    activeLoopTimeline.kill()
    activeLoopTimeline = null
  }
  gsap.killTweensOf(activeScrubState)
  activeScrubState = { x: 0, y: 0, progress: 0 }
  if (progressTween) progressTween.kill()
  gsap.killTweensOf('*')
  const textNodes = [image, copy, label, title, ...title.children, body, meta]
  gsap.set(textNodes, { clearProps: 'all' })
  gsap.set([lightSweep, focusRing, railLines, paperPanel], { autoAlpha: 0, clearProps: 'transform,filter,background,clipPath' })
  gsap.set(progress, { attr: { value: 62 } })
  time.textContent = '04:12'
}

function animateProgress () {
  const timer = { seconds: 252 }
  progressTween = gsap.timeline({ repeat: -1, repeatDelay: 0.4 })
    .to(progress, {
      attr: { value: 72 },
      duration: 4,
      ease: 'none'
    }, 0)
    .to(timer, {
      seconds: 228,
      duration: 4,
      ease: 'none',
      onUpdate: () => {
        const minutes = String(Math.floor(timer.seconds / 60)).padStart(2, '0')
        const seconds = String(Math.round(timer.seconds % 60)).padStart(2, '0')
        time.textContent = `${minutes}:${seconds}`
      }
    }, 0)
}

const loopEffects = [
  { id: 'pan' },
  { id: 'type' },
  { id: 'layout' },
  { id: 'burst' },
  { id: 'terrace' },
  { id: 'horizon' },
  { id: 'glitch' },
  { id: 'ripple' },
  { id: 'margin' },
  { id: 'lantern' }
]

function resetLoopElements () {
  if (activeLoopTimeline) {
    gsap.killTweensOf(activeLoopTimeline)
    activeLoopTimeline.kill()
    activeLoopTimeline = null
  }
  gsap.killTweensOf(activeScrubState)
  activeScrubState = { x: 0, y: 0, progress: 0 }
  gsap.killTweensOf([image, grain, copy, label, ...title.children, body, meta, lightSweep, focusRing, railLines, paperPanel])
  gsap.set([copy, label, ...title.children, body, meta, image, grain], { clearProps: 'transform,filter,opacity,clipPath' })
  gsap.set([lightSweep, focusRing, railLines, paperPanel], { autoAlpha: 0, clearProps: 'transform,filter,background,clipPath' })
}

function loopPan () {
  return gsap.timeline({ repeat: -1, yoyo: true })
    .to(image, {
      xPercent: -2.6,
      scale: 1.045,
      duration: 7.2,
      ease: 'sine.inOut',
      force3D: true
    }, 0)
    .to(copy, {
      x: 10,
      duration: 7.2,
      ease: 'sine.inOut'
    }, 0)
}

function loopDepth () {
  gsap.set(focusRing, { autoAlpha: 0.18, scale: 1 })
  return gsap.timeline({ repeat: -1, yoyo: true })
    .to(image, {
      scale: 1.07,
      filter: 'saturate(1.04) contrast(1.02) blur(0.4px)',
      duration: 6.4,
      ease: 'sine.inOut'
    }, 0)
    .to(focusRing, {
      autoAlpha: 0.38,
      scale: 0.92,
      duration: 6.4,
      ease: 'sine.inOut'
    }, 0)
    .to([label, ...title.children, body, meta], {
      scale: 1.012,
      transformOrigin: 'left center',
      duration: 6.4,
      ease: 'sine.inOut'
    }, 0)
}

function loopType () {
  const words = [...title.children]
  return gsap.timeline({ repeat: -1, repeatDelay: 0.45 })
    .to(words, {
      y: index => index % 2 === 0 ? -9 : 7,
      autoAlpha: 0.76,
      filter: 'blur(1.1px)',
      duration: 0.72,
      ease: 'power2.inOut',
      stagger: { each: 0.08, from: 'edges' }
    })
    .to(words, {
      y: 0,
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: 0.82,
      ease: 'power3.out',
      stagger: { each: 0.06, from: 'center' }
    })
    .to([label, body, meta], {
      x: index => index === 1 ? 10 : -6,
      duration: 1.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1
    }, 0.2)
}

function loopSpot () {
  gsap.set(lightSweep, {
    background: 'radial-gradient(circle at 50% 50%, rgba(255, 244, 203, 0.44), rgba(255, 244, 203, 0.12) 18%, transparent 46%)',
    autoAlpha: 0,
    scale: 0.72,
    xPercent: -24,
    yPercent: -18
  })
  return gsap.timeline({ repeat: -1, repeatDelay: 0.25 })
    .to(lightSweep, {
      autoAlpha: 0.72,
      scale: 1,
      xPercent: 10,
      yPercent: -5,
      duration: 2.2,
      ease: 'sine.inOut'
    })
    .to(lightSweep, {
      xPercent: 28,
      yPercent: 18,
      scale: 1.18,
      duration: 2.35,
      ease: 'sine.inOut'
    })
    .to(lightSweep, {
      autoAlpha: 0,
      scale: 0.88,
      duration: 1.1,
      ease: 'power1.out'
    })
}

function loopFilm () {
  gsap.set(grain, { opacity: 0.34 })
  return gsap.timeline({ repeat: -1, repeatDelay: 0.18 })
    .to([image, copy], {
      x: 1.4,
      y: -0.8,
      rotation: 0.08,
      duration: 0.08,
      ease: 'none'
    })
    .to([image, copy], {
      x: -1,
      y: 1,
      rotation: -0.06,
      duration: 0.08,
      ease: 'none'
    })
    .to([image, copy], {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 1.4,
      ease: 'power2.out'
    })
    .to(grain, {
      opacity: 0.62,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: 'none'
    }, 0)
}

function loopLayout () {
  gsap.set(paperPanel, { autoAlpha: 0.5, rotationY: 0, x: 0, y: 0 })
  gsap.set(railLines, { autoAlpha: 0.28, scaleX: 1 })
  return gsap.timeline({ repeat: -1, yoyo: true })
    .to(copy, {
      x: 28,
      y: -14,
      duration: 4.6,
      ease: 'power1.inOut'
    }, 0)
    .to(paperPanel, {
      x: -34,
      y: 18,
      rotationY: 5,
      duration: 4.6,
      ease: 'power1.inOut'
    }, 0)
    .to(railLines, {
      scaleX: 0.84,
      autoAlpha: 0.62,
      duration: 4.6,
      ease: 'sine.inOut'
    }, 0)
}

function loopOrbit () {
  gsap.set(focusRing, { autoAlpha: 0.2, scale: 0.92 })
  gsap.set(railLines, { autoAlpha: 0.32, scaleX: 0.9 })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power1.inOut' } })
    .to(image, {
      xPercent: -4.5,
      yPercent: 2.4,
      scale: 1.09,
      rotation: -1.2,
      duration: 5.8
    }, 0)
    .to(copy, {
      x: 34,
      y: -22,
      rotation: 1.4,
      duration: 5.8
    }, 0)
    .to(focusRing, {
      xPercent: 8,
      yPercent: -6,
      scale: 1.06,
      autoAlpha: 0.42,
      duration: 5.8
    }, 0)
    .to(railLines, {
      rotation: -1.6,
      scaleX: 1.08,
      autoAlpha: 0.66,
      duration: 5.8
    }, 0)
}

function loopShutter () {
  gsap.set(railLines, { autoAlpha: 0.72, scaleX: 1 })
  gsap.set(lightSweep, {
    autoAlpha: 0.44,
    background: 'repeating-linear-gradient(90deg, rgba(255,250,240,0.18) 0 7%, transparent 7% 14%)',
    xPercent: -12
  })
  return gsap.timeline({ repeat: -1, repeatDelay: 0.55 })
    .to(lightSweep, {
      xPercent: 14,
      duration: 0.44,
      ease: 'power4.inOut'
    })
    .to(image, {
      clipPath: 'inset(0% 16% 0% 11%)',
      scale: 1.07,
      duration: 0.34,
      ease: 'power4.inOut'
    }, 0)
    .to(copy, {
      x: 18,
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.34,
      ease: 'power4.inOut'
    }, 0)
    .to([image, copy], {
      clipPath: 'inset(0% 0% 0% 0%)',
      x: 0,
      scale: 1,
      duration: 0.62,
      ease: 'power3.out'
    })
    .to(lightSweep, {
      autoAlpha: 0,
      duration: 0.28,
      ease: 'power1.out'
    }, '<')
}

function loopBurst () {
  const words = [...title.children]
  return gsap.timeline({ repeat: -1, repeatDelay: 0.9 })
    .to(words, {
      x: 'random(-34, 34, 2)',
      y: 'random(-26, 24, 2)',
      rotation: 'random(-7, 7, 0.5)',
      scale: index => index % 2 === 0 ? 1.14 : 0.92,
      duration: 0.46,
      ease: 'back.out(1.8)',
      stagger: { each: 0.045, from: 'random' }
    })
    .to([label, body, meta], {
      x: 'random(-18, 18, 2)',
      autoAlpha: 0.72,
      duration: 0.4,
      ease: 'power2.out'
    }, 0.08)
    .to([words, label, body, meta], {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      duration: 0.78,
      ease: 'elastic.out(1, 0.45)'
    })
}

function loopTilt () {
  gsap.set(paperPanel, { autoAlpha: 0.76, rotationY: -8, x: 0, y: 0 })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 3.4, ease: 'power2.inOut' } })
    .to(copy, {
      rotationY: -12,
      rotationX: 4,
      x: 44,
      y: -10,
      transformPerspective: 900,
      transformOrigin: 'left center'
    }, 0)
    .to(paperPanel, {
      rotationY: 14,
      rotationX: -4,
      x: -42,
      y: 24,
      transformPerspective: 900
    }, 0)
    .to(image, {
      scale: 1.055,
      xPercent: -2.2,
      filter: 'saturate(1.05) contrast(1.04)'
    }, 0)
}

function loopGlitch () {
  gsap.set(railLines, { autoAlpha: 0.45, scaleX: 1 })
  return gsap.timeline({ repeat: -1, repeatDelay: 0.75 })
    .to([image, copy], {
      x: 'random(-8, 8, 1)',
      y: 'random(-4, 4, 1)',
      filter: 'hue-rotate(14deg) contrast(1.18) saturate(1.18)',
      duration: 0.06,
      ease: 'none',
      repeat: 5,
      yoyo: true
    })
    .to(title.children, {
      x: index => index % 2 === 0 ? 8 : -8,
      autoAlpha: 0.82,
      duration: 0.07,
      ease: 'none',
      repeat: 3,
      yoyo: true,
      stagger: 0.015
    }, 0)
    .to([image, copy, ...title.children], {
      x: 0,
      y: 0,
      autoAlpha: 1,
      filter: 'none',
      duration: 0.42,
      ease: 'power2.out'
    })
}

function loopTunnel () {
  gsap.set(focusRing, { autoAlpha: 0.5, scale: 1.15 })
  gsap.set(lightSweep, {
    autoAlpha: 0.28,
    background: 'radial-gradient(circle at 50% 50%, transparent 0 24%, rgba(255,250,240,0.22) 25%, transparent 46%)'
  })
  return gsap.timeline({ repeat: -1, repeatDelay: 0.35 })
    .to(image, {
      scale: 1.16,
      rotation: 0.8,
      duration: 1.65,
      ease: 'expo.inOut'
    }, 0)
    .to(copy, {
      scale: 0.9,
      y: 28,
      filter: 'blur(1.1px)',
      duration: 1.65,
      ease: 'expo.inOut'
    }, 0)
    .to([focusRing, lightSweep], {
      scale: 0.72,
      autoAlpha: 0.72,
      duration: 1.65,
      ease: 'expo.inOut'
    }, 0)
    .to([image, copy, focusRing, lightSweep], {
      scale: 1,
      rotation: 0,
      y: 0,
      filter: 'blur(0px)',
      autoAlpha: index => index < 2 ? 1 : 0,
      duration: 1.2,
      ease: 'power3.out'
    })
}

function loopHorizon () {
  gsap.set(railLines, { autoAlpha: 0.22, scaleX: 0.96 })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
    .to(image, {
      yPercent: -1.8,
      scale: 1.042,
      duration: 6.8
    }, 0)
    .to(copy, {
      y: -12,
      duration: 6.8
    }, 0)
    .to(railLines, {
      yPercent: -3,
      scaleX: 1.05,
      autoAlpha: 0.44,
      duration: 6.8
    }, 0)
}

function loopTerrace () {
  gsap.set(paperPanel, { autoAlpha: 0.34, x: 18, y: 0, rotationY: -4 })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power1.inOut' } })
    .to(paperPanel, {
      x: -24,
      y: 12,
      rotationY: 4,
      autoAlpha: 0.52,
      duration: 5.4
    }, 0)
    .to([label, body, meta], {
      x: index => index % 2 === 0 ? 14 : -10,
      duration: 5.4
    }, 0)
    .to(title.children, {
      y: index => index % 2 === 0 ? -5 : 4,
      duration: 5.4,
      stagger: 0.04
    }, 0)
}

function loopRipple () {
  gsap.set(focusRing, {
    autoAlpha: 0.12,
    scale: 1.04
  })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
    .to(focusRing, {
      autoAlpha: 0.28,
      scale: 0.94,
      duration: 4.8
    }, 0)
    .to(image, {
      scale: 1.035,
      duration: 4.8
    }, 0)
    .to(copy, {
      scale: 1.012,
      transformOrigin: 'left center',
      duration: 4.8
    }, 0)
}

function loopMargin () {
  gsap.set(railLines, { autoAlpha: 0.24, scaleX: 0.82 })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power1.inOut' } })
    .to(copy, {
      x: 18,
      y: -8,
      duration: 5.8
    }, 0)
    .to(image, {
      xPercent: -1.4,
      scale: 1.032,
      duration: 5.8
    }, 0)
    .to(railLines, {
      scaleX: 1.08,
      autoAlpha: 0.48,
      duration: 5.8
    }, 0)
}

function loopLantern () {
  gsap.set(lightSweep, {
    background: 'radial-gradient(circle at 45% 50%, rgba(255, 239, 190, 0.24), rgba(255, 239, 190, 0.08) 24%, transparent 52%)',
    autoAlpha: 0.22,
    scale: 0.95,
    xPercent: -10,
    yPercent: -4
  })
  return gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
    .to(lightSweep, {
      xPercent: 18,
      yPercent: 8,
      scale: 1.08,
      autoAlpha: 0.34,
      duration: 6.2
    }, 0)
    .to(title.children, {
      y: index => index % 2 === 0 ? -4 : -2,
      duration: 6.2,
      stagger: 0.03
    }, 0)
    .to([body, meta], {
      y: 5,
      duration: 6.2
    }, 0)
}

const timelineByLoop = {
  pan: loopPan,
  depth: loopDepth,
  type: loopType,
  spot: loopSpot,
  film: loopFilm,
  layout: loopLayout,
  orbit: loopOrbit,
  shutter: loopShutter,
  burst: loopBurst,
  tilt: loopTilt,
  glitch: loopGlitch,
  tunnel: loopTunnel,
  horizon: loopHorizon,
  terrace: loopTerrace,
  ripple: loopRipple,
  margin: loopMargin,
  lantern: loopLantern
}

function pointerState (event) {
  const rect = stage.getBoundingClientRect()
  const width = rect.width || window.innerWidth || 1
  const height = rect.height || window.innerHeight || 1
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / height))

  return {
    x: (x - 0.5) * 2,
    y: (y - 0.5) * 2,
    progress: Math.min(1, Math.max(0, (x * 0.72) + (y * 0.28)))
  }
}

function animateTargets (targets, vars) {
  gsap.set(targets, vars)
}

function titleWords () {
  return [...title.children]
}

const interactionByLoop = {
  pan: ({ x, y, progress }) => {
    animateTargets(image, {
      xPercent: x * -2.8,
      yPercent: y * -1.3,
      scale: 1.02 + (progress * 0.03),
      filter: `saturate(${0.96 + (progress * 0.08)}) contrast(${0.98 + (progress * 0.04)})`,
      force3D: true
    })
    animateTargets(copy, {
      x: x * 18,
      y: y * 9
    })
  },
  type: ({ x, y, progress }) => {
    animateTargets(titleWords(), {
      y: index => (index % 2 === 0 ? -10 : 8) * progress + (y * 4),
      autoAlpha: 0.78 + ((1 - progress) * 0.22),
      filter: `blur(${progress * 1.2}px)`,
      stagger: { each: 0.025, from: x > 0 ? 'end' : 'start' }
    }, 0.24)
    animateTargets([label, body, meta], {
      x: index => (index === 1 ? x * 14 : x * -8)
    }, 0.28)
  },
  layout: ({ x, y, progress }) => {
    gsap.set([paperPanel, railLines], { autoAlpha: 1 })
    animateTargets(copy, {
      x: 18 + (x * 24),
      y: -10 + (y * 16)
    })
    animateTargets(paperPanel, {
      x: -24 + (x * -26),
      y: 12 + (y * 18),
      rotationY: x * 8,
      autoAlpha: 0.38 + (progress * 0.22)
    })
    animateTargets(railLines, {
      scaleX: 0.86 + (progress * 0.24),
      autoAlpha: 0.22 + (progress * 0.42)
    })
  },
  burst: ({ x, y, progress }) => {
    const words = titleWords()
    const center = (words.length - 1) / 2
    animateTargets(words, {
      x: index => ((index - center) * 11 * progress) + (x * 18),
      y: index => (index % 2 === 0 ? -20 : 16) * progress + (y * 14),
      rotation: index => ((index - center) * 2.6 * progress) + (x * 3),
      scale: index => 1 + ((index % 2 === 0 ? 0.12 : -0.06) * progress),
      stagger: { each: 0.018, from: 'center' }
    }, 0.24)
    animateTargets([label, body, meta], {
      x: x * 18,
      autoAlpha: 0.72 + ((1 - progress) * 0.28)
    }, 0.26)
  },
  terrace: ({ x, y, progress }) => {
    gsap.set(paperPanel, { autoAlpha: 1 })
    animateTargets(paperPanel, {
      x: 10 + (x * -34),
      y: y * 18,
      rotationY: -4 + (x * 9),
      autoAlpha: 0.32 + (progress * 0.26)
    })
    animateTargets([label, body, meta], {
      x: index => (index % 2 === 0 ? 12 : -9) * progress + (x * 10)
    }, 0.32)
    animateTargets(titleWords(), {
      y: index => (index % 2 === 0 ? -6 : 5) * progress + (y * 4),
      stagger: 0.02
    }, 0.32)
  },
  horizon: ({ y, progress }) => {
    gsap.set(railLines, { autoAlpha: 1 })
    animateTargets(image, {
      yPercent: -2.4 + (y * -1.4),
      scale: 1.02 + (progress * 0.026)
    })
    animateTargets(copy, {
      y: -12 + (y * 12)
    })
    animateTargets(railLines, {
      yPercent: -4 + (y * 3),
      scaleX: 0.96 + (progress * 0.12),
      autoAlpha: 0.18 + (progress * 0.28)
    })
  },
  glitch: ({ x, y, progress }) => {
    gsap.set(railLines, { autoAlpha: 0.34 + (progress * 0.18) })
    animateTargets([image, copy], {
      x: Math.round(x * 8),
      y: Math.round(y * 4),
      filter: `hue-rotate(${Math.round(x * 14)}deg) contrast(${1 + (progress * 0.18)}) saturate(${1 + (progress * 0.18)})`
    }, 0.08)
    animateTargets(titleWords(), {
      x: index => (index % 2 === 0 ? 7 : -7) * progress,
      autoAlpha: 0.82 + ((1 - progress) * 0.18)
    }, 0.08)
  },
  ripple: ({ progress }) => {
    gsap.set(focusRing, { autoAlpha: 1 })
    animateTargets(focusRing, {
      autoAlpha: 0.12 + (progress * 0.22),
      scale: 1.06 - (progress * 0.16)
    })
    animateTargets(image, {
      scale: 1.02 + (progress * 0.026)
    })
    animateTargets(copy, {
      scale: 1 + (progress * 0.016),
      transformOrigin: 'left center'
    })
  },
  margin: ({ x, y, progress }) => {
    gsap.set(railLines, { autoAlpha: 1 })
    animateTargets(copy, {
      x: 14 + (x * 18),
      y: -8 + (y * 10)
    })
    animateTargets(image, {
      xPercent: -1.2 + (x * -1.4),
      scale: 1.02 + (progress * 0.02)
    })
    animateTargets(railLines, {
      scaleX: 0.82 + (progress * 0.3),
      autoAlpha: 0.2 + (progress * 0.32)
    })
  },
  lantern: ({ x, y, progress }) => {
    gsap.set(lightSweep, {
      background: 'radial-gradient(circle at 45% 50%, rgba(255, 239, 190, 0.24), rgba(255, 239, 190, 0.08) 24%, transparent 52%)',
      autoAlpha: 1
    })
    animateTargets(lightSweep, {
      xPercent: x * 24,
      yPercent: y * 18,
      scale: 0.96 + (progress * 0.16),
      autoAlpha: 0.18 + (progress * 0.2)
    })
    animateTargets(titleWords(), {
      y: index => (index % 2 === 0 ? -5 : -2) * progress
    }, 0.32)
    animateTargets([body, meta], {
      y: progress * 5
    }, 0.32)
  }
}

function scrubActiveLoop (state) {
  if (prefersReducedMotion()) return

  gsap.killTweensOf(activeScrubState)
  activeScrubState = {
    x: state.x ?? activeScrubState.x,
    y: state.y ?? activeScrubState.y,
    progress: state.progress ?? activeScrubState.progress
  }

  const loop = loopEffects[activeLoopIndex]
  interactionByLoop[loop.id](activeScrubState)
}

function buildInteractiveTimeline (loop) {
  const timelineFactory = timelineByLoop[loop.id]
  if (!timelineFactory || prefersReducedMotion()) return null

  const timeline = timelineFactory()
  timeline.repeat(0)
  timeline.yoyo(false)
  timeline.pause(0)

  return timeline
}

function playLoop (index) {
  activeLoopIndex = (index + loopEffects.length) % loopEffects.length
  resetLoopElements()
  const loop = loopEffects[activeLoopIndex]
  loopButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.loop === loop.id)
  })

  activeLoopTimeline = buildInteractiveTimeline(loop)
  scrubActiveLoop({ x: 0, y: 0, progress: 0 })
}

function startPreview () {
  resetScene()
  updateCopy(defaultScene)
  gsap.set([image, copy, label, ...title.children, body, meta], { clearProps: 'all', autoAlpha: 1 })
  animateProgress()
  playLoop(0)
}

loopButtons.forEach((button, index) => {
  button.addEventListener('click', () => playLoop(index))
})

stage.addEventListener('pointermove', event => {
  scrubActiveLoop(pointerState(event))
})

stage.addEventListener('pointerleave', () => {
  scrubActiveLoop({ x: 0, y: 0, progress: 0 })
})

window.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') playLoop(activeLoopIndex - 1)
  if (event.key === 'ArrowRight') playLoop(activeLoopIndex + 1)
  if (event.key === ' ') {
    event.preventDefault()
    const progress = activeScrubState.progress > 0.5 ? 0 : 1
    scrubActiveLoop({
      x: progress ? 0.72 : 0,
      y: progress ? 0.24 : 0,
      progress
    })
  }
})

startPreview()
