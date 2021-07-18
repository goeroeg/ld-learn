# LD Games

This is a collection of various LDraw™-Library and three.js based (mini-)games:

- [LD-Learn](#ld-learn) [-> Try](https://goeroeg.github.io/ld-learn/apps/learn/ld-learn.html)
- LD-Office [-> Try](https://goeroeg.github.io/ld-learn/apps/office/hoffice.html)
- LD-Flowers [-> Try](https://goeroeg.github.io/ld-learn/apps/flowers/ld-flowers.html)
- LD-Robot [-> Try](https://goeroeg.github.io/ld-learn/apps/robot/ld-robot.html)
- (LD-Nativity [-> Try](https://goeroeg.github.io/ld-nativity/nscene.html))
- Fireworks [-> Try](https://goeroeg.github.io/ld-learn/apps/fireworks/fireworks.html)

---
- Further infos:
  - [Starting for developers](#starting-for-developers)
  - [Licenses and attributions](#licenses-and-attributions)
  - [Privacy policy](#privacy-policy)

---

## LD-Learn

An Edu-shooter using three.js and the LDraw™-Library to exercise some maths.

![screenshot](/doc/img/screenshot.jpg)

---

### Try it online

[You can try the game online here.](https://goeroeg.github.io/ld-learn/apps/learn/ld-learn.html)

### How to play

Solve the exercise and collect the chrystals. After each collected chrystal a new object is added to the world or something else changes - find out what.

A short guide to the controls is displayed on the start screen.

You can change the difficulty level by disabling or enabling certain types of maths operations and selecting the min/max values of the operands and results.

You can also save and load profiles for different players.

---

### System requirements

The game should run on all modern PCs or laptops, however a dedicated graphics card is recommended.

Mobile devices are not fully supported yet, Android devices (with Chrome and Firefox tested) work with very low graphics settings (see below).

Online version tested with Chromium, Firefox and Edge, but you can try others with WebGL support too.

Gamepad support tested with Chrome(-ium), the current versions of Firefox seem a bit buggy there.

### Performance tuning

If you experience low framerates and/or lags you can try the following:

- Graphics settings:
  - select a lower resolution in the graphics settings (however only max. window size is rendered)
  - try the lower quality render mode (renders 1/2 resolution and scales up, ~15% perf.)
  - disable shadows

- Game settings
  - select a lower object density (reduces the number of polygons)
  - disable day/night cycle (at night the lights need more rendering power)

---

## Starting for developers

run ```npm install```
> this will also download the needed LDraw™ files, but this may take a rather long time
>
> I recommend unpacking the contents of the [complete LDraw™ library](http://www.ldraw.org/library/updates/complete.zip) into the ```ldraw``` folder first

then run ```npm run serve``` for a browser version - start a browser at ```http://localhost:8080/```, the apps are in the "apps/[appname]" folder

or run ```npm run start``` or ```electron .``` for a standalone application using electron.

Have fun :)

---

## Licenses and attributions

This project is completely non-commercial, free and just for fun.

The [LDraw™ library](https://www.ldraw.org/) under Creative Commons Attribution License 2.0 ([CC BY 2.0](https://creativecommons.org/licenses/by/2.0/))

LDraw™ is a trademark owned and licensed by the Estate of James Jessiman

[three.js](https://threejs.org/) as MIT license (no extra attribution needed, but I think they deserve it :) )

[dat.gui](https://github.com/dataarts/dat.gui) under Apache License 2.0

Sounds from [OrangeFreeSounds](http://www.orangefreesounds.com/) under Attribution-NonCommercial 4.0 International ([CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/))

LEGO® is a registered trademark of the [LEGO Group](https://www.lego.com/), which does not sponsor, endorse, or authorize this project.

## Privacy policy

The application stores no private data - the name is only used for display. All data stored is used only by the client (localStorage).

[See also the GitHub privacy policy for visitors here...](https://help.github.com/en/github/site-policy/github-privacy-statement#github-pages)
