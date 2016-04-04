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
    .directive('mlD3GraphImage', mlD3GraphImage)
    .controller('mlD3GraphControllerImage', mlD3GraphControllerImage);

  mlD3GraphImage.$inject = ['MLRest'];

  function mlD3GraphImage(mlRest) {
    return {
      restrict: 'E',
      templateUrl: 'app/graph/d3-graph-directive.image.html',
      controller: 'mlD3GraphControllerImage',
      controllerAs: 'ctrl',
      scope: { scopeId: '@' }
    };

  }

  mlD3GraphControllerImage.$inject = ['$scope', 'MLRest', '$location'];

  function mlD3GraphControllerImage($scope, mlRest, $location) {
    var ctrl = this;

    angular.extend(ctrl, {
      id: '',
      links: [],
      nodes: null,
      init: init
    });

    // $scope.$watch('uri', function(newValue) {
    //   console.log('uri changed');
    //   init();
    //   console.log($scope.uri);
    // });

    init();

    function init() {
      ctrl.id =  $scope.scopeId;

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
      var width = 800; //960,
      var height = 500;  //500;
      var absUrl = $location.absUrl();

      d3.select("div#containerImage.svg").remove()


      var force = d3.layout.force()
        .nodes(d3.values(ctrl.nodes))
        .links(ctrl.links)
        .size([width, height])
        //.gravity(0.8)
        .linkDistance(120) //120
        .charge(-1200) //-300 -600
        .on("tick", tick);

      var zoom = d3.behavior.zoom()
        // .scaleExtent([1, 10])
        .on("zoom", zoomed);

      var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

      var drag2 = force.drag()
        .on("dragstart", dragstart2);


      var svg = d3.select("div#containerImage").append("svg:svg")
        .attr("style", "display: inline; width: 100%; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;")
        .call(zoom);

      var svgg = svg.append("svg:g").attr("id", "map-matrix")

      // Per-type markers, as they don't inherit styles.
      svgg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
          .attr("id", String)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 16)
          // .attr("refY", -1.5)
          .attr("refY", 0)
          .attr("markerWidth", 10)
          .attr("markerHeight", 10)
          .attr("orient", "auto")
        .append("svg:path")
          // Removed curve link line
          // .attr("d", "M0,-5L10,0L0,5");
          .attr("d", "M0,-5L10,0L0,5");

      var link = svgg.selectAll(".link")
        .data(force.links())
        .enter();

      var linkPath = link.append("svg:path")
        .attr("class", function(d) { return "link licensing" })
        .attr("marker-end", function(d) { return "url(" + absUrl + "#end)"; });

      var textPath = link.append("svg:path")
        .attr("id", function(d) { console.log(d); console.log(d.source); return d.source.index + "_" + d.target.index; })
        .attr("class", "textpath");

      var circle = svgg.append("svg:g").selectAll("circle")
        .data(force.nodes())
        .enter().append("svg:image")
          .attr("class", function(d) {
            return d.objectType.replace(/["]/g, '');
          })
          .attr("xlink:href", function(d) {
            return "/images/" + d.objectType + ".png";
          })
          .attr("x", "-10px")
          .attr("y", "-10px")
          .attr("width", "20px")
          .attr("height", "20px")
        .on("dblclick", dblclick)
        // .call(force.drag);
        .call(drag2);

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

      // This block adds the link labels.
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

      // Keep the graph from bouncing initially.
      force.start();
      for (var i = 10000; i > 0; --i) force.tick();
      force.stop();

      function zoomed() {
        svgg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        // d3.select(this).classed("dragging", true);
        // force.start();

        d3.select(this).classed("fixed", d.fixed = true);
      }

      function dragstart2(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("fixed", d.fixed = true);
      }

      function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
      }

      function dragged(d) {
        console.log(d.x + " - " + d3.event.x);
        console.log(d.y + " - " + d3.event.y);
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      }

      function dragended(d) {
        d3.select(this).classed("dragging", false);
        console.log('drag end');
      }

      function arcPath(leftHand, d) {
        var start = leftHand ? d.source : d.target,
          end = leftHand ? d.target : d.source,
          dx = end.x - start.x,
          dy = end.y - start.y,
          dr = Math.sqrt(dx * dx + dy * dy),
          sweep = leftHand ? 0 : 1;
        // Removed curved link line
        // return "M" + start.x + "," + start.y + "A" + dr + "," + dr + " 0 0," + sweep + " " + end.x + "," + end.y;
        return "M" + start.x + "," + start.y + "A" + 0 + "," + 0 + " 0 0," + sweep + " " + end.x + "," + end.y;
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
    };
  }

}());
