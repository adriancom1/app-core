'use strict';

/**
* Helper 'class' that checks for a valid URL string.
* Rendition types and thier respective QueryParameters
* are also validated.
*/


// Export public modules
module.exports = exports = AssertUrl;


// @urlToTest 'String' that represents a Url path 
function AssertUrl(urlToTest){
    if(typeof urlToTest !== 'string') return null;
    this.url = urlToTest;
    // Convert all special chars to a string
    this.specialChars = urlToTest.match(/\W/g).join(""); 
};

// RegEx Expression that parses the suffix types from the URL
AssertUrl.regQueryParams = /(?:\.h)t(?:ml|m)(?!\w)|(?:\.j)so(?:np|n)(?!\w)|(?:\.pos|edi)(?:t)(?!\w)/;

// If string to test has value
AssertUrl.prototype.contains = function(stringToTest, charToTest) {
    return (!~stringToTest.indexOf(charToTest) == 0) ? true : false;
};

// Returns 'false' if the Url path name validation failed
AssertUrl.prototype.validate = function() {
    var url = this.url;
    var chars = this.specialChars;
    var has = this.contains.bind(this, chars);
    var hasText = this.contains.bind(this, url);

    if(has('?') && !has('=')) return false;
    if(has('?') && has('&') && !has('=')) return false;
    if(has('.')) {
        if(url.match(AssertUrl.regQueryParams) === null) return false;
		if(hasText('jsonp') && !hasText('callback')) return false;
		if(hasText('post') && !hasText('data')) return false;
    }
    return true; 
};