const fs = require('fs');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
    { name: 'decode', alias: 'd', type: String },
    { name: 'encode', alias: 'e', type: String, defaultOption: true },
    { name: 'name', alias: 'n', type: String }
]
const options = commandLineArgs(optionDefinitions)

const MIN = 32;
const MAX = 126;

const SIMPLE = {
    'false': '![]',
    'true': '!![]',
    'undefined': '[][[]]',
    'NaN': '+[![]]',
    'Infinity': '+(+!+[]+(!+[]+[])[!+[]+!+[]+!+[]]+[+!+[]]+[+[]]+[+[]]+[+[]])' // +"1e1000"
};

const CONSTRUCTORS = {
    'Array': '[]',
    'Number': '(+[])',
    'String': '([]+[])',
    'Boolean': '(![])',
    'Function': '[]["flat"]',
    'RegExp': 'Function("return/"+false+"/")()',
    'Object': '[]["entries"]()'
};

const MAPPING = {
    'a': '(false+"")[1]',
    'b': '([]["entries"]()+"")[2]',
    'c': '([]["flat"]+"")[3]',
    'd': '(undefined+"")[2]',
    'e': '(true+"")[3]',
    'f': '(false+"")[0]',
    'g': '(false+[0]+String)[20]',
    'h': '(+(101))["to"+String["name"]](21)[1]',
    'i': '([false]+undefined)[10]',
    'j': '([]["entries"]()+"")[3]',
    'k': '(+(20))["to"+String["name"]](21)',
    'l': '(false+"")[2]',
    'm': '(Number+"")[11]',
    'n': '(undefined+"")[1]',
    'o': '(true+[]["flat"])[10]',
    'p': '(+(211))["to"+String["name"]](31)[1]',
    'q': '("")["fontcolor"]([0]+false+")[20]',
    'r': '(true+"")[1]',
    's': '(false+"")[3]',
    't': '(true+"")[0]',
    'u': '(undefined+"")[0]',
    'v': '(+(31))["to"+String["name"]](32)',
    'w': '(+(32))["to"+String["name"]](33)',
    'x': '(+(101))["to"+String["name"]](34)[1]',
    'y': '(NaN+[Infinity])[10]',
    'z': '(+(35))["to"+String["name"]](36)',
    'A': '(NaN+[]["entries"]())[11]',
    'B': '(+[]+Boolean)[10]',
    'C': 'Function("return escape")()(("")["italics"]())[2]',
    'D': 'Function("return escape")()([]["flat"])["slice"]("-1")',
    'E': '(RegExp+"")[12]',
    'F': '(+[]+Function)[10]',
    'G': '(false+Function("return Date")()())[30]',
    'H': null,
    'I': '(Infinity+"")[0]',
    'J': null,
    'K': null,
    'L': null,
    'M': '(true+Function("return Date")()())[30]',
    'N': '(NaN+"")[0]',
    'O': '(+[]+Object)[10]',
    'P': null,
    'Q': null,
    'R': '(+[]+RegExp)[10]',
    'S': '(+[]+String)[10]',
    'T': '(NaN+Function("return Date")()())[30]',
    'U': '(NaN+Object()["to"+String["name"]]["call"]())[11]',
    'V': null,
    'W': null,
    'X': null,
    'Y': null,
    'Z': null,
    ' ': '(NaN+[]["flat"])[11]',
    '!': null,
    '"': '("")["fontcolor"]()[12]',
    '#': null,
    '$': null,
    '%': 'Function("return escape")()([]["flat"])[21]',
    '&': '("")["fontcolor"](")[13]',
    '\'': null,
    '(': '([]["flat"]+"")[13]',
    ')': '([0]+false+[]["flat"])[20]',
    '*': null,
    '+': '(+(+!+[]+(!+[]+[])[!+[]+!+[]+!+[]]+[+!+[]]+[+[]]+[+[]])+[])[2]',
    ',': '[[]]["concat"]([[]])+""',
    '-': '(+(.+[0000001])+"")[2]',
    '.': '(+(+!+[]+[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+[!+[]+!+[]]+[+[]])+[])[+!+[]]',
    '/': '(false+[0])["italics"]()[10]',
    ':': '(RegExp()+"")[3]',
    ';': '("")["fontcolor"](NaN+")[21]',
    '<': '("")["italics"]()[0]',
    '=': '("")["fontcolor"]()[11]',
    '>': '("")["italics"]()[2]',
    '?': '(RegExp()+"")[2]',
    '@': null,
    '[': '([]["entries"]()+"")[0]',
    '\\': '(RegExp("/")+"")[1]',
    ']': '([]["entries"]()+"")[22]',
    '^': null,
    '_': null,
    '`': null,
    '{': '(true+[]["flat"])[20]',
    '|': null,
    '}': '([]["flat"]+"")["slice"]("-1")',
    '~': null
};

