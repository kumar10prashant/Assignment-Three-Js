import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { ExposureShader } from 'three/addons/shaders/ExposureShader.js';
import { HueSaturationShader } from 'three/addons/shaders/HueSaturationShader.js';
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



let canvas = document.getElementById("c");
let scene, cam, renderer, world;
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;
let texture, intersects;
let composer, object;
let IsUp = true;
let Obstacles = [];
let totaltime = 0;
let gui, obstcale_Detail;
const loader = document.querySelector(".loader");
const param = {
    postprocessing: true,
    DirLight_Intensity: 1,
    AmbientLight_Intensity: 0.3,
    Scaler: 1,

}

    
    param.Scaler = sessionStorage.getItem("Scaler");

//alert(navigator.userAgent.match(/Android/i))


gui = new GUI();

//Loading Screen
const Manager = new THREE.LoadingManager();
Manager.onLoad = function () {
    loader.style.display = 'none';
}

//Basic Shader
const _VS = `
varying vec3 v_Normal;
void main(){

gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
v_Normal = normal;
}
`;

const _FS = `

uniform vec3 sphereColour;
varying vec3 v_Normal;

void main(){
gl_FragColor = vec4(sphereColour,1.0);
}
`;




//Path Follow Points
const points = [
    new THREE.Vector3(20, 5, -10),
    new THREE.Vector3(-15, 20, 5),
    new THREE.Vector3(10, 15, 0),
    new THREE.Vector3(15, 25, 5),
    new THREE.Vector3(20, 8, 10),
]


const path = new THREE.CatmullRomCurve3(points, true);
const pathgeo = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
const pathmat = new THREE.LineBasicMaterial({ color: 0xff000 });
const pathobject = new THREE.Line(pathgeo, pathmat);
let stats;
stats = new Stats();
document.body.appendChild(stats.dom);

//Physics Bouncy Material
const bouncyMaterial = new CANNON.Material('bouncyMaterial');
const mixedMaterial = new CANNON.ContactMaterial(bouncyMaterial, bouncyMaterial, {
    friction: 0,
    restitution: 1
});

function init() {
    //Loader for load Texture,Hdr Skybox,Gltf Model(3D)
    texture = new THREE.TextureLoader(Manager);
    const gLTFLoader = new GLTFLoader(Manager);
    const rgbeloader = new RGBELoader(Manager);

    //Scene Setup(Scene Creation,SkyBox)
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

    //Rendering
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    canvas = renderer.domElement;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio/param.Scaler);
    renderer.shadowMap.enabled = true;
    renderer.toneMappingExposure = 1;

    //You can visualize path which is follow by animation
    //scene.add(pathobject);

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

    //3d Model
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

    //Physcis
    world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);

    //Ground
    const Ground = new THREE.PlaneGeometry(1000, 1000, 20, 20);
    const tex = texture.load("Material/GroundMat/Rock057_1K-JPG_Color.jpg");
    const normalMap = texture.load("Material/GroundMat/Rock057_1K-JPG_NormalGL.jpg");

    wrapping(tex, 5, 10);
    wrapping(normalMap, 5, 10);

    const GroundMat = new THREE.MeshStandardMaterial({
        map: tex,
        normalMap: normalMap,
        aoMap: texture.load("Material/GroundMat/Rock057_1K-JPG_AmbientOcclusion.jpg"),
        metalness: 0.8,
        //side: THREE.DoubleSide,

    })

    const GroundMesh = new THREE.Mesh(Ground, GroundMat);
    scene.add(GroundMesh);
    GroundMesh.rotation.x = -Math.PI / 2;
    GroundMesh.position.y = -2;
    GroundMesh.receiveShadow = true;
    GroundMesh.castShadow = false;
    GroundMesh.name = "Ground";
    GroundMesh.userData.Tag = "NoAnim";
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        mass: 0, // mass = 0 makes the body static
        shape: groundShape,
        material: bouncyMaterial
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
   world.addBody(groundBody);
    world.addContactMaterial(mixedMaterial);

    //#region PostProcessing  
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
    //#endregion

}




