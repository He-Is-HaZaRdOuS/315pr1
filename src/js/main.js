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

const health_html = document.getElementById( 'health' );
const score_html = document.getElementById( 'score' );

/* Declare global vars */
let raycaster;
let camera, uiCamera, scene, uiScene, renderer, controls;
let plane, box, wall1, wall2, wall3, wall4;
let planeSize, cubeSize;
let HWallHeight, HWallWidth, HWallDepth;
let VWallHeight, VWallWidth, VWallDepth;
let planeSkeleton, boxSkeleton, wall1Skeleton, wall2Skeleton, wall3Skeleton, wall4Skeleton;
let planeGeometry, boxGeometry, wall1Geometry, wall2Geometry, wall3Geometry, wall4Geometry;
let spiderGeometry, catGeometry;
let spiderMaterial, catMaterial;
let spiderWireFrame, catWireFrame;
let spiderHeight, spiderWidth, spiderDepth;
let catHeight, catWidth, catDepth;
let playerModel, playerSkeleton;
let playerHeight, playerWidth, playerDepth;

let numberOfAnimals = 20;

let EXIT = false;

let mapEdge;

let score = 0;
let health = 5;

playerHeight = 10;
playerWidth = 5;
playerDepth = 5;

const initialJumpHeight = 1.0;

const objects = [];

const catClones = [];
const catMovements = [];
const catSkeletons = [];
const catWireframes = [];

const spiderClones = [];
const spiderMovements = [];
const spiderSkeletons = [];
const spiderWireframes = [];

/* Assign values to vars */
let DEBUG_MODE = false;

let verticalJumpVelocityOffset = 250;

planeSize = 1000;
mapEdge = (planeSize / 2) - 10;
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

  playerModel.position.copy(playerSkeleton.position);
  playerModel.quaternion.copy(playerSkeleton.quaternion);

  playerSkeleton.position.copy(controls.getObject().position);
  playerSkeleton.position.y = controls.getObject().position.y-10;

  for(let i = 0; i < catSkeletons.length; ++i){
    catClones[i].position.copy(catSkeletons[i].position);
    catClones[i].quaternion.copy(catSkeletons[i].quaternion);
    catWireframes[i].position.copy(catSkeletons[i].position);
    catWireframes[i].position.y += catHeight / 2;
    catWireframes[i].quaternion.copy(catSkeletons[i].quaternion);
  }

  for(let i = 0; i < spiderSkeletons.length; ++i){
    spiderClones[i].position.copy(spiderSkeletons[i].position);
    spiderClones[i].position.y -= spiderHeight / 2;
    spiderClones[i].quaternion.copy(spiderSkeletons[i].quaternion);
    spiderWireframes[i].position.copy(spiderSkeletons[i].position);
    spiderWireframes[i].quaternion.copy(spiderSkeletons[i].quaternion);
  }

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
    new THREE.MeshBasicMaterial({color: 0xFCBA03,}) //orange
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
    //scene.add(spiderModel);
    //spiderModel.position.set(-55, 0, -55);
    //console.log("loaded!!!");

    for (let i = 0; i < numberOfAnimals; i++) {
      const spiderClone = spiderModel.clone();
      scene.add(spiderClone);
      spiderClones.push(spiderClone);

      const movementDirection = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1).normalize();
      spiderMovements.push(movementDirection);
    }
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  }, function(error){
    console.error(error);
  });

  assetLoaderFBX.load(catURL.href, function(fbx){
    catModel = fbx;
    //scene.add(catModel);
    //catModel.position.set(-40, 0, -55);
    //console.log("loaded!!!");

    for (let i = 0; i < numberOfAnimals; i++) {
      const catClone = catModel.clone();
      scene.add(catClone);
      catClones.push(catClone);

      const movementDirection = new THREE.Vector3(Math.random() * 2 - 1, 0.5, Math.random() * 2 - 1).normalize();
      catMovements.push(movementDirection);
    }
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

  for (let i = 0; i < numberOfAnimals; i++) {
    const randomX = Math.random() * planeSize - mapEdge;
    const randomZ = Math.random() * planeSize - mapEdge;
    const spiderSkeleton = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(5, 1, 5)),
      position: new CANNON.Vec3(randomX, 10, randomZ),
      mass: 7,
    });

    world.addBody(spiderSkeleton);
    spiderSkeletons.push(spiderSkeleton);
    let c = spiderWireFrame.clone();
    spiderWireframes.push(c);
    scene.add(c);
  }

  for (let i = 0; i < numberOfAnimals; i++) {
    const randomX = Math.random() * planeSize - mapEdge;
    const randomZ = Math.random() * planeSize - mapEdge;
    const catSkeleton = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(5, 1, 5)),
      position: new CANNON.Vec3(randomX, 10, randomZ),
      mass: 10,
    });

    world.addBody(catSkeleton);
    catSkeletons.push(catSkeleton);
    let c = catWireFrame.clone();
    catWireframes.push(c);
    scene.add(c);
  }


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
    0xFFFFFF, 500.0, distance, angle, penumbra, decay);
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

