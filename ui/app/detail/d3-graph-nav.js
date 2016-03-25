var transMatrix = [1,0,0,1,0,0];

var width = 1200
var height = 600

function pan(dx, dy) {
  transMatrix[4] += dx;
  transMatrix[5] += dy;

  newMatrix = "matrix(" +  transMatrix.join(' ') + ")";
  mapMatrixElement = document.getElementById("map-matrix")
  mapMatrixElement.setAttributeNS(null, "transform", newMatrix);
}

function zoom(scale)
{
  for (var i=0; i<transMatrix.length; i++) {
    transMatrix[i] *= scale;
  }
  transMatrix[4] += (1-scale)*width/2;
  transMatrix[5] += (1-scale)*height/2;

  newMatrix = "matrix(" +  transMatrix.join(' ') + ")";
  mapMatrixElement = document.getElementById("map-matrix")
  mapMatrixElement.setAttributeNS(null, "transform", newMatrix);
}

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
