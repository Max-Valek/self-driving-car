class NeuralNetwork {
    // neuronCounts is the number of neurons in each layer
    constructor(neuronCounts){
        this.levels = [];   // neural network made out of an array of levels
        for (let i=0; i<neuronCounts.length-1; i++){
            // inputCount is neurons at current index, output is next index (next level)
            this.levels.push(new Level(
                neuronCounts[i], neuronCounts[i+1]
            ));
        }
    }

    static feedForward(givenInputs, network) {
        // call feedForward on first level to produce its outputs
        let outputs = Level.feedForward(
            givenInputs, network.levels[0]);
        // call feedForward on remaining levels
        for (let i=1; i<network.levels.length; i++){
            outputs = Level.feedForward(
                outputs, network.levels[i]);
        }
        return outputs;
    }

    // mutate weights and biases a random amount (1 or inputted value)
    // 1 is totally random while lower values (eg 0.1) would be closer to original
    static mutate(network, amount=1){
        network.levels.forEach(level => {
            for (let i=0; i<level.biases.length; i++){
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random()*2-1,
                    amount
                )
            }
            for (let i=0; i<level.weights.length; i++){
                for (let j=0; j<level.weights[i].length; j++){
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random()*2-1,
                        amount
                    )
                }
            }
        });
    }
}

class Level {
    constructor(inputCount, outputCount){
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);   // value above which output neuron will fire

        this.weights = [];
        // for each input node there is outputCount number of connections
        for (let i=0; i<inputCount; i++){
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }
    // static because we want to serialize after
    static #randomize(level) {
        for (let i=0; i<level.inputs.length; i++){
            for (let j=0; j<level.outputs.length; j++){
                // for every i/o pair, set weight between -1 and 1 (random)
                level.weights[i][j] = Math.random()*2-1;    // random is 0-1, *2 is 0-2, -1 makes it -1 to 1
            }
        }

        for (let i=0; i<level.biases.length; i++){
            level.biases[i] = Math.random()*2-1;
        }
    }

    // compute the output values
    static feedForward(givenInputs, level){
        // set all inputs in current level to givenInputs (from the sensor)
        for (let i=0; i<level.inputs.length; i++){
            level.inputs[i] = givenInputs[i];
        }

        for (let i=0; i<level.outputs.length; i++){
            let sum = 0;
            for (let j=0; j<level.inputs.length; j++){
                // sum of all inputs * their weights to current output node
                sum += level.inputs[j]*level.weights[j][i];
            }
            // if the sum is higher than bias, "turn output on", if not then "turn it off"
            if (sum>level.biases[i]){
                level.outputs[i] = 1;
            }else{
                level.outputs[i] = 0;
            }
        }
        return level.outputs;
    }
}