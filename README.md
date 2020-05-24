# LD-Learn

An Edu-shooter using three.js and the LDraw™-Library to exercise some maths.

![screenshot](/doc/img/screenshot.jpg)

---

## Try it online

[You can try the game online here.](https://goeroeg.github.io/ld-learn/ld-learn.html)

---

## System requirements

The game should run on all modern PCs or laptops, however a dedicated graphics card is recommended.

Mobile devices are not supported yet.

Online version tested with Chromium and Firefox, but you can try others with WebGL support too.

Gamepad support tested with Chrome(-ium).

---

## Starting for developers

run ```npm install```
> this will also download the needed LDraw™ files, but this may take a rather long time
>
> I recommend unpacking the contents of the [complete LDraw™ library](http://www.ldraw.org/library/updates/complete.zip) into the ```ldraw``` folder first

then run ```npm run serve``` for a browser version - start a browser at ```http://localhost:8080/ld-learn.html```

or run ```npm run start``` or ```electron .``` for a standalone application using electron.

Have fun :)

---

## Licenses and attributions

This project is completely non-commercial, free and just for fun.

The [LDraw™ library](https://www.ldraw.org/) under Creative Commons Attribution License 2.0 ([CC BY 2.0](https://creativecommons.org/licenses/by/2.0/))

LDraw™ is a trademark owned and licensed by the Estate of James Jessiman

[three.js](https://threejs.org/) as MIT license (no extra attribution needed, but I think they deserve it :) )

[dat.gui](https://github.com/dataarts/dat.gui) under Apache License 2.0 (js module used from the three.js lib)

Sounds from [OrangeFreeSounds](http://www.orangefreesounds.com/) under Attribution-NonCommercial 4.0 International ([CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/))

LEGO® is a registered trademark of the [LEGO Group](https://www.lego.com/), which does not sponsor, endorse, or authorize this project.

## Privacy policy

The application stores no private data - the name is only used for display. All data stored is used only by the client (localStorage).

[See also the GitHub privacy policy for visitors here...](https://help.github.com/en/github/site-policy/github-privacy-statement#github-pages)
