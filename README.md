<div align="center">
<a href="https://astral-dust.onrender.com"><img src="assets/banner.svg" alt="Astral Dust — bend 3,200 particles of stardust with your bare hands" width="100%" /></a>
<img src="https://readme-typing-svg.demolab.com?font=Space+Mono&size=17&duration=3000&pause=1100&color=FFC46B&center=true&vCenter=true&width=620&height=36&lines=Wave+your+hand.+Bend+the+cosmos.;Pinch+to+compress.+Release+to+go+supernova.;3%2C200+particles.+Zero+controllers.;Runs+entirely+in+your+browser." alt="Wave your hand. Bend the cosmos." />
<p>
<a href="https://astral-dust.onrender.com"><img src="https://img.shields.io/badge/Launch_Live_Demo-FFC46B?style=for-the-badge&logo=googlechrome&logoColor=0B0D12" alt="Launch live demo" /></a>&nbsp;
<a href="https://github.com/priyanshusharan-cmd/astral-dust/releases/latest"><img src="https://img.shields.io/badge/Download_App-0B0D12?style=for-the-badge&logo=github&logoColor=FFC46B" alt="Download the desktop app" /></a>
</p>
<p>
<a href="https://github.com/priyanshusharan-cmd/astral-dust/releases/latest"><img src="https://img.shields.io/github/v/release/priyanshusharan-cmd/astral-dust?style=flat-square&color=FFC46B&labelColor=0B0D12&label=release" alt="Latest release" /></a>
<a href="https://astral-dust.onrender.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Fastral-dust.onrender.com&style=flat-square&labelColor=0B0D12&up_color=FFC46B&up_message=online&label=live%20demo" alt="Live demo status" /></a>
<a href="LICENSE"><img src="https://img.shields.io/github/license/priyanshusharan-cmd/astral-dust?style=flat-square&color=67E8F9&labelColor=0B0D12" alt="MIT license" /></a>
<img src="https://img.shields.io/badge/Three.js-r170-FFC46B?style=flat-square&logo=threedotjs&logoColor=FFC46B&labelColor=0B0D12" alt="Three.js r170" />
<img src="https://img.shields.io/badge/MediaPipe-Hand_Landmarker-FFC46B?style=flat-square&logo=google&logoColor=FFC46B&labelColor=0B0D12" alt="MediaPipe Hand Landmarker" />
<img src="https://img.shields.io/badge/WebGL-Bloom-FFC46B?style=flat-square&logo=webgl&logoColor=FFC46B&labelColor=0B0D12" alt="WebGL bloom" />
<img src="https://img.shields.io/badge/Node.js-18+-67E8F9?style=flat-square&logo=nodedotjs&logoColor=67E8F9&labelColor=0B0D12" alt="Node.js 18+" />
</p>
<sub>
<a href="#-see-it-move">DEMO</a> &nbsp;✦&nbsp;
<a href="#-the-gestures">GESTURES</a> &nbsp;✦&nbsp;
<a href="#-features">FEATURES</a> &nbsp;✦&nbsp;
<a href="#-how-it-works">HOW IT WORKS</a> &nbsp;✦&nbsp;
<a href="#-download">DOWNLOAD</a> &nbsp;✦&nbsp;
<a href="#-run-it-locally">RUN LOCALLY</a>
</sub>
</div>

<br/>

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ See it move

<div align="center">
  <video src="https://github.com/user-attachments/assets/03a3d798-c767-41ad-aa35-2ba6caf824fa" width="800" autoplay loop muted playsinline></video>
</div>

<br/>

**Astral Dust** turns your webcam into a controller for a sphere made of 3,200 glowing particles. Google's **MediaPipe** tracks 21 landmarks on each hand in real time, a small hand-written physics engine turns those landmarks into forces, and **Three.js** renders the dust with additive blending and an Unreal bloom pass, layered straight over your camera feed.

You don't need a headset, a controller or an account. Open the page, raise a hand, and the dust follows you.

> [!TIP]
> Works best in Chrome or Edge on a laptop with a decent webcam. Keep your hand roughly 40–80 cm from the camera.

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ The gestures

