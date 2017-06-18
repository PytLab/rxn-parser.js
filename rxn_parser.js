/* Javascript version of chemical reaction expression parser.
 * Author: PytLab <shaozhengjiang@gmail.com>
 * Date: 2017-06-18
 */

"use restrict";

/* Class for chemical formula object. */
var ChemFormula = function(formula) {
    this.formula = formula;
    this.split();
};

/* Query functions for private variables */
Object.defineProperties(ChemFormula.prototype, {

    formulaRegex: { // regession expression for formla match
        get: function() { return /(\d*)(([\w\*-]*)_(\d*)([a-z\*]+))/; },
    },

    spRegex: { // regession expression for species match
        get: function() { return /([a-zA-Z\*])(\d*)/g; },
    }

});

/* Prototype methods defintions for ChemFormula */

/* Get essential components */
ChemFormula.prototype.split = function() { if (this.formulaRegex.test(this.formula)) {
        var match = this.formulaRegex.exec(this.formula);
        this.stoich = match[1] ? parseInt(match[1]) : 1;  // stoichiometric
        this.species_site = match[2];                     // species and site
        this.species = match[3];                          // species name
        this.site = match[5];                             // site name
        this.nsite = match[4] ? parseInt(match[4]) : 1;   // site number
    } else {
        throw new Error('Invalid chemical formula' + this.formula);
    }
};

/* Species type query function */
ChemFormula.prototype.type = function() {
    if (this.site == 'g') {
        return 'gas';
    } else if (this.site == 'l') {
        return 'liquid';
    } else if (this.species_site.indexOf('*') != -1) {
        return 'site';
    } else {
        return 'adsorbate';
    }
};

/* Return an object containing atom type and its number in a species name */
ChemFormula.prototype.getElementNumber = function() {
    var species = this.species;

    // Empty site
    if (species == '*') { return {}; }

    // Not an empty site
    var element_number = {};
    var matches = species.match(this.spRegex);

    for (var i = 0; i < matches.length; i++) {
        var match = this.spRegex.exec(matches[i]);

        var element = match[1];
        var number = match[2] ? parseInt(match[2]) : 1;

        if (element in element_number) {
            element_number[element] += number;
        } else {
            element_number[element] = number;
        }
    }

    // Multiple the stoich.
    for (elem in element_number) {
        element_number[elem] *= this.stoich;
    }

    return element_number;
};

/* Return the site type and its number */
ChemFormula.prototype.getSiteNumber = function() {
    var siteNumber = {}
    siteNumber[this.site] = this.stoich*this.nsite;
    return siteNumber;
};

/* Helper function to determine equality of two SIMPLE object */
var isEquivalent = function(objA, objB) {
    var propsA = Object.getOwnPropertyNames(objA);
    var propsB = Object.getOwnPropertyNames(objB);

    if (propsA.length != propsB.length) {
        return false;
    }

    for (prop in objA) {
        if (!(prop in objB)) {
            return false;
        }
        if (objA[prop] != objB[prop]) {
            return false;
        }
    }

    return true;
};

/* Check the coservation of two ChemFormula object */
ChemFormula.prototype.conserve = function(another) {
    if (another.constructor != ChemFormula) {
        var msg = "Parameter another must be instance of ChemFormula";
        throw new Error(msg);
    }

    // Check element number.
    var elemNum1 = this.getElementNumber();
    var elemNum2 = another.getElementNumber();

    if (!isEquivalent(elemNum1, elemNum2)) {
        var msg = ''
            + 'Mass of chemical formula '
            + this.formula
            + ' and '
            + another.formula
            + ' are not conservative';
        throw new Error(msg);
    }

    // Check site number.
    var siteNum1 = this.getSiteNumber();
    var siteNum2 = another.getSiteNumber();

    if (!isEquivalent(siteNum1, siteNum2)) {
        var msg = ''
            + 'Site of chemical formula '
            + this.formula
            + ' and '
            + another.formula
            + ' are not conservative';
        throw new Error(msg);
    }

    return true;
};

// Export to NodeJS module.
if (typeof exports != 'undefined') {
    exports.ChemFormula = ChemFormula;
}

