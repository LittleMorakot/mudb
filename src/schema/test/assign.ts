import test = require('tape');
import {
    MuBoolean,
    MuUTF8,
    MuFloat32,
    MuDate,
    MuArray,
    MuSortedArray,
    MuVector,
    MuDictionary,
    MuStruct,
    MuUnion,
    MuJSON,
} from '../index';

test('primitive.assign()', (t) => {
    const bool = new MuBoolean();
    t.equal(bool.assign(true, true), true);
    t.equal(bool.assign(true, false), false);
    t.equal(bool.assign(false, true), true);
    t.equal(bool.assign(false, false), false);

    const float32 = new MuFloat32();
    t.equal(float32.assign(1, 2), 2);
    t.end();
});

test('date.assign()', (t) => {
    const date = new MuDate();
    const dst = date.alloc();
    const src = date.alloc();
    date.assign(dst, src);
    t.deepEqual(dst, src);
    t.notEqual(dst, src);
    dst.setTime(0);
    t.notDeepEqual(dst, src);
    date.assign(dst, src);
    t.deepEqual(dst, src);
    t.end();
});

test('array.assign()', (t) => {
    const array = new MuArray(new MuFloat32(), Infinity);
    const aDst = array.alloc();
    const aSrc = array.alloc();
    array.assign(aDst, aSrc);
    t.notEqual(aDst, aSrc);
    t.deepEqual(aDst, aSrc);
    aSrc.push(0);
    array.assign(aDst, aSrc);
    t.deepEqual(aDst, aSrc);
    aSrc.push(0.5);
    array.assign(aDst, aSrc);
    t.deepEqual(aDst, aSrc);
    aDst.push(1);
    array.assign(aDst, aSrc);
    t.deepEqual(aDst, aSrc);

    const nestedArray = new MuArray(
        new MuArray(new MuFloat32(), Infinity),
        Infinity,
    );
    const naDst = nestedArray.alloc();
    const naSrc = nestedArray.alloc();
    naSrc.push([]);
    nestedArray.assign(naDst, naSrc);
    t.deepEqual(naDst, naSrc);
    t.notEqual(naDst[0], naSrc[0]);
    naSrc.push([0, 0.5]);
    nestedArray.assign(naDst, naSrc);
    t.deepEqual(naDst, naSrc);
    t.notEqual(naDst[1], naSrc[1]);
    t.end();
});

test('sortedArray.assign()', (t) => {
    const array = new MuSortedArray(new MuFloat32(), Infinity);
    const aDst = array.alloc();
    const aSrc = array.alloc();
    array.assign(aDst, aSrc);
    t.notEqual(aDst, aSrc);
    t.deepEqual(aDst, aSrc);
    aSrc.push(0);
    array.assign(aDst, aSrc);
    t.deepEqual(aDst, aSrc);
    aSrc.push(0.5);
    array.assign(aDst, aSrc);
    t.deepEqual(aDst, aSrc);

    const nestedArray = new MuSortedArray(
        new MuSortedArray(new MuFloat32(), Infinity),
        Infinity,
    );
    const naDst = nestedArray.alloc();
    const naSrc = nestedArray.alloc();
    naSrc.push([]);
    nestedArray.assign(naDst, naSrc);
    t.deepEqual(naDst, naSrc);
    t.notEqual(naDst[0], naSrc[0]);
    naSrc.push([0, 0.5]);
    nestedArray.assign(naDst, naSrc);
    t.deepEqual(naDst, naSrc);
    t.notEqual(naDst[1], naSrc[1]);
    t.end();
});

test('vector.assign()', (t) => {
    t.test('dimension 0', (st) => {
        const vector = new MuVector(new MuFloat32(), 0);
        const dst = vector.alloc();
        const src = vector.alloc();
        vector.assign(dst, src);
        st.deepEqual(dst, src);
        st.notEqual(dst, src);
        st.end();
    });
    t.test('dimension 1', (st) => {
        const vector = new MuVector(new MuFloat32(), 1);
        const dst = vector.alloc();
        const src = vector.alloc();
        vector.assign(dst, src);
        st.deepEqual(dst, src);
        st.notEqual(dst, src);
        src[0] = 0.5;
        vector.assign(dst, src);
        t.deepEqual(dst, src);
        st.end();
    });
    t.test('dimension 2', (st) => {
        const vector = new MuVector(new MuFloat32(), 2);
        const dst = vector.alloc();
        const src = vector.alloc();
        vector.assign(dst, src);
        st.deepEqual(dst, src);
        st.notEqual(dst, src);
        src[0] = 0.5;
        src[1] = 1.5;
        vector.assign(dst, src);
        t.deepEqual(dst, src);
        st.end();
    });
});