<table>
  <tr>
    <td width="33%"><img src="assets/gesture-follow.svg" alt="Show one open palm: the sphere follows your hand" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-pinch.svg" alt="Pinch: the dust collapses into a ball of light" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-scatter.svg" alt="Release the pinch: a big-bang burst" width="100%" /></td>
  </tr>
  <tr>
    <td width="33%"><img src="assets/gesture-gather.svg" alt="Palm after scattering: dust swirls back to your hand" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-fist.svg" alt="Close your fist: the cloud snaps back into a sphere" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-two-hands.svg" alt="Two palms: hand distance sets the size" width="100%" /></td>
  </tr>
  <tr>
    <td width="33%"><img src="assets/gesture-split.svg" alt="Two palms after scattering: one cloud per hand" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-clap.svg" alt="Bring palms together: merge, then spread to grow" width="100%" /></td>
    <td width="33%"><img src="assets/gesture-camera.svg" alt="Press C: toggle the camera feed" width="100%" /></td>
  </tr>
</table>

<details>
<summary><b>Full gesture reference</b></summary>
<br/>

| Gesture | State | What happens |
| :-- | :--: | :-- |
| ✋ &nbsp;Show one open palm | `FOLLOW` | The sphere locks onto the centre of your palm and glides after it. |
| 🤏 &nbsp;Pinch thumb + index | `PINCH` | The sphere collapses into a tiny, dense ball of light. |
| 🖐 &nbsp;Release the pinch | `SCATTER` | A big-bang burst flings the dust across the screen, where it bounces off the edges. |
| ✋ &nbsp;Show a palm after scattering | `GATHER` | The loose dust drifts back into a swirling cloud around your hand. |
| ✊ &nbsp;Close your fist | `FOLLOW` | The cloud snaps back into a perfect Fibonacci sphere. |
| 🙌 &nbsp;Show two palms | `TWO_HAND` | The distance between your hands sets the size of the sphere. |
| 🙌 &nbsp;Two palms after scattering | `SPLIT` | The dust divides into two clouds, one per hand. Each hand can pinch on its own. |
| 👏 &nbsp;Bring both palms together | — | The halves merge into one compressed ball. Spread your hands to grow it again. |
| ⌨️ &nbsp;Press <kbd>C</kbd> | — | Turns the camera feed behind the particles on or off. |

</details>

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ Features

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>🖐 Real-time hand tracking</h3>
      MediaPipe's Hand Landmarker runs on the GPU in your browser, tracks up to two hands and smooths every landmark to remove jitter.
    </td>
    <td width="33%" valign="top">
      <h3>🌌 Fibonacci sphere</h3>
      3,200 particles are spread over a golden-angle spiral for a perfectly even sphere, with a second volumetric layout for the loose cloud form.
    </td>
    <td width="33%" valign="top">
      <h3>⚛️ Spring physics</h3>
      Every particle is pulled by a damped spring toward its target. Scatters add radial impulses, and particles bounce inside the screen bounds.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>🎨 Adaptive colour</h3>
      The webcam frame is sampled four times a second. The dust turns cyan in bright rooms, magenta under indoor light and gold in the dark.
    </td>
    <td width="33%" valign="top">
      <h3>✨ Cinematic glow</h3>
      Soft radial star sprites, additive blending and an Unreal bloom pass give every particle a halo without blowing out to white.
    </td>
    <td width="33%" valign="top">
      <h3>🔒 Private by design</h3>
      Video never leaves your device. All tracking happens locally in the browser, and the server only hands out static files.
    </td>
  </tr>
</table>

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ How it works

Every frame runs the same short loop: read the webcam, find the hands, decide the gesture, move the particles, render.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#11141B','primaryTextColor':'#FFE9C2','primaryBorderColor':'#FFC46B','lineColor':'#FFC46B','secondaryColor':'#0B0D12','tertiaryColor':'#0B0D12','fontFamily':'monospace'}}}%%
flowchart LR
    A["📷 Webcam"] --> B["🖐 MediaPipe<br/>21 landmarks"]
    B --> C["🧠 Gestures<br/>state machine"]
    C --> D["⚛️ Physics<br/>3,200 springs"]
    D --> E["✨ Three.js<br/>+ bloom"]
    A -. "colour sampling" .-> E
```

<details>
<summary><b>The gesture state machine</b></summary>
<br/>

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#11141B','primaryTextColor':'#FFE9C2','primaryBorderColor':'#FFC46B','lineColor':'#FFC46B','fontFamily':'monospace'}}}%%
stateDiagram-v2
    direction LR
    [*] --> IDLE
    IDLE --> FOLLOW: one palm
    IDLE --> TWO_HAND: two palms
    FOLLOW --> PINCH: pinch
    PINCH --> SCATTER: release
    SCATTER --> GATHER: one palm
    SCATTER --> SPLIT: two palms
    GATHER --> FOLLOW: fist
    SPLIT --> TWO_HAND: clap, then spread
    TWO_HAND --> FOLLOW: drop one hand
```

