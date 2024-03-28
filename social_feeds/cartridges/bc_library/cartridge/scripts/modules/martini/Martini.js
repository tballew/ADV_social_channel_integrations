/**
 * A typical mixer to mix in mixins into an object
 *
 * It adds all properties of a mixin to the object being mixed in. If there are collisions the mixin
 * overrides the mixedin property. This is not true if the overridden property and the overriding property
 * are both functions. Then the functions are lineralized. First the overridden method is called and then
 * the overriding method. The furthest function to the left of the lineralized functions returning a value
 * will be returned to the callee.
 *
 * Example: A will be mixed into. It defines a method go(). Mixin B and C are both mixed in into A (in that order)
 * and both define a method go() too. Then after mixing in, if go() is called on the resulting object
 * first A's go() will be called followed by the go()s of B and C.
 *
 */

var Martini = function () {
};

/**
 * @function Martini.mixin
 * @param {Object} mixedIn Object to which mixins are added
 * @param  {...Object} mixin a variable number of mixins
 *
 */
Martini.mixin = function (mixedIn) {
    /**
     * check if it is a function
     *
     * @return {boolean}
     */
    var isFunction = function (obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    };
    /**
     * check if it is a native object
     *
     * @return {boolean}
     */
    var isObject = function (obj) {
        return !!(typeof obj === 'object' && !Array.isArray(obj));
    };

    /* if object to mix into is not an object return */
    if (!mixedIn || typeof mixedIn !== 'object' || Array.isArray(mixedIn)) {
        return;
    }

    var args = Array.prototype.slice.call(arguments);
    var mixins = args;

    mixins.shift();

    for (var index in mixins) {
        var mixin = mixins[index];
        /* do not mixin not enumerable properties */
        for (var property in mixin) {
            /* Do not allow mixin with itself */
            if (mixin[property] === mixedIn[property]) {
                continue;
            }

            /* if property of mixin is method and
            			*  it overrides a method of the object
            			*  to mixin, else simply override what is on
            			*  the mixed in object
            			*/
            if (isFunction(mixin[property])
                && isFunction(mixedIn[property])) {
                /* first call original method of mixed in
                				*  and then call overriding method */
                mixedIn[property] = (function (overridden, overriding) {
                    return function () {
                        var returnValueOverridden = overridden.apply(this, arguments);
                        var returnValueOverriding = overriding.apply(this, arguments);

                        return returnValueOverridden || returnValueOverriding;
                    };
                }(mixedIn[property], mixin[property]));
            } else {
                mixedIn[property] = mixin[property];
            }
        }
    }
};

if (typeof (exports) !== 'undefined') {
    exports.Martini = Martini;
}