const TINY_MAPPING = {
    '(': 'Tiny',
    ')': 'tiny',
    '[': 'TINY',
    ']': 'tiny!',
    '+': 'tiny?',
    '!': 'tiny.'
}

class Parser {
    constructor(input) {
        this._input = input;
        this.fillMissingDigits();
        this.replaceMap();
        this.replaceStrings();
    }

    fillMissingDigits() {
        let output, number, i;
        for (number = 0; number < 10; number++) {
            output = "+[]";
            if (number > 0) {
                output = "+!" + output;
            }
            for (i = 1; i < number; i++) {
                output = "+!+[]" + output;
            }
            if (number > 1) {
                output = output.substr(1);
            }
            MAPPING[number] = "[" + output + "]";
        }
    }
    replaceMap() {
        let character = "";
        let value; let i; let key;
        function replace(pattern, replacement) {
            value = value.replace(
                new RegExp(pattern, "gi"),
                replacement
            );
        }
        function digitReplacer(_, x) { return MAPPING[x]; }
        function numberReplacer(_, y) {
            const values = y.split("");
            const head = +(values.shift());
            let output = "+[]";
            if (head > 0) { output = "+!" + output; }
            for (i = 1; i < head; i++) { output = "+!+[]" + output; }
            if (head > 1) { output = output.substr(1); }
            return [output].concat(values).join("+").replace(/(\d)/g, digitReplacer);
        }
        for (i = MIN; i <= MAX; i++) {
            character = String.fromCharCode(i);
            value = MAPPING[character];
            if (!value) { continue; }
            for (key in CONSTRUCTORS) {
                replace("\\b" + key, CONSTRUCTORS[key] + '["constructor"]');
            }
            for (key in SIMPLE) {
                replace(key, SIMPLE[key]);
            }
            replace('(\\d\\d+)', numberReplacer);
            replace('\\((\\d)\\)', digitReplacer);
            replace('\\[(\\d)\\]', digitReplacer);
            replace('\\+""', "+[]");
            replace('""', "[]+[]");
            MAPPING[character] = value;
        }
    }
    replaceStrings() {
        const regEx = /[^\[\]\(\)\!\+]{1}/g;

        let all; let value; let missing;
        let count = MAX - MIN;
        function findMissing() {
            let all; let value;
            let done = false;
            missing = {};
            for (all in MAPPING) {
                value = MAPPING[all];
                if (value && value.match(regEx)) {
                    missing[all] = value;
                    done = true;
                }
            }
            return done;
        }
        function mappingReplacer(a, b) {
            return b.split("").join("+");
        }
        function valueReplacer(c) {
            return missing[c] ? c : MAPPING[c];
        }
        for (all in MAPPING) {
            if (MAPPING[all]) {
                MAPPING[all] = MAPPING[all].replace(/\"([^\"]+)\"/gi, mappingReplacer);
            }
        }
        while (findMissing()) {
            for (all in missing) {
                value = MAPPING[all];
                value = value.replace(regEx, valueReplacer);
                MAPPING[all] = value;
                missing[all] = value;
            }
            if (count-- === 0) {
                throw new Error("Could not compile the following chars:", missing);
            }
        }
    }
    escapeSequence(c) {
        const cc = c.charCodeAt(0);
        if (cc < 256) {
            return '\\' + cc.toString(8);
        } else {
            const cc16 = cc.toString(16);
            return '\\u' + ('0000' + cc16).substring(cc16.length);
        }
    }
    escapeSequenceForReplace(c) {

        return this.escapeSequence(c).replace('\\', 't');
    }
    encode(input, word = "TINY") {
        let output = [];
        if (!input) {
            return "";
        }
        let unMapped = ''
        for (const k in MAPPING) {
            if (MAPPING[k]) {
                unMapped += k;
            }
        }
        unMapped = unMapped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        unMapped = new RegExp('[^' + unMapped + ']', 'g');
        const unmappedCharactersCount = (input.match(unMapped) || []).length;
        if (unmappedCharactersCount > 1) {
            input = input.replace(/[^0123456789.adefilnrsuN]/g, c => this.escapeSequenceForReplace.call(this, c));
        } else if (unmappedCharactersCount > 0) {
            input = input.replace(/["\\]/g, this.escapeSequence);
            //Convert all unmapped characters to escape sequence
            input = input.replace(unMapped, this.escapeSequence);
        }
        let r = "";
        for (const i in SIMPLE) {
            r += i + "|";
        }
        r += ".";
        input.replace(new RegExp(r, 'g'), function (c) {
            let replacement = SIMPLE[c];
            if (replacement) {
                output.push("(" + replacement + "+[])");
            } else {
                replacement = MAPPING[c];
                if (replacement) {
                    output.push(replacement);
                } else {
                    throw new Error('Found unmapped character: ' + c);
                }
            }
        });
        output = output.join("+");
        if (/^\d$/.test(input)) {
            output += "+[]";
        }
        if (unmappedCharactersCount > 1) {
            // replace `t` with `\\`
            output = "(" + output + ")[" + this.encode("split") + "](" + this.encode("t") + ")[" + this.encode("join") + "](" + this.encode("\\") + ")";
        }
        if (unmappedCharactersCount > 0) {
            output = "[][" + this.encode("flat") + "]" +
                "[" + this.encode("constructor") + "]" +
                "(" + this.encode("return\"") + "+" + output + "+" + this.encode("\"") + ")()";
        }
        fs.writeFileSync
        return output;
    }

    /**
     * Convert a JS_F'd input to single word variants
     * @param {String} input The input string
     * @returns {String} The code, TINY-fied
     */
    toTINY(input) {
        const out = [];
        for (let letter of input) {
            out.push(TINY_MAPPING[letter]);
        }
        return out.filter(q => !!q).join(' ');
    }

    fromTiny(input) {
        //reverse the map
        const fromMap = Object.fromEntries(Object.entries(TINY_MAPPING).map(e => e.reverse()))
        const out = [];
        const inputSplit = input.split(' ').filter(q => !!q);
        for (let letter of inputSplit) {
            out.push(fromMap[letter]);
        }
        return out.filter(q => !!q).join('');
    }
}


const parser = new Parser();

const { decode, encode, name } = options;

if (!decode && !encode) {
    throw new Error('Must specify either an encoded TINY-file, or a file to encode!')
}

const str = fs.readFileSync(decode || encode, 'utf-8');

let output = decode ? parser.fromTiny(str) : parser.toTINY(parser.encode(str));
const fileType = decode ? 'js' : 'tiny';
const fileDescriptor = name ? name : (encode || decode).replace(/\.\w+/, '');
const fileName = `${fileDescriptor}.${fileType}`;
const action = decode ? 'decoded' : 'encoded';
console.log(`Done! File ${decode || encode} ${action} and saved at ${fileName}`)

fs.writeFileSync(fileName, output, 'utf-8');

//CLI options are 'decode' or 'encode' (default)