require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { isSameEvent } = require('../eventEngine');

const runEvaluation = async () => {
    console.log("🚀 Starting Formal NISE Evaluation via Groq (Llama 3)...");
    
    const testCasesPath = path.join(__dirname, 'testCases.json');
    let testCases;
    try {
        testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
    } catch (error) {
        console.error("❌ Failed to read testCases.json. Make sure the file exists.", error.message);
        return;
    }

    let TP = 0; // True Positives
    let TN = 0; // True Negatives
    let FP = 0; // False Positives
    let FN = 0; // False Negatives

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        console.log(`\n⏳ Evaluating Pair ${i + 1}/${testCases.length}...`);
        
        // Calling your actual production function
        const isSame = await isSameEvent(tc.headline_a, tc.headline_b);
        const predicted = isSame ? "SAME" : "DIFFERENT";
        
        console.log(`Expected: ${tc.expected} | Predicted: ${predicted}`);

        if (tc.expected === "SAME" && predicted === "SAME") TP++;
        else if (tc.expected === "DIFFERENT" && predicted === "DIFFERENT") TN++;
        else if (tc.expected === "DIFFERENT" && predicted === "SAME") FP++;
        else if (tc.expected === "SAME" && predicted === "DIFFERENT") FN++;
        
        // Brief 1-second pause between calls to respect Groq API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mathematical calculations for academic metrics
    const accuracy = ((TP + TN) / testCases.length) * 100;
    const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
    const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
    const f1Score = (precision + recall) === 0 ? 0 : 2 * ((precision * recall) / (precision + recall));

    const finalResults = {
        total_test_cases: testCases.length,
        confusion_matrix: {
            True_Positives: TP,
            True_Negatives: TN,
            False_Positives: FP,
            False_Negatives: FN
        },
        metrics: {
            accuracy: `${accuracy.toFixed(2)}%`,
            precision: `${(precision * 100).toFixed(2)}%`,
            recall: `${(recall * 100).toFixed(2)}%`,
            f1_score: `${(f1Score * 100).toFixed(2)}%`
        }
    };

    console.log("\n📊 --- FORMAL EVALUATION RESULTS ---");
    console.table(finalResults.metrics);
    console.table(finalResults.confusion_matrix);

    const outputPath = path.join(__dirname, 'evaluation-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
    console.log(`\n✅ Results successfully exported to: ${outputPath}`);
};

runEvaluation();