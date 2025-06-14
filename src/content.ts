import { getSetting } from "./storage"

const BOOST_FLAG = "__LOUDR_BOOSTED__"
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

  boostAll()

  const observer = new MutationObserver(boostAll)
  observer.observe(document.body, { childList: true, subtree: true })

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "UPDATE_GAIN") {
      currentGain = msg.gain
      updateGainOnAll(currentGain)
    }

    if (msg.type === "AUTO_OPTIMIZE") {
      currentSettings.auto_optimize = msg.value
      resetAllAudio()
    }
  })
}

const boostElement = (el: HTMLMediaElement) => {
  const alreadyBoosted = (el as any)[BOOST_FLAG]

  // Cleanup any previous nodes if reboosting
  if (alreadyBoosted) {
    const nodes = (el as any)[BOOST_FLAG]
    nodes.forEach((node: AudioNode) => node.disconnect())
  }

  const source = audioCtx.createMediaElementSource(el)
  const gainNode = audioCtx.createGain()
  gainNode.gain.value = currentGain

  const nodes: AudioNode[] = [source, gainNode]

  if (currentSettings?.auto_optimize) {
    const compressor = audioCtx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-10, audioCtx.currentTime)
    compressor.knee.setValueAtTime(20, audioCtx.currentTime)
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime)
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime)
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime)

    gainNode.connect(compressor)
    compressor.connect(audioCtx.destination)

    nodes.push(compressor)
  } else {
    gainNode.connect(audioCtx.destination)
  }

  source.connect(gainNode)

  el.addEventListener("play", () => {
    audioCtx.resume()
  })

  // Save all nodes so we can disconnect later
  ;(el as any)[BOOST_GAIN_NODE] = gainNode
  ;(el as any)[BOOST_FLAG] = nodes
}

const boostAll = () => {
  const mediaElements = document.querySelectorAll("video, audio")
  mediaElements.forEach((el) => boostElement(el as HTMLMediaElement))
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

const resetAllAudio = () => {
  const mediaElements = document.querySelectorAll("video, audio")
  mediaElements.forEach((el) => {
    const nodes = (el as any)[BOOST_FLAG]
    if (Array.isArray(nodes)) {
      nodes.forEach((node: AudioNode) => node.disconnect())
    }
    delete (el as any)[BOOST_FLAG]
    delete (el as any)[BOOST_GAIN_NODE]
  })

  boostAll()
}

applyBooster()
