var Renderer = function(container) {
  var self = this;

  self.gl = null;
  self.canvas = container || null;

  this.drawScene = function() {
    if (self.gl) {
      self.gl.clearColor(1.0, 0.0, 0.5, 1.0);
      self.gl.clearDepth(1.0);
      self.gl.enable(self.gl.DEPTH_TEST);
      self.gl.depthFunc(self.gl.LEQUAL);
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
    }
  }

  var intializeContainer = function(canvas) {
    var gl = null;

    try {
      gl = canvas.getContext('experimental-webgl');
    }
    catch (e) { 
      console.error(e);
    }

    if (!gl) {
      console.error("Couldn't initialize WebGl. Sorry");
    }

    return gl;
  }

  self.gl = intializeContainer(this.canvas);
}