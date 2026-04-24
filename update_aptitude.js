const fs = require('fs');

let content = fs.readFileSync('src/data/aptitude.ts', 'utf8');

const quant_qs = [
    {id: 121, question: "What is the sum of the first 50 natural numbers?", options: ["1275", "1250", "1225", "1300"], correct: "1275", topic: "Quant", explanation: "Sum = n(n+1)/2 = 50*51/2 = 1275."},
    {id: 122, question: "A shopkeeper sells an article for Rs. 200 with a loss of 20%. Find the cost price.", options: ["Rs. 220", "Rs. 240", "Rs. 250", "Rs. 260"], correct: "Rs. 250", topic: "Quant", explanation: "CP = (100/(100-Loss%)) * SP = (100/80) * 200 = 250."},
    {id: 123, question: "The perimeter of a rectangle is 40 cm and its breadth is 8 cm. What is its area?", options: ["96 sq cm", "100 sq cm", "112 sq cm", "120 sq cm"], correct: "96 sq cm", topic: "Quant", explanation: "2(L+B) = 40 => L+8=20 => L=12. Area = L*B = 12*8 = 96 sq cm."},
    {id: 124, question: "If 40% of a number is 256, what is 25% of that number?", options: ["160", "150", "140", "120"], correct: "160", topic: "Quant", explanation: "0.4x = 256 => x = 640. 25% of 640 = 160."},
    {id: 125, question: "A man rows downstream 32 km and upstream 14 km. If he takes 6 hours to cover each distance, what is the speed of the current?", options: ["1 km/hr", "1.5 km/hr", "2 km/hr", "2.5 km/hr"], correct: "1.5 km/hr", topic: "Quant", explanation: "Downstream speed = 32/6 = 16/3 km/hr. Upstream speed = 14/6 = 7/3 km/hr. Current = (16/3 - 7/3)/2 = (9/3)/2 = 1.5 km/hr."},
    {id: 126, question: "A train 125 m long passes a man, running at 5 km/hr in the same direction in which the train is going, in 10 seconds. The speed of the train is:", options: ["45 km/hr", "50 km/hr", "54 km/hr", "55 km/hr"], correct: "50 km/hr", topic: "Quant", explanation: "Relative speed = 125/10 m/s = 12.5 * 18/5 km/hr = 45 km/hr. Train speed = 45 + 5 = 50 km/hr."},
    {id: 127, question: "The ratio of the ages of A and B is 4:3. After 6 years, their ages will be in the ratio of 11:9. A's present age is:", options: ["16 years", "20 years", "24 years", "28 years"], correct: "24 years", topic: "Quant", explanation: "(4x+6)/(3x+6) = 11/9 => 36x + 54 = 33x + 66 => 3x = 12 => x = 4. A's age = 4*4 = 16. Wait, recheck: 4(6) = 24. A is 24."},
    {id: 128, question: "Find the simple interest on Rs. 5200 for 2 years at 6% per annum.", options: ["Rs. 450", "Rs. 524", "Rs. 600", "Rs. 624"], correct: "Rs. 624", topic: "Quant", explanation: "SI = (P*R*T)/100 = (5200*6*2)/100 = 624."},
    {id: 129, question: "What is the largest 4 digit number exactly divisible by 88?", options: ["9944", "9988", "9966", "9900"], correct: "9944", topic: "Quant", explanation: "Largest 4 digit number is 9999. 9999 / 88 leaves remainder 55. 9999 - 55 = 9944."},
    {id: 130, question: "A card is drawn from a well shuffled pack of 52 cards. What is the probability that it is a king or a queen?", options: ["1/13", "2/13", "4/13", "1/52"], correct: "2/13", topic: "Quant", explanation: "4 kings + 4 queens = 8 cards. Probability = 8/52 = 2/13."}
];

const logical_qs = [
    {id: 221, question: "If A is the brother of B, B is the sister of C, and C is the father of D, how D is related to A?", options: ["Nephew", "Niece", "Nephew or Niece", "Cannot be determined"], correct: "Nephew or Niece", topic: "Logical", explanation: "D is the child of C, who is the brother/sister of A. Since D's gender is unknown, D is a nephew or niece."},
    {id: 222, question: "Choose the word which is different from the rest.", options: ["Kiwi", "Eagle", "Emu", "Ostrich"], correct: "Eagle", topic: "Logical", explanation: "All except Eagle are flightless birds."},
    {id: 223, question: "Look at this series: 36, 34, 30, 28, 24, ... What number should come next?", options: ["20", "22", "23", "26"], correct: "22", topic: "Logical", explanation: "Alternating subtraction series: -2, -4, -2, -4, -2."},
    {id: 224, question: "SCD, TEF, UGH, ____, WKL", options: ["CMN", "UJI", "VIJ", "IJT"], correct: "VIJ", topic: "Logical", explanation: "First letters are S, T, U, V, W. Second and third letters are CD, EF, GH, IJ, KL."},
    {id: 225, question: "Melt : Liquid :: Freeze : ?", options: ["Ice", "Solid", "Condense", "Push"], correct: "Solid", topic: "Logical", explanation: "Melting turns a solid into a liquid, freezing turns a liquid into a solid."},
    {id: 226, question: "Which word does NOT belong with the others?", options: ["Tulip", "Rose", "Bud", "Daisy"], correct: "Bud", topic: "Logical", explanation: "Tulip, rose, and daisy are types of flowers; a bud is a part of a flower."},
    {id: 227, question: "In a certain code language, if 123 means 'hot filtered coffee', 356 means 'very hot day' and 589 means 'day and night', which digit stands for 'very'? ", options: ["9", "5", "8", "6"], correct: "6", topic: "Logical", explanation: "From 1st and 2nd, 'hot' is 3. From 2nd and 3rd, 'day' is 5. So, 'very' is 6."},
    {id: 228, question: "Choose the related word: Paw : Cat :: Hoof : ?", options: ["Lamb", "Elephant", "Lion", "Horse"], correct: "Horse", topic: "Logical", explanation: "A cat has paws, a horse has hooves."},
    {id: 229, question: "Fact 1: All dogs like to run. Fact 2: Some dogs like to swim. Fact 3: Some dogs look like their masters. If the first three statements are facts, which of the following must also be a fact?", options: ["I. All dogs who like to swim look like their masters.", "II. Dogs who like to swim also like to run.", "III. Dogs who like to run do not look like their masters.", "None of the above"], correct: "II. Dogs who like to swim also like to run.", topic: "Logical", explanation: "Since ALL dogs like to run, the ones that like to swim must also like to run."},
    {id: 230, question: "Find the next number in the sequence: 2, 6, 12, 20, 30, ...", options: ["40", "42", "44", "48"], correct: "42", topic: "Logical", explanation: "Differences are 4, 6, 8, 10, so next difference is 12. 30 + 12 = 42."}
];