test('dictionary.assign()', (t) => {
    const dictionary = new MuDictionary(new MuFloat32(), Infinity);
    const dDst = dictionary.alloc();
    const dSrc = dictionary.alloc();
    dictionary.assign(dDst, dSrc);
    t.deepEqual(dDst, dSrc);
    t.notEqual(dDst, dSrc);
    dSrc.a = 0.5;
    dictionary.assign(dDst, dSrc);
    t.deepEqual(dDst, dSrc);
    dSrc.b = 1.5;
    dictionary.assign(dDst, dSrc);
    t.deepEqual(dDst, dSrc);
    dDst.c = 1;
    dictionary.assign(dDst, dSrc);
    t.deepEqual(dDst, dSrc);

    const nestedDictionary = new MuDictionary(
        new MuDictionary(new MuFloat32(), Infinity),
        Infinity,
    );
    const ndDst = nestedDictionary.alloc();
    const ndSrc = nestedDictionary.alloc();
    ndSrc.a = {};
    nestedDictionary.assign(ndDst, ndSrc);
    t.deepEqual(ndDst, ndSrc);
    t.notEqual(ndDst.a, ndSrc.a);
    ndSrc.b = {c: 0.5, d: 1.5};
    nestedDictionary.assign(ndDst, ndSrc);
    t.deepEqual(ndDst, ndSrc);
    t.end();
});

test('struct.assign()', (t) => {
    const struct = new MuStruct({
        f: new MuFloat32(),
    });
    const sDst = struct.alloc();
    const sSrc = struct.alloc();
    struct.assign(sDst, sSrc);
    t.deepEqual(sDst, sSrc);
    t.notEqual(sDst, sSrc);
    sSrc.f = 0.5;
    struct.assign(sDst, sSrc);
    t.deepEqual(sDst, sSrc);

    const nestedStruct = new MuStruct({
        s: new MuStruct({
            f: new MuFloat32(),
        }),
    });
    const nsDst = nestedStruct.alloc();
    const nsSrc = nestedStruct.alloc();
    nestedStruct.assign(nsDst, nsSrc);
    t.deepEqual(nsDst, nsSrc);
    t.notEqual(nsDst.s, nsSrc.s);
    nsSrc.s.f = 0.5;
    nestedStruct.assign(nsDst, nsSrc);
    t.deepEqual(nsDst, nsSrc);
    t.end();
});

test('union.assign()', (t) => {
    const stringOrFloat = new MuUnion({
        u: new MuUTF8(),
        f: new MuFloat32(),
    });
    const dst = stringOrFloat.alloc();
    const src = stringOrFloat.alloc();
    stringOrFloat.assign(dst, src);
    t.deepEqual(dst, src);
    t.notEqual(dst, src);
    src.type = 'u';
    src.data = 'Iñtërnâtiônàlizætiøn☃💩';
    stringOrFloat.assign(dst, src);
    t.deepEqual(dst, src);
    dst.data = 'Internationalization';
    stringOrFloat.assign(dst, src);
    t.deepEqual(dst, src);
    src.type = 'f';
    src.data = 0.5;
    stringOrFloat.assign(dst, src);
    t.deepEqual(dst, src);
    stringOrFloat.assign(dst, stringOrFloat.alloc());
    t.deepEqual(dst, stringOrFloat.alloc());

    const union = new MuUnion({
        us: new MuStruct({
            u: new MuUTF8(),
        }),
        fs: new MuStruct({
            f: new MuFloat32(),
        }),
    }, 'us');
    const uDst = union.alloc();
    const uSrc = union.alloc();
    uSrc.type = 'fs';
    uSrc.data = union.muData.fs.alloc();
    union.assign(uDst, uSrc);
    t.deepEqual(uDst, uSrc);
    t.notEqual(uDst.data, uSrc.data);
    t.end();
});

test('json.assign', (t) => {
    const json = new MuJSON();
    const o = {a: 0, b: 1};
    const p = {a: {b: {c: [0]}}};
    json.assign(o, p);
    t.deepEqual(o, p);
    t.notEqual(o, p);

    const q = [0, 1, 2];
    const r = [{}, {}];
    json.assign(q, r);
    t.deepEqual(q, r);
    t.notEqual(q, r);
    t.end();
});
