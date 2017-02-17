# NOTE #
The THREE.js main file (https://threejs.org/) has been changed at the last line with the following piece of code:

* if ( typeof window !== 'undefined' ) window.THREE = exports;

As detailed [in here](https://github.com/mrdoob/three.js/issues/9602), RequireJS and THREE.js do not go along very well. A possible fix to threeGraph will remove this line in the future.

# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Summary of set up
* Configuration
* Dependencies
* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact