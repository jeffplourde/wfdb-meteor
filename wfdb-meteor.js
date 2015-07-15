var recordName = 'mimic2wdb/30/3000003/3000003'; 
var signalName = recordName + '/II';
  
Items = new Meteor.Collection(signalName);

if(Meteor.isClient) {
    Meteor.subscribe(signalName);
    var renderer;

    Template.body.helpers({
        data: function() {
          return Items.find({}, {sort: {appliesDateTime: 1}});
        }, count: function() {
          return Items.find().count();
        }, range: function() {
          return renderer.minY + "-" + renderer.maxY;
        }, signal: function() {
            return signalName;
        }
    });
    Template.d.helpers({
        format: function() {
            return JSON.stringify(this, null, 4);
        }    
    });
    window.onload = function(c) {
        renderer = new Renderer({canvas: document.getElementById("plot"), row: Items.find(), continuousRescale: false,
            fixedMinY: -1.5, fixedMaxY: 2.5, lineWidth: 0.60});
        setInterval(function() {
            var now = Date.now();
            var t1 = now - 10000 - 2000;
            var t2 = now - 2000;
      
            var s1 = moment(t1).format('HH:mm:ss');
            var s2 = moment(t2).format('HH:mm:ss');

            renderer.render(t1, t2, s1, s2);
        }, 100);
    };
}

if(Meteor.isServer) {
  Meteor.publish(signalName, function () {
    return Items.find({}, {sort: {appliesDateTime: 1}});
  });

  var insert = Meteor.bindEnvironment(function(fhir) {
    Items.insert(fhir);
  });
  var remove = Meteor.bindEnvironment(function(id) {
    Items.remove(id);
  });

  Meteor.startup(function () {
    Items.remove({});
    var header;
    var locator = new WFDB.CachedLocator('data/', 'http://physionet.org/physiobank/database/');
    var wfdb = new WFDB(locator);

    var cache = [];
    new WFDB.Playback(wfdb).playFromFile(recordName, {activeWindowMs: 30000, startTime: 120000, loop:true}, function(res) {
      res
      .on('header', function(h) {
        header = h;
      })
      .on('sample', function(name, mydata) {
        if(name == signalName) {
          if(cache.length == header.sampling_frequency) {
            var fhir = 
            {
              _id: ''+mydata.tm,
              valueSampledData: {
                  origin: {
                      value: 0,
                      'units': 'mV'
                  },
                  period: 1000 / header.sampling_frequency,
                  data: cache.join(" ")
              },
              appliesDateTime: new Date(mydata.tm)
            };
            cache.length = 0;
            insert(fhir);
            
          }
          cache.push(mydata.val.toFixed(3));
        }        
      })
      .on('delete', function(name, myid) {
        if(name == signalName) {
          remove(''+myid);
        }
      })
      .on('error', function(error) {
        console.error("error", error);
      });   
    });
  });

}