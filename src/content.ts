import { getSetting } from "./storage"

const BOOSTED_ELEMENTS = new WeakSet<HTMLMediaElement>()
const BOOST_GAIN_NODE = "__LOUDR_GAIN_NODE__"

export const config = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_idle"
}

const audioCtx = new AudioContext()

let currentSettings: any = {}
let currentGain = 1

const applyBooster = async () => {
  currentSettings = await getSetting()
  currentGain = currentSettings.gain || 1

  window.addEventListener("DOMContentLoaded", boostAll, { once: true })

  const observer = new MutationObserver(boostAll)
  observer.observe(document.body, { childList: true, subtree: true })

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "UPDATE_GAIN") {
      currentGain = msg.gain
      updateGainOnAll(currentGain)
    }
  })
}

const boostElement = (el: HTMLMediaElement) => {
  try {
    const source = audioCtx.createMediaElementSource(el)
    const gainNode = audioCtx.createGain()
    gainNode.gain.value = currentGain

    source.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    ;(el as any)[BOOST_GAIN_NODE] = gainNode
    BOOSTED_ELEMENTS.add(el)

    // Resume if already playing 
    if (!audioCtx || audioCtx.state === "suspended") {
      if (!el.paused && !el.muted && el.readyState >= 2) {
        audioCtx.resume().catch(console.warn)
      }
    }

    // Fallback for when playback starts later
    el.addEventListener("play", () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(console.warn)
      }
    })
  } catch (err) {
    console.warn("LOUDR boost skipped:", err)
  }
}

const boostAll = () => {
  const mediaElements = document.querySelectorAll("video, audio")

  for (let i = 0; i < mediaElements.length; i++) {
    if (BOOSTED_ELEMENTS.has(mediaElements[i] as HTMLMediaElement)) {
      continue
    }
    const el = mediaElements[i] as HTMLMediaElement
    boostElement(el)
  }
}

const updateGainOnAll = (newGain: number) => {
  const mediaElements = document.querySelectorAll("video, audio")
  mediaElements.forEach((el) => {
    const gainNode = (el as any)[BOOST_GAIN_NODE]
    if (gainNode) {
      gainNode.gain.value = newGain
    }
  })
}

applyBooster()
