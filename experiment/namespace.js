/*global policyManager ui QuestionManager $ FieldChangeHandler Renderers */
/*jslint eqeqeq: false, white: false, maxlen: 256, 
regexp: false, plusplus: false, nomen: false*/

/**
* documentation style: http://developer.yahoo.com/yui/yuidoc/
* @module STRATUI
* @requires jquery, jquery.json, policyManager
*/
var STRATUI = STRATUI || {};
/**
* Resolves the name property in a given object or STRATUI
* @method nameProperty
* @param str {String} name/path using dot notation
* @param obj {Object} parent object, default STRATUI
* @param prevent {Boolean} prevent creation of missing properties, default TRUE
* @return {Array} namespace[0] (parent object), namespace[1] (property name)
*/
STRATUI.nameProperty = function(str, obj, prevent) {
    var ns = obj || STRATUI,
    k = str.split(".");
    while (k.length > 1) {
        if (!prevent && typeof ns[k[0]] === "undefined") {
            ns[k[0]] = {};
        }
        if (ns[k[0]]) {
            ns = ns[k.shift()];
        } else {
            return;
        }
    }
    return [ns, [k[0]]];
};
/**
* Utility function resolves namespace in STRATUI
* creating an empty object if the namespace is not in
* use and throwing a warning if it does exist
* @method namespace
* @param str {String} name/path using dot notation, STRATUI is stripped
* @return {Boolean|undefined} TRUE if the namespace was reserved
*/
STRATUI.namespace = function(str) {
    var ns = this.nameProperty(str),
    k = str.split(".");
    if (k[0] === "STRATUI") {
        k.shift();
    }
    if (ns && ns[0][ns[1]]) {
        //$.warn(["namespace STRATUI.", k.join("."), " already in use."].join(""));
        return;
    } else {
        ns[0][ns[1]] = {};
    }
    return true;
};
/**
* STRATUI utility helper methods
* @property util
* @type {Object}
* @namespace STRATUI.util
*/
STRATUI.namespace("util");
/**
* Utility function mixes the properties of objects
* resolving conflicts through overwrites.  The objects
* passed last have the highest priority.
* @method mixin
* @param object {Object} any number of objects
* @return {Object} the modified first object parameter
*/
STRATUI.util.mixin = function(/* {Object}, {Object}, ... */) {
    var args = Array.prototype.slice.apply(arguments),
    r = args.shift(), o, m;
    while (args.length) {
        m = args.shift();
        for (o in m) {
            if (m.hasOwnProperty(o)) {
                r[o] = m[o];
            }
        }
    }
    return r;
};
/**
* Utility function adds commas to numbers and 
* strings of numbers
* @method addCommas
* @param v {String|Number}
* @return {String} the modified string
*/
STRATUI.util.addCommas = function(v) {
    var rx = new RegExp('(-?[0-9]+)([0-9]{3})');
    if (typeof v === "number") {
        v = v.toString();
    }
    while (rx.test(v)) {
        v = v.replace(rx, '$1,$2');
    }
    return v;
};
/**
* Utility function returns current day CCYY-MM-DD format
* @method today
* @return {String} today
*/
STRATUI.util.today = function() {
    var d = new Date(),
    curr_year = d.getFullYear(),
    curr_month = d.getMonth() + 1,
    curr_date = d.getDate();
    if (curr_month < 10) {
        curr_month = "0" + curr_month;
    }
    if (curr_date < 10) {
        curr_date = "0" + curr_date;
    }
    return curr_year + "-" + curr_month + "-" + curr_date;
};
/**
* The core class for STRATUI.  This constructor can be
* called like a function with an optional options parameter
* which overrides default configuration.
* @class Class
* @param options {Object} the options parameter
* overrides default configuration
* @namespace STRATUI
* @for STRATUI
* @constructor
*/
STRATUI.Class = function(options) {
    var config = options || {};
    if (!(this instanceof STRATUI.Class)) {
        return new STRATUI.Class(options);
    }
    /**
    * The constructor's name in the STRATUI namespace
    * @property name
    * @type {String}
    */
    this.name = "Class";
    /**
    * Provides access to this config
    * @method privilege
    * @param name {String} method gaining privilege
    * @for Class
    */
    this.privilege = function(/*name, arguments list*/) {
        var args = Array.prototype.slice.apply(arguments),
        name = args.shift();
        args.unshift(config);
        if (typeof name === "function") {
            return name.apply(this, args);
        } else {
            if (this[name]) {
                this[name].apply(this, args);
            }
        }
    };
    /**
    * Return this object's stringified config
    * @method get
    * @param str {String} config path
    * @for Class
    * @return {String} JSON
    * Example: STRATUI.Trav_ACORD.instance.get();
    */
    this.get = function(str) {
        var ns, g = config;
        if (str) {
            ns = STRATUI.nameProperty(str, config, "prevent");
            if (!ns) {
                return;
            }
            g = ns[0][ns[1]];
        }
        if (typeof g === "object") {
            return $.toJSON(g);
        } else {
            return g;
        }
    };
    if (this.init) {
        this.init();
    }
};

