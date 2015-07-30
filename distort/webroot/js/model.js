
//Model object for a Perspective Transform
function Transform(scope, compiler) {
  var instance = this;
  this.id = uuid();

  //generate html for transform
  this.allHTMLElements = [];
  this.transformElement = angular.element('<div hm-dragstart=transformMD($event) hm-drag=mouseMove($event) hm-tap=transformMD($event) class=rect uuid=' + this.id + '></div>')
  this.transformElement.css('width', standardWidth);
  this.transformElement.css('height', standardHeight);
  this.allHTMLElements.push(this.transformElement);
  this.perspectiveTransform = new PerspectiveTransform(this.transformElement[0], standardWidth, standardHeight, true);

  //generate drag points for the element
  this.tl = angular.element("<div class=pt uuid=" + this.id + " role=tl hm-drag=pointDrag($event) hm-tap=pointTap($event)></div>");
  this.tr = angular.element("<div class=pt uuid=" + this.id + " role=tr hm-drag=pointDrag($event) hm-tap=pointTap($event)></div>");
  this.bl = angular.element("<div class=pt uuid=" + this.id + " role=bl hm-drag=pointDrag($event) hm-tap=pointTap($event)></div>");
  this.br = angular.element("<div class=pt uuid=" + this.id + " role=br hm-drag=pointDrag($event) hm-tap=pointTap($event)></div>");


  //synchronize drag points position
  this.tl.css({
    left : this.perspectiveTransform.topLeft.x,
    top : this.perspectiveTransform.topLeft.y
  });
  this.tr.css({
    left : this.perspectiveTransform.topRight.x,
    top : this.perspectiveTransform.topRight.y
  });
  this.bl.css({
    left : this.perspectiveTransform.bottomLeft.x,
    top : this.perspectiveTransform.bottomLeft.y
  });
  this.br.css({
    left : this.perspectiveTransform.bottomRight.x,
    top : this.perspectiveTransform.bottomRight.y
  });

  this.allHTMLElements.push(this.tl);
  this.allHTMLElements.push(this.tr);
  this.allHTMLElements.push(this.bl);
  this.allHTMLElements.push(this.br);

  //compile html into angular controller and insert into dom
  this.allHTMLElements.forEach(function(element) {
    compiler(element)(scope);
    scope.canvas.append(element);
  });

  this.removeFromDOM = function() {
    this.allHTMLElements.forEach(function(element) {
      element.remove();
    });
  }

  this.updatePosition = function(newPoint, deltas) {
    instance.updatePoint("tl", newPoint.plus(deltas[0]).x, newPoint.plus(deltas[0]).y);
    instance.updatePoint("tr", newPoint.plus(deltas[1]).x, newPoint.plus(deltas[1]).y);
    instance.updatePoint("bl", newPoint.plus(deltas[2]).x, newPoint.plus(deltas[2]).y);
    instance.updatePoint("br", newPoint.plus(deltas[3]).x, newPoint.plus(deltas[3]).y);
  }

  this.updatePoint = function(role, newX, newY) {
    var transformPoint;
    var targetPoint;

    switch(role) {
    case "tl":
        transformPoint = this.perspectiveTransform.topLeft;
        targetPoint = this.tl;
        break;
    case "tr":
        transformPoint = this.perspectiveTransform.topRight;
        targetPoint = this.tr;
        break;
    case "bl":
        transformPoint = this.perspectiveTransform.bottomLeft;
        targetPoint = this.bl;
        break;
    case "br":
        transformPoint = this.perspectiveTransform.bottomRight;
        targetPoint = this.br;
        break;
      }

      transformPoint.x = newX;
      transformPoint.y = newY;
      targetPoint.css({left: transformPoint.x, top: transformPoint.y});
      this.perspectiveTransform.update();
  }

  this.setSelected = function() {
    this.transformElement.addClass('selected');
  }

  this.setDeselected = function() {
    this.transformElement.removeClass('selected');
  }

  this.setTexture = function(texture) {
      this.transformElement.css('background-image', 'url(' + texture.url + ')');
      this.texture = texture;
  }

  this.getVerticePositions = function() {
    return {
      "top_left": new Point(this.perspectiveTransform.topLeft.x, this.perspectiveTransform.topLeft.y),
      "top_right": new Point(this.perspectiveTransform.topRight.x, this.perspectiveTransform.topRight.y),
      "bottom_left": new Point(this.perspectiveTransform.bottomLeft.x, this.perspectiveTransform.bottomLeft.y),
      "bottom_right": new Point(this.perspectiveTransform.bottomRight.x, this.perspectiveTransform.bottomRight.y)
    }
  }
  this.getVerticePositionsArray = function() {
    return [
      new Point(this.perspectiveTransform.topLeft.x, this.perspectiveTransform.topLeft.y),
      new Point(this.perspectiveTransform.topRight.x, this.perspectiveTransform.topRight.y),
      new Point(this.perspectiveTransform.bottomLeft.x, this.perspectiveTransform.bottomLeft.y),
      new Point(this.perspectiveTransform.bottomRight.x, this.perspectiveTransform.bottomRight.y)
    ]
  }
  this.setVerticePositionsArray = function(positions) {
    instance.updatePoint("tl", positions[0].x, positions[0].y);
    instance.updatePoint("tr", positions[1].x, positions[1].y);
    instance.updatePoint("bl", positions[2].x, positions[2].y);
    instance.updatePoint("br", positions[3].x, positions[3].y);
  }

}


// Model Object for a Point in 2D Space
function Point(x, y) {
  this.x = x;
  this.y = y;
  this.minus = function(subtrahend) {
    return {"x": this.x - subtrahend.x,"y":this.y - subtrahend.y};
  }
  this.plus = function(summand) {
    return {"x": this.x + summand.x,"y":this.y + summand.y};
  }
  this.scale = function(factor) {
    this.x = Math.round(this.x*factor);
    this.y = Math.round(this.y*factor);
  }
}


//Simple model object for a texture
function Texture(name, url) {
  this.name = name;
  this.url = url;
}

function textureSet(name) {
  this.name = name;
  this.textures = [];
  this.addTexture = function(rectID, texture) {
    this.textures.push({rectID: rectID, texture: texture});
  };
}

//helper function

function uuid(a){
  return a           // if the placeholder was passed, return
  ? (              // a random number from 0 to 15
    a ^            // unless b is 8,
    Math.random()  // in which case
    * 16           // a random number from
    >> a/4         // 8 to 11
  ).toString(16) // in hexadecimal
  : (              // or otherwise a concatenated string:
    [1e7] +        // 10000000 +
    -1e3 +         // -1000 +
    -4e3 +         // -4000 +
    -8e3 +         // -80000000 +
    -1e11          // -100000000000,
  ).replace(     // replacing
    /[018]/g,    // zeroes, ones, and eights with
    uuid            // random hex digits
  )
}
