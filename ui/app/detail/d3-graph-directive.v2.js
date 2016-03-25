(function () {

  'use strict';

  Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
        continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
    }
    return a;
  };

  angular.module('app.graph')
    .directive('mlD3Graph', mlD3Graph)
    .controller('mlD3GraphController', mlD3GraphController);

  mlD3Graph.$inject = ['MLRest'];

  function mlD3Graph(mlRest) {
    return {
      restrict: 'E',
      templateUrl: 'app/detail/d3-graph-directive.html',
      controller: 'mlD3GraphController',
      controllerAs: 'ctrl',
      scope: { uri: '@' }
    };

  }

  mlD3GraphController.$inject = ['$scope', 'MLRest', '$location'];

  function mlD3GraphController($scope, mlRest, $location) {
    var ctrl = this;

    angular.extend(ctrl, {
      id: '',
      links: [],
      nodes: null,
      init: init
    });

    init();

    function init() {
      var scopeId = $scope.uri;
      if (scopeId.indexOf('/data/') === 0) {
        scopeId = scopeId.substring(6);
      }

      var extIdx = scopeId.indexOf('.json');
      if (extIdx >= 0) {
        scopeId = scopeId.substring(0, extIdx);
      }

      ctrl.id = scopeId;

      mlRest.extension('rootcauseanalysis',
        {
          method: 'GET',
          params:
            {
              'rs:scope': ctrl.id
            }
        })
        .then(function(response) {
          if (response && response.data) {
            ctrl.links = response.data;
            processLinks(ctrl.links);
            initGraph();
          }
        });
    };

    function processLinks(links) {
      var nodes = {};

      // Compute the distinct nodes from the links.
      links.forEach(function(link)
      {
        link.type = 'end';
        if (nodes[link.source]) {
          //{"source":"sys:USA-NYC-B-5-6-3", "sObjectType":"system down", "type":"is in room", "target":"rm:6", "tObjectType":"room"}
          nodes[link.source].objectType = (nodes[link.source].objectType + " " + link.sObjectType).split(" ").getUnique().join(" ")
          link.source = nodes[link.source]
        } else {
          link.source = (nodes[link.source] = {name: link.source, objectType: link.sObjectType, docURI: link.sourceDocURI })
        }

        if (nodes[link.target]) {
          //{"source":"sys:USA-NYC-B-5-6-3", "sObjectType":"system down", "type":"is in room", "target":"rm:6", "tObjectType":"room"}
          nodes[link.target].objectType = (nodes[link.target].objectType + " " + link.tObjectType).split(" ").getUnique().join(" ")
          link.target = nodes[link.target]
        } else {
          link.target = (nodes[link.target] = {name: link.target, objectType: link.tObjectType, docURI: link.targetDocURI})
        }

      });

      ctrl.nodes = nodes;
    };

    function initGraph() {
      var width = 800;
      var height = 500;

      d3.select("svg").remove()

      var force = d3.layout.force()
        .nodes(d3.values(ctrl.nodes))
        .links(ctrl.links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300) //-300 -600
        .on("tick", tick)
        .start();

      var svg = d3.select("div#container").append("svg")
        .attr("width", width)
        .attr("height", height);
        // .attr("style", "display: inline; width: 100%; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;")


      // var svgg = svg.append("svg:g").attr("id", "map-matrix")

      // Per-type markers, as they don't inherit styles.
      svg.append("defs").selectAll("marker")
         .data(["end"])
        // .data(["licensing"])
        .enter().append("marker")
          .attr("id", function(d) {return d;})
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 15)
          .attr("refY", -1.5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
        .append("path")
          .attr("d", "M0,-5L10,0L0,5");

      var absUrl = $location.absUrl();

      var path = svg.append("g").selectAll("path")
          .data(force.links())
        .enter().append("path")
          .attr("class", function(d) { return "link end"; })
          .attr("marker-end", function(d) { return "url(" + absUrl + "#end)"; });

      console.log($location.absUrl());

      var circle = svg.append("g").selectAll("circle")
          .data(force.nodes())
        .enter().append("circle")
          .attr("r", 6)
          .call(force.drag);

      var text = svg.append("g").selectAll("text")
          .data(force.nodes())
        .enter().append("text")
          .attr("x", 8)
          .attr("y", ".31em")
          .text(function(d) { return d.name; });




      // Keep the graph from bouncing initially.
      // force.start();
      // for (var i = 10000; i > 0; --i) force.tick();
      // force.stop();

      function arcPath(leftHand, d) {
        var start = leftHand ? d.source : d.target,
          end = leftHand ? d.target : d.source,
          dx = end.x - start.x,
          dy = end.y - start.y,
          dr = Math.sqrt(dx * dx + dy * dy),
          sweep = leftHand ? 0 : 1;
        return "M" + start.x + "," + start.y + "A" + dr + "," + dr + " 0 0," + sweep + " " + end.x + "," + end.y;
      };

      // Use elliptical arc path segments to doubly-encode directionality.
      function tick() {
        path.attr("d", function(d) {
          return arcPath(false, d);
        });

        circle.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      };

      function pan(dx, dy) {
        transMatrix[4] += dx;
        transMatrix[5] += dy;

        var newMatrix = "matrix(" +  transMatrix.join(' ') + ")";
        var mapMatrixElement = document.getElementById("map-matrix")
        if (mapMatrixElement) {
          mapMatrixElement.setAttributeNS(null, "transform", newMatrix);
        }
      };

      function zoom(scale)
      {
        for (var i=0; i<transMatrix.length; i++) {
          transMatrix[i] *= scale;
        }
        transMatrix[4] += (1-scale)*width/2;
        transMatrix[5] += (1-scale)*height/2;

        var newMatrix = "matrix(" +  transMatrix.join(' ') + ")";
        var mapMatrixElement = document.getElementById("map-matrix")
        if (mapMatrixElement) {
          mapMatrixElement.setAttributeNS(null, "transform", newMatrix);
        }
      };
    };

    function initGraphOrig() {
      var transMatrix = [1,0,0,1,0,0];
      var w = 800, //960,
          h = 500  //500;

      d3.select("svg").remove()

      var force = d3.layout.force()
        .nodes(d3.values(ctrl.nodes))
        .links(ctrl.links)
        .size([w, h])
        //.gravity(0.8)
        .linkDistance(120) //120
        .charge(-1200) //-300 -600
        .on("tick", tick);
        // .start();

      var svg = d3.select("div#container").append("svg:svg")
        //.attr("width", w)
        //.attr("height", h);
        .attr("style", "display: inline; width: 100%; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;")

      svg.append("svg:circle")
        .attr("cx", "50")
        .attr("cy", "50")
        .attr("r", "42")
        .attr("fill", "white")
        .attr("opacity", "0.75")

      svg.append("svg:path")
        .attr("class", "button")
        .attr("onclick", "pan(0, 50)")
        .attr("d", "M50 10 l12   20 a40, 70 0 0,0 -24,  0z")

      svg.append("svg:path")
        .attr("class", "button")
        .attr("onclick", "pan(50, 0)")
        .attr("d", "M10 50 l20  -12 a70, 40 0 0,0   0, 24z")

      svg.append("svg:path")
        .attr("class", "button")
        .attr("onclick", "pan(0, -15)")
        .attr("d", "M50 90 l12  -20 a40, 70 0 0,1 -24,  0z")

      svg.append("svg:path")
        .attr("class", "button")
        .attr("onclick", "pan(-50, 0)")
        .attr("d", "M90 50 l-20 -12 a70, 40 0 0,1   0, 24z")

      svg.append("svg:circle")
        .attr("class", "compass")
        .attr("cx", "50")
        .attr("cy", "50")
        .attr("r", "20")

      svg.append("svg:circle")
        .attr("class", "button")
        .attr("cx", "50")
        .attr("cy", "41")
        .attr("r", "8")
        .attr("onclick", "zoom(0.8)")

      svg.append("svg:circle")
        .attr("class", "button")
        .attr("cx", "50")
        .attr("cy", "59")
        .attr("r", "8")
        .attr("onclick", "zoom(1.25)")

      svg.append("svg:rect")
        .attr("class", "plus-minus")
        .attr("x", "46")
        .attr("y", "39.5")
        .attr("width", "8")
        .attr("height", "3")

      svg.append("svg:rect")
        .attr("class", "plus-minus")
        .attr("x", "46")
        .attr("y", "57.5")
        .attr("width", "8")
        .attr("height", "3")

      svg.append("svg:rect")
        .attr("class", "plus-minus")
        .attr("x", "48.5")
        .attr("y", "55")
        .attr("width", "3")
        .attr("height", "8")

      var svgg = svg.append("svg:g").attr("id", "map-matrix")

      // Per-type markers, as they don't inherit styles.
      svgg.append("svg:defs").selectAll("marker")
        .data(["suit", "licensing", "resolved", "mounted in rack"])
        // .data(["end"])
        .enter().append("svg:marker")
          .attr("id", String)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 15)
          .attr("refY", -1.5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
        .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");

      // var path = svg.append("svg:g").selectAll("path")
      var path = svgg.append("svg:g").selectAll("path")
          .data(force.links())
        .enter().append("svg:path")
          .attr("class", "link licensing")
          .attr("marker-end", "url(#end)");


      var link = svgg.append("svg:g").selectAll("g.link")
        .data(force.links())
        .enter().append('g')
          .attr("class", function(d) { return "link bob"; })
          .attr("marker-end", function(d) { return "url(#licensing)"; });

      /*
      var link = svgg.append("svg:g").selectAll("g.link")
        .data(force.links())
        .enter().append('g')
          .attr('class', 'link')
          .attr("marker-end", "url(#end)");
      */

      var linkPath = link.append("svg:path")
        //.attr("class", function(d) { return "link " + d.type; })
        .attr("class", function(d) { return "link licensing" })
        .attr("marker-end", function(d) { return "url(#licensing)"; });
        //.attr("marker-start", function(d) { return "url(#" + "suit" + ")"; });

      var textPath = link.append("svg:path")
        .attr("id", function(d) { return d.source.index + "_" + d.target.index; })
        .attr("class", "textpath");

      var circle = svgg.append("svg:g").selectAll("circle")
        .data(force.nodes())
        .enter().append("svg:circle")
          .attr("class", function(d) {
            return d.objectType.replace(/["]/g, '');
          })
          .attr("r", 6)
          //.attr("oncontextmenu", "javascript:alert('success!');return false;")
          .attr("oncontextmenu", function(d) {
              var docURI = d.docURI
              return "showDoc(\""+docURI+"\");return false;"
            })
          .call(force.drag);

      var circle2 = svgg.selectAll("circle.down")
        .append("svg:animate")
          .attr("attributeType", "xml")
          .attr("attributeName", "r")
          .attr("values", "6;12;6")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite")

      var path_label = svgg.append("svg:g").selectAll(".path_label")
        .data(force.links())
        .enter().append("svg:text")
          .attr("class", "path_label")
        .append("svg:textPath")
          .attr("startOffset", "50%")
          .attr("text-anchor", "middle")
          .attr("xlink:href", function(d) { return "#" + d.source.index + "_" + d.target.index; })
          .style("fill", "#000")
          .style("font-family", "Arial")
        .append("svg:tspan")
          .attr("dy", "-3")
          .text(function(d) { return d.type; });

      var text = svgg.append("svg:g").selectAll("g")
        .data(force.nodes())
        .enter().append("svg:g");

      // A copy of the text with a thick white stroke for legibility.
      text.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .text(function(d) { return d.name; });

      text.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });

      // Keep the graph from bouncing initially.
      force.start();
      for (var i = 10000; i > 0; --i) force.tick();
      force.stop();

      function arcPath(leftHand, d) {
        var start = leftHand ? d.source : d.target,
          end = leftHand ? d.target : d.source,
          dx = end.x - start.x,
          dy = end.y - start.y,
          dr = Math.sqrt(dx * dx + dy * dy),
          sweep = leftHand ? 0 : 1;
        return "M" + start.x + "," + start.y + "A" + dr + "," + dr + " 0 0," + sweep + " " + end.x + "," + end.y;
      };

      // Use elliptical arc path segments to doubly-encode directionality.
      function tick() {
        linkPath.attr("d", function(d) {
          return arcPath(false, d);
        });

        textPath.attr("d", function(d) {
          return arcPath(d.source.x < d.target.x, d);
        });

        //circle.attr("transform", function(d) {
        circle.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      };

      function pan(dx, dy) {
        transMatrix[4] += dx;
        transMatrix[5] += dy;

        newMatrix = "matrix(" +  transMatrix.join(' ') + ")";
        mapMatrixElement = document.getElementById("map-matrix")
        mapMatrixElement.setAttributeNS(null, "transform", newMatrix);
      };

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
      };
    };
  }

}());
