import gsap from '../../node_modules/gsap/index.js'

function prefersReducedMotion () {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function visibleTextNodes (elements) {
  return elements.filter(element => element && !element.hidden && element.textContent.trim())
}

function stopTextEntrance (scope = document) {
  const animated = scope.querySelectorAll('[data-text-entrance]')
  gsap.killTweensOf(animated)
  animated.forEach(element => {
    gsap.set(element, { clearProps: 'all' })
    element.removeAttribute('data-text-entrance')
  })
}

function animateTextEntrance (elements, options = {}) {
  const nodes = visibleTextNodes(elements)
  if (!nodes.length) return null

  stopTextEntrance(document)
  nodes.forEach(node => node.setAttribute('data-text-entrance', 'true'))

  if (prefersReducedMotion()) {
    gsap.set(nodes, { clearProps: 'all' })
    return null
  }

  const timeline = gsap.timeline({
    defaults: {
      duration: 0.72,
      ease: 'power3.out'
    }
  })

  timeline.addLabel('enter')
    .fromTo(nodes, {
      autoAlpha: 0,
      y: options.offsetY ?? 20,
      filter: 'blur(10px)'
    }, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      stagger: options.stagger ?? 0.08
    }, 'enter')
    .add(() => {
      startTextLoop(nodes, options)
    })

  return timeline
}

function startTextLoop (nodes, options = {}) {
  gsap.killTweensOf(nodes)
  gsap.set(nodes, {
    autoAlpha: 1,
    y: 0,
    filter: 'blur(0px)'
  })

  return gsap.to(nodes, {
    y: (index) => index % 2 === 0 ? -4 : -2,
    filter: 'blur(0.25px)',
    duration: options.loopDuration ?? 3.6,
    ease: 'sine.inOut',
    stagger: {
      each: options.loopStagger ?? 0.18,
      from: 'start'
    },
    repeat: -1,
    yoyo: true,
    overwrite: 'auto'
  })
}

function animateTextLoopOnly (elements, options = {}) {
  const nodes = visibleTextNodes(elements)
  if (!nodes.length) return null

  stopTextEntrance(document)
  nodes.forEach(node => node.setAttribute('data-text-entrance', 'true'))

  if (prefersReducedMotion()) {
    gsap.set(nodes, { clearProps: 'all' })
    return null
  }

  return startTextLoop(nodes, options)
}

function scheduleTextLoop (elements, options = {}) {
  const start = () => animateTextLoopOnly(elements, options)
  if (typeof window === 'undefined') return start()

  return window.setTimeout(() => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(start)
      })
    } else {
      start()
    }
  }, options.delayMs ?? 120)
}

function scheduleTextEntrance (elements, options = {}) {
  const start = () => animateTextEntrance(elements, options)
  if (typeof window === 'undefined') return start()

  return window.setTimeout(() => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(start)
      })
    } else {
      start()
    }
  }, options.delayMs ?? 120)
}

export {
  animateTextEntrance,
  animateTextLoopOnly,
  scheduleTextEntrance,
  scheduleTextLoop,
  stopTextEntrance
}
