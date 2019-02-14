# mudb/schema
A `mudb` schema is a type declaration that can be used to define the message passing interface between client and server.  You can think of it as the parameter part of a function declaration.

In the `schema` module, we have defined several commonly used data types (`boolean`, `float32`, `struct`, etc.) which you can use to describe complex structures accurately.  They should be enough for you to handle the large majority of situations.

That being said, you are by no means limited to the predefined data types.  `mudb` is designed to work with any data types that implement the `MuSchema` interface and contract correctly.

Each data type defined in `schema` performs serialization as [data differencing](https://en.wikipedia.org/wiki/Delta_encoding).  That means messages can be sent in the form of delta (difference relative to an observed state), which may help lowering the bandwidth requirement for your application substantially.  And for situations where JSON is required, `schema` provides APIs that can convert data into JSON-stringifiable objects, and back.

Although most modern JavaScript engines are optimized to mitigate the problem of GC pauses, for example, V8 tries to split up the work of marking live objects into smaller chunks so that the main thread is paused for a short interval each time, for applications like fast-paced games where jank should be avoided at all costs, it is still essential to spend some effort in reducing the number of memory allocations and deallocations.  For this purpose, data types implementing `MuSchema` can have a pooling interface.  Note that pooling isn't always a good idea, a pooling implementation makes sense for a type of which similar objects are created and destroyed constantly, like a struct.

## example

```js
const {
    MuFloat64,
    MuInt32,
    MuString,
    MuDictionary
    MuStruct,
} = require('muschema')
const {
    MuWriteStream,
    MuReadStream,
} = require('mustreams')

// define an entity schema
const EntitySchema = new MuStruct({
    x: new MuFloat64(),
    y: new MuFloat64(),
    dx: new MuFloat64(),
    dy: new MuFloat64(),
    hp: new MuInt32(10),
    name: new MuString('entity')
})

// define an entity set schema
const EntitySetSchema = new MuDictionary(EntitySchema)

// create a new entity set object using the schema
const entities = EntitySetSchema.alloc()

// create a new entity and add it to the schema
const player = EntitySchema.alloc()

player.x = 10
player.y = 10
player.dx = -10
player.dy = -20
player.name = 'winnie'

entities['pooh'] = player

// make a copy of all entities
const otherEntities = EntitySetSchema.clone(entities)

// modify player entity
otherEntities.foo.hp = 1

// compute a patch and write it to stream
const out = new MuWriteStream(32)
const hasPatch = EntitySetSchema.diff(entities, otherEntities, out)

let otherEntitiesCopy = EntitySetSchema.clone(entities)
if (hasPatch) {
    // read the patch from stream and apply it to
    // a copy of entities
    const inp = new MuReadStream(out.bytes())
    otherEntitiesCopy = EntitySetSchema.patch(otherEntitiesCopy, inp)
}

// pool objects
EntitySetSchema.free(otherEntities)
```

**table of contents**
* [use](#use)
* interface
    * [`MuSchema`](#muschema)
* primitive
    * [void](#void)
    * [number](#number)
    * [string](#string)
* functor
    * [struct](#struct)
    * [array](#array)
    * [sorted-array](#sorted-array)
    * [union](#union)
* data structure
    * [dictionary](#dictionary)
    * [vector](#vector)
* miscellaneous
    * [date](#date)
    * [json](#json)

## use

```js
const { MuFloat32 } = require('mudb/schema/float32')
const { MuStruct } = require('mudb/schema/struct')

// all predefined data types are also available from `mudb/schema`
// const { MuFloat32, MuStruct } = require('mudb/schema')

const coordinate = new MuStruct({
    x: new MuFloat32(1),
    y: new MuFloat32(1),
    z: new MuFloat32(1),
})

const c1 = coordinate.alloc()
coordinate.free(c1)
const c2 = coordinate.alloc()
c2 === c1   // true
coordinate.free(c2) // free what you alloc whenever possible

const c3 = coordinate.alloc()
const c4 = coordinate.alloc()
coordinate.equal(c3, c4)  // true
c3.x += 1
coordinate.equal(c3, c4)  // false
coordinate.free(c3)
coordinate.free(c4)
```

Below is a complete list of predefined data types.

* void `MuVoid`
* boolean `MuBoolean`
* number
    * int8 `MuInt8`
    * int16 `MuInt16`
    * int32 `MuInt32`
    * uint8 `MuUint8`
    * uint16 `MuUint16`
    * uint32 `MuUint32`
    * float32 `MuFloat32`
    * float64 `MuFloat64`
* string
    * ascii `MuASCII`
    * fixed-ascii `MuFixedASCII`
    * utf8 `MuUTF8`
* functor
    * struct `MuStruct`
    * array `MuArray`
    * sorted-array `MuSortedArray`
    * union `MuUnion`
* data structure
    * dictionary `MuDictionary`
    * vector `MuVector`
* date `MuDate`
* json `MuJSON`

## `MuSchema`
Each data type should implement the `MuSchema<T>` interface accordingly.

* Properties
    * `muType` (`string`): the name of the schema type
    * `muData` (`any?`): additional information about the schema, e.g. the schema of elements
    * `identity` (`T`): the default value of the schema
    * `json` (`object`): description of the schema used for schema comparisons
* Methods
    * `alloc()` (`() => void`): construct a value from scratch, or fetch from the object pool
    * `free(value)` (`(T) => void`): return the value back to the object pool
    * `equal(a, b)` (`(T, T) => boolean`): determine whether two values are equivalent
    * `clone(value)` (`(T) => T`): construct a copy of the value
    * `assign(dst, src)` (`(T, T) => T`): assign `dst` the content of `src`
    * `diff(base, target, out)` (`(T, T, MuWriteStream) => boolean`) compute a patch from `base` to `target`
    * `patch(base, inp)` (`(T, MuReadStream) => T`): apply the patch to `base`
    * `toJSON(value)` (`(T) => any`): construct a JSON-compatible form of the value
    * `fromJSON(value)` (`(any) => T`): construct a schema-compatible form of the value
* *General* contract
    * `alloc() === identity` should be true for **primitive** types
    * `equal(clone(x), x)` should be true
    * `equal(assign(x, y), y)` should be true
    * `assign(x, y) === x` should be true for **reference** types
    * `diff(x, y, out)` should be equal to `!equal(x, y)`
    * with `diff(x, y, out)`, `equal(patch(x, inp), y)` should be true
    * `equal(fromJSON(toJSON(x)), x)` should be true

### void
The bottom type.  It can be used to specify arguments to messages which do not need to be serialized.

### number
```js
// for signed integers of 8/16/32-bit
const { MuInt8 } = require('muschema/int8')
const { MuInt16 } = require('muschema/int16')
const { MuInt32 } = require('muschema/int32')

// for unsigned integers of 8/16/32-bit
const { MuUint8 } = require('muschema/uint8')
const { MuUint16 } = require('muschema/uint16')
const { MuUint32 } = require('muschema/uint32')

// for floating point of 32/64-bit
const { MuFloat32 } = require('muschema/float32')
const { MuFloat64 } = require('muschema/float64')

// here MuNumber stands for any of the number schema types
const AnyNumberSchema = new MuNumber(identity)

AnyNumberSchema.identity    // defaults to 0 if not specified
AnyNumberSchema.muType      // string of one of int8/int16/int32/uint8/uint16/uint32/float32/float64
                            // depending on the schema type

const num = AnyNumberSchema.alloc() // equals identity
AnyNumberSchema.free(num)           // noop
AnyNumberSchema.clone(num)          // returns the value of `num`
```

* for numbers in general, use `MuFloat64`
* but if you know the range of the numbers in advance, use a more specific data type instead

### string
```js
const { MuString } = require('muschema/string')
const { MuASCII } = require('muschema/ascii')
const { MuFixedASCII } = require('muschema/fixed-ascii')

const MessageSchema = new MuString(identity)
MessageSchema.identity              // defaults to '' if not specified
MessageSchema.muType                // 'string'

const msg = MessageSchema.alloc()   // equals identity
MessageSchema.free(msg)             // noop
MessageSchema.clone(msg)            // returns the value of `msg`

const UsernameSchema = new MuASCII(identity)
UsernameSchema.identity                 // defaults to '' if not specified
UsernameSchema.muType                   // 'ascii'

const username = UsernameSchema.alloc() // equals identity
UsernameSchema.free(username)           // noop
UsernameSchema.clone(username)          // returns the value of `username`

// for this schema type, you must either specify the identity
const phoneNumberSchema = new MuFixedASCII('1234567890')
phoneNumberSchema.identity              // '1234567890'
phoneNumberSchema.muType                // 'fixed-ascii'
phoneNumberSchema.length                // 10, the length of all strings in this schema
const phone = phoneNumberSchema.alloc() // '1234567890'

// or the fixed length
const IDSchema = new MuFixedASCII(8)
IDSchema.identity           // a string of 8 spaces
IDSchema.length             // 8

const id = IDSchema.alloc() // a string of 8 spaces
IDSchema.free(id)           // noop
IDSchema.clone(id)          // returns the value of `id`
```

* for strings in general, use `MuString`
* if the strings consist of only ASCII characters, use `MuASCII`
* if the strings consist of only ASCII characters and are of the same length, use `MuFixedASCII` instead

## functor
Primitive data types in `muschema` can be composed using functors.  These take in multiple sub-schemas and construct new schemas.

### struct
A struct is a collection of subtypes.  Structs are constructed by passing in a dictionary of schemas.  Struct schemas may be nested as follows:

```js
const { MuFloat64 } = require('muschema/float64')
const { MuStruct } = require('muschema/struct')

const Vec2 = new MuStruct({
    x: new MuFloat64(0),
    y: new MuFloat64(0),
})
const Particle = new MuStruct({
    position: Vec2,
    velocity: Vec2
})

const p = Particle.alloc()
p.position.x = 10
p.position.y = 10

// Particle.free recursively calls Vec2.free
Particle.free(p)
```

### array
```js
const { MuStruct } = require('muschema/struct')
const { MuArray } = require('muschema/array')
const { MuUint32 } = require('muschema/uint32')

const SlotSchema = new MuStruct({
    item_id: new MuUint32()
    amount: new MuUint32()
})
const InventorySchema = new MuArray(SlotSchema, identity)

InventorySchema.identity    // defaults to [] if not specified
InventorySchema.muType      // 'array'
InventorySchema.muData      // SlotSchema

const backpack = InventorySchema.alloc()    // always []
InventorySchema.free(backpack)              // pools `backpack` and all its members
InventorySchema.clone(backpack)             // returns a deep copy of `backpack`
```

### sorted-array
```js
const { MuStruct } = require('muschema/struct')
const { MuSortedArray } = require('muschema/sorted')
const { MuUint8 } = require('muschema/uint8')

function compare (a, b) {
    if (a.rank < b.rank) {
        return -1
    } else if (a.rank > b.rank) {
        return 1
    }

    if (a.suit < b.suit) {
        return -1
    } else if (a.suit > b.suit) {
        return 1
    } else {
        return 0
    }
}

const CardSchema = new MuStruct({
    suit: new MuUint8(),
    rank: new MuUint8(),
})
const DeckSchema = new MuSortedArray(CardSchema, compare, identity)

DeckSchema.identity     // defaults to []
                        // if identity specified, will be a sorted copy of it
DeckSchema.muType       // 'sorted-set'
DeckSchema.muData       // CardSchema
DeckSchema.compare      // reference to the compare function

const deck = DeckSchema.alloc() // always []
DeckSchema.free(deck)           // pools `deck` and all its members
DeckSchema.clone(deck)          // returns a deep copy of `deck`
```

### union
A discriminated union of several subtypes.  Each subtype must be given a label.

```js
const { MuFloat64 } = require('muschema/float64')
const { MuString } = require('muschema/string')
const { MuUnion } = require('muschema/union')
const { MuWriteStream, MuReadStream } = require('mustreams')

const FloatOrString = new MuUnion({
    float: new MuFloat64('foo'),
    string: new MuString('bar'),
})

// create a new value
const x = FloatOrString.alloc()
x.type = 'float'
x.data = 1

// compute a delta and write it to stream
const out = new MuWriteStream(32)
FloatOrString.diff(FloatOrString.identity, x, out)

// apply a patch
const inp = new MuReadStream(out.buffer.uint32)
const y = FloatOrString.patch(FloatOrString.identity, inp)
```

## data structure

### dictionary
A dictionary is a labelled collection of values.

```js
const { MuUint32 } = require('muschema/uint32')
const { MuDictionary } = require('muschema/dictionary')

const NumberDictionary = new MuDictionary(new MuUint32(), identity)
NumberDictionary.identity   // defaults to {} if not specified
NumberDictionary.muType     // 'dictionary'
NumberDictionary.muData     // a MuUint32 schema

const dict = NumberDictionary.alloc()
dict['foo'] = 3

NumberDictionary.free(dict)     // pools `dict` and all its members
NumberDictionary.clone(dict)    // returns a deep copy of `dict`
```

### vector
```js
const { MuVector } = require('muschema/vector')
const { MuFloat32 } = require('muschema/float64')

const ColorSchema = new MuVector(new MuFloat32(), 4)
ColorSchema.identity    // Float32Array [0, 0, 0, 0]
ColorSchema.muType      // 'vector'
ColorSchema.muData      // reference to the specified MuFloat32 schema
ColorSchema.dimension   // 4

const rgba = ColorSchema.alloc()    // Float32Array [0, 0, 0, 0]
ColorSchema.free(rgba)              // pools `rgba`
ColorSchema.clone(rgba)             // returns a copy of `rgba`
```
