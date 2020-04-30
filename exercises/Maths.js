import { Exercise } from './Exercise.js';

const OperatorType = { Addition:1, Substraction:2, Multiplication:3, Division:4 };

class MathExercise extends Exercise {
    constructor( opType, range, resultRange = 0, numResults = 5, first) {
        super();
        this.opType = opType;

        if (opType == OperatorType.Division && numResults > range) {
             numResults = range;
        };

        let operator;

        let results = new Set();
        
        if (opType == OperatorType.Multiplication) {
            this.first = (first === undefined ? Math.floor(Math.random() * ( range + 1 )) : first);
        }
        
        do {
            if (opType != OperatorType.Multiplication) {
                this.first = (first === undefined ? Math.floor(Math.random() * ( range + 1 )) : first);
            }

            this.second = Math.floor(Math.random() * ( range + 1 ));
            this.result = Math.floor(Math.random() * ( resultRange + 1 ));

            switch (opType) {
                case OperatorType.Addition : 
                    operator = '+';
                    if (resultRange > 0) {
                        if (this.first > this.result) {
                            this.swapResultAndFirst();
                        }
                        this.second = this.result - this.first;                        
                    } else {
                        this.result = this.first + this.second;
                    }
                    break;
                case OperatorType.Substraction :
                    operator = '-';
                    if (this.first < this.second) { // ensure result is positive
                        let temp = this.second;
                        this.second = this.first;
                        this.first = temp;
                    }
                    this.result = this.first - this.second;
                    break;
                case OperatorType.Multiplication :
                    operator = 'x';
                    if (this.first == 0) this.first = 1;
                    this.result = this.first * this.second;
                    break;
                case OperatorType.Division :
                    operator = '/';
                    
                    this.first = Math.floor(Math.random() * (range + 1));
                    while (this.second == 0) {
                        this.second = Math.floor(Math.random() * (range + 1));
                    };

                    this.result = this.first * this.second;
                    this.swapResultAndFirst(); // exchange for a division without remainder
                    break;
            }
            results.add(this.result);

        } while (results.size < numResults);
        
        this.results = shuffle(Array.from(results));

        this.description = this.first + ' ' + operator + ' ' + this.second;
    }

    swapResultAndFirst() {
        let temp = this.first;
        this.first = this.result;
        this.result = temp;
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