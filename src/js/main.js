import * as THREE from 'three';
import * as CANNON from 'cannon-es'

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const spiderURL = new URL('../../resources/spider.fbx', import.meta.url);
const catURL = new URL('../../resources/cat.fbx', import.meta.url);

import SurfaceTexture from '../../resources/checkerboard.png';
import crossHair from '../../resources/crosshair.png'

import negx from '../../resources/skybox/negx.jpg';
import negy from '../../resources/skybox/negy.jpg';
import negz from '../../resources/skybox/negz.jpg';
import posx from '../../resources/skybox/posx.jpg';
import posy from '../../resources/skybox/posy.jpg';
import posz from '../../resources/skybox/posz.jpg';

import concreteAlbedo from '../../resources/freepbr/concrete3-albedo.png';
import concreteNormal from '../../resources/freepbr/concrete3-normal.png';
import concreteMetallic from '../../resources/freepbr/concrete3-metallic.png';
import concreteRoughness from '../../resources/freepbr/concrete3-roughness.png';

import vintageAlbedo from '../../resources/freepbr/vintage-tile1_albedo.png';
import vintageAO from '../../resources/freepbr/vintage-tile1_ao.png';
import vintageHeight from '../../resources/freepbr/vintage-tile1_height.png';
import vintageMetallic from '../../resources/freepbr/vintage-tile1_metallic.png';
import vintageNormal from '../../resources/freepbr/vintage-tile1_normal.png';
import vintageRoughness from '../../resources/freepbr/vintage-tile1_roughness.png';

/* Declare global vars */
let raycaster;
let camera, uiCamera, scene, uiScene, renderer, controls;
let plane, box, wall1, wall2, wall3, wall4;
let planeSize, cubeSize;
let HWallHeight, HWallWidth, HWallDepth;
let VWallHeight, VWallWidth, VWallDepth;
let planeSkeleton, boxSkeleton, wall1Skeleton, wall2Skeleton, wall3Skeleton, wall4Skeleton;
let planeGeometry, boxGeometry, wall1Geometry, wall2Geometry, wall3Geometry, wall4Geometry;
let spiderModel, catModel;
let spiderSkeleton, catSkeleton;
let spiderGeometry, catGeometry;
let spiderMaterial, catMaterial;
let spiderWireFrame, catWireFrame;
let spiderHeight, spiderWidth, spiderDepth;
let catHeight, catWidth, catDepth;
let playerModel, playerSkeleton;
let playerHeight, playerWidth, playerDepth;

playerHeight = 10;
playerWidth = 5;
playerDepth = 5;

const objects = [];

/* Assign values to vars */
let DEBUG_MODE = false;

let verticalJumpVelocityOffset = 250;

planeSize = 1000;
cubeSize = 20;

HWallWidth = 1000;
HWallHeight = 60;
HWallDepth = 4;
VWallWidth = 4;
VWallHeight = 60;
VWallDepth = 1000;

spiderWidth = 7;
spiderHeight = 2;
spiderDepth = 5;
catWidth = 3;
catHeight = 4;
catDepth = 10;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

/* Instantiate simulated physics world */
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0)
});

/* update time */
const timeStep = 1 / 60;

init();
animate();

/* Attach visual meshes to their physical counterparts */
function fuseMeshWithGeometry(){
  plane.position.copy(planeGeometry.position);
  plane.quaternion.copy(planeGeometry.quaternion);

  box.position.copy(boxGeometry.position);
  box.quaternion.copy(boxGeometry.quaternion);
  boxSkeleton.position.copy(boxGeometry.position);
  boxSkeleton.quaternion.copy(boxGeometry.quaternion);

  wall1.position.copy(wall1Geometry.position);
  wall1.quaternion.copy(wall1Geometry.quaternion);

  wall2.position.copy(wall2Geometry.position);
  wall2.quaternion.copy(wall2Geometry.quaternion);

  wall3.position.copy(wall3Geometry.position);
  wall3.quaternion.copy(wall3Geometry.quaternion);

  wall4.position.copy(wall4Geometry.position);
  wall4.quaternion.copy(wall4Geometry.quaternion);

  spiderModel.position.copy(spiderSkeleton.position);
  spiderModel.position.y-= spiderHeight / 2;
  spiderModel.quaternion.copy(spiderSkeleton.quaternion);

  catModel.position.copy(catSkeleton.position);
  catModel.position.y-= catHeight / 2;
  catModel.quaternion.copy(catSkeleton.quaternion);

  spiderWireFrame.position.copy(spiderSkeleton.position);
  spiderWireFrame.quaternion.copy(spiderSkeleton.quaternion);

  catWireFrame.position.copy(catSkeleton.position);
  catWireFrame.quaternion.copy(catSkeleton.quaternion);

  playerModel.position.copy(playerSkeleton.position);
  playerModel.quaternion.copy(playerSkeleton.quaternion);

  playerSkeleton.position.copy(controls.getObject().position);
  playerSkeleton.position.y = controls.getObject().position.y-10;
  //playerSkeleton.quaternion.copy(controls.getObject().quaternion);
  

}

