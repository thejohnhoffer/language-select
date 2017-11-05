'use strict'
var scene, camera, renderer;
var geometry, material, mesh;
var width = window.innerWidth, height = window.innerHeight
console.log(width, height)
scene = new THREE.Scene()
camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 10000)
scene.add(camera)
camera.position.z = 1000

// geometry = new THREE.BoxGeometry( 200, 200, 200 )
// material = new THREE.MeshBasicMaterial({color: 0xff0000})
// mesh = new THREE.Mesh(geometry, material)
// scene.add(mesh)

function uniforms(opts) {
  opts = opts || {}
  return {
    color: {
      type: 'c',
      value: new THREE.Color(0x3498db)
    },
    alpha: { type: 'f', value: 0.7 },
    pointSize: { type: 'f', value: 10 },
    shouldResize: { type: '1i', value: opts.shouldResize ? 1 : 0 }
  }
}

var particles = 1000
var mouseIdx = 200
var positions = new Float32Array(particles * 3)
var dx = 2
var norm = d3.random.normal(0, 100)
for(var i = 0; i < positions.length; i+=3) {
  var x = norm(), y = norm(), z = norm()
  if (i / 3 < particles / 3) x -= 0.5, y += 1, z -= 0.5
  else if (i / 3 < particles / 3 * 2) x += dx, y += dx, z += dx
  else x -= dx, y -= dx, z -= dx
  positions[i] = x, positions[i + 1] = y, positions[i + 2] = z
}
var sizes = new Float32Array(particles)
for(var i = 0; i < particles; i++) sizes[i] = Math.random() * 10 + 3

var attributes = {
  size: { type: 'f', value: [] }
}

var cloudMat = new THREE.ShaderMaterial({
    uniforms:       uniforms(),
    attributes:     attributes,
    vertexShader:   d3.select('#vertexshader').node().textContent,
    fragmentShader: d3.select('#fragmentshader').node().textContent,
    transparent:    true,
    setDepthTest: false,
    // blending: THREE.CustomBlending,
    // blendEquation: THREE.AddEquation,
    // blendSrc: THREE.SrcAlphaSaturate,
    // blendDst: THREE.OneMinusSrcAlphaFactor,
})

var cloudGeom = new THREE.BufferGeometry()
var posBuff = new THREE.BufferAttribute(positions, 3)
cloudGeom.addAttribute('position', posBuff)
cloudGeom.addAttribute('size', new THREE.BufferAttribute(sizes, 1))
cloudGeom.computeBoundingSphere()

var pointCloud = new THREE.PointCloud(cloudGeom, cloudMat)
scene.add(pointCloud)

renderer = new THREE.WebGLRenderer({alpha: true})
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

var nodes = d3.range(particles).map(function(d) { return {} })
var mouseNode = { fixed: true }
nodes.push(mouseNode)

// mouseNode.fixed = true

var force = d3.layout.force()
  .nodes(nodes)
  .size([width, height])
  .charge(function(d, i) { return -sizes[i] || -500 })
  // .chargeDistance(10)
  .start()

var mousePosition = [0, 0]
d3.timer(function(d) {
  force.start()
  mouseNode.x = mousePosition[0], mouseNode.y = mousePosition[1]
  for(var i = 0; i + 1 < nodes.length; i++) {
    positions[i * 3] = nodes[i].x - width / 2
    positions[i * 3 + 1] = - (nodes[i].y - height / 2)
  }
  posBuff.needsUpdate = true // Important!
  renderer.render(scene, camera)
})

d3.select('canvas')
  .on('mousemove', updateMouse)
  .call(d3.behavior.drag().on('drag', updateMouse))

function updateMouse() {
  var p = d3.mouse(this)
  mousePosition = p
}
