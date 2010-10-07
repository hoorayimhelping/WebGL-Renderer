var Renderer = function(container) {
  var self = this;

  self.canvas = container || null;

  self.gl = null;
  self.shaderProgram = null;
  self.aspectRatio = 0.0;
  self.perspectiveMatrix = null;

	self.cubeVertexPositionBuffer = null;
  self.cubeVertexColorBuffer = null;
	self.cubeVertexIndexBuffer = null;

  self.rotation = 0;

  self.lastTime = 0;
  self.currentTime = 0;
  self.elapsedTime = 0;

  self.mvMatrix = null;

	self.mvMatrixStack = [];

  this.drawScene = function() {
    if (self.gl) {
      self.gl.viewport(0, 0, self.gl.viewportWidth, self.gl.viewportHeight);
      self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);

      self.perspectiveMatrix = makePerspective(45, self.gl.viewportWidth / self.gl.viewportHeight, 0.1, 100.0);
      loadIdentity();

      mvTranslate([0.0, 0.0, -6.0]);

      animate();
      mvRotate(self.rotation, [1, 1, 1]);

      self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.cubeVertexPositionBuffer);
      self.gl.vertexAttribPointer(self.shaderProgram.vertexPositionAttribute, 3, self.gl.FLOAT, false, 0, 0);

      self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.cubeVertexColorBuffer);
      self.gl.vertexAttribPointer(self.shaderProgram.vertexColorAttribute, 4, self.gl.FLOAT, false, 0, 0);

			self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.cubeVertexIndexBuffer);
      setMatrixUniforms();
			self.gl.drawElements(self.gl.TRIANGLES, 36, self.gl.UNSIGNED_SHORT, 0);
      self.gl.drawArrays(self.gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  var animate = function() {
    self.currentTime = new Date().getTime();

    if (self.lastTime != 0) {
      self.elapsedTime = self.currentTime - self.lastTime;

      self.rotation += (75 * self.elapsedTime) / 1000.0;
    }
    self.lastTime = self.currentTime;
  }

  var getShader = function(id) {
    var shaderScript = document.getElementById(id);

    if (!shaderScript) {
      return null;
    }

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while(currentChild) {
      if (currentChild.nodeType == 3) {
        theSource += currentChild.textContent;
      }

      currentChild = currentChild.nextSibling;
    }

    var shader;

    if (shaderScript.type === "x-shader/x-fragment") {
      shader = self.gl.createShader(self.gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type === "x-shader/x-vertex") {
      shader = self.gl.createShader(self.gl.VERTEX_SHADER);
    }
    else {
      return null;
    }

    self.gl.shaderSource(shader, theSource);
    self.gl.compileShader(shader);

    if (!self.gl.getShaderParameter(shader, self.gl.COMPILE_STATUS)) {
      console.error("An error occurred compiling the shaders: " + self.gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  var initializeShaders = function() {
    var fragmentShader = getShader("shader-fs");
    var vertexShader = getShader("shader-vs");

    self.shaderProgram = self.gl.createProgram();
    self.gl.attachShader(self.shaderProgram, vertexShader);
    self.gl.attachShader(self.shaderProgram, fragmentShader);
    self.gl.linkProgram(self.shaderProgram);

    if (!self.gl.getProgramParameter(self.shaderProgram, self.gl.LINK_STATUS)) {
      console.error("Couldn't initialize shader program. Sorry", self.gl.getProgramInfoLog(self.shaderProgram));
    }

    self.gl.useProgram(self.shaderProgram);

    self.shaderProgram.vertexPositionAttribute = self.gl.getAttribLocation(self.shaderProgram, "aVertexPosition");
    self.gl.enableVertexAttribArray(self.shaderProgram.vertexPositionAttribute);

    self.shaderProgram.vertexColorAttribute = self.gl.getAttribLocation(self.shaderProgram, "aVertexColor");
    self.gl.enableVertexAttribArray(self.shaderProgram.vertexColorAttribute);
  }

  var initializeBuffers = function() {
    self.cubeVertexPositionBuffer = self.gl.createBuffer();
    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.cubeVertexPositionBuffer);

    var vertices = [
			// front face
     -1.0, -1.0,  1.0,
      1.0, -1.0,  1.0,
			1.0,  1.0,  1.0,
		 -1.0,  1.0,  1.0,
		
		  // back face
		 -1.0, -1.0, -1.0,
		 -1.0,  1.0, -1.0,
		  1.0,  1.0, -1.0,
		  1.0, -1.0, -1.0,

      // top face
     -1.0,  1.0, -1.0,
		 -1.0,  1.0,  1.0,
		  1.0,  1.0,  1.0,
		  1.0,  1.0, -1.0,

      // bottom face
     -1.0, -1.0, -1.0,
		  1.0, -1.0, -1.0,
		  1.0, -1.0,  1.0,
		 -1.0, -1.0,  1.0,

      // right face
			1.0, -1.0, -1.0,
			1.0,  1.0, -1.0,
			1.0,  1.0,  1.0,
			1.0, -1.0,  1.0,

      // left face
		 -1.0, -1.0, -1.0,
		 -1.0, -1.0,  1.0,
		 -1.0,  1.0,  1.0,
		 -1.0,  1.0, -1.0
    ];

    self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(vertices), self.gl.STATIC_DRAW);

    self.cubeVertexColorBuffer = self.gl.createBuffer();
    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.cubeVertexColorBuffer);
    var colors = [
      [1.0, 0.0, 0.0, 1.0], // front face
      [1.0, 1.0, 0.0, 1.0], // back face
      [0.0, 1.0, 0.0, 1.0], // top face
      [0.0, 1.0, 1.0, 1.0], // bottom face
			[1.0, 0.0, 1.0, 1.0], // right face
			[0.5, 0.5, 1.0, 1.0], // left face
    ];
		var unpackedColors = [];
		for (var i = 0; i < colors.length; i++) {
		  for (var j = 0; j < 4; j++) {
		    unpackedColors = unpackedColors.concat(colors[i]);
			}
		}
		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(unpackedColors), self.gl.STATIC_DRAW);

		self.cubeVertexIndexBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, self.cubeVertexIndexBuffer);
		var cubeVertexIndices = [
		  0, 1, 2,      0, 2, 3,    // front face
		  4, 5, 6,      4, 6, 7,    // back face
		  8, 9, 10,     8, 10, 11,  // top face
		  12, 13, 14,   12, 14, 15, // bottom face
		  16, 17, 18,   16, 18, 19, // right face
		  20, 21, 22,   20, 22, 23  // left face
		]

		self.gl.bufferData(self.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), self.gl.STATIC_DRAW);
  }

  var initializeContainer = function(canvas) {
    var gl = null;

    try {
      gl = canvas.getContext('experimental-webgl');
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    }
    catch (e) {
      console.error(e);
    }

    if (!gl) {
      console.error("Couldn't initialize WebGl. Sorry");
    }

    return gl;
  }

  var loadIdentity = function() {  
    self.mvMatrix = Matrix.I(4);  
  }  
    
  var multMatrix = function(m) {  
    self.mvMatrix = self.mvMatrix.x(m);  
  }  
    
  var mvTranslate = function(v) {  
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());  
  }  

  var mvRotate = function(ang, v) {
    var radians = ang * Math.PI / 180.0;

    var m = Matrix.Rotation(radians, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  var setMatrixUniforms = function() {  
    var pUniform = self.gl.getUniformLocation(self.shaderProgram, "uPMatrix");  
    self.gl.uniformMatrix4fv(pUniform, false, new Float32Array(self.perspectiveMatrix.flatten()));  
    
    var mvUniform = self.gl.getUniformLocation(self.shaderProgram, "uMVMatrix");  
    self.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(self.mvMatrix.flatten()));  
  }

	var mvPushMatrix = function(m) {
	  if (m) {
	    self.mvMatrixStack.push(m.dup());
	    self.mvMatrix = m.dup();
	  } else {
	    self.mvMatrixStack.push(self.mvMatrix.dup());
	  }
	}

	var mvPopMatrix = function() {
	  if (self.mvmvMatrixStack.length == 0) {
	    throw "Invalid popMatrix!";
	  }
	   self.mvMatrix = self.mvmvMatrixStack.pop();
	  return self.mvMatrix;
	}

  var initialize = function() {
    self.gl = initializeContainer(self.canvas);

    if (self.gl) {
      self.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      self.gl.clearDepth(1.0);
      self.gl.enable(self.gl.DEPTH_TEST);
      self.gl.depthFunc(self.gl.LEQUAL);

      initializeShaders();
      initializeBuffers();
    }
  }

  initialize();
}