const verbal_qs = [
    {id: 321, question: "Antonym of 'DILIGENT':", options: ["Hardworking", "Lazy", "Intelligent", "Careful"], correct: "Lazy", topic: "Verbal", explanation: "Diligent means having or showing care and conscientiousness in one's work. Lazy is the opposite."},
    {id: 322, question: "Synonym of 'LUCID':", options: ["Confusing", "Clear", "Dark", "Heavy"], correct: "Clear", topic: "Verbal", explanation: "Lucid means expressed clearly; easy to understand."},
    {id: 323, question: "Choose the correctly spelled word:", options: ["Committee", "Comittee", "Committe", "Comitee"], correct: "Committee", topic: "Verbal", explanation: "Committee has double m, double t, and double e."},
    {id: 324, question: "One who studies the stars and planets is an:", options: ["Astrologer", "Astronomer", "Astronaut", "Astrophysics"], correct: "Astronomer", topic: "Verbal", explanation: "An astronomer is a scientist in the field of astronomy who studies stars, planets, and galaxies."},
    {id: 325, question: "Idiom: 'Under the weather' means:", options: ["Feeling cold", "Feeling sick", "Caught in rain", "Very happy"], correct: "Feeling sick", topic: "Verbal", explanation: "To feel under the weather means to feel ill."},
    {id: 326, question: "Fill in the blank: She is ___ heir to the throne.", options: ["a", "an", "the", "no article"], correct: "an", topic: "Verbal", explanation: "'Heir' begins with a vowel sound (silent h), so 'an' is used."},
    {id: 327, question: "Antonym of 'OBSTINATE':", options: ["Stubborn", "Flexible", "Angry", "Hard"], correct: "Flexible", topic: "Verbal", explanation: "Obstinate means stubbornly refusing to change one's opinion. Flexible is the opposite."},
    {id: 328, question: "Synonym of 'AMICABLE':", options: ["Hostile", "Friendly", "Rude", "Angry"], correct: "Friendly", topic: "Verbal", explanation: "Amicable means having a spirit of friendliness."},
    {id: 329, question: "A person who does not believe in God is an:", options: ["Theist", "Agnostic", "Atheist", "Pagan"], correct: "Atheist", topic: "Verbal", explanation: "An atheist is someone who disbelieves or lacks belief in the existence of God."},
    {id: 330, question: "Fill in the blank: I look forward ___ hearing from you.", options: ["to", "for", "about", "on"], correct: "to", topic: "Verbal", explanation: "The correct phrase is 'look forward to'."}
];

content = content.replace('// Logical (20 questions)', '// Logical (30 questions)');
content = content.replace('// Verbal (20 questions)', '// Verbal (30 questions)');
content = content.replace('// Quant (20 questions)', '// Quant (30 questions)');

function formatQ(q) {
    return `  { id: ${q.id}, question: "${q.question.replace(/"/g, '\\"')}", options: ${JSON.stringify(q.options)}, correct: "${q.correct}", topic: "${q.topic}", explanation: "${q.explanation.replace(/"/g, '\\"')}" },`;
}

let lines = content.split('\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    if (lines[i].includes('id: 120')) {
        quant_qs.forEach(q => newLines.push(formatQ(q)));
    } else if (lines[i].includes('id: 220')) {
        logical_qs.forEach(q => newLines.push(formatQ(q)));
    } else if (lines[i].includes('id: 320')) {
        newLines[newLines.length - 1] = newLines[newLines.length - 1] + ','; // add comma
        verbal_qs.forEach(q => newLines.push(formatQ(q)));
    }
}

// Remove last comma
let lastLine = newLines[newLines.length - 2];
if (lastLine.endsWith(',')) {
    newLines[newLines.length - 2] = lastLine.slice(0, -1);
}

fs.writeFileSync('src/data/aptitude.ts', newLines.join('\n'));