/**
* @method _clone
* @private
* @param config {Object} this config
* @param options {Object} overrides
* @return {Object} instance of this constructor
* @for Class
*/
STRATUI.Class.prototype._clone = function(config, options) {
    return new this.constructor(STRATUI.util.mixin({}, config, options));
};

/**
* Creates a new instance with the same configuration
* or a mix of this configuration and the options parameter.
* @method clone
* @param options {Object}
* @for Class
* @return {Object} instance of this constructor
* Example: STRATUI.Symbol().getVehicle("Veh1").clone({"@id": "Veh2"});
*/
STRATUI.Class.prototype.clone = function(options) {
    return this.privilege("_clone", options);
};

/**
* @method _set
* @private
* @param config {Object}
* @param path {String}
* @param value {Varies}
* @for Class
*/
STRATUI.Class.prototype._set = function(config, path, value) {
    var ns = STRATUI.nameProperty(path, config, false);
    ns[0][ns[1]] = value;
};

/**
* @method _mixin
* @private
* @param parent {Object} parent's config object
* @param config {Object} this config
* @param defaults {Object} this constructor's config
* @param options {Object} this instance overrides
* @for Class
*/
STRATUI.Class.prototype._mixin = function(parent, config, defaults, options) {
    STRATUI.util.mixin(config, parent, defaults, options);
};
/**
* This class factory creates a subclass constructor with this instance
* as a __super__ property of the new class, inheriting this instance's
* prototype and configuration.
*
* The new class constructor can be invoked like a function and will
* accept an options parameter which can override default configuration
* as well as a pattern.
*
* Upon instantiation, objects will call their init method if one exists.
* @method subClass
* @param name {String} the reference to the new class
* @param defaults {Object} the default configuration for new
* instances of the new class
* @param pattern {String} (factory), "singleton", "multiton", or "pool"
* @constructor
* @for Class
*/
STRATUI.Class.prototype.subClass = function(name, defaults, pattern) {
    var parent = this,
    ns = STRATUI.nameProperty(name, STRATUI, false);
    ns[0][ns[1]] = function(options) {
        var that, config = {},
        instance = this.constructor.instance;
        if (pattern === "singleton") {
            if ((this instanceof ns[0][ns[1]]) && instance) {
                return instance;
            }
        }
        if (!(this instanceof ns[0][ns[1]])) {
            return new ns[0][ns[1]](options);
        }
        that = this;
        this.name = name;
        /**
        * The parent object
        * @property __super__
        * @type {Object}
        */
        this.__super__ = parent;
        parent.privilege("_mixin", config, defaults, options);
        this.privilege = function(/*name, arguments list*/) {
            var args = Array.prototype.slice.apply(arguments),
            name = args.shift();
            args.unshift(config);
            if (typeof name === "function") {
                return name.apply(this, args);
            } else {
                if (this[name]) {
                    this[name].apply(this, args);
                }
            }
        };
        this.get = function(str) {
            var ns, g = config;
            if (str) {
                ns = STRATUI.nameProperty(str, config, "prevent");
                if (!ns) {
                    return;
                }
                g = ns[0][ns[1]];
            }
            if (typeof g === "object") {
                return $.toJSON(g);
            } else {
                return g;
            }
        };
        if (pattern === "singleton") {
            /**
            * The reference to a singleton
            * @property instance
            * @type {Object}
            */
            this.constructor.instance = that;
        }
        if (pattern === "multiton") {
            if (!this.constructor.instance) {
                /**
                * The instances collection
                * @property instance
                * @type {Array}
                */
                this.constructor.instance = [];
            }
            this.constructor.instance.push(that);
        }
        if (pattern === "pool") {
            if (!this.constructor.index) {
                /**
                * The reference of objects in the pool
                * @property index
                * @type {Object}
                * Example: STRATUI.SymbolVehicle.index
                */
                this.constructor.index = {};
            }
        }
        if (this.init) {
            this.init();
        }
    };
    STRATUI.util.mixin(ns[0][ns[1]].prototype, parent.constructor.prototype);
};

/**
* The base object for STRATUI inheritence
* @property base
* @type {Object}
* @namespace STRATUI
*/
STRATUI.base = STRATUI.Class();

