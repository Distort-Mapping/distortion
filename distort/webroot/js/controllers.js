var standardWidth = 300;
var standardHeight = 200;
'use strict';

/* Controllers */
var inject = ['$scope', '$location', 'Model', '$routeParams', '$cookies', '$resource', '$compile'];

function distortArrangeCtrl($scope, $location, Model, $routeParams, $cookies, $resource, $compile) {
  $scope.canvas = angular.element('.beamer-canvas-1');
  $scope.activeBeamer = 1;
  $scope.numberOfBeamers = 2;
  $scope.beamerOffset = 1680;
  $scope.snapModeActive = false;
  $scope.pointsToSnap = [];
  $scope.snappedPoints = {};


  $scope.changeActiveBeamer = function(beamerIndex) {
    if($scope.selectedTransform) {
      $scope.selectedTransform.setDeselected();
      $scope.selectedTransform = null;
    }
    $scope.snapModeActive = false;
    $scope.pointsToSnap = [];
    $scope.activeBeamer = beamerIndex;
    var elName = '.beamer-canvas-' + beamerIndex.toString();
    $scope.canvas = angular.element(elName);
    //angular.element('.nav-tabs').width($scope.canvas.width());
  }

  // Create Transform
  $scope.newTransform = function() {
    var transform = new Transform($scope, $compile);
    $scope.allTransforms.push(transform);
    var texture = $scope.textures[0];
    transform.setTexture(texture);
    // Send to server
    $scope.sendCreate(transform.id, transform.getVerticePositions(), texture);
  }

  // Navigation using ngswitch
  $scope.navigate = function(index) {
    if(index === 0){
      angular.element('.presentation-wrapper').addClass('hidden');
      angular.element('.arrange-wrapper').removeClass('hidden');
    } else {
      if($scope.selectedTransform) {
        $scope.selectedTransform.setDeselected();
        $scope.selectedTransform = null;
      }
      angular.element('.presentation-wrapper').removeClass('hidden');
      angular.element('.arrange-wrapper').addClass('hidden');
    }
    angular.element('.top-nav-btn').toggleClass('active');
  }

  $scope.newTextureSet = function() {
    var set = new textureSet($scope.textureSetName);
    $scope.allTransforms.forEach(function(transform){
      set.addTexture(transform.id, transform.texture);
    });
    $scope.textureSets.push(set);
  }

  // CLICK HANDLER ON TRANSFORMS
  $scope.transformMD = function($event) {
    $scope.movingTransform = $scope.transformWithUUID(angular.element($event.target).attr('uuid'));
    var currentPoints = $scope.movingTransform.getVerticePositionsArray();
    var clickPoint = $event.center;
    $scope.dragPointDeltas = currentPoints.map(function(point) {
      return point.minus(clickPoint);
    });

    // Set selected states
    $scope.allTransforms.forEach(function(transform){
      transform.setDeselected();
    });
    $scope.selectedTransform = $scope.movingTransform;
    $scope.selectedTransform.setSelected();
  }

  // CLICK HANDLER FOR DRAG POINTS
  $scope.pointDrag = function($event){
    var point = angular.element($event.target);
    var identifier = point.attr("uuid") + point.attr("role");
    $scope.movePoint(point, $event);

    if (point.hasClass('point-snapped')) {
        $scope.snappedPoints[identifier].forEach(function(point) {
            $scope.movePoint(point, $event);
        });
    }
  }

  $scope.movePoint = function(point, event) {
      var affectedTransform = $scope.transformWithUUID(point.attr('uuid'));
      var newX = event.center.x - $scope.canvas.offset().left;
      var newY = event.center.y - $scope.canvas.offset().top;

      if(newX < 0 || newX > $scope.canvas.width() || newY < 0 || newY > $scope.canvas.height()) {
        return;
      }

      affectedTransform.updatePoint(point.attr('role'), newX, newY);
      if (affectedTransform) {
        $scope.sendTransformMove(affectedTransform.id, affectedTransform.getVerticePositions());
      }
  }

  $scope.pointTap = function($event) {
      if($scope.snapModeActive) {
          var selectedSnapPoint = angular.element($event.target);
          var points = $scope.pointsToSnap;

          //look if the point is snapped, if so, unsnap
          if($scope.snappedPoints[selectedSnapPoint.attr('uuid') + selectedSnapPoint.attr('role')]) {
            $scope.unsnapPoints($scope.snappedPoints[selectedSnapPoint.attr('uuid') + selectedSnapPoint.attr('role')].concat(selectedSnapPoint));
            return;
          }

          //look if there is already a point from the same transform selected
          var pointFromSameTransform = false;
          points.forEach(function(point){
            if(point.attr('uuid') === selectedSnapPoint.attr('uuid')) pointFromSameTransform = true;
          });
          if(pointFromSameTransform) return;

          //look if the tapped point is already selected
          var pointInSelected = null;
          points.forEach(function(point){
            if(point.attr('uuid') + point.attr('role') == selectedSnapPoint.attr('uuid') + selectedSnapPoint.attr('role')) pointInSelected = point;
          });
          if(!pointInSelected){
            points.push(selectedSnapPoint);
            selectedSnapPoint.addClass('point-selected');
          } else {
            points.splice(points.indexOf(pointInSelected), 1);
            selectedSnapPoint.removeClass('point-selected');
          }

      }
  }

  $scope.snapSelectedPoints = function() {
    if ($scope.pointsToSnap.length > 0) {

        var points = $scope.pointsToSnap;
        var refPoint = points[0];

        points.forEach(function(point1, index1) {
            //set points positions to refPoints position and send to server
            if(point1 != refPoint){
              var affectedTransform = $scope.transformWithUUID(point1.attr('uuid'));
              affectedTransform.updatePoint(point1.attr('role'), parseInt(refPoint.css('left')), parseInt(refPoint.css('top')));
              affectedTransform.perspectiveTransform.update();
              if (affectedTransform) {
                $scope.sendTransformMove(affectedTransform.id, affectedTransform.getVerticePositions());
              }
            }
            //add snapped class
            point1.addClass('point-snapped');

            //now save those snaps in our model
            points.forEach(function(point2, index2) {
                if (index1 !== index2) {
                    var identifier = point1.attr("uuid") + point1.attr("role");
                    if(!$scope.snappedPoints[identifier]) $scope.snappedPoints[identifier] = [];
                    $scope.snappedPoints[identifier].push(point2);
                };
            })
        })
    }
  }

  $scope.unsnapPoints = function(pointsArray) {
    pointsArray.forEach(function(point){
      //remove snapped class
      point.removeClass('point-snapped');
      //delete from snapped points
      delete $scope.snappedPoints[point.attr("uuid") + point.attr("role")];

    });
  }

  // HANDLE TRANSFORM MOVE
  $scope.mouseMove = function($event){
    var affectedTransform;
    if($scope.movingTransform && $event.center){
      affectedTransform = $scope.movingTransform;
      var newPoint = new Point($event.center.x, $event.center.y);
      var deltas = $scope.dragPointDeltas;
      var invalidLayout = false;
      var canvas = $scope.canvas;

      deltas.forEach(function(key, index) {
        var point = newPoint.plus(deltas[index])
        invalidLayout = invalidLayout || point.x < 0 || point.x > canvas.width() || point.y < 0 || point.y > canvas.height();
      });

      if(!invalidLayout) {
        affectedTransform.updatePosition(newPoint, $scope.dragPointDeltas);

        //look out for snapped points
        Object.keys($scope.snappedPoints).forEach(function(key){
          if(key === affectedTransform.id + "tl") {
            moveSnappedPoints($scope.snappedPoints[affectedTransform.id + "tl"], parseInt(affectedTransform.tl.css('left')), parseInt(affectedTransform.tl.css('top')));
          }else if(key === affectedTransform.id + "tr"){
            moveSnappedPoints($scope.snappedPoints[affectedTransform.id + "tr"], parseInt(affectedTransform.tr.css('left')), parseInt(affectedTransform.tr.css('top')));
          }else if(key === affectedTransform.id + "bl"){
            moveSnappedPoints($scope.snappedPoints[affectedTransform.id + "bl"], parseInt(affectedTransform.bl.css('left')), parseInt(affectedTransform.bl.css('top')));
          }else if(key === affectedTransform.id + "br"){
            moveSnappedPoints($scope.snappedPoints[affectedTransform.id + "br"], parseInt(affectedTransform.br.css('left')), parseInt(affectedTransform.br.css('top')));
          }
        });
      }
    }
    // Send to server
    if (affectedTransform) $scope.sendTransformMove(affectedTransform.id, affectedTransform.getVerticePositions());
  }

  function moveSnappedPoints(pointsArray, newX, newY) {
    pointsArray.forEach(function(point){
      var affectedTransform = $scope.transformWithUUID(point.attr('uuid'));
      affectedTransform.updatePoint(point.attr('role'), newX, newY);
      $scope.sendTransformMove(affectedTransform.id, affectedTransform.getVerticePositions())
    });
  }

  $scope.findSnappedPointsForTranformID = function(id) {
    var found = [];
    Object.keys($scope.snappedPoints).forEach(function(pointKey){
      if(pointKey.substr(0, pointKey.length - 2) === id) found = found.concat($scope.snappedPoints[pointKey]);
    });
    return found;
  }

  // HANDLE MOUSE BUTTON RELEASE
  $scope.mouseUp = function($event) {
    $scope.movingTransform = null;
  }

  // DELETE TRANSFORM
  $scope.deleteTransform = function() {
    if($scope.selectedTransform){
      //search for snapped points and remove those snaps
      var snappedPoints = $scope.findSnappedPointsForTranformID($scope.selectedTransform.id);
      if(snappedPoints.length > 0){
        snappedPoints.forEach(function(point){
          var snappedArray = $scope.snappedPoints[point.attr('uuid') + point.attr('role')];
          if(snappedArray.length < 2) {
            delete $scope.snappedPoints[point.attr('uuid') + point.attr('role')];
          } else {
            var indexOfPoint;
            snappedArray.forEach(function(point, index){
              if(point.attr('uuid') === $scope.selectedTransform.id) indexOfPoint = index;
            });
            snappedArray.splice(indexOfPoint, 1);
          }
        });
      }

      $scope.selectedTransform.removeFromDOM();
      var removeIndex = $scope.allTransforms.indexOf($scope.selectedTransform);
      // Send to server
      $scope.sendDelete($scope.selectedTransform.id);
      $scope.selectedTransform = null;
      $scope.allTransforms.splice(removeIndex, 1);
    }
  }

  // CHANGE TRANSFORM TEXTURE
  $scope.changeTexture = function(texture) {
    if($scope.selectedTransform){
      $scope.selectedTransform.setTexture(texture);
      // Send to server
      $scope.sendChangeTexture($scope.selectedTransform.id, texture);
    }
  }

  $scope.loadTextureSet = function(set) {
    var counter = 0;
    set.textures.forEach(function(el) {
      $scope.transformWithUUID(el.rectID).setTexture(el.texture);
      counter++;
      setTimeout(function() {
        $scope.sendChangeTexture(el.rectID, el.texture);
      }, 100 * counter);
    });
    $scope.activeTextureSet = set;
  }

  $scope.canvasTapped = function($event) {
    if($scope.selectedTransform) {
      $scope.selectedTransform.setDeselected();
      $scope.selectedTransform = null;
    }
  }

  // SNAP BEHAVIOUR
  $scope.activateSnapMode = function() {
      $scope.snapModeActive = true;
  }

  $scope.performSnap = function() {
      if($scope.pointsToSnap.length > 1) $scope.snapSelectedPoints();
      $scope.cancelSnap();
  }

  $scope.cancelSnap = function() {
      $scope.snapModeActive = false;
      $scope.pointsToSnap = [];
      angular.element('.point-selected').removeClass('point-selected');
  }

  // HELPER METHODS FOR SENDING
  $scope.sendCreate = function(uuid, verticePositions, texture) {
    Object.keys(verticePositions).forEach(function(key){
        verticePositions[key].scale(1 / $scope.serverClientRatio);
        if($scope.activeBeamer == 2 && $scope.numberOfBeamers > 1){
          verticePositions[key] = verticePositions[key].plus(new Point($scope.beamerOffset, 0));
        }
    });
    var dict = {
      "event_identifier": "create_rect",
      "uuid": uuid,
      "positions": verticePositions,
      "texture": texture
    }
    $scope.sendJSON(dict);
  }

  $scope.sendTransformMove = function(uuid, verticePositions) {
    Object.keys(verticePositions).forEach(function(key) {
        verticePositions[key].scale(1 / $scope.serverClientRatio);
        if($scope.activeBeamer == 2 && $scope.numberOfBeamers > 1) {
          verticePositions[key] = verticePositions[key].plus(new Point($scope.beamerOffset, 0));
        }
    });
    var dict = {
      "event_identifier": "move_rect",
      "uuid": uuid,
      "positions": verticePositions
    }
    $scope.sendJSON(dict);
  }

  $scope.sendChangeTexture = function(uuid, texture) {
    var dict = {
      "event_identifier": "change_texture",
      "uuid": uuid,
      "texture": texture
    }
    $scope.sendJSON(dict);
  }

  $scope.sendDelete = function(uuid) {
    var dict = {
      "event_identifier": "delete_rect",
      "uuid": uuid
    }
    $scope.sendJSON(dict);
  }

  // GENERIC JSON SENDING METHOD
  $scope.sendJSON = function (obj) {
    if (sckt == null || sckt.readyState != 1) {
      sckt.close();
      sckt = connect();
    }
    if (sckt.readyState == 1) {
      sckt.send(angular.toJson(obj));
    }
  }

  // Calculate size for the canvas
  var setupView = function () {
    var viewWidth = angular.element(window).width();
    var usedWidth = angular.element('#buttons').width() + viewWidth - $scope.canvas.parent().width();

    $scope.serverClientRatio = (viewWidth - usedWidth) / $scope.serverConfig.screenWidth * $scope.numberOfBeamers;
    $scope.canvas.width($scope.serverConfig.screenWidth * $scope.serverClientRatio / $scope.numberOfBeamers);
    $scope.canvas.height($scope.serverConfig.screenHeight * $scope.serverClientRatio);
    angular.element('.nav-tabs').width($scope.canvas.width());

    angular.element('.beamer-canvas-2').width($scope.canvas.width());
    angular.element('.beamer-canvas-2').height($scope.canvas.height());

    angular.element('body').on('touchmove', function(e){
      e.preventDefault();
    });
  }

  var message = function (a) {
    //console.log(a);
   };

  // Websocket configuration
  var connect = function () {
    var socket;

    var host = "ws://" + $scope.serverConfig.ip + ":1081";
    socket = new WebSocket(host);

    message('Socket Status: ' + socket.readyState);

    socket.onopen = function () {
      message('Socket Status: ' + socket.readyState + ' (open)');
    };

    socket.onmessage = function (msg) {
      message('Received: ' + msg.data);
    };

    socket.onclose = function () {
      message('Socket Status: ' + socket.readyState + ' (Closed)');
    };

    return socket;
  };

  // Helper functions and properties
  $scope.movingTransform = null;
  $scope.textureSetName;
  $scope.activeTextureSet = null;
  $scope.dragPointDeltas = null;
  $scope.offsetX = null;
  $scope.offsetY = null;
  $scope.selectedTransform = null;
  $scope.allTransforms = [];
  $scope.textureSets = [];
  $scope.serverConfig = new ServerConfig();

  $scope.textures = $scope.serverConfig.textures.map(function(filename){
    return new Texture(filename.substr(0, filename.lastIndexOf('.')) || filename, "http://" + $scope.serverConfig.ip + "/textures/" + filename);
  });

  // Helper function for finding a transform by its uuid
  $scope.transformWithUUID = function(uuid) {
    var matching = $scope.allTransforms.filter(function(tr) {
      return tr.id === uuid;
    });
    if (matching.length > 0) return matching[0]; else return null;
  }

  // Executed on startup
  var sckt = connect();
  setupView();

}

distortArrangeCtrl.$inject = inject;
