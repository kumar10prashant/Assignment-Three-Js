
# Three Js Assignment

Three js and cannon js interactive scene setup



## Screenshots

![App Screenshot](https://i.ibb.co/F8PkHBJ/Screenshot-21-7-2024-231517-kumar10prashant-github-io.jpg)

🔗 Links
[![Live Project](https://img.shields.io/badge/LIve-Project-000?style=for-the-badge&logo=ko-go&logoColor=white)](https://kumar10prashant.github.io/Assignment-Three-Js/)
[![Github Page](https://img.shields.io/badge/Github-Page-000?style=for-the-badge&logo=ko-go&logoColor=white)](https://github.com/kumar10prashant/Assignment-Three-Js.git)




## Installation

After download github project you need to install some library


 ##  Import from a CDN
Install Node.js. We'll need it to load manage dependencies and to run our build tool.


```bash
# three.js
 <script type="importmap">
        {
          "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@v0.166.1/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@v0.166.1/examples/jsm/"

          }
        }
      </script>
```


```bash
# cannon.js
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
```

cannon js is Lightweight 3D physics for the web Inspired by three.js and ammo.js, and driven by the fact that the web lacks a physics engine, here comes cannon.js. The rigid body physics engine includes simple collision detection, various body shapes, contacts, friction and constraints.

##  Getting started
All the necessary library 
```bash
import * as THREE from 'three';//Three js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';//Camera Control
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';//User Interface
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';//Hdr or skybox;
//postprocessing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { ExposureShader } from 'three/addons/shaders/ExposureShader.js';
import { HueSaturationShader } from 'three/addons/shaders/HueSaturationShader.js';
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js';
//Fps or OtherStats
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';//3D model
```




### Graphics and Lighting
```bash
postprocessing: true,
DirLight_Intensity: 0.5,
AmbientLight_Intensity: 0.3,
Scaler: 1,
```
In GUI you can find all these variable by using this you can on off postprocessing.<br>
Scaler for downgrade and upgrade number of pixel which will improve performance/<br>
Light intensity controller for visuals.



#### Loading Screen
LoadingManager recieve output from TextureLoader.LoadingManager indicates that website is loading and not stuck until texture and meshes download.
```bash
const Manager = new THREE.LoadingManager();
Manager.onLoad = function(){
loader.style.display = 'none';
}
```

#### Texture Loader
Import all the require texture loader for texture,3D model,hdr or skybox
```bash
texture = new THREE.TextureLoader(Manager);//Texture
const gLTFLoader = new GLTFLoader(Manager);//For 3D mdoel
const rgbeloader = new RGBELoader(Manager);//For hdr
```

#### Scene with skybox Setup
```bash
scene = new THREE.Scene();
const hdrurl = new URL('autumn_field_puresky_1k.hdr', import.meta.url);
rgbeloader.load(hdrurl, (texture) => {
texture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = texture;
scene.environment = texture;
scene.backgroundIntensity = 0.4;
scene.environmentIntensity = 0.5;
scene.environmentRotation = new THREE.Euler(0, 0, 0);
    });
```

### Render 
```bash
renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
canvas = renderer.domElement;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio / param.Scaler);
renderer.shadowMap.enabled = true;
renderer.toneMappingExposure = 1;
```
### Camera and Camera Controls
Fov stands for field of view,the range of the observable world visible at any given time through the human eye, a camera viewfinder or on a display screen<br>
aspect represent display size<br>near show minimum value of camera in which camera can see a object and far represent maximum value in which camera can see a object.
```bash
//Camera
cam = new THREE.PerspectiveCamera(fov, aspect, near, far);
cam.position.set(10, 15, 20);
cam.lookAt(scene.position);

//Camera Controls
const controls = new OrbitControls(cam, renderer.domElement);
controls.target.set(0, 0, - 0.2);
controls.update();
controls.minDistance = 10;
controls.maxDistance = 200;
controls.maxPolarAngle = Math.PI / 2;
```
### Basic 3D model Import example
```bash
gLTFLoader.load('tanr_makina_factory_building/scene.gltf', function (gltf) {
const model = gltf.scene;
model.scale.set(10, 10, 10);
model.position.set(-50, -5, 10);
model.traverse(function (node) {
if (node.isMesh) {
node.castShadow = true;
node.receiveShadow = true;
}
})
scene.add(model);
})
```
### Basic Plane with Ground texture
Here i use MeshStandardMaterial because they interact with light.The map contain the color data of object in UV space,Normal Map contain the fake surface normal information,Metalness refer the smoothness whose value goes 0 to 1,where 0 represent completelly smooth surface and 1 represent completely rough surface.
```bash
const GroundMat = new THREE.MeshStandardMaterial({
map: tex,
normalMap: normalMap,
aoMap: texture.load("Material/GroundMat/Rock057_1K-JPG_AmbientOcclusion.jpg"),
metalness: 0.8,
side: THREE.DoubleSide,
})

    const GroundMesh = new THREE.Mesh(Ground, GroundMat);
    scene.add(GroundMesh);
    GroundMesh.rotation.x = -Math.PI / 2;
    GroundMesh.position.y = -2;
    GroundMesh.receiveShadow = true;
    GroundMesh.castShadow = false;
    GroundMesh.name = "Ground";
```
### User Interactions using raycast


We can check object by drawing a raycast from camera.forward position and if something hit with raycast we get the object and using that object and object we can check where user click.
```bash
canvas.addEventListener('mousedown',rayCastCheck);

function rayCastCheck(event) {
const raycast = new THREE.Raycaster();
const pointer = new THREE.Vector2();
pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
raycast.setFromCamera(pointer, cam);
intersects = raycast.intersectObjects(scene.children);
try {
if (intersects.length > 0) {
if (obstcale_Detail) {
obstcale_Detail.destroy();

}
if (intersects[0].object.parent == scene) {
GuiUpdate(intersects[0].object);
}
else {
GuiUpdate(intersects[0].object.parent);
}
}
}catch {
        //console.log("Nothing Found");
}
}
```
### Animation
In raycast section we see how we can check object using raycast and after getting the object we pass that object as obj and add some userData or private data of object by using that data we can play and pause animation<br>So i make different function for each animation

```bash
function ObstaclesData(obj) {
    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.userData.UpDown = false;
    obj.userData.Rotaion = false;
    obj.userData.FollowPath = false;
}

//Rotate Obstacle
function rotateAnim(model) {
    if (model.userData.Rotaion) {
        model.rotation.x += 0.01;
        model.rotation.y += 0.01;
    }
}


function UpDown(model) {
    if (model.userData.UpDown) {

        if (model.position.y <= -0.5) {

            IsUp = true;
        }
        else if (model.position.y >= 10) {
            IsUp = false;
        }

        if (IsUp) {
            model.position.y += 0.03;
        } else {
            model.position.y -= 0.01;

        }

    }
}

("Path Followed By Obstacle")
function PathFollows(model) {
    if (model.userData.FollowPath) {
        const time = Date.now();
        const t = (time / 1000 % 6) / 6;
        const position = path.getPointAt(t);
        model.position.copy(position);
    }
}
```

### Example of postprocessing and Shader
```bash
    // Setup EffectComposer
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, cam);
    composer.addPass(renderPass);

    // Add color grading pass
    const gammaCorrectionShader = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionShader);

    //Exposure Shader
    const exposureShader = new ShaderPass(ExposureShader);
    exposureShader.uniforms['exposure'].value = 1.5;
    composer.addPass(exposureShader);


    //Vignetter Shader
    const vignetteShader = new ShaderPass(VignetteShader);
    vignetteShader.uniforms['darkness'].value = 1.2;
    vignetteShader.uniforms['offset'].value = 1;
    composer.addPass(vignetteShader);


    //HueSaturation
    const HueSaturation = new ShaderPass(HueSaturationShader);
    HueSaturation.uniforms['hue'].value = 0;
    HueSaturation.uniforms['saturation'].value = 0.4;
    composer.addPass(HueSaturation);

    //Brigthness
    const brightnessContrastShader = new ShaderPass(BrightnessContrastShader);
    brightnessContrastShader.uniforms['brightness'].value = -0.1;
    brightnessContrastShader.uniforms['contrast'].value = 0.1;
    composer.addPass(brightnessContrastShader);

    //Color Correction
    const colorCorrectionShader = new ShaderPass(ColorCorrectionShader);
    colorCorrectionShader.uniforms['powRGB'].value = new THREE.Vector3(1, 1, 1);
    colorCorrectionShader.uniforms['mulRGB'].value = new THREE.Vector3(1, 1, 1.5);

    composer.addPass(colorCorrectionShader);

```
### Responsive Design
For Responsive Design we use a event in which we check if user resize the window we shall update aspect ratio,renderer size and update camera.
```bash
window.addEventListener('resize', () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```
### GUI
First we need create a instance of gui and then just use gui.addFolder() for making new folder in which we can add data
```bash
gui = new GUI();
obstcale_Detail = gui.addFolder(model.name);
const Position = obstcale_Detail.addFolder("Position");
Position.add(model.position, 'x')
Position.add(model.position, 'y')
Position.add(model.position, 'z')

```
### Physics using Cannon.js example
```bash
world = new CANNON.World();
world.gravity.set(0, -9.81, 0);
const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
     mass: 0, // mass = 0 makes the body static
     shape: groundShape,
     material: bouncyMaterial
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2;
world.addBody(groundBody);

```

For More Info you can read docs
[![THREE](https://img.shields.io/badge/THREE.JS-0A66C2?style=for-the-badge&logo=check&logoColor=white)](https://threejs.org/docs/#manual/en/introduction/Installation)
[![THREE](https://img.shields.io/badge/Cannon.js-0A66C?style=for-the-badge&logo=check&logoColor=white)](https://sbcode.net/threejs/physics-cannonjs/)