/**
* This class contains application level constants.
* @class Class
* @param options {Object} the options parameter
* overrides default configuration
* @namespace STRATUI
* @for STRATUI
* @constructor
*/
STRATUI.base.subClass("Constants", { CoveragePackageLimit: "4" }, "singleton");

/**
* Gets the value of CoveragePackageLimit.
* @method getCoveragePackageLimit
* @for Constants
* @return {Number} 
*/
STRATUI.Constants.prototype.getCoveragePackageLimit = function() {
    return this.get("CoveragePackageLimit");
};

/**
* This property represents application level constants.
* @property constants
* @type {Object}
* @namespace STRATUI
*/
STRATUI.constants = STRATUI.Constants();

/**
* Contains panel properties and methods
*   id should match the pageid passed to QuestionManager
*   path is the path to the instance in the object pool
* @class Panel
* @extends STRATUI.Class
* @namespace STRATUI
* @constructor
* @param options {Object} configuration overrides
*/
STRATUI.base.subClass("Panel", {
    id: "",
    status: "initial",
    errorContainerId: "",
    DOMcontainer: function (config) {
        return document.getElementById(config.containerId);
    },
    DOMtemplate: function (config) {
        return $(".template", config.container);
    }
}, "pool");

/**
* @method getPanel
* @static
* @param path {String} namespace to panel
* @return {Array}
* @for Panel
*/
STRATUI.Panel.getPanel = function(path) {
    this.index = this.index || {};
    var ns = STRATUI.nameProperty(path, this.index, false);
    return ns[0][ns[1]];
};

/**
* @method validateAll
* @static
* @param path {String} namespace to panel
* @return {Boolean}
* @for Panel
* @example STRATUI.Panel.validateAll("finalSale");
*/
STRATUI.Panel.validateAll = function(path) {
    var obj = this.getPanel(path), valid = true;
    if (obj.name && obj.name === "Panel" && typeof obj.validateAll === "function") {
        valid = obj.validateAll();
    } else {
        for (var o in obj) {
            if (obj.hasOwnProperty(o) && typeof obj[o].validateAll === "function") {
                valid = obj[o].validateAll() && valid;
            }
        }
    }
    return valid;
};

/**
* Sets a key/value combination in Panel's config
* @method set
* @param key {String}
* @param val {Varies}
* @for Panel
*/
STRATUI.Panel.prototype.set = function(key, val) {
    this.privilege("_set", key, val);
};

/**
* Delegates to the validationHandler's validateAll method
* @method validateAll
* @return {Boolean}
* @for Panel
*/
STRATUI.Panel.prototype.validateAll = function() {
    return this.privilege(function(config) {
        var base = config.validationHandler.validateAll(),
        custom = config.customValidation ? config.customValidation(config) : true,
        override = config.overrideValidation ? config.overrideValidation(config) : false;
        return override || custom && base;
    });
};

/**
* Delegates to the validationHandler's remove method
* @method clearError
* @for Panel
*/
STRATUI.Panel.prototype.clearError = function(elm) {
    this.privilege(function(config, elm) {
        config.validationHandler.remove(elm);
    }, elm);
};
/**
* Initializes Panel
* @method init
* @for Panel
*   The calls to render, prefill, fill, and postfill
*   all reference functions in the Panel's config.
*   If the function does not exist, the step is 
*   skipped.  These functions have access to config
*   but do not return values.    
*/
STRATUI.Panel.prototype.init = function() {
    this.privilege("register");
    this.set("status", "building");
    this.privilege("build");
    this.set("status", "rendering");
    this.privilege("render");
    this.privilege("prefill");
    this.set("status", "filling");
    this.privilege("fill");
    this.privilege("postfill");
    this.set("status", "ready");
};

