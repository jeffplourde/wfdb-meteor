
var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;
    // console.log("dpr", dpr, "bsr", bsr);
    return dpr / bsr;
})();

var makeHiPPICanvas = function(canvas) {
  if(!canvas.pixelRatio || PIXEL_RATIO != canvas.pixelRatio) {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * PIXEL_RATIO;
    canvas.height = oldHeight * PIXEL_RATIO;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    canvas.pixelRatio = PIXEL_RATIO;

  }
  return canvas;
}


function isElementInViewport (el) {
  //special bonus for those using jQuery
  if (el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();

  // Changed from original to return true even if the element is clipped (not fully displayed)

  return (
    rect.top >= -el.height &&
    rect.left >= -el.width &&
    rect.bottom <= (el.height + (window.innerHeight || document.documentElement.clientHeight)) && /*or $(window).height() */
    rect.right <= (el.width + (window.innerWidth || document.documentElement.clientWidth)) /*or $(window).width() */
  );
}

function Renderer(args) {
  this.canvas = args.canvas;
  this.canvas = makeHiPPICanvas(this.canvas);
  this.row = args.row;
  this.continuousRescale = args.continuousRescale || false;
  this.overwrite = args.overwrite || false;	

  Object.defineProperty(this, "minY", {
    get: function() {
      return this.fixedMinY || this.__minY;
    },
    set: function(value) {
      this.__minY = value;
    }
  });

  Object.defineProperty(this, "maxY", {
    get: function() {
      return this.fixedMaxY || this.__maxY;
    },
    set: function(value) {
      this.__maxY = value;
    }
  });

  this.minY = Number.MAX_VALUE;
  this.maxY = Number.MIN_VALUE;
  this.fixedMaxY = args.fixedMaxY;
  this.fixedMinY = args.fixedMinY;
  if(args.range) {
    this.fixedMinY = args.range[0];
    this.fixedMaxY = args.range[1];
  }
  this.gap_size = 0.05;
  this.background = args.background || "#FFFFFF";
  this.color = args.color || "#000000";
  this.textColor = args.textColor || "#000000";
  Object.defineProperty(this, "textFont", {
    get: function() {
      return this.__textFont;
    },
    set: function(value) {
      this.__textFont = value;
      this.__textFontSize = +value.match(/[0-9]+/);
    }
  });
  this.textFont = args.textFont || (PIXEL_RATIO*12)+"px Arial";
  Object.defineProperty(this, "textFontSize", {
    get: function() {
      return this.__textFontSize;
    }
  });
  this.lineWidth = args.lineWidth || 1;
  this.borderWidth = args.borderWidth || 0;
  this.borderColor = args.borderColor || "#000000";
  this.fillArea = args.fillArea || false;
}

// module.exports = exports = Renderer;

var DASHES = 21;

Renderer.prototype.render = function(t1, t2, s1, s2) {
  if(!isElementInViewport(this.canvas)) {
    return;
  }

  var ctx = this.canvas.getContext("2d");
  makeHiPPICanvas(this.canvas);
  ctx.save();
  var height = this.canvas.height;
  var width = this.canvas.width;

  ctx.fillStyle=this.background;
  ctx.fillRect(0,0,width,height);

  // ctx.beginPath();

  if(this.continuousRescale) {
  	this.minY = Number.POSITIVE_INFINITY;
  	this.maxY = Number.NEGATIVE_INFINITY;
  }

  var t0 = 0;
  if(this.overwrite) {
  	t0 = t2 - t2 % (t2 - t1);
  }

  if(true) {
    var domain = t2 - t1;

    // Draw vertical lines
    for(var t = t1; t <= t2; t+=200) {
      var x = (t-t1)/domain*width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#e19aab';
      ctx.stroke();
    }

    if(!this.continuousRescale) {
      var range = this.maxY - this.minY;
      for(var v = this.minY; v <= this.maxY; v += 0.5) {
        var y = (v - this.minY)/range*height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#e19aab';
        ctx.stroke();
      }
    }
  }

  if(false) {
    // draw timestamps
    s1 = s1 || moment(t1).format('HH:mm:ss');
    s2 = s2 || moment(t2).format('HH:mm:ss');
    ctx.font = this.textFont;
    ctx.fillStyle = this.textColor;

    if(this.overwrite) {
      var s0 = moment(t0).format('HH:mm:ss');
      ctx.fillText(s0, 0, height);
    } else {
      ctx.fillText(s1, 0, height);

      var smid = moment(t1+(t2-t1)/2).format('HH:mm:ss');
      ctx.moveTo(width/2, 0);
      for(var i = 0; i < DASHES; i++) {
        if(1==i%2) {
          ctx.lineTo(width/2,((i+1)/DASHES)*(height-this.textFontSize-5));
          ctx.stroke();  
        } else {
          ctx.moveTo(width/2,((i+1)/DASHES)*(height-this.textFontSize-5));
        }
      }
      ctx.fillText(smid, width/2 - ctx.measureText(smid).width / 2, height);
      ctx.fillText(s2, width - ctx.measureText(s2).width, height);
    }
    height -= this.textFontSize + 5; 
  }

  if(this.borderWidth > 0) {
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = PIXEL_RATIO * this.borderWidth;
    ctx.strokeRect(ctx.lineWidth/2,ctx.lineWidth/2,width-ctx.lineWidth,height-ctx.lineWidth);
    width -= 2 * ctx.lineWidth + 4;
    height -= 2 * ctx.lineWidth + 4;
    ctx.translate(ctx.lineWidth+2,ctx.lineWidth+2);
  }

  ctx.beginPath();

  ctx.lineWidth = PIXEL_RATIO * this.lineWidth;
  ctx.strokeStyle = this.color;
  ctx.fillStyle = this.color;


  var aged_segment = true;
  var started = false;
  var msPerSample = 100; // 1000 / this.row.keyValues.frequency;
  var lastTime = null;
  var lastValue = 0;
  var lastX = 0, firstX = Number.NaN;
  var count = 0;

  var self = this;
  this.row.forEach(function(row) {
    if(row.valueSampledData) {
      var endTime = row.appliesDateTime;
      var period = row.valueSampledData.period;
      var msPerSample = period;
      var values = row.valueSampledData.data.split(' ');

      for(var i = 0; i < values.length; i++) {

    	  var time = endTime - (values.length - i) * period;
    	  var value = values[i];
      
    	  if(time>=t1&&time<t2) {
    	  	self.minY = Math.min(value, self.minY);
    	  	self.maxY = Math.max(value, self.maxY);
    	  	if(self.maxY == self.minY) {
    	  		self.maxY = self.minY + 0.01;
    	  	}
    	  } else {
          continue;
        }
        count++;
        var x_prop = -1;
        if(self.overwrite) {
          var split_prop = 1 * (t2 - t0) / (t2 - t1);
          if(time >= t0 && time < t2) {
            // the newer data (left)
            if(aged_segment) {
              aged_segment = false;
              started = false;
            }
            x_prop = 1 * (time - t0) / (t2-t0);
            x_prop *= split_prop;
          } else if(time >= t1 && time < t0) {
            // the older data (right)
            x_prop = 1 * (time - t1) / (t0-t1);
            x_prop *= (1-split_prop);
            if(x_prop < self.gap_size) {
              x_prop = -1;
            } else {
              x_prop += split_prop;
            }
          } else {
            x_prop = -1;
          }
        } else {
          x_prop = 1 * (time - t1) / (t2-t1);
        }
      
        var y_prop = 1 * (value - self.minY) / (self.maxY-self.minY);
      
        var x = x_prop * width;
        var y = height - (y_prop * height);

        if(x_prop>=0&&x_prop<1&&y_prop>=0&&y_prop<1) {
          if(started) {
            lastX = x;
            if(isNaN(firstX)) {
              firstX = x;
            }
            // There is a gap in the data
            // TODO self won't work correctly with fill area!
            if(time > (lastTime + msPerSample+10)) {
              ctx.stroke();
              ctx.moveTo(x,y);
            } else {
              ctx.lineTo(x,y);
            }
          } else {
            if(self.fillArea) {
              ctx.moveTo(x, height - height * ((self.minY>0?self.minY:0) - self.minY) / (self.maxY - self.minY));
              ctx.lineTo(x,y);
            } else {
              ctx.moveTo(x,y);
            }
            started = true;
          }
        }
        lastTime = time;
        lastValue = value;
      }
    }
  });
  // console.log(count, this.minY, this.maxY);
  if(this.fillArea) {
    ctx.lineTo(lastX, height - height * ((this.minY>0?this.minY:0) - this.minY) / (this.maxY - this.minY));
    ctx.lineTo(firstX, height - height * ((this.minY>0?this.minY:0) - this.minY) / (this.maxY - this.minY));
    ctx.fill();
  } else {
    ctx.stroke();
  }
  ctx.restore();
}

window.Renderer = Renderer;

