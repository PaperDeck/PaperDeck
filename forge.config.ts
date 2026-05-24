import path from "path"
import { fileURLToPath } from "url"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import { FuseV1Options, FuseVersion } from "@electron/fuses"
import type { ForgeConfig } from "@electron-forge/shared-types"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: ForgeConfig = {
  packagerConfig: {
    name: "PaperDeck",
    appBundleId: "com.paperdeck.app",
    asar: {
      unpack: "**/drizzle/**",
    },
    icon: path.join(__dirname, "assets/icon"),
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        authors: "PaperDeck",
        icon: path.join(__dirname, "assets/icon.ico"),
        setupIcon: path.join(__dirname, "assets/icon.ico"),
        description: "A simple reader app.",
        iconUrl: "https://paperdeck.co/favicon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      config: {
        authors: "PaperDeck",
        icon: path.join(__dirname, "assets/icon.ico"),
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "paperdeck",
          name: "paperdeck",
        },
        prerelease: false,
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
