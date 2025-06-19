import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import { version } from "./meta"
import { getSetting, setSetting as setStorageSetting } from "./storage"

import "./global.css"

function Popup() {
  const [gain, setGainState] = useState(1)
  const [settings, setSettings] = useState({})

  useEffect(() => {
    getSetting().then((stored) => {
      setGainState(stored.gain || 1)
      setSettings(stored)
    })
  }, [])

  const updateGain = (val: number) => {
    const roundedVal = Number(val.toFixed(1))
    setGainState(roundedVal)
    setStorageSetting({ ...settings, gain: roundedVal })
    setSettings({ ...settings, gain: roundedVal })
    sendMessage({ type: "UPDATE_GAIN", gain: roundedVal })
  }

  const toggleSetting = (setting: string, value: boolean) => {
    setSettings({ ...settings, [setting.toLowerCase()]: value })
    setStorageSetting({
      ...settings,
      [setting.toLowerCase()]: value
    })
    sendMessage({ type: setting.toUpperCase(), value: value })
  }

  const sendMessage = (message: any) => {
    const browserAPI = chrome || browser
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      browserAPI.tabs.sendMessage(tabs[0]?.id!, message)
    })
  }

  return (
    <div className="w-72 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-2xl rounded-xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LOUDR
          </h1>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-green-400"></span>
            </span>
            <span className="text-xs text-gray-300">Active</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 flex-1">
          {/* Volume Control */}
          <div className="bg-gray-800/50 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                Volume Boost
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {gain.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={gain}
              onChange={(e) => updateGain(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gradient"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1x</span>
              <span>3x</span>
              <span>5x</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Made with ❤️ by{" "}
              <a
                href="https://github.com/prassamin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline">
                PRAS
              </a>
            </div>
            <div className="text-xs text-gray-500">v{version}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Popup
