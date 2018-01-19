import {
    MuSchema,
    MuBoolean,
    MuFloat32,
    MuFloat64,
    MuInt8,
    MuInt16,
    MuInt32,
    MuString,
    MuUint8,
    MuUint16,
    MuUint32,
} from '../';
import {
    MuReadStream,
    MuWriteStream,
} from 'mustreams';

import {
    Constants,
    muPrimitiveTypes,
} from '../constants';

function randomSign () {
    return Math.random() < 0.5 ? -1 : 1;
}

function fround (float) {
    const fa = new Float32Array(1);
    fa[0] = float;
    return fa[0];
}

function randomCodePoint () {
    // to avoid the surrogates issue
    const MAX_CODE_POINT = 0xD7FF;
    return Math.random() * MAX_CODE_POINT | 0;
}

const muNumType2SchemaType = {
    'float32': MuFloat32,
    'float64': MuFloat64,
    'int8': MuInt8,
    'int16': MuInt16,
    'int32': MuInt32,
    'uint8': MuUint8,
    'uint16': MuUint16,
    'uint32': MuUint32,
};
export function muNumSchema (muType) {
    return new muNumType2SchemaType[muType]();
}

const muPrimitiveType2SchemaType = {
    'boolean': MuBoolean,
    'float32': MuFloat32,
    'float64': MuFloat64,
    'int8': MuInt8,
    'int16': MuInt16,
    'int32': MuInt32,
    'string': MuString,
    'uint8': MuUint8,
    'uint16': MuUint16,
    'uint32': MuUint32,
};
export function muPrimitiveSchema (muType) {
    return new muPrimitiveType2SchemaType[muType]();
}

export function randomStr () {
    const length = Math.random() * 20 + 1 | 0;
    const charCodes = new Array(length);
    for (let i = 0; i < length; ++i) {
        charCodes[i] = randomCodePoint();
    }
    return String.fromCharCode.apply(null, charCodes);
}

export function randomShortStr () {
    const ingredient = 'abc';
    const ingredientLeng = ingredient.length;

    const length = Math.random() * 3 + 1 | 0;
    const charCodes = new Array(length);
    for (let i = 0; i < length; ++i) {
        charCodes[i] = ingredient.charCodeAt(Math.random() * ingredientLeng | 0);
    }
    return String.fromCharCode.apply(null, charCodes);
}

export function randomValueOf (muType:string) {
    const MAX = Constants[muType] && Constants[muType].MAX;
    const MIN = Constants[muType] && Constants[muType].MIN;
    switch (muType) {
        case 'boolean':
            return Math.random() < 0.5 ? false : true;
        case 'float32':
            return fround(randomSign() * Math.random() * 10 * MIN);
        case 'float64':
            return randomSign() * Math.random() * 10 * MIN;
        case 'int8':
        case 'int16':
        case 'int32':
            return randomSign() * Math.random() * MAX | 0;
        case 'string':
            return randomStr();
        case 'uint8':
        case 'uint16':
        case 'uint32':
            return Math.random() * MAX >>> 0;
        default:
            return;
    }
}

export function testPatchingFactory (t, schema:MuSchema<any>, fn?) {
    function diffPatch (a, b) {
        const ws = new MuWriteStream(2);
        schema.diff(a, b, ws);
        const rs = new MuReadStream(ws.buffer.uint8.subarray(0, ws.offset));
        if (rs.length) {
            const r = schema.patch(a, rs);
            t.equals(rs.offset, rs.length, 'no bytes left in stream');
            return r;
        } else {
            t.same(a, b, 'empty patch consistent');
            return schema.clone(a);
        }
    }

    return  fn ?
            (a, b) => {
                t.same(diffPatch(a, b), fn(b));
            }
            :
            (a, b) => {
                t.same(diffPatch(a, b), b);
            };
}

export function testPatchingPairFactory (t, schema:MuSchema<any>, fn?) {
    const test = fn ? testPatchingFactory(t, schema, fn) : testPatchingFactory(t, schema);

    return (a, b) => {
        test(a, b);
        test(b, a);
    };
}