</details>

<details>
<summary><b>Project structure</b></summary>
<br/>

```text
astral-dust/
├── server.js                 Express static server (opens your browser automatically)
├── package.json              scripts + pkg targets for the desktop builds
└── public/
    ├── index.html            loading screen, HUD and import map
    ├── css/styles.css        frosted-glass HUD and full-screen layering
    └── js/
        ├── main.js           animation loop, adaptive colour, HUD updates
        ├── handTracking.js   webcam + MediaPipe Hand Landmarker
        ├── coordinateMapper.js  landmark → 3D world mapping
        ├── gestures.js       gesture detection and state machine
        ├── particles.js      Fibonacci sphere + cloud buffers
        ├── physics.js        springs, damping, scatter impulses
        └── scene.js          Three.js renderer + bloom post-processing
```

</details>

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ Download

The desktop builds bundle the server and the app into a single file. Run it and Astral Dust opens in your default browser at `http://localhost:3000`.

<div align="center">

| Platform | File | |
| :-- | :-- | :--: |
| 🍎 &nbsp;macOS · Apple Silicon | `astral-dust-macos-arm64` | [**Download**](https://github.com/priyanshusharan-cmd/astral-dust/releases/latest/download/astral-dust-macos-arm64) |
| 🍏 &nbsp;macOS · Intel | `astral-dust-macos-x64` | [**Download**](https://github.com/priyanshusharan-cmd/astral-dust/releases/latest/download/astral-dust-macos-x64) |
| 🪟 &nbsp;Windows · x64 | `astral-dust-win-x64.exe` | [**Download**](https://github.com/priyanshusharan-cmd/astral-dust/releases/latest/download/astral-dust-win-x64.exe) |
| 🐧 &nbsp;Linux · x64 | `astral-dust-linux-x64` | [**Download**](https://github.com/priyanshusharan-cmd/astral-dust/releases/latest/download/astral-dust-linux-x64) |

</div>

<details>
<summary><b>macOS or Linux says the file can't be opened?</b></summary>
<br/>

The builds aren't code-signed, so mark the file as executable and clear the quarantine flag once:

```bash
chmod +x astral-dust-macos-arm64
xattr -d com.apple.quarantine astral-dust-macos-arm64
./astral-dust-macos-arm64
```

On Windows, choose **More info → Run anyway** if SmartScreen shows a warning.

</details>

<img src="assets/divider.svg" width="100%" alt="" />

## ✦ Run it locally

You'll need [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/priyanshusharan-cmd/astral-dust.git
cd astral-dust
npm install
npm start
```

Your browser opens at [http://localhost:3000](http://localhost:3000). Allow camera access when asked, and raise a hand.

<details>
<summary><b>Build the desktop apps yourself</b></summary>
<br/>

```bash
npm run build
```

[`pkg`](https://github.com/vercel/pkg) writes binaries for macOS (arm64 + x64), Windows and Linux to `dist/`.

</details>

<details>
<summary><b>Deploy your own copy</b></summary>
<br/>

Astral Dust is a plain Express app, so any Node host works. On [Render](https://render.com), create a **Web Service** with:

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment:** `NODE_ENV=production` (stops the server from trying to open a browser)

The server reads `PORT` from the environment. Webcams need a secure context, so serve over HTTPS.

</details>

<details>
<summary><b>Troubleshooting</b></summary>
<br/>

- **Stuck on "Requesting camera access…"**: allow the camera for your browser in your system's privacy settings, then reload.
- **Hands aren't detected**: add some light in front of you and keep your whole hand in frame.
- **Low frame rate**: close other tabs that use the GPU, or try Chrome with hardware acceleration turned on.
- **Particles look washed out**: press <kbd>C</kbd> to hide the camera feed and watch the dust on pure black.

</details>

<br/>

<img src="assets/footer.svg" width="100%" alt="" />

<div align="center">

<br/>

Crafted by **[Priyanshu Sharan](https://github.com/priyanshusharan-cmd)** &nbsp;·&nbsp; Released under the [MIT License](LICENSE)

<sub>If Astral Dust made you smile, a ⭐ helps other people find it.</sub>

</div>
