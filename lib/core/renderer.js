'use strict';

/**
* RenderManager is a Manager 'Class' that 
* takes care of processing the rendition type objects.
* A rendition type can be (html, json, etc). 
* RenderManager will return either a system managed Renderer object
* that will handle each renditon type or an override object that is
* provide in the main App Route config.
* Author: Adrian Sanoguel
*/


// Exports public modules
module.exports = exports = RenderManager;


// * A @Route routeHandler function is accepted as the input.
function RenderManager(routeHandler) {
    /**
    * @isManaged (internal) indicates if the Resource handling
    * will be managed by the RenderManager (this object) or by the
    * override function 'routeHandler' object
    * @true = Implement the System Managed Renditions
    * @false = Override
    */
    this._isManaged = (typeof routeHandler !== 'function') ? true : false;
    /* Renderer wrapper for the handler */
    this.handler = Renderer.call(this, routeHandler);
};

RenderManager.prototype = {
    renditions : {
        // TODO: This is going to come from another module
        html : function() {
            return 'This is the HTML';
        },
        json : function(resource) {
            var self = this;
            return resource.getResource().once("data", function(data) {
                resource.onComplete(data);
            });
        },
    },
    /**
    * A Resource Handler will process the output for all of the 
    * rendition types (json, html, etc).
    */
    handleResourceRequest : function() {
        // The handler is a Renderer wrapper object
        return this.handler.apply(this, arguments /*@ResourceMap*/);
    },
    // Is Resource handled by the system
    isResourceRequest : function() {
        return this._isManaged;
    },
    getRenditionTypes : function() {
        return this.renditions;
    },

};

/** 
* Constructs a Static Renderer 'Class' with static
* member properties.
*/
function Renderer() {
    var Renderer;
    // Context of 'this' is applied from the RenderManager
    var renderMgr = this;
    if(this.isResourceRequest()) {
        // renditions is a function that returns a collction of rendition objects
        var renditions = renderMgr.getRenditionTypes();
        Renderer = function(resource) {
            resource.render(renditions);
        };
    } else {
        // Override function handler
        Renderer = arguments[0];
    };
    return Renderer;
};