/* Load maps and return material */
function loadMaterial(name, tiling) {
  const mapLoader = new THREE.TextureLoader();
  let metalMap, albedo, normalMap, roughnessMap;
  if(name == 'concrete3-'){
    metalMap = mapLoader.load(concreteMetallic);
    metalMap.wrapS = THREE.RepeatWrapping;
    metalMap.wrapT = THREE.RepeatWrapping;
    metalMap.repeat.set(tiling, tiling);

    albedo = mapLoader.load(concreteAlbedo);
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.set(tiling, tiling);
    albedo.encoding = THREE.sRGBEncoding;

    normalMap = mapLoader.load(concreteNormal);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(tiling, tiling);

    roughnessMap = mapLoader.load(concreteRoughness);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(tiling, tiling);
  }
  else if(name == 'vintage-tile1_'){

    metalMap = mapLoader.load(vintageMetallic);
    metalMap.wrapS = THREE.RepeatWrapping;
    metalMap.wrapT = THREE.RepeatWrapping;
    metalMap.repeat.set(tiling, tiling);

    albedo = mapLoader.load(vintageAlbedo);
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.set(tiling, tiling);
    albedo.encoding = THREE.sRGBEncoding;

    normalMap = mapLoader.load(vintageNormal);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(tiling, tiling);

    roughnessMap = mapLoader.load(vintageRoughness);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(tiling, tiling);
  }

  const material = new THREE.MeshStandardMaterial({
  metalnessMap: metalMap,
  map: albedo,
  normalMap: normalMap,
  roughnessMap: roughnessMap,
  //wireframe: true,
  });

  return material;
}

function initCamera(){
  const fov = 60;
  const aspect = 1920 / 1080;
  const near = 1.0;
  const far = 2500.0;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-25, 2, 25);

  /* seperate camera instance to render HUD elements */
  uiCamera = new THREE.OrthographicCamera(
    -1, 1, 1 * aspect, -1 * aspect, 1, 1000);
}

