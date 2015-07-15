Package.describe({
  summary: "WaveForm DataBase"
});

Npm.depends({wfdb: "0.0.5"});

Package.on_use(function(api) {
  api.export('WFDB');
 api.addFiles("wfdb.js", "server");
});
