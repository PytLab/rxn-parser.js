## rxn-parser.js

### Javascript version of elementary reaction expression parser

### Install

``` shell
npm install rxn_parser
```

### Test

```
npm test
```

### Example

``` javascript
> var RxnEquation = require('./rxn_parser.js').RxnEquation;
> var ChemState = require('./rxn_parser.js').ChemState;
> var ChemFormula = require('').ChemFormula;

// Operate chemial equation.
> var equation = new RxnEquation('CO_s + O_s <-> CO-O_s + 2*_s -> CO2_g + 2*_s');
> equation.checkConservation();
true
> var chemStates = equation.toList();
[ ChemState { chemState: 'CO_s + O_s' },
  ChemState { chemState: 'CO-O_s + *_s' },
  ChemState { chemState: 'CO2_g + 2*_s' } ]

// Operate chemical state...
// Operate chemical formual...
```