function initScene(){
  scene = new THREE.Scene();
  uiScene = new THREE.Scene();
  const cubeMapLoader = new THREE.CubeTextureLoader();
  /* Load skybox textures */
  const texture = cubeMapLoader.load([
    posx,
    negx,
    posy,
    negy,
    posz,
    negz,
  ]);
  scene.background = texture;
  /* texture loader obj */ 
  const mapLoader = new THREE.TextureLoader();
  /* load surface texture (Checkerboard pattern) */
  const surface = mapLoader.load(SurfaceTexture);
  surface.wrapS = THREE.RepeatWrapping;
  surface.wrapT = THREE.RepeatWrapping;
  surface.repeat.set(32, 32);

  /* Instantiate a 2D plane mesh */
  plane = new THREE.Mesh(
  new THREE.PlaneGeometry(planeSize, planeSize, 100, 100 ),
  new THREE.MeshStandardMaterial({map: surface}));
  plane.castShadow = false;
  plane.receiveShadow = true;
  scene.add(plane);

  /* Instantiate solid 2D plane geometry */
  planeGeometry = new CANNON.Body({
    //shape: new CANNON.Plane(),
    shape: new CANNON.Plane(),
    //mass: 10,
    type: CANNON.Body.STATIC,
  });
  world.addBody(planeGeometry);
  /* Align to X axis */
  planeGeometry.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

  /* Instantiate box */
  box = new THREE.Mesh(
  new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
  loadMaterial('vintage-tile1_', 0.2));
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  //box.material.wireframe = true;

  boxGeometry = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)),
    mass: 10,
    position: new CANNON.Vec3(0, 100, 0),
    //type: CANNON.Body.STATIC,
  });
  world.addBody(boxGeometry);

  playerModel = new THREE.Mesh(
    new THREE.BoxGeometry(playerWidth, playerHeight, playerDepth),
    new THREE.MeshBasicMaterial({color: 0xFCBA03,})
  );
  playerModel.castShadow = true;
  playerModel.receiveShadow = true;
  scene.add(playerModel);

  playerSkeleton = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(playerWidth / 2, playerHeight / 2, playerDepth / 2)),
    //mass: 100,
    type: CANNON.STATIC,
  });
  world.addBody(playerSkeleton);

  const concreteMaterial = loadMaterial('concrete3-', 4);

  /* Instantiate world borders (walls) */
  wall1 = new THREE.Mesh(
  new THREE.BoxGeometry(HWallWidth, HWallHeight, HWallDepth),
  concreteMaterial);
  wall1.position.set(0, 0, -500);
  wall1.castShadow = true;
  wall1.receiveShadow = true;
  scene.add(wall1);

  wall1Geometry = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(HWallWidth / 2, HWallHeight / 2, HWallDepth / 2)),
    position: new CANNON.Vec3(0, 0, -500),
    type: CANNON.Body.STATIC,
  });
  world.addBody(wall1Geometry);

  wall2 = new THREE.Mesh(
  new THREE.BoxGeometry(HWallWidth, HWallHeight, HWallDepth),
  concreteMaterial);
  wall2.position.set(0, 0, 500);
  wall2.castShadow = true;
  wall2.receiveShadow = true;
  scene.add(wall2);

  wall2Geometry = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(HWallWidth / 2, HWallHeight / 2, HWallDepth / 2)),
    position: new CANNON.Vec3(0, 0, 500),
    type: CANNON.Body.STATIC,
  });
  world.addBody(wall2Geometry);

  wall3 = new THREE.Mesh(
  new THREE.BoxGeometry(VWallWidth, VWallHeight, VWallDepth),
  concreteMaterial);
  wall3.position.set(500, 0, 0);
  wall3.castShadow = true;
  wall3.receiveShadow = true;
  scene.add(wall3);

  wall3Geometry = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(VWallWidth / 2, VWallHeight / 2, VWallDepth / 2)),
    position: new CANNON.Vec3(500, 0, 0),
    type: CANNON.Body.STATIC,
  });
  world.addBody(wall3Geometry);

  wall4 = new THREE.Mesh(
  new THREE.BoxGeometry(VWallWidth, VWallHeight, VWallDepth),
  concreteMaterial);
  wall4.position.set(-500, 0, 0);
  wall4.castShadow = true;
  wall4.receiveShadow = true;
  scene.add(wall4);

  wall4Geometry = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(VWallWidth / 2, VWallHeight / 2, VWallDepth / 2)),
    position: new CANNON.Vec3(-500, 0, 0),
    type: CANNON.Body.STATIC,
  });
  world.addBody(wall4Geometry);

  // Create Box3 for each mesh in the scene so that we can
  // do some easy intersection tests.
  const meshes = [
  plane, box, wall1, wall2, wall3, wall4];

  // BIG BOX IN THE MIDDLE COLLIDER IDK
  const boxG = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
  boxSkeleton = new THREE.Mesh(boxG)
  objects.push(boxSkeleton);

  const assetLoaderFBX = new FBXLoader();

  assetLoaderFBX.load(spiderURL.href, function(fbx){
    spiderModel = fbx;
    scene.add(spiderModel);
    //spiderModel.position.set(-55, 0, -55);
    //console.log("loaded!!!");
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  }, function(error){
    console.error(error);
  });

  assetLoaderFBX.load(catURL.href, function(fbx){
    catModel = fbx;
    scene.add(catModel);
    //catModel.position.set(-40, 0, -55);
    //console.log("loaded!!!");
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  }, function(error){
    console.error(error);
  });

  /* construct basic wireframes to use when debugging */
  spiderGeometry = new THREE.BoxGeometry(spiderWidth, spiderHeight, spiderDepth);
  catGeometry = new THREE.BoxGeometry(catWidth, catHeight, catDepth);

  spiderMaterial = new THREE.MeshBasicMaterial({
    color: 0x00FFFF, //cyan
    wireframe: true,
  });
  catMaterial = new THREE.MeshBasicMaterial({
    color: 0x32CD32, //lime green
    wireframe: true,
  });

  spiderWireFrame = new THREE.Mesh(spiderGeometry, spiderMaterial);
  catWireFrame = new THREE.Mesh(catGeometry, catMaterial);

  scene.add(spiderWireFrame, catWireFrame);

  /* physical spider model */
  spiderSkeleton = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(spiderWidth / 2, spiderHeight / 2, spiderDepth / 2)),
    position: new CANNON.Vec3(-55, 100, -40),
    mass: 10,
  });
  world.addBody(spiderSkeleton);

  /* physical cat model */ 
  catSkeleton = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(catWidth / 2, catHeight / 2, catDepth / 2)),
    position: new CANNON.Vec3(-55, 10, -45),
    mass: 10,
  });
  world.addBody(catSkeleton);

  // Crosshair
  const crosshair = mapLoader.load(crossHair);

  this.sprite = new THREE.Sprite(
  new THREE.SpriteMaterial({map: crosshair, color: 0xffffff, fog: false, depthTest: false, depthWrite: false}));
  this.sprite.scale.set(0.15, 0.15 * camera.aspect, 1)
  this.sprite.position.set(0, 0, -10);

  uiScene.add(this.sprite	);
}

