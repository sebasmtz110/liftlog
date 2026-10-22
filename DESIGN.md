---
name: LiftLog
description: A personal gym log on true black. The exercise photo is the cover. Lime is the only hue, and only on a number.
colors:
  ground: "#000000"
  surface: "#111111"
  raised: "#2a2a2a"
  border: "#1a1a1a"
  control: "#444444"
  text: "#ffffff"
  muted: "#b4b4b4"
  faint: "#949494"
  accent: "#c6f24e"
  positive: "#c6f24e"
  negative: "#e5484d"
  chart-2: "#e6e6e6"
  chart-3: "#6b6b6b"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  figure:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  card: "20px"
  control: "999px"
spacing:
  pad: "22px"
  gap: "14px"
components:
  button-primary:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "999px"
    height: "36px"
  button-line:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "999px"
    height: "36px"
---

## Direction

True-black flat, dealt for a phone log used between sets. Elevation is a lightness step (`#000` ground, `#111` card, `#2a2a2a` nested). No card borders, no shadows. The active nav item is its label going from `#bbb` to `#fff`. The one primary control is a white pill with black text.

Lime `#c6f24e` is the sport data hue. It marks this week's volume, a logged day, and the latest volume bar. It does not touch buttons, tabs, or nav.

The shared move from the reference screens is the photograph of the lift: a cover on Today and on the open set, and a thumbnail on every exercise row. The category grid, the blue program button, and the green/red session bar are not part of this system.

## Shell

Desktop: a 224px sidebar on the same black, split from the page by a 1px `#1a1a1a` rule, plus a 56px top bar with the section name and an account link. Phone: that top bar, and a bottom bar of Today, Split, Library, Progress, History. Coach, Profile, Settings, Help, and Health (one account) sit at the foot of the sidebar.

## Library

`app/exercises` and the session movement player keep the previous exercise designs, scoped under `.library-keep` in `app/library.css`. Inter is the type in both.

## Product

Pounds only. No invented calories. Health is limited to sebasmtz110@gmail.com. Photos stay in the browser. The coach answers from local rules.
