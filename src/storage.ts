// storage.ts
import browser from "webextension-polyfill"

export const LOUDR_SETTING_KEY = "loudr.settings"

const getStorage = (): typeof chrome.storage =>
  typeof chrome !== "undefined" && chrome.storage
    ? chrome.storage
    : (browser as any).storage

export const getSetting = async (): Promise<any> => {
  return new Promise((resolve) => {
    getStorage().local.get([LOUDR_SETTING_KEY], (result: any) => {
      resolve(result?.[LOUDR_SETTING_KEY] || {})
    })
  })
}

export const setSetting = async (value: any): Promise<void> => {
  await getStorage().local.set({ [LOUDR_SETTING_KEY]: value })
}