function initLight(){
  const distance = 2000.0;
  const angle = Math.PI / 2.0;
  const penumbra = 0.5;
  const decay = 1.0;

  let light = new THREE.SpotLight(
    0xFFFFFF, 300.0, distance, angle, penumbra, decay);
  light.castShadow = true;
  light.shadow.bias = -0.00001;
  light.shadow.mapSize.width = 4096;
  light.shadow.mapSize.height = 4096;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 2000;

  light.position.set(25, 100, 0);
  light.lookAt(0, 0, 0);
  scene.add(light);

  const upColour = 0xFFFF80;
  const downColour = 0x808080;
  light = new THREE.HemisphereLight(upColour, downColour, 0.7);
  light.color.setHSL( 0.6, 1, 0.6 );
  light.groundColor.setHSL( 0.095, 1, 0.75 );
  light.position.set(0, 40, 0);
  scene.add(light);
}

function pollInput(){
  const onKeyDown = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'Space':
        if ( canJump === true ) velocity.y += verticalJumpVelocityOffset;
        canJump = false;
        break;
        
      case 'KeyH':
        DEBUG_MODE = !DEBUG_MODE;
        console.log("Toggling Debug Mode \n");
        break;
    }

  };

  const onKeyUp = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );
}

/* resize window */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function debugMode(){
  //console.log(DEBUG_MODE);
  if(!DEBUG_MODE){
    scene.remove(catWireFrame, spiderWireFrame);
  }
  else{
    scene.add(catWireFrame, spiderWireFrame);
  }

}

function init() {
  initCamera();
  initScene();
  initLight();
  pollInput();

  controls = new PointerLockControls( camera, document.body );
  /* Focus and Unfocus game window */ 
  {
    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    /* start/focus game */
    instructions.addEventListener( 'click', function () {
      controls.lock();
    } );

    /* unpause/focus game */
    controls.addEventListener( 'lock', function () {
      instructions.style.display = 'none';
      blocker.style.display = 'none';
    } );

    /* pause/unfocus game */
    controls.addEventListener( 'unlock', function () {
      blocker.style.display = 'block';
      instructions.style.display = '';
    } );

    scene.add( controls.getObject() );
  }

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

  /* set additional renderer properties */
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  /* attach window resizer function to event listener */
  window.addEventListener( 'resize', onWindowResize );

}

function animate() {

  requestAnimationFrame( animate );

  const time = performance.now();

  if ( controls.isLocked === true ) {

    world.step(timeStep);
    fuseMeshWithGeometry();
    debugMode();

    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects( objects, false );

    let onObject;
    if(intersections.length > 0){
      onObject = true;

    }

    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 2.0 * delta;
    velocity.z -= velocity.z * 2.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

    if ( onObject === true ) {
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;

    }

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

    /* Bound camera to map edges */
    if(controls.getObject().position.x >= 495){
      controls.getObject().position.x = 495;
    }

    if(controls.getObject().position.x <= -495){
      controls.getObject().position.x = -495;
    }

    
    if(controls.getObject().position.z >= 495){
      controls.getObject().position.z = 495;
    }

    if(controls.getObject().position.z <= -495){
      controls.getObject().position.z = -495;
    }

    controls.getObject().position.y += ( velocity.y * delta ); // new behavior
    //console.log(controls.getObject().position);

    if ( controls.getObject().position.y < 10 ) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

  }

  prevTime = time;

  renderer.autoClear = true;
  renderer.render( scene, camera );
  renderer.autoClear = false;
  renderer.render( uiScene, uiCamera );

}