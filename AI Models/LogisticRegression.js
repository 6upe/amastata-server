const tf = require('@tensorflow/tfjs-node');

const featuresArray = [
    [30, 45000, 5],   // Debtor 1: Age 30, Income $45,000, Address Stability 5 years
    [25, 35000, 2],   // Debtor 2: Age 25, Income $35,000, Address Stability 2 years
    [40, 60000, 8],   // Debtor 3: Age 40, Income $60,000, Address Stability 8 years
    [28, 32000, 3],   // Debtor 4: Age 28, Income $32,000, Address Stability 3 years
    [35, 55000, 6],   // Debtor 5: Age 35, Income $55,000, Address Stability 6 years
  ];

//THE FEATURE ARRAY WILL HAVE : OCCUPATION SCORE, ADDRESS SCORE AND OUTSTANDING LOANS SCORE
//MAKE ALGORITHMS TO DETERMINE THE SCORES
  
  const labelsArray = [
    1,  // Debtor 1: Good Credit
    0,  // Debtor 2: Bad Credit
    1,  // Debtor 3: Good Credit
    0,  // Debtor 4: Bad Credit
    1,  // Debtor 5: Good Credit
  ];
  

const features = tf.tensor2d(featuresArray); // Shape: [numSamples, numFeatures]
const labels = tf.tensor1d(labelsArray); // Shape: [numSamples]
const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid', inputShape: [numFeatures] }));
model.compile({ loss: 'binaryCrossentropy', optimizer: 'adam', metrics: ['accuracy'] });
model.fit(features, labels, {
    epochs: numEpochs,
    batchSize: batchSize,
    validationData: [validationFeatures, validationLabels],
  }).then(info => {
    console.log('Final accuracy', info.history.acc);
  });
  const newFeatureVector = tf.tensor2d(newFeatureArray); // Shape: [1, numFeatures]
const prediction = model.predict(newFeatureVector);
console.log(`Predicted probability: ${prediction.dataSync()[0]}`);

modules.export = prediction;