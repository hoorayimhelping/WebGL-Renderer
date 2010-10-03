var Renderer = function(container) {
  var self = this;

	self.canvas = container || null;

  self.gl = null;
	self.shaderProgram = null;
	self.squareVertexPositionBuffer = null;
	self.squareVertexColorBuffer = null;
	self.aspectRatio = 0.0;
	self.perspectiveMatrix = null;

	self.mvMatrix = null;

  this.drawScene = function() {
    if (self.gl) {
			self.gl.viewport(0, 0, self.gl.viewportWidth, self.gl.viewportHeight);
      self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);

      self.perspectiveMatrix = makePerspective(45, self.gl.viewportWidth / self.gl.viewportHeight, 0.1, 100.0);
			loadIdentity();

			mvTranslate([0.0, 0.0, -6.0]);

			self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
			self.gl.vertexAttribPointer(self.shaderProgram.vertexPositionAttribute, 3, self.gl.FLOAT, false, 0, 0);

			self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.squareVertexColorBuffer);
			self.gl.vertexAttribPointer(self.shaderProgram.vertexColorAttribute, 4, self.gl.FLOAT, false, 0, 0);

			setMatrixUniforms();
			self.gl.drawArrays(self.gl.TRIANGLE_STRIP, 0, 4);
    }
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
		self.squareVertexPositionBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);

		var vertices = [
		  1.0,  1.0, 0.0,  
		 -1.0,  1.0, 0.0,  
      1.0, -1.0, 0.0,  
	   -1.0, -1.0, 0.0
		];

		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(vertices), self.gl.STATIC_DRAW);

		self.squareVertexColorBuffer = self.gl.createBuffer();
		self.gl.bindBuffer(self.gl.ARRAY_BUFFER, self.squareVertexColorBuffer);
		var colors = [
			1.0, 0.0, 0.0, 1.0,
			0.0, 1.0, 0.0, 1.0,
			0.0, 0.0, 1.0, 1.0,
			0.0, 1.0, 1.0, 1.0
		];

		self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(colors), self.gl.STATIC_DRAW);
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

	function loadIdentity() {  
    self.mvMatrix = Matrix.I(4);  
  }  
    
  function multMatrix(m) {  
    self.mvMatrix = self.mvMatrix.x(m);  
  }  
    
  function mvTranslate(v) {  
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());  
  }  
    
  function setMatrixUniforms() {  
    var pUniform = self.gl.getUniformLocation(self.shaderProgram, "uPMatrix");  
    self.gl.uniformMatrix4fv(pUniform, false, new Float32Array(self.perspectiveMatrix.flatten()));  
    
    var mvUniform = self.gl.getUniformLocation(self.shaderProgram, "uMVMatrix");  
    self.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(self.mvMatrix.flatten()));  
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