function Lights() {

    //Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, param.AmbientLight_Intensity);
    scene.add(ambientLight);

    //Direction Light
    const dirLight = new THREE.DirectionalLight(0xffffff, param.DirLight_Intensity);
    dirLight.name = 'Dir. Light';
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.left = - 15;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = - 15;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    //Lighting Gui
    const LightFolder = gui.addFolder("Lighting");
    const LightPos = LightFolder.addFolder("Position");

    LightPos.add(dirLight.position, 'x');
    LightPos.add(dirLight.position, 'y');
    LightPos.add(dirLight.position, 'z');

    const Light_Intensity = LightFolder.addFolder("Intensity");
    Light_Intensity.add(param, "DirLight_Intensity", 0, 3).onChange(function () {
        dirLight.intensity = param.DirLight_Intensity;
    });
    Light_Intensity.add(param, "AmbientLight_Intensity", 0, 3).onChange(function () {
        ambientLight.intensity = param.AmbientLight_Intensity;
    });

    const addition_Graphic = LightFolder.addFolder("Graphic");
    addition_Graphic.add(param, "postprocessing");
    addition_Graphic.add(param, "Scaler", 1, 3).onChange(function () {
        renderer.setPixelRatio(window.devicePixelRatio / param.Scaler)
        sessionStorage.setItem("Scaler",param.Scaler);
    });
}

init();

//Cube
const cube = new THREE.BoxGeometry(3, 3, 3);
const cubemat = new THREE.MeshStandardMaterial({
    map: texture.load("Material/Wood092_1K-JPG/Wood092_1K-JPG_Color.jpg"),
    normalMap: texture.load("Material/Wood092_1K-JPG/Wood092_1K-JPG_NormalGL.jpg"),
    roughnessMap: texture.load("Material/Wood092_1K-JPG/Wood092_1K-JPG_Roughness.jpg"),
    metalness: 0,
})
const CubeMesh = new THREE.Mesh(cube, cubemat);
scene.add(CubeMesh);
CubeMesh.name = "Cube";
CubeMesh.position.set(-10, -0.5, 0);

//Torus
const torus = new THREE.TorusGeometry(3, 1);
const torusmat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture.load("Material/Wood067_1K-JPG/Wood067_1K-JPG_Color.jpg"),
    normalMap: texture.load("Material/Wood067_1K-JPG/Wood067_1K-JPG_NormalGL.jpg"),
    roughnessMap: texture.load("Material/Wood067_1K-JPG/Wood067_1K-JPG_Roughness.jpg"),
    metalness: 0.2,
})
const torusmesh = new THREE.Mesh(torus, torusmat);
torusmesh.position.set(0, 2, 0);
scene.add(torusmesh);
torusmesh.name = "Torus";

//Sphere
const sphere = new THREE.SphereGeometry(3, 20);
const sphermet = new THREE.MeshStandardMaterial({
    map: texture.load("Material/Tiles135D_1K-JPG/Tiles135D_1K-JPG_Color.jpg"),
    normalMap: texture.load("Material/Tiles135D_1K-JPG/Tiles135D_1K-JPG_NormalGL.jpg"),
    aoMap: texture.load("Material/Tiles135D_1K-JPG/Tiles135D_1K-JPG_AmbientOcclusion.jpg"),
    roughnessMap: texture.load("Material/Tiles135D_1K-JPG/Tiles135D_1K-JPG_Roughness.jpg"),
    metalness: 0.2,
})
const spheremesh = new THREE.Mesh(sphere, sphermet);
spheremesh.position.set(10, 2, 0);
scene.add(spheremesh);
spheremesh.name = "Sphere";
const phySphere = new CANNON.Sphere(0.5);
const phySphereBody = new CANNON.Body({
    shape: phySphere,
    mass: 100,
    position: new CANNON.Vec3(10, 50, 0),
    material: bouncyMaterial
});
console.log(torusmat.color);

