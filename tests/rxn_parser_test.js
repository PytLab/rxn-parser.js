var assert = require('chai').assert;
var ChemFormula = require('../rxn_parser.js').ChemFormula;
var ChemState = require('../rxn_parser.js').ChemState;

describe('rxn-parser', function() {
    describe('ChemFormula', function() {
        it('ChemFormula object should be constructed correctly', function() {
            var f = new ChemFormula('CO2_s');
            assert.equal(f.formula, 'CO2_s');
            assert.equal(f.stoich, 1);
            assert.equal(f.species_site, 'CO2_s');
            assert.equal(f.species, 'CO2');
            assert.equal(f.site, 's');
            assert.equal(f.nsite, 1);
        });

        it('formula should return correct species type', function() {
            var f = new ChemFormula('CO_g');
            assert.equal(f.type(), 'gas');
            var f = new ChemFormula('CO_s');
            assert.equal(f.type(), 'adsorbate');
            var f = new ChemFormula('H2O_l');
            assert.equal(f.type(), 'liquid');
            var f = new ChemFormula('*_s');
            assert.equal(f.type(), 'site');
        });

        it('should return correct element and number pair', function() {
            var f = new ChemFormula('2H2O_s');
            var element_number = f.getElementNumber();
            assert.equal(4, element_number.H);
            assert.equal(2, element_number.O);
        })

        it('should check conservative correctly', function() {
            var f1 = new ChemFormula('2H2O_3s');
            var f2 = new ChemFormula('H4O2_6s');
            assert.isTrue(f1.conserve(f2));

            // Site.
            f2 = new ChemFormula('H4O2_3s');
            assert.throws(function() {f1.conserve(f2);}, Error);

            // Element.
            f2 = new ChemFormula('H3O2_6s');
            assert.throws(function() {f1.conserve(f2);}, Error);
        });
    });

    describe('ChemState', function() {
        it('ChemState object should be constructed correcly', function() {
            var s = new ChemState('CO_s + O_s');
            assert.equal(s.chemState, 'CO_s + O_s');
        });

        it('chemstate object can be splitted correctly', function() {
            var s = new ChemState('CO_s + O_s');
            var formulaList = s.toList();
            var first = formulaList[0];
            assert.equal(first.formula, 'CO_s');
            assert.equal(first.site, 's');
            assert.equal(first.species, 'CO');
            assert.equal(first.nsite, 1);
            assert.equal(first.stoich, 1);
            var second = formulaList[1];
            assert.equal(second.formula, 'O_s');
            assert.equal(second.site, 's');
            assert.equal(second.species, 'O');
            assert.equal(second.nsite, 1);
            assert.equal(second.stoich, 1);
        });

        it('chemstate object should return correct elements and numbers', function() {
            var s = new ChemState('CO_s + 2H2O_g');
            var elemNums = s.getElementNumber();
            assert.equal(elemNums['C'], 1);
            assert.equal(elemNums['O'], 3);
            assert.equal(elemNums['H'], 4);
        });

        it('chemstate object should return correct elements and numbers', function() {
            var s = new ChemState('CO_s + HO_2t + NO_g');
            var siteNums = s.getSiteNumber();
            assert.equal(siteNums['s'], 1);
            assert.equal(siteNums['t'], 2);
            assert.equal(siteNums['g'], 1);
        });

        it('chemstate object should check the conservation correctly ', function() {
            var s1 = new ChemState('2CO_s + HOO_s');
            var s2 = new ChemState('C_s + CO2_s + HO2_s');
            assert.isTrue(s1.conserve(s2));

            var s2 = new ChemState('2CO_s + HO_s');
            assert.throws(function() { s1.conserve(s2); }, Error);

            var s2 = new ChemState('2CO_s + HOO_2s');
            assert.throws(function() { s1.conserve(s2); }, Error);
        });
    });
});

