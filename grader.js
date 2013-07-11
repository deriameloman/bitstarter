#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

 + restler
    - https://github.com/danwrong/restler

 + util
    - http://nodejs.org/docs/latest/api/util.html   
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var util = require('util');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var URL_DEFAULT = "http://morning-garden-1878.herokuapp.com/"
var CHECKSFILE_DEFAULT = "checks.json";

var TEMPFILE = "temp.html";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(inurl) {
    var instr = inurl.toString();
    if(instr.length == 0) {
        console.log("Empty url. Exiting.");
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var checkUrlAndOutJson = function(url, checks) {    

  rest.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      util.puts('Error: ' + result.message);
      this.retry(5000); // try again after 5 sec
    } else {           
      fs.writeFileSync(TEMPFILE, result);                        
      var checkJson = checkHtmlFile(TEMPFILE, checks);         
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }
  });

};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to check', clone(assertUrlExists))
        .parse(process.argv);
    
    if (program.url)  {
      //console.log("Checking %s", program.url);
      checkUrlAndOutJson(program.url, program.checks);          
    }
    else{
      //console.log("Checking %s", program.file);
      var checkJson = checkHtmlFile(program.file, program.checks);         
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }  
         
} else {
    exports.checkHtmlFile = checkHtmlFile;
}