world.add(phySphereBody);


//Shader Sphere
const ShaderGeo = new THREE.SphereGeometry(3, 20);
const ShaderMet = new THREE.ShaderMaterial({
    uniforms: {
        sphereColour: {
            value: new THREE.Vector3(0, 0, 1),
        }
    },
    vertexShader: _VS,
    fragmentShader: _FS,
});
const ShaderMesh = new THREE.Mesh(ShaderGeo, ShaderMet);
ShaderMesh.name = "Shader";
ShaderMesh.position.set(-20, 5, 0);
scene.add(ShaderMesh);

//Addiing Additional Data to meshes
ObstaclesData(ShaderMesh);
ObstaclesData(spheremesh);
ObstaclesData(torusmesh);
ObstaclesData(CubeMesh);


//Raycast To check obstacle
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
    } catch {
        //console.log("Nothing Found");

    }
}

//Parameter for gui
const params = {
    UpDown: true,
    RotateCheck: true,
    PathFollow: true,
    color: 0xffffff,
};

//Called when you select new mesh
function GuiUpdate(model) {
    obstcale_Detail = gui.addFolder(model.name);

    const Position = obstcale_Detail.addFolder("Position");
    Position.add(model.position, 'x')
    Position.add(model.position, 'y')
    Position.add(model.position, 'z')

    const Rotation = obstcale_Detail.addFolder("Rotation");
    Rotation.add(model.rotation, 'x', 0, Math.PI * 2)
    Rotation.add(model.rotation, 'y', 0, Math.PI * 2)
    Rotation.add(model.rotation, 'z', 0, Math.PI * 2)

    const Scale = obstcale_Detail.addFolder("Scale");
    Scale.add(model.scale, 'x')
    Scale.add(model.scale, 'y')
    Scale.add(model.scale, 'z')
    params.color = (model.material.color);

    Scale.addColor(params, 'color').onChange(() => {
        model.material.color.set(params.color)
    });


    if (model.userData.Tag != "NoAnim") {
        params.UpDown = (model.userData.UpDown);
        params.RotateCheck = (model.userData.Rotaion);
        params.FollowPath = (model.userData.FollowPath);
        const Animation_Toggle = obstcale_Detail.addFolder("Animation_Toggle");
        Animation_Toggle.add(params, "UpDown").onChange(() => { model.userData.UpDown = params.UpDown })
        Animation_Toggle.add(params, "RotateCheck").onChange(() => { model.userData.Rotaion = params.RotateCheck });
        Animation_Toggle.add(params, "FollowPath").onChange(() => { model.userData.FollowPath = params.FollowPath });
    }
    obstcale_Detail.open()
}


Lights();
animate();

//Push All meshes in which you want to play anim
//Before pushing enter custom data on mesh by passing on ObstaclesData(Pass) in this function
Obstacles.push(spheremesh);
Obstacles.push(CubeMesh);
Obstacles.push(torusmesh);
Obstacles.push(ShaderMesh);

//Called in everyframe
function animate() {
    requestAnimationFrame(animate);

   

    world.step(1 / 60);
    spheremesh.position.copy(phySphereBody.position);
    spheremesh.quaternion.copy(phySphereBody.quaternion);
    if (param.postprocessing)
        composer.render();
    else
        renderer.render(scene, cam);

    for (let i = 0; i < Obstacles.length; i++) {
        UpDown(Obstacles[i]);
        rotateAnim(Obstacles[i]);
        PathFollows(Obstacles[i]);
    }
   
    stats.update();
}

//Responsive
window.addEventListener('resize', () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//Data of obstacles(Which Contain important data about object)
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

//Texture Wrapping(Tiling)
function wrapping(ground, tilingX, tilingY) {
    ground.wrapS = THREE.RepeatWrapping;
    ground.wrapT = THREE.RepeatWrapping;
    ground.repeat.set(tilingX, tilingY);
}


canvas.addEventListener('mousedown',rayCastCheck);


