import { Exercise } from './Exercise.js';

const OperatorType = { Addition:1, Substraction:2, Multiplication:3, Division:4 };

class MathExercise extends Exercise {
    constructor( opType, operator, range, resultRange = 0, numResults = 5, first) {
        super();
        this.opType = opType;

        if (opType == OperatorType.Division)
        { 
            range = resultRange;
            numResults = Math.min(numResults, range);
        };

        let results = new Set();

        this.first = (typeof first !== 'undefined' ? first : Math.floor(Math.random() * range) + 1 );

        let counter = 0;

        do {            
            this.second = Math.floor(Math.random() * range ) + 1; // avoid 0
            
            switch (opType) {
                case OperatorType.Addition : 
                    this.result = this.first + this.second;
                    if (resultRange > 0 && this.result > resultRange) {                                                                                                
                        this.first = Math.floor(Math.random() * (range - 1)) + 1; // make sure that more results are possible
                        this.result = Math.floor(Math.random() * ( resultRange - this.first )) + this.first + 1;
                        this.second = this.result - this.first;
                    }                                            
                    break;

                case OperatorType.Substraction :
                    if ( this.first < this.second ) { // ensure result is positive
                        let temp = this.second;
                        this.second = this.first;
                        this.first = temp;
                    }
                    this.result = this.first - this.second;
                    break;

                case OperatorType.Multiplication :
                    if (this.first == 0) this.first = 1;
                    this.result = this.first * this.second;
                    break;

                case OperatorType.Division :
                    this.result = Math.floor(Math.random() * ( resultRange + 1 ));
                    this.first = this.second * this.result;                    
                    break;
            }
            results.add(this.result);
            counter++; // avoid infinite loops

        } while (results.size < numResults && counter < 100);
        
        this.results = shuffle(Array.from(results));

        this.description = this.first + ' ' + operator + ' ' + this.second; // + " = ?";
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

export { OperatorType }
export { MathExercise }