function handleCatCollision(indexOfRemove) {
  score += 1;
  console.log("Score: " + score);

  let model = catClones[indexOfRemove];
  let skeleton = catSkeletons[indexOfRemove];
  let wireframe = catWireframes[indexOfRemove];

  scene.remove(model);
  world.removeBody(skeleton);
  scene.remove(wireframe);

  catClones.splice(indexOfRemove, 1);
  catSkeletons.splice(indexOfRemove, 1);
  catWireframes.splice(indexOfRemove, 1);
}

function handleSpiderCollision(indexOfRemove) {
  health -= 1;
  console.log("Health: " + health)

  let model = spiderClones[indexOfRemove];
  let skeleton = spiderSkeletons[indexOfRemove];
  let wireframe = spiderWireframes[indexOfRemove];

  scene.remove(model);
  world.removeBody(skeleton);
  scene.remove(wireframe);

  spiderClones.splice(indexOfRemove, 1);
  spiderSkeletons.splice(indexOfRemove, 1);
  spiderWireframes.splice(indexOfRemove, 1);
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
    for(let i = 0; i < catSkeletons.length; ++i){
      scene.remove(catWireframes[i]);
    }

    for(let i = 0; i < spiderSkeletons.length; ++i){
      scene.remove(spiderWireframes[i]);
    }

    scene.remove(playerModel);
  }
  else{
    for(let i = 0; i < catSkeletons.length; ++i){
      scene.add(catWireframes[i]);
    }

    for(let i = 0; i < spiderSkeletons.length; ++i){
      scene.add(spiderWireframes[i]);
    }

    scene.add(playerModel);
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

    const blocker_lost = document.getElementById( 'blocker_lost' );
    const instructions_lost = document.getElementById( 'instructions_lost' );
    instructions_lost.style.display = 'none';
    blocker_lost.style.display = 'none';

    const blocker_won = document.getElementById( 'blocker_won' );
    const instructions_won = document.getElementById( 'instructions_won' );
    instructions_won.style.display = 'none';
    blocker_won.style.display = 'none';

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

  /* Exit conditions: */
  if( !EXIT && score >= numberOfAnimals){
    controls.lock();
    EXIT = true;
    score_html.textContent = "Score: " + numberOfAnimals;
    blocker_won.style.display = 'block';
    instructions_won.style.display = '';
    console.log("YOU WON!");
  }
  if( !EXIT && health <= 0){
    controls.lock();
    EXIT = true; 
    health_html.textContent = "Health: " + 0;
    blocker_lost.style.display = 'block';
    instructions_lost.style.display = '';
    console.log("YOU LOST!");
  }

  if ( !EXIT && controls.isLocked === true ) {

    world.step(timeStep);
    fuseMeshWithGeometry();
    debugMode();
    health_html.textContent = "Health: " + health;
    score_html.textContent = "Score: " + score;

    const playerPosition =playerSkeleton.position;

    for (let i = 0; i < catSkeletons.length; i++) {
      //Cats
      const catClone = catSkeletons[i];
      const catMovementDirection = catMovements[i];

      //adjust the speed by multiplying the movement direction by a scalar
      const catSpeed = 0.3;
      const jumpSpeed = 0.2;

      catClone.position.x += catMovementDirection.x * catSpeed;
      catClone.position.z += catMovementDirection.z * catSpeed;
      catClone.position.y += catMovementDirection.y * jumpSpeed;
      //console.log(catClone.velocity);

      //Optionally, we can add logic to change direction when reaching boundaries
      if (catClone.position.x > mapEdge) catMovementDirection.x = -Math.abs(catMovementDirection.x);
      if (catClone.position.x < -mapEdge) catMovementDirection.x = Math.abs(catMovementDirection.x);
      if (catClone.position.z > mapEdge) catMovementDirection.z = -Math.abs(catMovementDirection.z);
      if (catClone.position.z < -mapEdge) catMovementDirection.z = Math.abs(catMovementDirection.z);
      if (catClone.position.y >= catHeight + initialJumpHeight) catMovementDirection.y = -Math.abs(catMovementDirection.y);
      if (catClone.position.y <= catHeight) catMovementDirection.y = Math.abs(catMovementDirection.y);

      const catAngle = Math.atan2(catMovementDirection.x, catMovementDirection.z);
      catClone.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), catAngle);

      const catPosition = catSkeletons[i].position;
      const distanceWithCat = playerPosition.distanceTo(catPosition);

      if(distanceWithCat < 10) {
        //collision handle
        handleCatCollision(i);

      }

    }
    
    for(let i = 0; i < spiderSkeletons.length; i++) {
      //Spiders
      const spiderClone = spiderSkeletons[i];
      const spiderMovementDirection = spiderMovements[i];

      const spiderSpeed = 0.2;
      spiderClone.position.x += spiderMovementDirection.x * spiderSpeed;
      spiderClone.position.z += spiderMovementDirection.z * spiderSpeed;

      if (spiderClone.position.x > mapEdge) spiderMovementDirection.x = -Math.abs(spiderMovementDirection.x);
      if (spiderClone.position.x < -mapEdge) spiderMovementDirection.x = Math.abs(spiderMovementDirection.x);
      if (spiderClone.position.z > mapEdge) spiderMovementDirection.z = -Math.abs(spiderMovementDirection.z);
      if (spiderClone.position.z < -mapEdge) spiderMovementDirection.z = Math.abs(spiderMovementDirection.z);

      const spiderAngle = Math.atan2(spiderMovementDirection.x, spiderMovementDirection.z);

      spiderClone.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), (spiderAngle - Math.PI / 2));

            const spiderPosition = spiderSkeletons[i].position;
      const distanceWithSpider = playerPosition.distanceTo(spiderPosition);
      
      if(distanceWithSpider < 10) {
        handleSpiderCollision(i);
      } 
    }

    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects( objects, false );

    let onObject;
    if(intersections.length > 0){
      onObject = true;

    }

    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 5.0 * delta;
    velocity.z -= velocity.z * 5.0 * delta;

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
    if(controls.getObject().position.x >= mapEdge + 5){
      controls.getObject().position.x = mapEdge + 5;
    }

    if(controls.getObject().position.x <= -mapEdge - 5){
      controls.getObject().position.x = -mapEdge - 5;
    }

    
    if(controls.getObject().position.z >= mapEdge + 5){
      controls.getObject().position.z = mapEdge + 5;
    }

    if(controls.getObject().position.z <= -mapEdge - 5){
      controls.getObject().position.z = -mapEdge - 5;
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