/**
* Runs a custom function.  
* Called by init using privilege method.
* @method prefill
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.prefill = function(config) {
    if (config.prefill && typeof config.prefill === "function") {
        config.prefill.apply(this, [config]);
    }
};

/**
* Runs a custom function.  
* Called by init using privilege method.
* @method postfill
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.postfill = function(config) {
    if (config.postfill && typeof config.postfill === "function") {
        config.postfill.apply(this, [config]);
    }
};

/**
* Runs a custom function.  
* Called by init using privilege method.
* @method render
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.render = function(config) {
    var r = config.render;
    if (r && typeof r === "function") {
        r(config);
    }
};

/**
* Creates context for questions based on values in
* the Trav_ACORD
* @method createContext
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.createContext = function (config) {
    var arr = [], i, len, obj, src, attributeArr = [], attribute, g, glen, c, cachedNames = {}, cn,
    filterFn, filter = function (src) { return true; },
    recur = function (curr, prior, siblings) {
        var j, jlen = arr.length, srcM, k, klen, o, arrCopy = [], arrJ;
        for (j = 0; j < jlen; j += 1) {
            arrJ = arr[j];
            if (siblings) {
                srcM = ui.get(curr.source);
            } else {
                srcM = ui.get(arrJ.path + "_" + curr.source);
            }
            filterFn = curr.filter || filter;
            if (srcM && srcM.length) {
                for (k = 0, klen = srcM.length; k < klen; k += 1) {
                    if (k > 0) {
                        o = {};
                        STRATUI.util.mixin(o, arrJ);
                        if (curr.property === "#") {
                            o[k] = k;
                        } else {
                            o[curr.name] = srcM[k][curr.property];
                        }
                        if (o.synonym) {
                            o[curr.synonym] = o[curr.name];
                        }
                        o.path = o.path.split("=");
                        o.path.splice(o.path.length - 1, 1, o[curr.name]);
                        o.path = o.path.join("=");
                        config.context.index[o[prior.name]].push(o);
                        if (filterFn(srcM[k])) {
                            arrCopy.push(o);
                        }
                    } else {
                        if (curr.property === "#") {
                            arrJ[0] = 0;
                        } else {
                            arrJ[curr.name] = srcM[k][curr.property];
                        }
                        if (curr.synonym) {
                            arrJ[curr.synonym] = arrJ[curr.name];
                        }
                        if (siblings) {
                            arrJ.path = curr.source + "-" + curr.property + "=" + arrJ[curr.name];
                        } else {
                            arrJ.path = arrJ.path + "_" + curr.source + "-" + curr.property + "=" + arrJ[curr.name];
                        }
                    }
                }
            } else {
                arrJ[curr.name] = srcM[curr.property];
                if (curr.synonym) {
                    arrJ[curr.synonym] = arrJ[curr.name];
                }
                arrJ.path = arrJ.path + "_" + curr.source + "-" + curr.property + "=" + arrJ[curr.name];
            }
        }
        if (curr.child) {
            recur(curr.child, curr);
        }
        arr = arr.concat(arrCopy);
    },
    intersect = function (sibling1, sibling2) {
        recur(sibling2, sibling1, true);
    },
    parent = function (ctx) {
        var filterFn = ctx.filter || filter,
            j, jlen, p, plen;
        src = ui.get(ctx.source);
        if (src.length) {
            for (j = 0, jlen = src.length; j < jlen; j += 1) {
                obj = {};
                STRATUI.util.mixin(obj, ctx);
                if (typeof ctx.property === "object") {
                    for (p = 0, plen = ctx.property.length; p < plen; p += 1) {
                        if (ctx.property[p] === "#") {
                            obj["#"] = j;
                            attributeArr.push(j);
                        } else {
                            obj[ctx.name[p]] = src[j][ctx.property[p]];
                            attributeArr.push(ctx.property[p] + "=" + obj[ctx.name[p]]);
                        }

                    }
                    attribute = attributeArr.toString();
                } else {
                    if (ctx.property === "#") {
                        obj["#"] = j;
                        attribute = j;
                    } else {
                        obj[ctx.name] = src[j][ctx.property];
                        attribute = ctx.property + "=" + obj[ctx.name];
                    }
                    if (ctx.synonym) {
                        obj[ctx.synonym] = obj[ctx.name];
                    }
                }

                if (obj.property === "#") {
                    obj.path = ctx.source + "_" + attribute;
                } else {
                    obj.path = ctx.source + "-" + attribute;
                }

                if (filterFn(src[j])) {
                    config.context.index[src[j][ctx.property]] = [obj];
                    arr.push(obj);
                }
            }
        } else {
            obj = {};
            if (ctx.property === "#") {
                obj["#"] = 0;
                obj.path = ctx.source;
                if (filterFn(src)) {
                    config.context.index[ctx.property] = obj;
                    arr.push(obj);
                }
            } else {
                obj[ctx.name] = src[ctx.property];
                obj.path = ctx.source + "-" + ctx.property + "=" + obj[ctx.name];
                if (filterFn(src)) {
                    config.context.index[src[ctx.property]] = [obj];
                    arr.push(obj);
                }
            }
            if (ctx.synonym) {
                obj[ctx.synonym] = obj[ctx.name];
            }
        }
        if (ctx.child) {
            recur(ctx.child, ctx);
        }
        if (ctx.sibling) {
            intersect(ctx, ctx.sibling);
        }
    };
    config.context = { array: [], index: {} };
    if (config.contextMap && config.contextMap.length) {
        for (i = 0, len = config.contextMap.length; i < len; i += 1) {
            parent(config.contextMap[i]);
        }
    }
    config.context.array = arr;
};

/**
* Makes Ids in QuestionManager based on contexts and templates
* @method makeIds
* @param config
* @for Panel
* @return {Array} databinding Ids
*/
STRATUI.Panel.prototype.makeIds = function (config) {
    var qs = config.template, q, len = qs.length, i, d, id,
        ctx = config.context.array, clen = ctx.length, j, c, arr = [];
    if (typeof len === "undefined") {
        qs = [config.template];
        len = 1;
    }
    for (i = 0; i < len; i += 1) {
        q = qs[i];
        d = q["@dataBinding"];
        if (clen) {
            for (j = 0; j < clen; j += 1) {
                c = ctx[j];
                id = QuestionManager.makeId(d, c);
                c.questions = c.questions || [];
                c.questions.push(id);
                c.template = c.template || [];
                c.template.push(d);
                c.index = c.index || {};
                c.index[d] = id;
                arr.push(id);
            }
        } else {
            if (d.indexOf("${") === -1) {
                id = QuestionManager.makeId(d);
                arr.push(id);
            }
        }
    }
    config.questions = arr;
    return arr;
};
/**
* Adds the new Panel to the object pool index 
* Called by init using privilege method.
* @method register
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.register = function(config) {
    var ns = STRATUI.nameProperty(config.path || config.id, this.constructor.index);
    ns[0][ns[1]] = this;
};

/**
* Augments the Panel config
* Called by init using privilege method.
* the fillControl and validationHandler properties may be
* overridden in the Panel initialization
* @method build
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.build = function (config) {
    config.template = QuestionManager.getTemplatesForPage(config.id) || [];
    config.translatorMap = config.translatorMap || {};
    config.container = config.DOMcontainer(config);
    this.createContext(config);
    this.makeIds(config);
    config.validationHandler = config.validationHandler || new FieldChangeHandler({
        viewName: config.id,
        containerName: config.containerId,
        renderers: [
            Renderers.Field(config.containerId),
            Renderers.Row(config.containerId),
            Renderers.TopMessage(config.errorContainerId)
        ]
    });
    config.fillControl = config.fillControl || function (dataBinding) {
        var val = ui.get(dataBinding), t = config.translatorMap[dataBinding];
        if (!t) {
            t = QuestionManager.getTranslatorForQuestion(dataBinding);
            config.translatorMap[dataBinding] = t;
        }
        if (val !== null) {
            STRATUI.dom.$(dataBinding).setUserControlInputValue(t.acordToDisplay(val));
        } else {
            STRATUI.dom.$(dataBinding).setUserControlInputValue("");
        }
    };
};

/**
* Runs a custom or the default fill function.  
* Called by init using privilege method.
* @method fill
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.fill = function(config) {
    var qs = config.questions, i, len = qs.length;
    for (i = 0; i < len; i += 1) {
        config.fillControl(qs[i]);
    }
};

/**
* Used to augment an existing Panel with a sub panel.
* Automatically extends the namespace of the indexed path.
* @method addPanel
* @param config
* @for Panel
* @return {Object} Panel
*/
STRATUI.Panel.prototype.addPanel = function(panel) {
    this.privilege(function(config, panel) {
        var path = panel.get("path"), ns, i, len, arr;
        config.panel = config.panel || {};
        arr = path.split(".");
        config.panel[arr.pop()] = path;
        ns = STRATUI.nameProperty(path, this.constructor.index);
        ns[0][ns[1]] = panel;
    }, panel);
    return this;
};

/**
* Delegates the request to the constructor's static method
* @method getPanel
* @param config
* @for Panel
* @return {Object} Panel
*/
STRATUI.Panel.prototype.getPanel = function(id) {
    return this.privilege(function(config, id) {
        var ns, path;
        if (config.panel && config.panel[id]) {
            path = config.panel[id];
            return this.constructor.getPanel(path);
        }
    }, id);
};

/**
* Helper method to clear all input errors
* @method clearAll
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.clearAll = function (config) {
    var that = this;
    $(":input", config.container).each(function () {
        that.clearError(this);
    });
};

/**
* Runs selected methods to refresh a panel and its data
* @method reload
* @param config
* @for Panel
*/
STRATUI.Panel.prototype.reload = function (config) {
    this.set("status", "reloading");
    this.clearAll(config);
    this.createContext(config);
    this.makeIds(config);
    this.render(config);
    this.fill(config);
    this.validateAll();
    this.set("status", "ready");
};