import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils'
import * as dat from 'lil-gui'
import { createNoise3D } from 'simplex-noise';

let noise3D = createNoise3D();



// Canvas
const canvas = document.querySelector('#canvas')


// Scene
const scene = new THREE.Scene()


/**
 * gui
 */
const gui = new dat.GUI()
const debugObject = {}

debugObject.resolution = 16;
debugObject.normalized = 1.0;
debugObject.radius = 1.0;
debugObject.wireframe = false;
debugObject.color = 0x72c445;

debugObject.noiseStrength = 0.167;
debugObject.noiseRoughness = 0.8;
debugObject.noiseCenter = new THREE.Vector3();
debugObject.noiseLayers = 4;
debugObject.noisePersistence = 0.324;
debugObject.baseRoughness = 1.765;
debugObject.minValue = 0.816;


gui.add(debugObject, 'resolution').min(4).max(64).step(1)
gui.add(debugObject, 'normalized').min(0).max(1).step(0.001)
gui.add(debugObject, 'radius').min(1).max(10).step(0.001)
gui.add(debugObject, 'wireframe')
gui.addColor(debugObject, 'color')

gui.add(debugObject, 'noiseStrength').min(0).max(10).step(0.001)
gui.add(debugObject, 'noiseRoughness').min(0).max(10).step(0.001)
gui.add(debugObject, 'noiseLayers').min(1).max(10).step(1)
gui.add(debugObject, 'noisePersistence').min(0).max(1).step(0.001)
gui.add(debugObject, 'baseRoughness').min(0).max(10).step(0.001)
gui.add(debugObject, 'minValue').min(0).max(1).step(0.001)
gui.add(debugObject.noiseCenter, 'x').name('noiseX').min(-10).max(10).step(0.001)
gui.add(debugObject.noiseCenter, 'y').name('noiseY').min(-10).max(10).step(0.001)
gui.add(debugObject.noiseCenter, 'z').name('noiseZ').min(-10).max(10).step(0.001)




/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Objects
 */

// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
let group = new THREE.Group()
const createFace = (resolution = 10, localUp = new THREE.Vector3(0,0,1)) => {
	const geometry = new THREE.BufferGeometry();
		

	const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x)
	const axisB = localUp.clone().cross(axisA)
	const vertices = new Array(resolution * resolution)
	const triangles = new Int32Array((resolution - 1) * (resolution - 1) * 6)
	let triIndex = 0
	for (let y = 0; y < resolution; y++) {
		for (let x = 0; x < resolution; x++) {
			const i = x + y * resolution
			const percent = new THREE.Vector2(x / (resolution - 1), y / (resolution - 1))
			const pointOnUnitCube = localUp.clone()
																.add(axisA.clone().multiplyScalar((percent.x - 0.5) * 2))
				.add(axisB.clone().multiplyScalar((percent.y - 0.5) * 2))
			
			const pointOnUnitSphere = pointOnUnitCube.clone().lerp(pointOnUnitCube.clone().normalize(), debugObject.normalized)
											
			let noiseValue = 0;
			let frequency = debugObject.baseRoughness;
			let amplitude = 1;
			for (let index = 0; index < debugObject.noiseLayers; index++) {
				let v = noise3D(
					pointOnUnitSphere.x * frequency + debugObject.noiseCenter.x,
					pointOnUnitSphere.y * frequency + debugObject.noiseCenter.y,
					pointOnUnitSphere.z * frequency + debugObject.noiseCenter.z
				)
				noiseValue += (v + 1) * 0.5 * amplitude;
				frequency *= debugObject.noiseRoughness
				amplitude *= debugObject.noisePersistence
			}
			noiseValue = Math.max(0, noiseValue - debugObject.minValue)
			const elevation = noiseValue * debugObject.noiseStrength;
			
			vertices[i] = pointOnUnitSphere.multiplyScalar(debugObject.radius).multiplyScalar(1 + elevation);
			
			if (x != resolution - 1 && y != resolution - 1) {
				triangles[triIndex] = i;
				triangles[triIndex + 1] = i + resolution + 1;
				triangles[triIndex + 2] = i + resolution;

				triangles[triIndex + 3] = i;
				triangles[triIndex + 5] = i + resolution + 1;
				triangles[triIndex + 4] = i + 1;				
				triIndex += 6
			}
		}
	}
	const tempPos = []

	for (const triangle of triangles) {
		tempPos.push(vertices[triangle].x)
		tempPos.push(vertices[triangle].y)
		tempPos.push(vertices[triangle].z)
	}
	
	const positions = new Float32Array(tempPos)
	
	geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	geometry.computeVertexNormals()
	const material = new THREE.MeshStandardMaterial({
		color: debugObject.color,
		wireframe: debugObject.wireframe,
		metalness: 0.2,
		roughness: 0.6,		
	});
	const mesh = new THREE.Mesh(geometry, material);
	
	group.add(mesh)
}
// createFace(4, new THREE.Vector3(0,1,0))


const createSphere = () => {

	for (let i = 0; i < group.children.length; i++) {
		group.children[i].mesh.dispose();
		group.children[i].material.dispose();
		scene.remove(group.children[i])
	}
	createFace(debugObject.resolution, new THREE.Vector3(1,0,0))
	createFace(debugObject.resolution, new THREE.Vector3(0,1,0))
	createFace(debugObject.resolution, new THREE.Vector3(0,0,1))
	createFace(debugObject.resolution, new THREE.Vector3(-1,0,0))
	createFace(debugObject.resolution, new THREE.Vector3(0,-1,0))
	createFace(debugObject.resolution, new THREE.Vector3(0,0,-1))
	
}

createSphere();

gui.onChange(() => {
	group.children = []
	createSphere()
})
scene.add(group)


const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 1)
scene.add(directionalLight)
gui.add(directionalLight.position, 'x').name('lightX').min(-5).max(5).step(0.001)
gui.add(directionalLight.position, 'y').name('lightY').min(-5).max(5).step(0.001)
gui.add(directionalLight.position, 'z').name('lightZ').min(-5).max(5).step(0.001)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)

scene.add(ambientLight)


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor('#211d20')

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()