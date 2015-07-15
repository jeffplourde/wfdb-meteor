WFDB for Meteor
===============

Getting Started
--------------

* Make sure you've installed [meteor](https://www.meteor.com/install)

* Clone this repo
```bash
git clone https://github.com/jeffplourde/wfdb-meteor.git
cd wfdb-meteor
```

* Run meteor
```bash
meteor
```

* Connect your browser to app running at [http://localhost:3000](http://localhost:3000)

Rationale
---------
A motivation of the wfdb project was to make waveform data widely available for server-side javascript development.
Because of that availability the package can be used in a meteor app to stream realtime waveform data to meteor client.

Caveats
-------
* Note that by default a __data/__ directory will be added in the current working directory to cache waveform database files.

* Currently the signal used is hardcoded
