/* Javascript version of chemical reaction expression parser.
 * Author: PytLab <shaozhengjiang@gmail.com>
 * Date: 2017-06-18
 */

"use restrict";

// Extend String trim method.
if (typeof(String.prototype.trim) === 'undefined') {
    String.prototype.trim = function() {
        return String(this).replace(/^\s+|\s+/g, '');
    };
}

// Custom exception type.
var RxnEquationError = function(message, htmlMsg) {
    this.name = 'RxnEquationError';
    this.message = message || 'Invalid reaction equation expression';
    this.htmlMsg = htmlMsg || this.message;
};

RxnEquationError.prototype = Object.create(Error.prototype);
RxnEquationError.prototype.constructor = RxnEquationError;

/* Class for chemical reaction equation */
var RxnEquation = function(rxnEquation) {
    this.rxnEquation = rxnEquation;
    this.chemStates = this.toList();
};

Object.defineProperties(RxnEquation.prototype, {
    stateRegex: {
        get: function() {
            return /([^\<\>]*)(?:\<?\-\>)(?:([^\<\>]*)(?:\<?\-\>))?([^\<\>]*)/;
        },
    }
});

/* Split the rxn equation to state list */
RxnEquation.prototype.toList = function() {
    if (!this.stateRegex.test(this.rxnEquation)) {
        var msg = 'Invalid reaction equation: ' + this.rxnEquation;
        var htmlMsg = ''
            + 'Invalid reaction equation: '
            + '<span style="font-family: Courier New, consola">'
            + this.rxnEquation
            + '</span>'
        throw new RxnEquationError(msg, htmlMsg);
    }

    var match = this.stateRegex.exec(this.rxnEquation);
    var chemStates = [];
    for (var i = 1; i < 4; i++) {
        if (match[i] != undefined) {
            chemStates.push(new ChemState(match[i].trim()));
        }
    }

    return chemStates;
};

/* Split the rxn equation to formula list */
RxnEquation.prototype.toFormulaList = function() {
    var formulaList = [];
    var chemStates = this.toList();
    for (var i = 0; i < chemStates.length; i++) {
        formulaList.push(chemStates[i].toList());
    }

    return formulaList;
};

/* Check equation conservation */
RxnEquation.prototype.checkConservation = function() {
    var chemStates = this.toList();

    var first = chemStates[0];
    for (var i = 1; i < chemStates.length; i++) {
        first.conserve(chemStates[i]);
    }

    // If passed all checks, return true.
    return true;
};


/* Class for chemical state */
var ChemState = function(chemState) {
    this.chemState = chemState;
    this.formulaList = this.toList();
};

/* Split the chemical state to formula list */
ChemState.prototype.toList = function() {
    var formulaList = [];
    var formulaStrs = this.chemState.split('+');
    for (var i = 0; i < formulaStrs.length; i++) {
        var formula = new ChemFormula(formulaStrs[i].trim());
        formulaList.push(formula);
    }

    return formulaList;
};

/* Get element names and its number pairs */
ChemState.prototype.getElementNumber = function() {
    var formulaList = this.toList();
    var elemNum;
    var mergedElemNum = {};

    for (var i = 0; i < formulaList.length; i++) {
        elemNum = formulaList[i].getElementNumber();
        for (var elem in elemNum) {
            if (elem in mergedElemNum) {
                mergedElemNum[elem] += elemNum[elem];
            } else {
                mergedElemNum[elem] = elemNum[elem];
            }
        }
    }

    return mergedElemNum;
};

/* Get site name and its number pairs */
ChemState.prototype.getSiteNumber = function() {
    var formulaList = this.toList();
    var siteNum;
    var mergedSiteNum = {};

    for (var i = 0; i < formulaList.length; i++) {
        siteNum = formulaList[i].getSiteNumber();
        for (var site in siteNum) {
            if (site in mergedSiteNum) {
                mergedSiteNum[site] += siteNum[site];
            } else {
                mergedSiteNum[site] = siteNum[site];
            }
        }
    }

    return mergedSiteNum;
};

/* Check the conservation of two chemical state object */
ChemState.prototype.conserve = function(another) {
    if (another.constructor != ChemState) {
        var msg = 'Parameter another must be a instance of ChemState';
        throw new RxnEquationError(msg);
    }

    // Check element number.
    var elemNum1 = this.getElementNumber();
    var elemNum2 = another.getElementNumber();

    if (!isEquivalent(elemNum1, elemNum2)) {
        var msg = ''
            + 'Mass of chemical state '
            + this.chemState
            + ' and '
            + another.chemState
            + ' are not conservative';
        var htmlMsg = ''
            + 'Mass of chemical state '
            + '<span style="font-family: Courier New, consola">'
            + this.chemState
            + '</span>'
            + ' and '
            + '<span style="font-family: Courier New, consola">'
            + another.chemState
            + '</span>'
            + ' are not conservative';
        throw new RxnEquationError(msg, htmlMsg);
    }

    // Check site number.
    var siteNum1 = this.getSiteNumber();
    var siteNum2 = another.getSiteNumber();

    if (!isEquivalent(siteNum1, siteNum2)) {
        var msg = ''
            + 'Site of chemical state '
            + this.chemState
            + ' and '
            + another.chemState
            + ' are not conservative';
        var htmlMsg = ''
            + 'Site of chemical state '
            + '<span style="font-family: Courier New, consola">'
            + this.chemState
            + '</span>'
            + ' and '
            + '<span style="font-family: Courier New, consola">'
            + another.chemState
            + '</span>'
            + ' are not conservative';
        throw new RxnEquationError(msg, htmlMsg);
    }

    return true;
};


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
ChemFormula.prototype.split = function() {
    if (this.formulaRegex.test(this.formula)) {
        var match = this.formulaRegex.exec(this.formula);
        this.stoich = match[1] ? parseInt(match[1]) : 1;  // stoichiometric
        this.species_site = match[2];                     // species and site
        this.species = match[3];                          // species name
        this.site = match[5];                             // site name
        this.nsite = match[4] ? parseInt(match[4]) : 1;   // site number
    } else {
        var msg = 'Invalid chemical formula ' + this.formula;
        var msg_html = 'Invalid chemical formula '
            + '<span style="font-family: Courier New, consola">'
            + this.formula
            + '</span>';
        throw new RxnEquationError(msg, msg_html);
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
    if (this.site != 'l' && this.site != 'g') {
        siteNumber[this.site] = this.stoich*this.nsite;
    }
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
        throw new RxnEquationError(msg);
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
        var htmlMsg = ''
            + 'Mass of chemical formula '
            + '<span style="font-family: Courier New, consola">'
            + this.formula
            + '</span>'
            + ' and '
            + '<span style="font-family: Courier New, consola">'
            + another.formula
            + '</span>'
            + ' are not conservative';
        throw new RxnEquationError(msg, htmlMsg);
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
        var htmlMsg = ''
            + 'Site of chemical formula '
            + '<span style="font-family: Courier New, consola">'
            + this.formula
            + '</span>'
            + ' and '
            + '<span style="font-family: Courier New, consola">'
            + another.formula
            + '</span>'
            + ' are not conservative';
        throw new RxnEquationError(msg, htmlMsg);
    }

    return true;
};

// Export to NodeJS module.
if (typeof exports != 'undefined') {
    exports.ChemFormula = ChemFormula;
    exports.ChemState = ChemState;
    exports.RxnEquation = RxnEquation;
    exports.RxnEquationError = RxnEquationError;
}
